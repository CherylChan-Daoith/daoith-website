/* DAOITH service marketplace catalog
 * Source of truth: 服务产品汇总表_260912.xlsx（服务内容全文）+ 发布页结构
 * Categories: consult | compliance | hongkong | asia | europe | other
 */
(function () {
  /** Single fee → bold text; multi fee → pricing table only (never both). */
  function formatSinglePricingDisplay(pricing) {
    const t = String(pricing || '').trim();
    if (!t) return '';
    if (/^\d[\d,]*$/.test(t)) {
      const n = Number(t.replace(/,/g, ''));
      if (Number.isFinite(n)) return `¥${n.toLocaleString('zh-CN')}`;
    }
    if (/^\d[\d,]*起$/.test(t)) {
      const n = Number(t.replace(/[,起]/g, ''));
      if (Number.isFinite(n)) return `¥${n.toLocaleString('zh-CN')}起`;
    }
    return t;
  }

  function excelBlocks(p) {
    const out = [];
    const content = p.content || '';
    const cycle = p.cycle || '';
    const process = p.process || '';
    const processSteps = Array.isArray(p.processSteps) ? p.processSteps : null;
    const pricing = p.pricing || '';
    const pricingNote = p.pricingNote || '';
    const advantages = p.advantages || '';
    const audience = p.audience || '';
    const conditions = p.conditions || '';
    const pricingTable = p.pricingTable || null;
    const bundle = p.bundle || null;

    function pushLines(title, text) {
      const raw = String(text || '').trim();
      if (!raw) return;
      out.push({ type: 'h2', text: title });
      out.push({ type: 'publish', text: raw });
    }

    if (bundle) {
      out.push({ type: 'h2', text: '服务内容' });
      if (String(content || '').trim()) out.push({ type: 'publish', text: content });
      out.push({ type: 'bundle-picker', bundle });
    } else {
      pushLines('服务内容', content);
    }

    pushLines('办理条件', conditions);
    pushLines('服务周期', cycle);

    out.push({ type: 'h2', text: '服务流程' });
    if (processSteps && processSteps.length) {
      out.push({ type: 'timeline', steps: processSteps });
    } else if (process) {
      const steps = String(process).split(/→|->|➡/).map((s) => s.replace(/[。．]+$/g, '').trim()).filter(Boolean);
      if (steps.length > 1) {
        out.push({ type: 'timeline', steps: steps.map((title) => ({ title })) });
      } else {
        out.push({ type: 'publish', text: process });
      }
    }

    out.push({ type: 'h2', text: '服务收费' });
    const hasPricingTable = !!(pricingTable?.headers && pricingTable?.rows?.length);
    if (hasPricingTable) {
      out.push({
        type: 'table',
        variant: 'pricing',
        firstColHeader: true,
        headers: pricingTable.headers,
        rows: pricingTable.rows,
      });
    } else if (pricing) {
      out.push({ type: 'price', text: formatSinglePricingDisplay(pricing) });
    }
    if (pricingNote) out.push({ type: 'note', text: pricingNote });
    if (bundle) {
      out.push({ type: 'bundle-price', bundleId: bundle.id });
    }

    pushLines('核心优势', advantages);

    if (audience) {
      out.push({ type: 'h2', text: '适合对象' });
      const items = String(audience)
        .split(/\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (items.length > 1) out.push({ type: 'ul', items });
      else out.push({ type: 'publish', text: audience });
    }
    return out;
  }

  window.DAOITH_SERVICE_CATEGORIES = [
    { id: 'all', label: '全部', en: 'All' },
    { id: 'consult', label: '财税咨询', en: 'Advisory', blurb: '1v1、方案定制、陪跑与资质认定', blurbEn: '1-on-1, custom plans, coaching and qualifications' },
    { id: 'compliance', label: '财税合规', en: 'Tax compliance', blurb: '合规代账、全托管、退税与出口合规', blurbEn: 'Bookkeeping, managed packs, rebates and export compliance' },
    { id: 'hongkong', label: '中国香港', en: 'Hong Kong', blurb: '注册、年审、审计报税、开户与变更注销', blurbEn: 'Setup, annual return, audit & tax, banking, changes' },
    { id: 'asia', label: '亚洲', en: 'Asia', blurb: '马来西亚、新加坡公司与财税服务', blurbEn: 'Malaysia and Singapore' },
    { id: 'europe', label: '欧洲', en: 'Europe', blurb: '英国、德国、法国 VAT、公司设立与做账报税', blurbEn: 'UK, Germany and France VAT, setup and bookkeeping' },
    { id: 'other', label: '其他地区', en: 'Other regions', blurb: '美国等跨境主体与合规', blurbEn: 'US and other markets' },
  ];

  window.DAOITH_SERVICES = [
    {
      id: 'consult-1v1',
      category: 'consult',
      title: `财税专家 1v1 咨询`,
      desc: `前国际四大会计师事务所资深专家，专注电商合规、深耕跨境财税规划 15 年以上，助力企业降本增效、稳健出海。`,
      priceLabel: `¥2,999`,
      priceValue: 2999,
      unit: `/小时`,
      details: excelBlocks({
        content: `合规风险识别：了解企业现有财税流程，识别潜在合规漏洞与核心税务风险点，出具针对性整改建议。
跨境架构规划：结合企业业务模式与目标市场，设计税务架构方案，合理降低整体税负，提升资金流转效率。
股权架构设计：合理规划控股架构、资金路径与利润分配机制。
涉税风险处理：针对税务疑点、风险任务、税务处罚等事项，提供专业应对策略。
退税优化方案：深度分析企业退税环节，挖掘退税空间，优化退税路径与申报材料，提高退税成功率与到账速度。
财税处理：针对跨境电商、海外仓、多平台经营等复杂业务场景，提供定制化记账报税方案。
个性化答疑：针对企业具体业务场景，提供一对一深度答疑，提供可落地、可执行方案。`,
        cycle: `服务开启后 1 小时`,
        processSteps: [{ title: `预约咨询`, time: `提前 1-3 个工作日` }, { title: `业务信息收集`, time: `咨询前完成` }, { title: `线上1v1 咨询`, time: `1小时起` }, { title: `咨询总结`, time: `咨询结束当天出具` }],
        process: ``,
        pricing: `¥2,999 / 小时`,
        pricingNote: `不足 1 小时按 1 小时计费；超出1小时部分按半小时为单位计费`,
        advantages: ``,
        audience: `跨境电商企业创始人/财务负责人
有海外业务布局的中小企业
正在规划出海架构或面临跨境税务合规问题的企业`,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'domestic-diagnosis',
      category: 'consult',
      title: `财税合规方案定制`,
      desc: `「财税健康全面体检 ·多业务场景定制化合规方案 ·落地事项清单」`,
      priceLabel: `¥28,000`,
      priceValue: 28000,
      unit: `/次`,
      details: excelBlocks({
        content: `企业情况分析：业务流、资金流、货物流、票据流和组织架构全面梳理
合规方案设计：整合各业务版块的全面合规方案设计，在合法合规的前提下合理降低企业整体税负成本
税负测算：针对目前销售规模或者未来1-3年预测的销售规模下的合规税负进行测算，让管理层清晰掌握合规成本
方案优劣对比，企业轻松决策：从税务风险、税负、操作难以程度等各个纬度对比不同方案的优劣势，让企业根据自身偏好选择方案
制定落地明细清单：包括核心处理事项，增加外部成本预估、关键事项实施步骤、责任人和时间节奏等`,
        cycle: `一般 3–4 周（视资料回收速度）`,
        processSteps: [{ title: `需求沟通`, time: `1–2 个工作日` }, { title: `资料清单发送`, time: `当天` }, { title: `资料收集`, time: `约 1 周` }, { title: `深度访谈`, time: `1 个工作日` }, { title: `资料审阅与分析`, time: `1–2 周` }, { title: `风险诊断`, time: `3–5 个工作日` }, { title: `报告撰写`, time: `3–5 个工作日` }, { title: `报告交付与解读`, time: `1 个工作日` }],
        process: ``,
        pricing: `28,000 元/次`,
        pricingNote: `建议配合「财税合规陪跑」服务购买`,
        advantages: ``,
        audience: `跨境电商平台卖家、独立站卖家
计划融资/上市/股权调整需排查风险的企业
曾收税务风险提示希望自查的企业`,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'consult-annual',
      category: 'consult',
      title: `财税合规陪跑`,
      desc: `合规落地陪跑 · 方案执行不走样 · 税局风险早应对。`,
      priceLabel: `¥38,000`,
      priceValue: 38000,
      unit: `/年起`,
      details: excelBlocks({
        content: `一、合规方案落地拆解
基于企业已有合规方案（或我方出具的合规诊断报告），将整体合规目标拆解为具体可执行的落地步骤
明确每项整改任务的负责人、完成标准、时间节点及优先级
区分优先层级，确保企业按节奏稳步推进
形成《财税合规落地执行计划表》，作为全程跟进的执行依据
二、落地执行计划制定
根据企业实际经营节奏、人员配置、业务周期，制定合理的落地时间表
将合规整改嵌入企业日常经营流程，针对重大整改事项（如股权架构调整等），制定专项推进方案
明确各阶段里程碑节点，确保落地过程可量化、可追踪
三、定期复盘与进度跟进
按约定周期（月度/季度）与企业进行合规落地复盘会议
逐项核对落地计划完成情况，对标"已完成""进行中""延期""待启动"状态进展
对延期或未完成事项，分析原因并调整后续计划
对执行中遇到的新合规方案，及时更新落地计划
四、税局对接与风险管理
当企业收到税务风险提示、税务事项通知书、纳税评估通知等，及时介入分析并制定应对策略
协助企业准备税局要求的说明材料、自查报告及相关佐证资料
陪同企业参与税务约谈等场景，提供专业支持
五、日常财税合规支持
解答企业日常经营中涉及的财税合规问题（如新业务模式税务处理、合同涉税条款审核等）
对企业重大经营决策（如分红、股权转让、资产处置等）提供事前财税合规建议
跟踪财税政策变化，及时告知企业可能受到的影响及应对建议`,
        cycle: `服务开启后 1 年（按年签约）`,
        processSteps: [{ title: `方案对接`, time: `签约后 1 周内` }, { title: `落地拆解`, time: `2 周内完成` }, { title: `计划确认`, time: `1 周内` }, { title: `执行跟进`, time: `全年持续` }, { title: `定期复盘`, time: `按月/季度` }, { title: `税局应对`, time: `重大税局事项随时响应` }, { title: `阶段验收`, time: `每阶段结束后` }, { title: `持续优化`, time: `贯穿服务期` }],
        process: ``,
        pricing: ``,
        pricingNote: `按年签约；周期内线上沟通不限次数，重大税局事项随时响应；尚未完成诊断者可搭配「财税合规方案定制」先行出方案再进入陪跑。`,
        advantages: ``,
        audience: `已完成诊断/方案需协助落地的企业
曾收风险提示或面临核查的企业
缺乏内部合规团队的企业`,
        conditions: ``,
        pricingTable: {
          headers: ["方案", "价格"],
          rows: [["线下上门 4 次", "38,000 元/年"], ["线下上门 6 次", "53,000 元/年"], ["线下上门 8 次", "68,000 元/年"], ["线下上门 10 次", "83,000 元/年"], ["线下上门 12 次", "98,000 元/年"]],
        },
        bundle: null,
      }),
    },
    {
      id: 'consult-ai-finance-coach',
      category: 'consult',
      title: `企业财务管理 AI 落地陪跑`,
      desc: `调研定周期 · 建流程与工具 · 带教团队独立运转。`,
      priceLabel: `¥60,000`,
      priceValue: 60000,
      unit: `起`,
      details: excelBlocks({
        content: `一、现状调研与目标设定
对企业财务核算、报表体系、资金管理与业务流程进行现状诊断
访谈财务、业务与管理层，识别手工重复劳动、数据孤岛、口径不一等痛点
明确AI落地目标与可量化指标（如结账周期、报表生成时效、人效提升比例）
识别数据安全与权限边界，确定AI介入的业务范围与合规要求
二、周期与路径规划
按2个月/4个月/6个月周期制定分阶段落地计划与里程碑
确定数据源、系统工具（ERP/表格/财务软件/BI）与流程节点的改造范围
划分试点与推广阶段，先在高频场景验证效果再全面铺开
三、流程与工具搭建
梳理并重构财务核算、报销审批与资金流程，消除冗余环节
部署财务AI工具、模板与自动化报表（如自动对账、凭证生成、报表汇总）
打通业务与财务数据，建立统一数据看板与管理驾驶舱
编写操作手册与提示词库，沉淀可复用的自动化流程
四、带教与验收
对财务团队进行分角色实操带教，确保会用、能维护
建立标准作业流程（SOP）与内控机制，直至团队可独立运转
设定验收标准，逐项核对自动化流程的稳定性和准确性
进行阶段复盘，输出持续优化与后续扩展建议`,
        cycle: `服务开启后按方案周期（2/4/6 个月）`,
        processSteps: [{ title: `现状调研`, time: `第 1–4 周` }, { title: `目标与指标确认`, time: `第 4–5 周` }, { title: `周期方案规划`, time: `第 5–6 周` }, { title: `流程与工具搭建`, time: `分阶段推进` }, { title: `系统部署与数据打通`, time: `4–6 周` }, { title: `团队带教`, time: `贯穿周期` }, { title: `独立运转验收`, time: `周期末` }, { title: `持续优化`, time: `验收后持续` }],
        process: ``,
        pricing: ``,
        pricingNote: `按陪跑周期分档计价；含调研诊断、规划、搭建、部署、带教与验收；第三方软件费用及超范围定制开发另计；可按里程碑分期支付`,
        advantages: ``,
        audience: `希望提升财务效率的中小企业
核算与报表不规范的成长型企业
计划用 AI 降本增效的跨境电商及贸易企业`,
        conditions: ``,
        pricingTable: {
          headers: ["交付期", "服务费", "说明"],
          rows: [["2个月内", "¥60,000", "调研后确认可在2个月内完成约定范围落地"], ["4个月内", "¥100,000", "调研后确认可在4个月内完成约定范围落地"], ["6个月内", "¥150,000", "调研后确认可在6个月内完成约定范围落地"]],
        },
        bundle: null,
      }),
    },
    {
      id: 'consult-hnte',
      category: 'consult',
      title: `高新技术企业申请`,
      desc: `高企认定申报 · 条件诊断 · 材料撰写 · 全程跟进至领证。`,
      priceLabel: `¥68,000`,
      priceValue: 68000,
      unit: ``,
      details: excelBlocks({
        content: `一、申报条件诊断
核查知识产权数量与类别、研发费用占比、高新技术产品（服务）收入占比、科技人员占比等核心指标
对照《高新技术企业认定管理办法》及八大支持领域逐项评估，测算各评分维度得分
评估申报可行性，识别短板并制定补强计划与时间排期
核查企业近一年有无重大安全、质量事故或环境违法行为等一票否决项
二、知识产权规划
梳理并补强发明专利、实用新型专利、软件著作权等一、二类知识产权
评估知识产权对核心产品的支撑度与关联度，确保Ⅰ类知识产权占优
匹配产品与核心技术所属八大支持领域，规划知识产权布局节奏
三、研发与财务规范
按项目梳理研发活动，规范立项、工时归集与费用分摊
编制研发费用辅助账（人员、直接投入、折旧、无形资产摊销、其他费用等科目）
协调具有资质的会计师事务所出具研发费用及高新收入专项审计报告
规范近三年年度财务审计报告与纳税申报表的收入、成本勾稽关系
四、材料撰写与申报
撰写企业创新能力评价材料（核心技术、研发组织管理、成果转化、成长性）
整理科技成果转化证明材料，构建"研发—成果—产品"逻辑链
在高新技术企业认定管理工作网填报，并提交纸质材料
五、跟进与领证
跟踪受理、评审、答辩与公示各环节，及时补正材料
协助领取高企证书，指导享受15%优惠税率及亏损结转等政策
办理后续火炬统计年报、变更备案与到期重新认定提醒`,
        cycle: ``,
        processSteps: [{ title: `条件诊断`, time: `2 周` }, { title: `补强规划`, time: `1–2 个月` }, { title: `知识产权梳理`, time: `1–2 个月` }, { title: `研发与财务规范`, time: `1–2 个月` }, { title: `专项审计`, time: `2–4 周` }, { title: `材料撰写`, time: `2–4 周` }, { title: `系统填报`, time: `按年度申报批次` }, { title: `评审跟进`, time: `约 2–3 个月` }, { title: `公示领证`, time: `公示后领取` }, { title: `证后维护`, time: `持续` }],
        process: ``,
        pricing: `68,000 元/次（含基础申报代理与材料撰写；专项审计、知识产权申请等第三方费用另计，实报实销；未通过可按合同约定免费复核或续办）`,
        pricingNote: ``,
        advantages: ``,
        audience: `拥有核心自主知识产权、拟享受 15% 所得税优惠的科技型企业
计划申报政府奖补、投标加分的成长型企业`,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'consult-software-enterprise',
      category: 'consult',
      title: `软件企业申请`,
      desc: `软件企业评估/软件产品登记申报 · 助力享受税收优惠。`,
      priceLabel: `¥50,000`,
      priceValue: 50000,
      unit: ``,
      details: excelBlocks({
        content: `一、申报条件诊断
核查软件著作权、研究开发费用占比、软件产品（服务）收入占比等核心指标
对照软件企业及软件产品评估条件（如研发占比、软件收入占比、人员结构）逐项核验
评估是否符合软件企业及软件产品登记条件，明确补强方向
识别可申报的软件产品清单及对应知识产权支撑
二、材料准备
整理软件著作权证书、产品检测报告等证明材料
编制软件产品开发、生产与销售情况说明及功能描述
整理财务资料，规范软件收入的单独核算与归集口径
准备企业基本情况、人员、研发组织管理等申报附件
三、申报与跟进
在软件企业及软件产品评估平台填报并递交材料
跟踪评估、受理、补正与发证全过程，及时响应评估机构问询
配合现场核查或补充说明（如涉及）
四、证后与优惠落地
指导享受软件企业"两免三减半"、软件产品增值税超负荷即征即退等税收优惠
辅导优惠备案资料准备与留存备查
协助年度复核、信息更新与评估证书续期`,
        cycle: ``,
        processSteps: [{ title: `条件诊断`, time: `1–2 周` }, { title: `软著与产品梳理`, time: `2–4 周` }, { title: `检测与材料准备`, time: `2–4 周` }, { title: `系统填报`, time: `1 周` }, { title: `递交评估`, time: `评估周期约 1–2 个月` }, { title: `补正跟进`, time: `按评估机构要求` }, { title: `发证`, time: `评估通过后` }, { title: `优惠落地与年审`, time: `按年度` }],
        process: ``,
        pricing: `50,000 元/次（含材料整理与申报代理；检测费、软著登记费等第三方费用另计；软件企业与软件产品登记可打包报价）`,
        pricingNote: ``,
        advantages: ``,
        audience: `自主开发软件、持有软件著作权的软件公司
需办理软件产品登记、双软评估的 IT 与信息服务企业`,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'consult-atas',
      category: 'consult',
      title: `技术先进型服务企业申请`,
      desc: `认定申报 · 离岸收入梳理 · 材料撰写 · 全程跟进。`,
      priceLabel: `¥50,000`,
      priceValue: 50000,
      unit: ``,
      details: excelBlocks({
        content: `一、认定条件诊断
核查离岸服务外包收入占比（不低于当年总收入35%）、技术人员占比、办公场所等硬性条件
对照技术先进型服务企业认定范围（信息技术、业务流程外包、知识库/研发/供应链管理等）评估适配性
评估申报可行性与补强方向，测算各维度得分
核查企业技术装备、管理制度与员工培训等配套条件
二、离岸业务梳理
整理与境外客户签订的服务合同、收款凭证、外汇收入证明等离岸业务证据链
梳理技术先进型服务收入范围与占比，区分离岸与在岸收入
规范离岸服务收入的确认口径与结算单据
三、材料与审计
协调具有资质的会计师事务所出具技术先进型服务收入专项审计报告（带统一监管平台备案验证码与报告编码）
编制技术研发、管理与服务创新、组织管理等认定材料
准备企业设立、场所、设备、人员等佐证文件
四、申报与跟进
在全国技术先进型服务企业业务办理管理平台及广东政务服务网（深圳站）填报
跟踪形式审查、专家评审、公示与备案各环节，及时补正
五、证后服务
指导享受企业所得税减按15%、职工教育经费税前扣除比例提高等优惠
协助后续年报、变更及到期重新认定提醒`,
        cycle: ``,
        processSteps: [{ title: `条件诊断`, time: `1–2 周` }, { title: `离岸业务梳理`, time: `2–4 周` }, { title: `专项审计`, time: `2–4 周` }, { title: `材料撰写`, time: `2–3 周` }, { title: `平台填报`, time: `1 周` }, { title: `评审跟进`, time: `约 1–2 个月` }, { title: `公示备案`, time: `评审通过后` }, { title: `优惠落地与年报`, time: `按年度` }],
        process: ``,
        pricing: `50,000 元/次（含材料撰写与申报代理；专项审计等第三方费用另计，实报实销）`,
        pricingNote: ``,
        advantages: ``,
        audience: `从事 ITO/BPO/技术性外包且离岸收入达标的服务型企业
希望享受 15% 所得税优惠的技术服务与跨境电商服务企业`,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'domestic-compliance-bookkeeping',
      category: 'compliance',
      title: `合规代账`,
      desc: `专业代理记账 · 规范财务核算 · 合规税务申报。`,
      priceLabel: `¥5,000`,
      priceValue: 5000,
      unit: `/年起`,
      details: excelBlocks({
        content: `一、日常账务处理
审核企业提供的原始凭证（发票、银行回单、合同、费用单据等）
按会计准则编制记账凭证，登记总账、明细账、日记账
确保账务处理符合《企业会计准则》或《小企业会计准则》要求
出口企业专项处理出口销售、采购、运费、退税等相关账务
二、财务报表编制
按月/季编制资产负债表、利润表（损益表）、现金流量表
根据需要编制往来明细表、进销存明细表等辅助报表
确保报表数据准确、勾稽关系正确、符合税务申报要求
三、纳税申报
按月/季申报增值税、附加税
按季预缴企业所得税
代扣代缴个人所得税（工资薪金、劳务报酬等）
申报印花税、房产税、土地使用税等地方税种
申报&缴纳社会保险及住房公积金
出口企业同步完成出口退税相关申报
四、凭证整理与档案保管
对原始凭证进行分类整理、装订成册
建立规范的会计档案管理制度
妥善保管记账凭证、账簿、报表等会计资料
五、税务合规与风险提示
定期核查企业税务状况，识别潜在税务风险
关注税收政策变化，及时提示企业享受优惠政策
对异常账务处理、税负异常等情况进行预警提示
协助应对税务稽查、资料调阅等事务
六、财务分析与管理建议
定期提供财务分析报告，解读企业经营状况
对收入、成本、费用、利润等关键指标进行趋势分析
提供成本控制、税务优化、资金管理等管理建议
七、工商年报协助：
协助企业按时完成工商年报公示
核对企业年报中的财务数据与账面记录一致性`,
        cycle: ``,
        processSteps: [{ title: `资料交接`, time: `每月 5 日前` }, { title: `凭证审核`, time: `1–2 个工作日` }, { title: `账务处理`, time: `3–5 个工作日` }, { title: `报表编制`, time: `2–3 个工作日` }, { title: `申报缴税`, time: `申报期内完成` }, { title: `对账确认`, time: `申报后 3 个工作日内` }, { title: `档案归档`, time: `当月完成` }, { title: `定期沟通`, time: `按月/季` }],
        process: ``,
        pricing: ``,
        pricingNote: ``,
        advantages: ``,
        audience: `初创企业、小微企业
电商企业、进出口贸易企业
无专职财务的企业`,
        conditions: ``,
        pricingTable: {
          headers: ["类型", "价格"],
          rows: [["小规模企业代理记账", "5,000 元/年"], ["一般纳税人代理记账", "8,000 元/年起"], ["零申报 - 小规模", "2,000 元/年"], ["零申报 - 一般纳税人", "3,600 元/年"]],
        },
        bundle: null,
      }),
    },
    {
      id: 'domestic-arch-0110-hk',
      category: 'compliance',
      title: `0110 出口退税 + 香港公司合规全托管`,
      desc: `出口公司走通 0110 报关出口退税、店铺公司财税合规记账、香港公司审计等组合服务。`,
      priceLabel: `全托管计价`,
      priceValue: 0,
      unit: `/3项起9折`,
      details: excelBlocks({
        content: `可勾选服务项目
出口公司设立
进出口权办理
首单退税辅导
代理退税申报
退税公司记账报税
香港公司年审
香港公司审计报税`,
        cycle: `服务开启后 1 年`,
        processSteps: [{ title: `需求确认`, time: `当天` }, { title: `线上下单确认服务选项`, time: `当天` }, { title: `资料收集`, time: `1 周内` }, { title: `服务项目跟进`, time: `按各子项目时效执行` }],
        process: ``,
        pricing: ``,
        pricingNote: `根据选项组合计价，3项及以上组合享9折`,
        advantages: ``,
        audience: `跨境电商卖家（亚马逊/TikTok/SHEIN 等平台）
供应商可开具专用发票、出口产品适用退税政策、需合规回款通道的企业`,
        conditions: ``,
        pricingTable: {
          headers: ["套餐参考", "模块组合", "说明"],
          rows: [["跨境电商境内外合规", "①+②+③+⑤+⑥+⑦", ""], ["新出口企业境内合规服务", "①+②+③+⑤", ""], ["已有出口业务、需退税及记账", "④+⑤", ""], ["香港公司维护专案", "⑥+⑦", ""], ["首次退税辅导", "②+③", ""]],
        },
        bundle: {"id": "0110", "discountFrom": 3, "discountRate": 0.9, "discountLabel": "3项及以上全托管可享受9折", "modules": [{"label": "①出口公司设立", "serviceId": "domestic-setup", "priceValue": 500, "priceLabel": "¥500"}, {"label": "②进出口权办理", "serviceId": "domestic-trade-license", "priceValue": 2000, "priceLabel": "¥2,000"}, {"label": "③首单退税辅导", "serviceId": "domestic-rebate-first", "priceValue": 10000, "priceLabel": "¥10,000"}, {"label": "④代理退税申报", "serviceId": "domestic-rebate", "priceValue": 0, "priceLabel": "按出口额0.1%-0.3%", "pricingModel": "percent", "volumeScope": "mainland", "rate": 0.001, "rateMax": 0.003, "minFee": 5000}, {"label": "⑤退税公司记账报税", "serviceId": "domestic-compliance-bookkeeping", "priceValue": 5000, "priceLabel": "¥5,000起"}, {"label": "⑥香港公司年审", "serviceId": "hk-annual", "priceValue": 3000, "priceLabel": "¥3,000"}, {"label": "⑦香港公司审计报税", "serviceId": "hk-audit-tax", "priceValue": 0, "priceLabel": "按营业额分级", "pricingModel": "tier", "volumeScope": "hk", "tiers": "hk-audit-ecom"}]},
      }),
    },
    {
      id: 'domestic-arch-1039-hk',
      category: 'compliance',
      title: `1039 出口免税 + 香港公司合规全托管`,
      desc: `个体户走通 1039 报关出口免税、核定征收、店铺公司财税合规记账、香港公司审计等组合服务。`,
      priceLabel: `全托管计价`,
      priceValue: 0,
      unit: `/3项起9折`,
      details: excelBlocks({
        content: `可勾选服务项目
个体户注册核定及税务申报
1039市场采购出口
香港公司年审
香港公司审计报税`,
        cycle: `服务开启后 1 年`,
        processSteps: [{ title: `需求确认`, time: `当天` }, { title: `线上下单确认服务选项`, time: `当天` }, { title: `资料收集`, time: `1 周内` }, { title: `服务项目跟进`, time: `按各子项目时效执行` }],
        process: ``,
        pricing: ``,
        pricingNote: `根据选项组合计价，3项及以上组合享9折；1039出口代理费（报关金额0.4%）另计。`,
        advantages: `1039 免税出口破解"无票出口"难题；"香港公司 + 1039 个体户"双主体协同架构；境内外合规全托管；低成本合规回款、资金链路清晰可溯。`,
        audience: `跨境电商卖家（亚马逊/TikTok/SHEIN 等平台）
传统外贸无票采购出口企业
小批量、多批次出口的小微企业`,
        conditions: ``,
        pricingTable: {
          headers: ["套餐参考", "模块组合", "说明"],
          rows: [["跨境电商境内外合规", "①+②+③+④", ""], ["新出口企业境内合规服务", "①+②", ""]],
        },
        bundle: {"id": "1039", "discountFrom": 3, "discountRate": 0.9, "discountLabel": "3项及以上全托管可享受9折", "modules": [{"label": "①个体户注册核定及税务申报", "serviceId": "domestic-1039-sole", "priceValue": 4500, "priceLabel": "¥4,500起"}, {"label": "②1039市场采购出口", "serviceId": "domestic-1039-export", "priceValue": 0, "priceLabel": "按报关金额0.4%", "pricingModel": "percent", "volumeScope": "mainland", "rate": 0.004, "minFee": 0}, {"label": "③香港公司年审", "serviceId": "hk-annual", "priceValue": 3000, "priceLabel": "¥3,000"}, {"label": "④香港公司审计报税", "serviceId": "hk-audit-tax", "priceValue": 0, "priceLabel": "按营业额分级", "pricingModel": "tier", "volumeScope": "hk", "tiers": "hk-audit-ecom"}]},
      }),
    },
    {
      id: 'domestic-setup',
      category: 'compliance',
      title: `公司注册服务（公司设立）`,
      desc: `核名、材料填报、执照领取、刻章、税务登记、社保/公积金开户、银行开户预约全流程代办。`,
      priceLabel: `¥500`,
      priceValue: 500,
      unit: `/次`,
      details: excelBlocks({
        content: `名称申报（核名）、确定基本信息，填报申请材料、执照领取、刻章协助、税务登记指导、社保/公积金开户指导、银行开户预约协助等全流程服务
办理条件：
股东符合法定人数：有限责任公司由五十个以下股东出资设立；
有符合公司章程规定的全体股东认缴的出资额；
股东共同制定公司章程；
有公司名称，建立符合有限责任公司要求的组织机构；
有公司住所。
办理形式：网上办理、线下办理`,
        cycle: `内资企业约 5 个工作日；外资企业约 20 个工作日`,
        processSteps: [{ title: `核名`, time: `1–2 个工作日` }, { title: `确定信息/填报材料`, time: `1–2 个工作日` }, { title: `执照领取`, time: `内资约 5 个工作日 / 外资约 20 个工作日` }, { title: `刻章`, time: `1 个工作日` }, { title: `税务登记`, time: `1–2 个工作日` }, { title: `社保公积金开户`, time: `1–2 个工作日` }],
        process: ``,
        pricing: `500 元/次（代办服务费；境外人员无法线上双录需现场办理的，服务费另计）`,
        pricingNote: ``,
        advantages: ``,
        audience: `新设有限责任公司
需全流程注册代办的企业`,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'domestic-1039-sole',
      category: 'compliance',
      title: `个体户注册核定及税务申报`,
      desc: `一站式个体户注册 · 核定征收落地 · 合规完税。`,
      priceLabel: `¥4,500`,
      priceValue: 4500,
      unit: `/年`,
      details: excelBlocks({
        content: `一、名称核准服务
根据客户提供的行业、经营方向，初步拟定3–5个备选名称，通过工商系统完成名称查重
二、工商注册服务
协助准备全套注册材料，包括经营者身份证信息、经营范围、经营场所证明等
线上提交注册申请，全程无需客户到场
办理周期通常3–5个工作日，材料齐全可快速下证
领取营业执照后同步完成刻章备案
三、税务登记服务
协助登录电子税务局完成实名认证及税务信息确认
绑定经营者手机号、邮箱，开通电子税务局操作权限
完成税种核定、发票票种核定等基础税务配置
指导客户设置电子税局账号密码，确保后续自主操作便捷
四、核定征收申请
根据客户实际经营规模、行业类型，合理填报预计月经营额
提交《个体工商户核定定额申请表》，申请定期定额核定征收
配合税务机关案头审核，跟进核定结果
五、后续申报维护
按月/季完成增值税、个人经营所得税申报
提醒并协助完成年度工商年报，避免异常名录风险`,
        cycle: `服务开启后 1 年`,
        processSteps: [{ title: `需求沟通`, time: `当天` }, { title: `名称核准`, time: `1–2 个工作日` }, { title: `资料收集`, time: `1–2 个工作日` }, { title: `工商注册`, time: `3–5 个工作日` }, { title: `税务登记`, time: `下证后 1–2 个工作日` }, { title: `核定申请`, time: `约 1–2 周` }, { title: `交付使用`, time: `核定通过后` }, { title: `后续维护`, time: `按月/季申报` }],
        process: ``,
        pricing: `个体户注册 + 核定申请 + 税务申报 4,500 元；地址押金 1,000 元（注销可退）；地址年度费用 3,000 元/年；次年 6,000 元（代理报税 3,000 元 + 地址费 3,000 元）。（参考东莞地区，其他地区以实际报价为准；核定征收适用连续 12 个月销售额 ≤ 500 万元的客户）`,
        pricingNote: ``,
        advantages: `线上注册、快速下证；核定征收后综合税负远低于查账征收；完税后资金可直接转入个人账户合法自由支配；可对接跨境电商等出口模式。`,
        audience: `无成本发票或成本票不足的小微个人经营者
出口贸易、跨境电商从业者
需配套 1039 市场采购出口主体备案的个体户
自由职业者、独立顾问`,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'domestic-1039-export',
      category: 'compliance',
      title: `1039 市场采购出口`,
      desc: `合规无票出口 · 阳光收汇结汇 · 一站式出海通道。`,
      priceLabel: `0.4%`,
      priceValue: 0,
      unit: `/报关金额`,
      details: excelBlocks({
        content: `一、商品备案服务
通过市场采购贸易联网信息平台录入出口商品信息（品名、规格、型号、数量、价值等）
审核商品是否属于禁限类目录，提前规避合规风险
生成可用于报关的商品清单，确保源头可溯
二、组货报关服务
提供具备1039资质的报关行进行双抬头报关
单票报关单货值上限15万美元，支持多票多批出口
支持全国一线口岸通关，享受24小时电子通关、智能卡口验放
支持整柜、拼柜、散货拼柜等多种出货方式
三、阳光收汇结汇
国外客户货款打入代理公司的外币账户，代理公司结汇后付RMB给个体户公户
不受个人每年5万美元结汇额度限制，凭报关单合规结汇
个体户公户人民币可直接转入经营者个人账户，资金自由支配`,
        cycle: ``,
        processSteps: [{ title: `需求沟通（评估适用性）`, time: `1–2 个工作日` }, { title: `商品备案`, time: `1–3 个工作日` }, { title: `组货报关`, time: `按出货计划，单票报关当天完成` }, { title: `收汇结汇`, time: `货款到账后即时安排结汇` }],
        process: ``,
        pricing: `出口代理服务费按报关金额人民币 0.4%（单笔低消 100 元）；报关单基础费 250 元/票（多页加收，杂费实报；物流/仓储/拖车/商检/个体户注册/报税等第三方费用另计）`,
        pricingNote: ``,
        advantages: `出口环节免征增值税、对公合规收汇告别冻卡风险、核定征收+减半优惠综合税负极低、全国口岸一体化通关、官方联网平台全程留底可溯。`,
        audience: `无法取得源头发票的工厂、贸易商
外贸 SOHO、个人创业者
品名繁杂的小商品企业
跨境电商卖家（B2B 批量订单）`,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'domestic-trade-license',
      category: 'compliance',
      title: `进出口权办理`,
      desc: `一站式进出口权办理（自主报关收汇 · 合规出海必备）。`,
      priceLabel: `¥2,000`,
      priceValue: 2000,
      unit: ``,
      details: excelBlocks({
        content: `一、经营范围核验及辅助
核查企业现有营业执照经营范围，确认是否包含"货物进出口"、"技术进出口"、"代理进出口"等法定表述；如未包含，协助企业办理经营范围变更
二、海关收发货人备案
提交《报关单位备案信息表》
核对企业基本信息、英文名称、英文地址等关键字段，确保与营业执照完全一致
审核通过后获取10位海关编码及《报关单位备案证明》，取得自主报关资格，办理周期约1–3个工作日
三、电子口岸入网及IC卡申领
搜集整理资料，提交入网申请
申领法人卡（管理授权用）及操作员卡（日常报关操作用）
审核通过后安排领卡或邮寄交付，办理周期约3–5个工作日
四、出口退税备案
针对一般纳税人企业，通过电子税务局提交《出口退（免）税备案表》
绑定退税专用账户，完成出口退税资质备案
五、材料预审与全程跟进
提前审核全套材料，规避信息不一致、盖章不规范、英文翻译错误等高频驳回风险
每个节点实时同步进度，专属顾问一对一跟进`,
        cycle: ``,
        processSteps: [{ title: `资质评估`, time: `1 个工作日` }, { title: `材料收集`, time: `2–3 个工作日` }, { title: `经营范围增项`, time: `3–5 个工作日` }, { title: `海关备案`, time: `1–3 个工作日` }, { title: `电子口岸入网`, time: `3–5 个工作日` }, { title: `出口退税备案`, time: `约 1 个工作日` }, { title: `资质交付`, time: `当天` }],
        process: ``,
        pricing: `¥2,000（全套）（代办服务费；经营范围变更单独收费；特殊行业许可证费用另计）`,
        pricingNote: ``,
        advantages: ``,
        audience: `计划自主开展进出口贸易的内贸企业
工厂转型工贸一体的生产型企业
跨境电商卖家
新注册外贸公司`,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'domestic-rebate-first',
      category: 'compliance',
      title: `首单退税辅导`,
      desc: `首次退税全面核查逐项梳理 · 精准准备全套资料 · 顺利通过核查、打通资金回笼链条。`,
      priceLabel: `¥10,000`,
      priceValue: 10000,
      unit: ``,
      details: excelBlocks({
        content: `一、出口退税资质审核
审核企业是否具备出口退税资格（一般纳税人身份、海关编码备案、退税备案等）
核查企业经营范围、纳税人资质、出口业务类型等是否满足退税条件
确认企业是否已完成出口退（免）税备案，退税账户是否合规
对不符合条件的企业，提供整改建议及补救方案
二、基本信息资料辅导
协助填写《出口企业首次申报核查情况表》
指导撰写出口业务情况说明及企业声明
三、生产经营场地资料辅导
指导准备租赁合同或产权证明，确保覆盖核查期间
审核电费、水费、租金发票的连续性及一致性
核对银行付款回单与发票的匹配性
指导拍摄场地照片（办公及仓储情况）
四、员工情况资料辅导
指导准备社保缴纳记录、工资表及银行代发工资回单
五、出口业务辅导
审核报关单的完整性与准确性
指导出口发票开具规范，确保备注栏信息齐全
指导规范出口合同，避免合同瑕疵影响业务真实性判断
指导准备对应运输方式的货运单据（提单、运单、入出仓单等）
审核收汇凭证、报关费发票、运费单据等配套材料
指导整理与境外客户、货代的沟通记录作为辅助佐证
六、外购业务资料辅导
审核采购合同、进货凭证（发票/缴款书）、付款凭证的完整性
指导准备运输单据及运费对账材料
指导整理与供应商的沟通记录及其他佐证资料
七、税务自查整改辅导
指导完成增值税、企业所得税、印花税自查`,
        cycle: `3–6 个月（服务有效期一年）`,
        processSteps: [{ title: `需求沟通`, time: `1 周` }, { title: `资质审核`, time: `1 周` }, { title: `资料清单核对`, time: `1 周` }, { title: `资料准备辅导`, time: `2–4 周，视资料速度` }, { title: `合同及单证审核`, time: `1–2 周` }, { title: `核查情况表填写`, time: `1 周` }, { title: `税务自查辅导`, time: `1–2 周` }, { title: `资料整合交付`, time: `1 周` }, { title: `退税代理申报`, time: `税局审核约 1–3 个月` }],
        process: ``,
        pricing: `¥10,000（全套）（含资质审核、清单梳理、全套资料辅导、合同单证审核、税务自查辅导、资料整合交付、退税代理申报；多年度补审、账务混乱等复杂情况费用另议）`,
        pricingNote: ``,
        advantages: ``,
        audience: `首次申报出口退税的出口企业（含生产企业和外贸企业）
希望一次性通过税务核查的跨境电商、外贸、工贸一体企业`,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'domestic-rebate',
      category: 'compliance',
      title: `代理退税申报`,
      desc: `常态化出口退税申报代理 · 降低退税风险 · 加速资金回笼。`,
      priceLabel: `0.1%-0.3%`,
      priceValue: 5000,
      unit: `/ 出口销售额`,
      details: excelBlocks({
        content: `一、退税资格核查
核查企业出口退税资质有效性，涵盖海关备案、退税备案、外汇名录等关键
二、出口单证审核协助
审核报关单、出口发票、采购发票合规性及数据一致性。
协助企业把关出口合同、运输单据、收汇凭证等备案单证的完整性及逻辑一致性。
三、退税申报资料编制及退税系统操作
根据每笔出口业务，编制退税申报汇总表及明细表。
通过退税申报系统，提交退税申报数据。
跟进系统退单等异常情况，确保申报顺利推进。
五、退税审核配合与跟进
积极配合税务局审核，及时补充说明材料，缩短审核周期。
跟踪退税款到账情况，与企业核对退税金额，确保账务清晰。
对审核中提出的问题，协助企业出具专业情况说明。
六、退税台账与数据分析
建立专属企业退税台账，记录申报进度及退税到账情况。
定期出具退税进度报表，帮助企业精准掌握资金回笼节奏。
对退税周期异常情况进行预警分析，提供优化建议。
七、税务合规辅导
指导企业规范出口业务单证管理，建立长效合规机制。
协助配合处理退税相关的税务问询等事宜，提供专业应对支持。`,
        cycle: ``,
        processSteps: [{ title: `需求沟通与资质复核`, time: `1 周内` }, { title: `资料交接`, time: `单证齐全后 2–3 个工作日` }, { title: `单证审核`, time: `3–5 个工作日` }, { title: `资料编制`, time: `3–5 个工作日` }, { title: `系统申报`, time: `申报后持续跟踪` }, { title: `审核配合`, time: `按税局进度` }, { title: `退税到账`, time: `审核通过后到账审核通过后按国库退付进度到账` }, { title: `归档维护`, time: `按月` }],
        process: ``,
        pricing: `年度出口额人民币 0.1%–0.3%，最低 5,000 元/年（含全年退税申报代理、单证管理合规辅导、退税台账管理；多年度补申报、涉敏产品频繁函调、四类企业等复杂情况费用另议）`,
        pricingNote: ``,
        advantages: ``,
        audience: `已完成首单退税、进入常态化出口经营的企业
出口业务频繁、希望委托专业机构的外贸企业`,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'domestic-rebate-1210-9610',
      category: 'compliance',
      title: `1210/9610 出口退税首单陪跑服务`,
      desc: `单证梳理 · 申报演练 · 打通首单退税。`,
      priceLabel: `¥10,000`,
      priceValue: 10000,
      unit: ``,
      details: excelBlocks({
        content: `一、模式与条件确认
确认适用1210（保税跨境电商）还是9610（跨境电商直邮）模式及其对应的海关监管与退税口径
核查出口收发货人海关备案、退（免）税资格备案、进项发票取得等前置条件
评估企业是否具备单证齐全、账票货一致的首单申报基础
提供9610/1210 服务商资源对接
二、单证与备案准备
指导办理退（免）税备案及单一窗口、电子口岸操作权限开通
梳理报关单、跨境电商清单、平台销售数据、进项发票、收汇凭证，逐项核对确保"四单一致"
规范商品归类与HS编码，确认申报要素与监管条件匹配，退税率适用准确
三、首单申报辅导
逐项梳理首单真实性核查所需资料清单，编制统一申报口径与账务处理方案
辅导在出口退税申报系统填报、报送及审核状态跟踪，处理疑点反馈
指导进项发票勾选认证与退税/抵扣用途的区分，避免重复勾选
四、税局核查应对
辅导应对税局首单实地核查与真实性核查，准备访谈与佐证材料
配合答疑、补充资料，回应单证逻辑、资金流与货物流一致性问题
五、复盘与常态化建议
总结首单全流程与常见问题，输出标准化操作清单
给出后续常态化申报、发票管理与涉税风控建议`,
        cycle: `服务开启后 1 年`,
        processSteps: [{ title: `模式确认`, time: `1 周` }, { title: `备案与资质核查`, time: `1–2 周` }, { title: `单证梳理`, time: `2–4 周` }, { title: `申报演练`, time: `1 周` }, { title: `首单填报报送`, time: `按出口批次` }, { title: `税局核查应对`, time: `约 1–2 个月` }, { title: `退税到账`, time: `审核通过后到账审核通过后按国库退付进度到账` }, { title: `流程复盘`, time: `首单完结后 1 周内` }],
        process: ``,
        pricing: `¥10,000/次（含首单陪跑辅导；不含第三方审计、翻译等实报实销费用；后续常态化退税可另选代理退税申报服务）`,
        pricingNote: ``,
        advantages: ``,
        audience: `首次开展 1210 保税备货或 9610 直邮出口、需打通首单退税的跨境电商企业`,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'domestic-rebate-9810',
      category: 'compliance',
      title: `9810 出口退税首单陪跑服务`,
      desc: `离境退税 · 销售清算 · 首单落地。`,
      priceLabel: `¥10,000`,
      priceValue: 10000,
      unit: ``,
      details: excelBlocks({
        content: `一、模式与条件确认
确认9810（出口海外仓）模式适用性与"离境即退税"最新政策口径
核查退（免）税备案、海外仓备案（含跨境电商综试区要求）、单证与进项发票条件
指导完成跨境电商企业备案
二、单证与备案准备
办理海外仓相关备案，梳理报关单、海外仓入仓/销售清单、离境与销售数据
指导进项发票归集，核对离境、销售、收汇三环节单证一致性
规范海外仓库存台账与销售数据的留存，满足后续清算核验要求
三、首单申报辅导
辅导凭销售清单办理预退税、销售完成后按实际销售进行清算的申报流程
编制首单核查资料并在退税系统填报、报送，跟踪审核状态
指导预退与清算差额的处理及账务调整
四、税局核查应对
配合税局真实性核查，就离境、入仓、销售、收汇链条进行说明与补正
回应海外仓模式特有的销售确认时点与退税计算口径问询
五、复盘与常态化建议
提醒离境退税预退与清算流程，形成可复用的操作规范
给出常态化申报、海外仓数据管理与涉税风控建议`,
        cycle: `服务开启后 1 年`,
        processSteps: [{ title: `模式确认`, time: `1 周` }, { title: `备案与海外仓梳理`, time: `1–2 周` }, { title: `单证与进项归集`, time: `2–4 周` }, { title: `预退税申报`, time: `按出口批次` }, { title: `税局核查应对`, time: `约 1–2 个月` }, { title: `退税到账`, time: `审核通过后到账审核通过后按国库退付进度到账` }, { title: `复盘与常态化建议`, time: `首单完结后 1 周内` }],
        process: ``,
        pricing: `¥10,000/次（含 9810 首单陪跑辅导；依 2025 年第 3 号公告，销售未完成可凭清单预退税、销售完成后清算，具体以主管税局口径为准）`,
        pricingNote: ``,
        advantages: ``,
        audience: `采用亚马逊 FBA 等海外仓模式、以 9810 报关出口并希望离境退税的跨境电商企业`,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'hk-company',
      category: 'hongkong',
      title: `香港公司注册`,
      desc: `香港私人有限公司注册（含政府规费、注册地址、法定秘书服务）。`,
      priceLabel: `¥5,000`,
      priceValue: 5000,
      unit: ``,
      details: excelBlocks({
        content: `一、公司名称服务
提供2–3个备选名称，通过香港公司注册处网上查册中心进行名称查重
确认名称不含"银行""信托""保险""皇家""政府"等敏感词汇
中文名称以"有限公司"结尾，英文名称以"Limited"结尾，或选择纯英文名称
二、注册资本与股权结构规划
标准注册资本10,000港币（10,000股，每股面值1港币），认缴制，无需实缴验资
协助规划股东持股比例及董事任命方案
至少1名董事及1名股东，可为同一人，无国籍限制，年满18周岁即可
三、经营范围规划
根据企业实际业务方向，协助拟定合规的经营范围表述
中文不超过30字符，英文不超过60字符
核对经营范围是否涉及金融、医疗、教育、电信等需前置审批的限制类行业
四、法定文件起草与递交
起草公司章程大纲及细则（M&A）
填写法团成立表格（NNC1）
准备法定秘书任职同意书、注册地址使用证明、股本认缴声明书
通过香港公司注册处电子服务平台在线提交申请
五、注册地址与法定秘书
提供香港本地真实注册地址（首年），可接收政府及商业信件
委任持有TCSP牌照的香港本地法定秘书，履行法定合规义务
六、注册证书交付
审核通过后获取公司注册证明书（CI）、商业登记证（BR）、法团成立表（NNC1)
制作公司印章、股份证书、章程、法定文件册（绿盒资料）
全套文件整理交付`,
        cycle: `5–10 个工作日（电子递交最快 1–2 天出证）`,
        processSteps: [{ title: `名称查册`, time: `1 个工作日` }, { title: `资料收集`, time: `1–2 个工作日` }, { title: `文件起草`, time: `1–2 个工作日` }, { title: `递交注册`, time: `标准 5–7 个工作日；电子递交最快 1–2 天出证` }, { title: `证书交付`, time: `出证后 1–2 个工作日` }, { title: `后续对接（银行开户/记账报税/年审）`, time: `按需衔接` }],
        process: ``,
        pricing: `¥5,000（含政府规费、首年注册地址及法定秘书服务；次年起按年续费；银行开户、审计等第三方费用另行告知）`,
        pricingNote: ``,
        advantages: ``,
        audience: `计划拓展海外市场、搭建离岸架构的内地企业
跨境电商、外贸、咨询、投资类业务经营者`,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'hk-annual',
      category: 'hongkong',
      title: `香港公司年审`,
      desc: `周年申报（NAR1）+ 商业登记证（BR）续期 + 秘书/地址续期，全套法定合规维护。`,
      priceLabel: `¥3,000`,
      priceValue: 3000,
      unit: `/次`,
      details: excelBlocks({
        content: `一、周年申报表（NAR1）制作与递交
向香港公司注册处提交周年申报表，更新公司最新备案信息
核对并更新董事、股东、法定秘书、注册地址、股本等核心信息
核对申报信息，避免因信息错误引发合规风险
二、商业登记证（BR）续期
向香港税务局商业登记署申请换领新年度商业登记证
商业登记证是公司合法经营、银行开户、收款开票的核心凭证，有效期为1年
按税务局寄发的缴款通知书完成缴费及续期手续
三、法定秘书服务续期
香港公司必须委任持有TCSP牌照的香港本地法定秘书
年审期间同步续期秘书服务，确保政府文书收发、合规通知等职能正常运作
处理政府、银行、商务信件的代收发
挂水牌
SCR重要控制人备案
四、注册地址续期
提供香港本地真实有效注册地址，用于接收政府及商业信件
年审期间确认地址有效性并完成续期，确保公司始终具备合规的法定地址
五、SCR重要控制人登记册维护
协助公司维护重要控制人登记册（Significant Controllers Register）
确保受益所有人信息及时更新，满足香港反洗钱合规要求`,
        cycle: ``,
        processSteps: [{ title: `到期提醒`, time: `周年日前 1 个月` }, { title: `资料收集`, time: `3–5 个工作日` }, { title: `信息核对`, time: `1–2 个工作日` }, { title: `文件制作`, time: `2–3 个工作日` }, { title: `递交申报`, time: `注册处处理约 1–2 个工作日` }, { title: `完成交付`, time: `须在周年日后 42 天内完成` }],
        process: ``,
        pricing: `3,000 元/次（含 NAR1 申报 + BR 续期 + 秘书续期 + 地址续期，含政府规费与秘书服务费；信息变更费用另计；逾期补救罚款及专项费另报）`,
        pricingNote: ``,
        advantages: ``,
        audience: `所有已注册的香港有限公司（法定要求）
需维护香港银行账户正常使用的企业`,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'hk-audit-tax',
      category: 'hongkong',
      title: `香港公司审计报税`,
      desc: `持牌执业会计师年度审计报告及报税服务（香港强制合规义务）。`,
      priceLabel: `¥2,200`,
      priceValue: 2200,
      unit: `起`,
      details: excelBlocks({
        content: `一、账务整理与财务报表编制
由账务公司负责归集并审核全年业务单据，包括银行月结单、购销合同、发票、收付款水单、费用票据等
核对银行流水与交易凭证的一致性，纠正错账、漏账
按《香港财务报告准则》完成账目录入，登记总账与明细账
生成试算平衡表，确保账实相符
财务报表编制（编制资产负债表、利润表、现金流量表）
针对特殊业务场景（如跨境交易、关联交易、外币结算）进行专项账务处理
二、审计执行
由香港持牌核数师（HKICPA执业会员）独立核查财务报表的公允性与合法性
抽样核验收入、采购、费用的凭证真实性
向银行、主要客户及供应商发函确认余额
评估内部控制流程，识别财务风险并提出改进建议
三、审计报告出具
根据核查结果出具审计报告，报告类型包括：
无保留意见（最优，适用于正常经营企业）
保留意见（资料有瑕疵但整体公允）
否定意见（财报无法反映真实经营状况）
无法表示意见（审计范围受限）
报告由核数师签字盖章，注明执业证书编号，确保税务局及银行认可
四、税务申报配合
依据审计报告填写利得税报税表（BIR51/BIR52）
按时提交税表与审计报告
协助跟进评税通知及缴税事宜
五、无运营公司审计
针对无实际经营、无银行流水的公司，出具《无营运审计报告》
提供董事签署的《无经营声明书》模板
配合完成零申报处理`,
        cycle: ``,
        processSteps: [{ title: `需求确认`, time: `2–3 个工作日` }, { title: `资料收集`, time: `1–2 周` }, { title: `账务整理`, time: `约 2–3 周` }, { title: `审计执行`, time: `约 3–4 周` }, { title: `报告出具`, time: `约 1–2 周` }, { title: `税务申报`, time: `按税表期限内提交` }],
        process: ``,
        pricing: ``,
        pricingNote: ``,
        advantages: ``,
        audience: `所有在香港注册的有限公司（法定要求，无论盈亏均需审计）
需维护香港银行账户的企业`,
        conditions: ``,
        pricingTable: {
          headers: ["营业额档次", "普通企业", "电商企业"],
          rows: [["无运营", "2,200 元/年", "—"], ["≤200 万港币", "≤3,200 元/年", "≤4,800 元/年"], ["≤600 万港币", "≤4,000 元/年", "≤6,000 元/年"], ["≤1000 万港币", "≤4,800 元/年", "≤7,200 元/年"], ["≤2000 万港币", "≤6,600 元/年", "≤10,000 元/年"], ["≤4000 万港币", "≤8,500 元/年", "≤13,000 元/年"], ["≤6000 万港币", "≤9,800 元/年", "≤14,800 元/年"], ["≤8000 万港币", "≤11,600 元/年", "≤17,800 元/年"], ["≤1 亿港币", "≤13,600 元/年", "≤20,500 元/年"], ["≤1.5 亿港币", "≤16,600 元/年", "≤25,000 元/年"], ["≤2 亿港币", "≤20,600 元/年", "≤31,000 元/年"]],
        },
        bundle: null,
      }),
    },
    {
      id: 'hk-bank',
      category: 'hongkong',
      title: `香港公司开立银行账户`,
      desc: `银行匹配、资料预审、预约面签、跟进下户的代理服务。`,
      priceLabel: `¥5,000`,
      priceValue: 5000,
      unit: `起`,
      details: excelBlocks({
        content: `一、银行匹配与方案定制
根据客户业务背景、关联公司情况、开户预算，推荐合适银行与账户类型
一类银行：汇丰、恒生、香港星展、香港花旗等，需有关联公司（同股东/法人/董事）
二类银行：如建设银行（亚洲），无需关联公司，香港公司本地有实质运营或成立 18 个月以上提前告知不同银行的资料要求、审核重点与开户周期差异
对比各银行账户管理费、最低存款要求、跨境汇款手续费及网银功能，给出性价比建议
二、开户资料清单梳理
成立未满一年
香港公司注册资料（CR/BR/NNC1/章程）+意向购销合同各 1 份
董事身份证正反面+通行证正反面/护照+近 3 个月流水+近半年社保
国内关联公司营业执照+近 3 个月流水+购销合同各 2 份（配套发票/提单，合同金额需对应流水）
填写 KYC（尽职调查）问卷
成立满 1 年及以上
香港公司 CR+BR+NAR1+变更文件（如有）
董事身份证正反面+通行证正反面/护照+近 3 个月流水+近半年社保
香港公司近 3 个月银行流水+购销合同各 2 份（配套提单，合同金额需对应流水）
填写 KYC（尽职调查）问卷
三、银行预约
代为预约银行开户时间，整理高频面试问答清单并做模拟演练
协助董事完成视频见证，指导应对客户经理尽调提问
跟进补件、补充尽职调查材料，及时回应银行风控问询
四、账户激活与后续
跟进账户审批结果，指导账户激活、初始存款入账
协助开通网上银行、移动APP及跨境收付款功能
提供后续收付汇、结汇、账户日常维护及避免账户冻结的基本指引`,
        cycle: ``,
        processSteps: [{ title: `开户需求评估`, time: `1–2 个工作日` }, { title: `银行方案匹配`, time: `2–3 个工作日` }, { title: `资料清单发送`, time: `当天` }, { title: `资料准备与预审`, time: `1–2 周，视客户进度` }, { title: `预约银行（面签/视频见证）`, time: `预约后 1–2 周内` }, { title: `账户激活`, time: `面签后约 2–6 周，视银行审批` }, { title: `网银开通与交付`, time: `激活后即时安排` }],
        process: ``,
        pricing: ``,
        pricingNote: ``,
        advantages: ``,
        audience: `已注册香港公司、需开立对公账户收款的内地及跨境企业
跨境电商、外贸、投资、咨询等需境外收款与结算的经营者`,
        conditions: ``,
        pricingTable: {
          headers: ["银行方案", "价格"],
          rows: [["汇丰银行 / 恒生银行（需关联公司）", "¥5,000"], ["香港星展银行（需关联公司）", "¥8,000"], ["香港花旗银行（需关联公司，转账无限额）", "¥10,000"], ["建设银行（亚洲）（无需关联公司）", "¥6,000"]],
        },
        bundle: null,
      }),
    },
    {
      id: 'hk-change',
      category: 'hongkong',
      title: `香港公司变更服务`,
      desc: `名称/董事/股东/地址等信息变更 · 全套文件更新 · 一次办结。`,
      priceLabel: `¥800`,
      priceValue: 800,
      unit: `起`,
      details: excelBlocks({
        content: `一、变更事项梳理
确认变更类型（公司名称、董事、股东、法定秘书、注册地址、股本、经营范围等）
逐项评估各变更事项的合规要求、办理顺序与所需法定文件
核查是否存在变更限制情形（如未年审、有未决案件、股份质押等），先行处理前置障碍
就变更对公司银行账户、合同主体、资质牌照的连带影响进行提示与安排
二、文件编制
编制变更所需的股东决议、董事会/股东会会议记录及各类法定表格
准备法团成立表格NNC1或周年申报表NAR1等新版本法定文件
编制变更名称所需的公司印章更换文件、股东签字页及必要的授权委托文件
三、递交与办理
向香港公司注册处（CR）递交变更申请，同步更新商业登记证（税务局）信息
代为缴纳注册处、税务局牌费等政府规费，跟踪审批与出证进度
及时回应注册处补正要求，跟进审批状态直至变更生效
四、文件交付
取得最新注册证书（CI）、最新商业登记证（BR）
更新公司章程（如改名需更新组织章程大纲与细则）、会议记录本（如有）
整理全套变更后文件交付客户，并提供文件归档与后续银行/业务更新提示`,
        cycle: `整体约 1–2 周（视变更事项与政府审批）`,
        processSteps: [{ title: `变更需求确认`, time: `1–2 个工作日` }, { title: `资料收集`, time: `1–2 个工作日` }, { title: `文件编制`, time: `2–3 个工作日` }, { title: `递交注册处`, time: `当天` }, { title: `政府审批`, time: `名称变更约 1–2 周；董事/股东/地址约 3–5 个工作日` }, { title: `文件更新`, time: `2–3 个工作日` }, { title: `全套文件交付归档`, time: `审批通过后 1–2 个工作日` }],
        process: ``,
        pricing: ``,
        pricingNote: ``,
        advantages: ``,
        audience: `需变更名称、董事、股东、地址的香港公司
股权结构或法定秘书发生变动需合规备案的公司`,
        conditions: ``,
        pricingTable: {
          headers: ["变更事项", "价格"],
          rows: [["公司名称变更", "1,800 元（含税）"], ["变更董事及股权", "1,200 元（含税）"], ["变更公司秘书和注册地址", "800 元（含税）"], ["增加注册股本", "1,200 元（含税）"]],
        },
        bundle: null,
      }),
    },
    {
      id: 'hk-deregister',
      category: 'hongkong',
      title: `香港公司注销`,
      desc: `自愿清盘注销 · 合规关账 · 规避后续风险与欠费。`,
      priceLabel: `¥3,500`,
      priceValue: 3500,
      unit: `/次`,
      details: excelBlocks({
        content: `一、注销方案评估
核实公司真实状态（有无实际运营、银行账户余额、对外债务、未清税款、未决诉讼）
评估注销前需完成的休止活动、清税、关户、资产处置等事项，制定注销时间表
就董事、股东的后续责任（如欠缴税款、牌费）进行风险提示
二、银行账户与资产处理
指导先行注销银行账户，处理账户剩余资金与资产分配
确保账户资金在清盘/撤销前合规转出，避免账户被冻结后资金难以取出
三、税务清理事宜
处理未申报的利得税表，完成最后年度或过渡期的税务申报
申请税务局出具不反对撤销/清盘的确认函，清偿印花税、牌费等欠款
四、文件与申报
准备注销申请、股东特别决议、法定声明（简单撤销）或清盘人文件（正式清盘）
向公司注册处递交撤销/清盘文件，按程序刊登公告
五、注销确认与归档
取得公司注册处注销确认函（撤销宪报/清盘完成证明）
整理全套注销文件归档留存，提示客户注销后资料保存年限及后续义务`,
        cycle: `整体约 6–9 个月（视公司状态与税局审核进度）`,
        processSteps: [{ title: `注销需求评估`, time: `1 周` }, { title: `公司状态核查`, time: `1 周` }, { title: `银行账户关闭`, time: `约 2–4 周，视银行` }, { title: `申请不反对通知书`, time: `税局审核约 2–3 个月` }, { title: `递交注册处`, time: `取得不反对函后递交` }, { title: `取得注销确认`, time: `整体约 6–9 个月` }],
        process: ``,
        pricing: `3,500 元/次（含注销文件编制与递交；政府规费及清补税款另计，实报实销；有未了债务、诉讼或异常状态的公司需另行评估）`,
        pricingNote: ``,
        advantages: ``,
        audience: `停止经营的香港公司
因架构调整需清理境外主体的企业
被强制除名前希望主动合规注销的公司`,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'asia-my-setup',
      category: 'asia',
      title: `马来西亚公司设立`,
      desc: `注册 + 秘书 + 开户打包 · 多数客户需加购挂名董事 · 后续年审衔接。`,
      priceLabel: `¥12,800`,
      priceValue: 12800,
      unit: ``,
      details: excelBlocks({
        content: `一、设立方案设计
确认公司类型（私人有限公司Sdn Bhd为主）、股权结构、注册资本与经营范围
评估外资持股比例限制、行业准入（如需行业牌照）及本地董事/股东要求
对比不同架构（本地/外资）在税务、外资持股、银行开户上的差异，给出最优方案
二、注册与备案
进行公司名称查册与保留，避免重名被驳
准备公司章程、董事股东决议、注册通知书等注册文件，向马来西亚公司委员会（SSM）递交注册
办理商业登记及（如适用）地方市政牌照、行业许可
三、配套服务
提供持牌公司秘书及注册地址服务，满足本地合规要求
协助开设马来西亚本地银行账户，准备开户尽调资料
四、交付与后续
交付公司注册证书、公司章程、注册文件包（SSM记录）及印章
衔接后续年度申报（Annual Return）、做账报税（含SST、CIT）、受益人备案与合规维护（单独收费）`,
        cycle: `整体约 4–8 周（含银行开户尽调周期）`,
        processSteps: [{ title: `设立方案确认`, time: `1 周` }, { title: `名称查册与保留`, time: `1–2 个工作日` }, { title: `资料准备`, time: `1 周` }, { title: `SSM 注册`, time: `约 3–5 个工作日` }, { title: `秘书与地址就位`, time: `注册后即时` }, { title: `银行开户`, time: `约 2–4 周，视银行尽调` }, { title: `文件交付`, time: `开户后 1 周内` }],
        process: ``,
        pricing: `12,800 元（含公司注册 + 秘书费 + 开户；不含挂名董事）`,
        pricingNote: `中国籍等多数客户无本地董事资格时，需加购挂名董事：约 20,600 元/人/年（另需可退押金约 10,900 元；名义董事+股东套餐同口径）；政府规费、差旅等实报实销。`,
        advantages: ``,
        audience: `布局东南亚、开拓马来西亚及东盟市场的贸易与制造企业
需设立区域或采购主体的跨境电商及供应链企业`,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'asia-my-bookkeeping',
      category: 'asia',
      title: `马来西亚公司做账报税`,
      desc: `按马来西亚财务报告标准（MFRS）建账理账、月度管理报表与年度财务报表、企业所得税（CIT）申报（Form C/C-S）、税款缴纳与 LHDN 沟通。`,
      priceLabel: `¥10,000`,
      priceValue: 10000,
      unit: `起`,
      details: excelBlocks({
        content: `一、账务梳理与建账
按马来西亚财务报告标准（MFRS）梳理原始凭证、建立规范账套与科目体系
核对银行流水、进销存数据及应收应付往来款项
确认收入成本，确保账实、账账相符
二、月度/年度理账
整理凭证并编制月度管理报表（利润表、资产负债表等）
出具年度财务报表，为审计与税务申报提供基础
三、税务申报
办理企业所得税（CIT）及年结申报（Form C/C-S）
跟进税款缴纳与税局（LHDN）沟通`,
        cycle: `按财年周期持续服务（月度理账 + 年度申报）`,
        processSteps: [{ title: `资料收集`, time: `每月初` }, { title: `凭证梳理与建账`, time: `首次 2–3 周` }, { title: `月度理账`, time: `每月 10–15 个工作日内` }, { title: `年度报表编制`, time: `财年结束后 1–2 个月` }, { title: `税务申报`, time: `Form C/C-S：财年结束后 7 个月内` }, { title: `税款缴纳`, time: `按税局缴税通知` }],
        process: ``,
        pricing: `10,000 元起（按交易量、科目复杂度、是否含 SST 据实报价；审计费、SST 注册等实报实销）`,
        pricingNote: ``,
        advantages: ``,
        audience: ``,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'asia-my-audit',
      category: 'asia',
      title: `马来西亚公司年审`,
      desc: `年度申报（Annual Return）递交、公司秘书与注册地址维护、实益拥有人（BO）备案及年度更新、合规到期提醒。`,
      priceLabel: `¥10,000`,
      priceValue: 10000,
      unit: ``,
      details: excelBlocks({
        content: `一、年审材料准备
核对公司股东、董事、股本、注册地址、公司秘书等登记信息是否最新
准备年度申报所需文件，梳理需同步变更的登记事项
二、法定申报
向SSM递交年度申报（Annual Return），缴纳年审规费与逾期罚款（如有）
维护公司秘书服务及注册地址，确保法定文件送达地址有效
三、受益人备案
完成实益拥有人（BO）身份识别、信息核验与向SSM的BO系统备案及年度更新
四、合规提醒
提示年报截止日、应保存的法定登记册与决议文件归档要求`,
        cycle: `年度服务（周年日后 30 天内完成申报）`,
        processSteps: [{ title: `年审提醒`, time: `提前 1 个月` }, { title: `资料核对`, time: `1–2 周` }, { title: `年度申报递交`, time: `周年日后 30 天内` }, { title: `规费缴纳`, time: `递交时同步` }, { title: `秘书与地址维护`, time: `同步续期` }, { title: `受益人备案与归档`, time: `申报后更新` }],
        process: ``,
        pricing: `10,000 元/年（含秘书、注册地址、受益人备案及年审报告；政府规费实报实销）`,
        pricingNote: ``,
        advantages: ``,
        audience: ``,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'asia-sg-setup',
      category: 'asia',
      title: `新加坡公司设立`,
      desc: `注册 + 秘书 + 名义董事 + 注册地址 · 次年起续费约 ¥25,800/年。`,
      priceLabel: `¥39,000`,
      priceValue: 39000,
      unit: ``,
      details: excelBlocks({
        content: `一、设立方案设计
确认公司类型（私人有限公司Pte Ltd）、股本结构与经营范围
评估股东构成、本地董事（至少1名新加坡ordinarily resident董事）及公司秘书、审计等合规要求
二、注册与备案
进行名称核准备案（ACRA），避免名称违规或重名
准备注册文件（章程、董事股东同意书、注册地址证明），递交注册
三、配套服务
提供持牌公司秘书、名义（本地）董事及商业注册地址服务，满足本地合规要求
四、交付与后续
交付公司注册文件（含注册证书、公司印章等）
衔接做账、法定审计（视豁免条件）、年度股东大会（AGM）与年度申报（AR）等合规维护（（单独收费）`,
        cycle: `整体约 2 周`,
        processSteps: [{ title: `设立方案确认`, time: `1 周` }, { title: `名称核准`, time: `ACRA 1–2 个工作日` }, { title: `资料准备`, time: `3–5 个工作日` }, { title: `ACRA 注册`, time: `1–3 个工作日` }, { title: `秘书/名义董事/地址就位`, time: `注册后即时` }, { title: `文件交付`, time: `整体约 2 周` }],
        process: ``,
        pricing: `39,000 元（含注册 + 秘书代理 + 名义董事 + 注册地址；政府规费等实报实销；名义董事为合规挂名安排，不参与经营）`,
        pricingNote: `次年起续费约 25,800 元/年（名义董事约 23,400 + 注册地址约 2,350，据实微调）；做账、审计等另计。`,
        advantages: ``,
        audience: ``,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'asia-sg-bookkeeping',
      category: 'asia',
      title: `新加坡公司做账报税`,
      desc: `按新加坡财务报告准则（SFRS）记账、财务报表编制与 XBRL 填报、ECI 及 Form C/CS 税务代理申报。`,
      priceLabel: `¥55,800`,
      priceValue: 55800,
      unit: `起`,
      details: excelBlocks({
        content: `一、账务处理
按新加坡财务报告准则进行日常记账、科目归集与凭证管理
核对银行流水、平台回款与应收应付往来，确保账实相符
按公司财年（FY）规范收入确认与费用归集
二、财务报表编制
编制财年年度财务报表（损益表、资产负债表等）
XBRL 填报
三、税务代理申报
税务代理：完成ECI 及 Form C/CS/CS (Lite)申报`,
        cycle: `按财年周期持续服务（月度记账 + 年度 ECI 及 Form C/C-S 申报）`,
        processSteps: [{ title: `资料收集`, time: `按月/季` }, { title: `日常记账`, time: `按月完成` }, { title: `财务报表编制与 XBRL 申报`, time: `财年结束后 1–2 个月` }, { title: `企业税申报（ECI）`, time: `财年结束后 3 个月内` }, { title: `企业税申报（Form C/C-S）`, time: `每年 11 月 30 日前` }, { title: `税款缴纳`, time: `按评税通知` }],
        process: ``,
        pricing: `55,800 元起（按交易量与复杂程度据实报价；关联方交易、预扣税申报另收）`,
        pricingNote: ``,
        advantages: ``,
        audience: ``,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'asia-sg-audit',
      category: 'asia',
      title: `新加坡公司审计服务`,
      desc: `法定审计豁免条件确认、审计实施与报告出具 · 按收入规模与合并层级据实上浮。`,
      priceLabel: `¥26,300`,
      priceValue: 26300,
      unit: `起`,
      details: excelBlocks({
        content: `一、审计范围确认
确认公司是否符合法定审计豁免条件（按营业额、总资产、雇员人数的休眠/小型公司豁免规则）
明确审计范围、财年区间与期初余额处理方式
评估关联方、跨境交易与重大合同对审计范围的影响
二、审计实施
审阅账务与凭证，执行分析性程序与实质性测试
处理期初余额核对、往来款项函证、关联方交易核对与存货、固定资产盘点抽验
评估内部控制与重大错报风险，识别需调整或披露事项
三、报告出具
按新加坡审计准则（SAS/ISA）出具独立审计报告及审计意见
配合财务报表定稿与企业所得税报税表的衔接`,
        cycle: `整体约 8–12 周`,
        processSteps: [{ title: `审计条件确认`, time: `1 周` }, { title: `资料收集`, time: `1–2 周` }, { title: `期初余额与凭证审阅`, time: `2–3 周` }, { title: `审计程序执行`, time: `3–4 周` }, { title: `报告出具`, time: `1–2 周` }],
        process: ``,
        pricing: `26,300 元起（含法定审计及期初余额程序；按收入规模、合并层级等据实上浮；政府规费、做账报税另计）`,
        pricingNote: ``,
        advantages: ``,
        audience: ``,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'europe-uk-setup',
      category: 'europe',
      title: `英国公司设立`,
      desc: `注册公司 + 注册地址 + 秘书服务 · 快速设立。`,
      priceLabel: `¥4,300`,
      priceValue: 4300,
      unit: ``,
      details: excelBlocks({
        content: `一、设立方案设计
确认公司类型（Private Limited Company）、董事与股东构成、注册地址与经营范围（SIC码）
评估是否需设公司秘书、董事责任及KYC要求
对比英国居民/非居民公司在税务、开户、公证认证上的差异，给出最优架构
二、注册与备案
进行名称核准备案（Companies House），避免敏感词或重名
准备注册文件（章程、注册表格IN01、PSC信息、AOA等），向英国公司注册处递交注册
三、配套服务
提供注册办公地址（Registered Office）与公司秘书服务，保障法定文件送达
四、交付与后续
交付公司注册证书（Certificate of Incorporation）、章程及注册处备案记录
衔接VAT注册、做账报税、年度确认书（Confirmation Statement）与年度账户申报等合规维护（单独收费）`,
        cycle: `整体约 1 周`,
        processSteps: [{ title: `设立方案确认`, time: `1–2 个工作日` }, { title: `名称核准`, time: `即时–1 个工作日` }, { title: `资料准备`, time: `1–2 个工作日` }, { title: `Companies House 注册`, time: `线上递交约 24 小时内出证` }, { title: `地址与秘书就位`, time: `注册后即时` }, { title: `文件交付`, time: `整体约 1 周` }],
        process: ``,
        pricing: `4,300 元（含注册公司 + 注册地址 + 秘书服务；政府规费、VAT 注册等按实际另计）`,
        pricingNote: ``,
        advantages: ``,
        audience: ``,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'europe-uk-vat',
      category: 'europe',
      title: `英国 VAT 注册及申报`,
      desc: `注册义务评估（远程销售阈值、平台代收规则）、HMRC 递交 VAT 注册、进销项发票与台账规范、季度申报与税款缴纳、MTD 电子申报合规提醒。`,
      priceLabel: `¥1,500`,
      priceValue: 1500,
      unit: ``,
      details: excelBlocks({
        content: `一、VAT注册
评估注册义务（远程销售阈值、本地库存/发货、进口、平台代收规则等），判断应注册本地VAT还是走OSS
准备公司、董事、业务与供应链资料，向HMRC递交VAT注册申请，取得英国VAT号
二、账务与发票规范
规范进销项发票格式与税率处理（标准20%/减免5%/零税率等），区分B2B与B2C
建立VAT台账与进项抵扣记录，做好进口增值税（I/VAT）与海关单据匹配
三、申报与缴纳
按季向HMRC 提交VAT申报
完成税款缴纳与HMRC对账
四、合规提醒
提示申报截止日（MTD强制电子申报）、记录留存`,
        cycle: `VAT 注册约 2–4 周；后续按季度持续申报`,
        processSteps: [{ title: `注册义务评估`, time: `2–3 个工作日` }, { title: `资料准备`, time: `1 周` }, { title: `HMRC 注册取得 VAT 号`, time: `约 2–4 周` }, { title: `账务与发票规范`, time: `取得税号后 1–2 周` }, { title: `季度申报`, time: `季度结束后 1 个月零 7 天内` }, { title: `税款缴纳与档案留存`, time: `申报时同步` }],
        process: ``,
        pricing: `1,500 元（含 VAT 注册及年度申报，按交易量据实报价；HMRC 税款实报实销）`,
        pricingNote: ``,
        advantages: ``,
        audience: ``,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'europe-uk-bookkeeping',
      category: 'europe',
      title: `英国公司做账报税（不含 VAT）`,
      desc: `按英国会计准则记账、年度财务报表编制、公司税（Corporation Tax）计算与 CT600 报税表申报。`,
      priceLabel: `¥4,000`,
      priceValue: 4000,
      unit: `起`,
      details: excelBlocks({
        content: `一、账务处理
按英国会计准则进行日常记账、科目归集与凭证管理
核对银行流水、平台回款与往来款项，确保账实相符
按财年规范收入确认、成本、费用归集
编制财年年度财务报表（损益表、资产负债表等）
二、企业所得税申报
计算公司税（Corporation Tax），区分应税利润与可扣除项目，适用相应税率与小型利润税率
编制公司税报税表（CT600），完成HMRC申报与税款缴纳`,
        cycle: `按财年周期持续服务（月度记账 + 年度 CT600 申报）`,
        processSteps: [{ title: `资料收集`, time: `财年结束后 1 个月内` }, { title: `日常记账`, time: `按月完成` }, { title: `公司税计算`, time: `财年结束后 1–2 个月` }, { title: `CT600 报税`, time: `财年结束后 9 个月内，与年报账目同步` }, { title: `税款缴纳`, time: `按 HMRC 缴税通知` }],
        process: ``,
        pricing: `4,000 元起（含公司税申报，不含 VAT；法定审计等按实际另计）`,
        pricingNote: ``,
        advantages: ``,
        audience: ``,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'europe-de-setup',
      category: 'europe',
      title: `德国公司设立`,
      desc: `注册公司 + 注册地址 + 秘书服务 + 银行开户 · 合规设立。`,
      priceLabel: `¥80,000`,
      priceValue: 80000,
      unit: ``,
      details: excelBlocks({
        content: `一、设立方案设计
确认公司类型（有限责任公司GmbH/微型有限责任公司UG等）、注册资本与经营范围
二、开立验资账户并注资
持核名通知书及公证章程开立临时验资账户，存入注册资本（GmbH最低实缴25,000欧元），银行出具验资证明。
二、注册与备案
进行名称与经营范围（含主营与附属业务）核定
起草公司设立合同/章程并经德国公证人（Notar）公证，开设资本账户并入缴最低资本
向商业登记簿（Handelsregister）递交登记并完成公告（如适用）
三、配套服务
提供商业注册地址与秘书/合规支持（含法定地址、文件接收）
四、交付与后续
交付商业登记证明、公证文件、章程及相关登记证明
衔接VAT注册及申报、做账报税、企业所得税/营业税申报与工商年报、联邦公报电子披露等合规维护（单独收费）`,
        cycle: `整体约 6–8 周`,
        processSteps: [{ title: `设立方案确认`, time: `1 周` }, { title: `开临时账户与注资`, time: `1–2 周` }, { title: `章程起草与公证`, time: `1–2 周` }, { title: `商业登记`, time: `约 2–4 周` }, { title: `地址与秘书配套`, time: `登记后即时` }, { title: `文件交付`, time: `整体约 6–8 周` }],
        process: ``,
        pricing: `80,000 元（含银行开户 + 注册公司 + 注册地址 + 秘书服务；公证费、商业登记费等政府规费实报实销）`,
        pricingNote: ``,
        advantages: ``,
        audience: ``,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'europe-de-vat',
      category: 'europe',
      title: `德国 VAT 注册及申报`,
      desc: `注册义务评估、德国税务机关 VAT 号申请、进销项台账规范、月/季预申报（UStVA）与年度申报（Jahreserklärung）、ELSTER 电子申报合规提醒。`,
      priceLabel: `¥2,500`,
      priceValue: 2500,
      unit: ``,
      details: excelBlocks({
        content: `一、VAT注册
评估注册义务（本地库存/仓储、进口、远程销售阈值等），准备公司、业务与供应链资料
向德国税务机关申请，取得德国VAT号
二、账务与发票规范
规范德国发票格式与税率，建立进销项台账与进项抵扣记录
做好进口增值税、内reverse charge等不同场景的处理
三、申报与缴纳
按月/季提交预先增值税申报（Voranmeldung/UStVA）并预缴
完成年度增值税申报（Jahreserklärung）
四、合规提醒
提示申报截止日、ELSTER电子申报要求、担保/保证金及税务稽查（Umsatzsteuer-Nachschau）应对要求
提示发票合规、年度申报与预缴差异调整等风险点`,
        cycle: `VAT 号申请约 4–8 周；后续按月/季持续申报`,
        processSteps: [{ title: `注册义务评估`, time: `2–3 个工作日` }, { title: `资料与税务代表准备`, time: `1 周` }, { title: `取得 VAT 号`, time: `约 4–8 周，视税局签发速度` }, { title: `发票与台账规范`, time: `取得税号后 1–2 周` }, { title: `月度/季度预申报`, time: `月度申报于次月 10 日前` }, { title: `年度申报`, time: `次年 7 月 31 日前` }],
        process: ``,
        pricing: `2,500 元起（含 VAT 注册及申报，按交易量与频次据实报价；税务代表费等实报实销）`,
        pricingNote: ``,
        advantages: ``,
        audience: ``,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'europe-de-bookkeeping',
      category: 'europe',
      title: `德国公司做账报税（不含 VAT）`,
      desc: `按德国商法典（HGB）/GoBD 记账、年度财务报表编制、企业所得税（KSt）及团结附加计算、营业税（GewSt）测算、ELSTER 年度申报。`,
      priceLabel: `¥20,000`,
      priceValue: 20000,
      unit: `起`,
      details: excelBlocks({
        content: `一、账务处理
按德国商法典（HGB）/IFRS进行日常记账、科目归集与凭证管理，遵循及时记账原则（GoBD）
核对银行流水与往来款项，建立合规账簿与电子可机读账务
按财年规范收入确认、存货计价与折旧摊销
编制财年年度财务报表（损益表、资产负债表等）
二、企业所得税申报
计算企业所得税（KSt）及团结附加，并测算营业税（GewSt，按当地税稽征率）
编制年度财务与税务申报，向税务机关（ELSTER）递交年度账目与税务申报表`,
        cycle: `按财年周期持续服务（月度记账 + 年度申报）`,
        processSteps: [{ title: `资料收集`, time: `按月/季` }, { title: `日常记账`, time: `按月完成` }, { title: `所得税与营业税计算`, time: `财年结束后 1–2 个月` }, { title: `年度申报`, time: `次年 7 月 31 日前，经税务顾问可延期` }, { title: `税款缴纳`, time: `按税局缴税通知` }],
        process: ``,
        pricing: `20,000 元起（含所得税及营业税申报，不含 VAT）`,
        pricingNote: ``,
        advantages: ``,
        audience: ``,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'europe-fr-setup',
      category: 'europe',
      title: `法国公司设立`,
      desc: `注册公司 + 注册地址 + 秘书服务 · 合规设立。`,
      priceLabel: `¥13,000`,
      priceValue: 13000,
      unit: ``,
      details: excelBlocks({
        content: `一、设立方案设计
确认公司类型（SARL有限责任公司/SAS简易股份公司等）、注册资本、股东与经营范围
评估董事（président/gérant）责任、公证、法定公告及银行资本金要求
对比SARL与SAS在治理灵活度、社保、外资持股上的差异，给出适配建议
二、注册与备案
进行名称与经营范围核定
起草章程、刊登设立公告并准备注册文件（含 beneficial owner 备案）
向商业法庭/单一窗口（Guichet unique / INPI）递交注册，取得SIREN/SIRET及Kbis营业执照
三、配套服务
提供注册地址与秘书/法务支持，保障法定地址与文件送达
四、交付与后续
交付Kbis营业执照、章程、SIREN/SIRET及设立公告等公司文件
衔接做账报税、年度财务报表与税务申报（liasse fiscale）、VAT申报等合规维护（单独收费）`,
        cycle: `整体约 2–4 周`,
        processSteps: [{ title: `设立方案确认`, time: `1 周` }, { title: `章程起草`, time: `1 周` }, { title: `公告刊登`, time: `1–2 个工作日` }, { title: `单一窗口注册`, time: `约 1–2 周` }, { title: `取得 Kbis`, time: `注册后即时可取` }, { title: `地址与秘书就位`, time: `注册后即时` }, { title: `文件交付`, time: `整体约 2–4 周` }],
        process: ``,
        pricing: `13,000 元（含注册公司 + 注册地址 + 秘书服务；政府公告费、登记费等实报实销）`,
        pricingNote: ``,
        advantages: ``,
        audience: ``,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'europe-fr-vat',
      category: 'europe',
      title: `法国 VAT 税号注册`,
      desc: `注册义务评估（含进口 VAT 与 OSS 适用边界）、法国税务机关 VAT 号申请、发票与台账规范、CA3（或 CA12）申报、2026 年起电子开票合规提醒。`,
      priceLabel: `¥3,500`,
      priceValue: 3500,
      unit: `起`,
      details: excelBlocks({
        content: `一、VAT注册
评估注册义务（本地库存/发货、进口、远程销售阈值、平台代收等），准备公司、业务与供应链资料
向法国税务机关（SIE，通过Guichet unique）递交注册申请，取得法国VAT号（numéro de TVA intracommunautaire）及SIREN关联登记
针对非欧盟卖家的进口 VAT（PVL）与自营/OSS适用边界进行说明
二、账务与发票规范
规范法国发票格式与税率（标准20%/减免等），建立进销项与进项抵扣台账
做好进口增值税、内反向征收（autoliquidation）与跨境B2B交易的处理
三、申报与缴纳
按月/季/年提交CA3（或 régime simplifié 的CA12简并申报）申报表
完成税款缴纳与税务机关对账，处理欧盟DEB/ESL货物与服务申报（达门槛）
四、合规提醒
提示申报截止日（TVA数字报告2026年起分批强制）、发票电子开票合规与稽查（vérification de comptabilité）应对要求`,
        cycle: `VAT 号申请约 3–6 周；后续按月/季持续申报`,
        processSteps: [{ title: `注册义务评估`, time: `2–3 个工作日` }, { title: `资料准备`, time: `1 周` }, { title: `取得 VAT 号`, time: `约 3–6 周` }, { title: `发票与台账规范`, time: `取得税号后 1–2 周` }, { title: `CA3 申报`, time: `月度申报于次月内提交` }, { title: `税款缴纳与档案留存`, time: `申报时同步` }],
        process: ``,
        pricing: `3,500 元起（含 VAT 注册及申报支持；税务代表费等实报实销）`,
        pricingNote: ``,
        advantages: ``,
        audience: ``,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'europe-fr-bookkeeping',
      category: 'europe',
      title: `法国公司做账报税（不含 VAT）`,
      desc: `按法国通用会计准则（PCG）记账、年度财务报表编制、企业所得税（IS）计算与 liasse fiscale 申报（2065 等表格）。`,
      priceLabel: `¥10,000`,
      priceValue: 10000,
      unit: `起`,
      details: excelBlocks({
        content: `一、账务处理
按法国通用会计准则（PCG）进行日常记账、科目归集与凭证管理，凭证须依法留存
核对银行流水与往来款项，建立合规账簿与年结分录
按财年规范收入确认、存货计价与折旧摊销
二、财务报表编制
编制年度财务报表
三、企业所得税申报
计算企业所得税（IS，按适用税率/优惠税率），区分应税与可扣除项目
编制税务申报附件（liasse fiscale），向税务机关递交年度账务与税务申报（2065等表格）`,
        cycle: `按财年周期持续服务（月度记账 + 年度 liasse fiscale 申报）`,
        processSteps: [{ title: `资料收集`, time: `按月/季` }, { title: `日常记账`, time: `按月完成` }, { title: `所得税计算`, time: `财年结束后 1–2 个月` }, { title: `年度税务申报`, time: `liasse fiscale，按财年法定期限` }, { title: `税款缴纳`, time: `按税局缴税通知` }],
        process: ``,
        pricing: `10,000 元起（含做账与企业所得税申报，不含 VAT）`,
        pricingNote: ``,
        advantages: ``,
        audience: ``,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    },
    {
      id: 'other-us-setup',
      category: 'other',
      title: `美国公司设立`,
      desc: `州际架构评估 + 注册 + 注册地址 + 注册代理 · 合规落地。`,
      priceLabel: `¥2,500`,
      priceValue: 2500,
      unit: `起`,
      details: excelBlocks({
        content: `一、设立方案设计
评估注册州（特拉华、怀俄明、科罗拉多、佛罗里达等）的法律、税收、年报费用与开户便利度差异
确定公司类型（C-Corp/LLC/（S-Corp视身份））、股权结构、经营范围与合规义务
结合业务模式、融资需求与身份（居民/非居民）给出州与架构选择建议
二、注册与备案
进行公司名称查册与保留
向州务卿（Secretary of State）递交注册文件（Articles of Incorporation/Organization），取得州注册号（File Number）
向国税局（IRS）申请联邦雇主识别号（EIN）
三、配套服务
提供注册地址与注册代理（Registered Agent）服务，保障法定文件接收与送达
四、交付与后续
交付注册证书（Certificate of Formation/Incorporation）、章程/运营协议、EIN确认函等文件
衔接联邦与州税（如1120/1065/1120-S）、Franchise Tax、年报与合规申报、BOI申报等持续合规（单独收费）`,
        cycle: `整体约 2–4 周（视注册州）`,
        processSteps: [{ title: `架构与选州评估`, time: `2–3 个工作日` }, { title: `名称查册`, time: `1–2 个工作日` }, { title: `资料准备`, time: `1–2 个工作日` }, { title: `州务卿注册`, time: `科罗拉多/怀俄明约 1–3 个工作日；特拉华/佛罗里达约 1–2 周` }, { title: `取得 EIN`, time: `注册后约 1–2 周，非美国居民申请人稍长` }, { title: `注册地址与代理就位`, time: `注册后即时` }, { title: `文件交付`, time: `整体约 2–4 周，视州` }],
        process: ``,
        pricing: ``,
        pricingNote: `（含秘书服务、代收官方信函、一年地址挂靠；其他州及多州注册另议）`,
        advantages: ``,
        audience: ``,
        conditions: ``,
        pricingTable: {
          headers: ["注册州及类型", "价格"],
          rows: [["科罗拉多州 C-Corp / LLC", "2,500 / 2,800 元"], ["佛罗里达州 C-Corp / LLC", "3,800 / 4,800 元"], ["特拉华 C-Corp / LLC", "4,500 / 5,000 元"], ["怀俄明 C-Corp / LLC", "3,800 / 4,900 元"]],
        },
        bundle: null,
      }),
    },
    {
      id: 'other-us-bookkeeping',
      category: 'other',
      title: `美国公司做账报税`,
      desc: `按美国会计准则（US GAAP）记账、年度财务报表编制、按实体类型编制联邦所得税申报、州所得税/销售税（Sales Tax）/特许经营税（Franchise Tax）申报、1099/W-8BEN-E/`,
      priceLabel: `¥2,500`,
      priceValue: 2500,
      unit: `起`,
      details: excelBlocks({
        content: `一、账务处理
按美国会计准则（US GAAP/现金制按需）进行日常记账、科目归集与凭证管理
核对银行流水、平台回款与应收应付往来，确保账实相符
按财年（日历/财政年）规范收入确认与费用归集
编制财年年度财务报表（损益表、资产负债表等）
二、税务申报
按实体类型编制联邦所得税申报
办理注册州所得税、销售税（Sales Tax，达关联 nexus）与特许经营税（Franchise Tax）申报
三、合规提醒
提示联邦/州申报截止日、延长期申请，以及1099、W-8BEN-E、BOI申报等合规报表要求`,
        cycle: `按财年周期持续服务（月度记账 + 年度联邦及州税申报）`,
        processSteps: [{ title: `资料收集`, time: `财年结束后 1 个月内` }, { title: `日常记账`, time: `按月完成` }, { title: `联邦所得税申报`, time: `C-Corp：4 月 15 日前；LLC/合伙：3 月 15 日前，均可申请延期` }, { title: `州税申报`, time: `按各州规定` }, { title: `税款缴纳`, time: `按 IRS/州税局通知` }],
        process: ``,
        pricing: `2,500 元起（按交易量与复杂度据实报价；联邦/州税费、销售税申报、审计等按实际另计）`,
        pricingNote: ``,
        advantages: ``,
        audience: ``,
        conditions: ``,
        pricingTable: null,
        bundle: null,
      }),
    }
  ];

  const LEGACY_SERVICE_IDS = {
    'tax-consult': 'consult-1v1',
    'tax-diagnosis': 'domestic-diagnosis',
    'tax-coach': 'consult-annual',
    bookkeeping: 'domestic-compliance-bookkeeping',
    'company-setup': 'domestic-setup',
    'sole-trader': 'domestic-1039-sole',
    'export-1039': 'domestic-1039-export',
    'trade-license': 'domestic-trade-license',
    'rebate-first': 'domestic-rebate-first',
    'rebate-agent': 'domestic-rebate',
    'hk-setup': 'hk-company',
    'hk-annual-return': 'hk-annual',
    'hk-audit': 'hk-audit-tax',
    'bundle-0110': 'domestic-arch-0110-hk',
    'bundle-1039': 'domestic-arch-1039-hk',
    'hk-bank-account': 'hk-bank',
    'hk-alteration': 'hk-change',
    'hk-cancel': 'hk-deregister',
  };

  window.getServiceById = function getServiceById(id) {
    const resolved = LEGACY_SERVICE_IDS[id] || id;
    return (window.DAOITH_SERVICES || []).find((s) => s.id === resolved) || null;
  };

  window.formatServicePrice = function formatServicePrice(value) {
    const n = Number(value) || 0;
    return `¥${n.toLocaleString('zh-CN')}`;
  };

  /** Volume / tier pricing used by bundles + cart auto-calc */
  const HK_AUDIT_ECOM_TIERS = [
    { max: 0, fee: 2200, label: '无运营' },
    { max: 2000000, fee: 4800, label: '≤200万港币' },
    { max: 6000000, fee: 6000, label: '≤600万港币' },
    { max: 10000000, fee: 7200, label: '≤1,000万港币' },
    { max: 20000000, fee: 10000, label: '≤2,000万港币' },
    { max: 40000000, fee: 13000, label: '≤4,000万港币' },
    { max: 60000000, fee: 14800, label: '≤6,000万港币' },
    { max: 80000000, fee: 17800, label: '≤8,000万港币' },
    { max: 100000000, fee: 20500, label: '≤1亿港币' },
    { max: 150000000, fee: 25000, label: '≤1.5亿港币' },
    { max: 200000000, fee: 31000, label: '≤2亿港币' },
  ];

  window.DAOITH_VOLUME_RULES = {
    'domestic-1039-export': {
      model: 'percent',
      scope: 'mainland',
      rate: 0.004,
      minFee: 0,
      metricLabel: { zh: '预计年报关金额（人民币）', en: 'Est. annual customs value (RMB)' },
      hint: { zh: '按报关金额 0.4% 预估；实际按票结算，单票另有最低收费。', en: 'Estimate at 0.4% of customs value; actual billing is per shipment.' },
    },
    'domestic-rebate': {
      model: 'percent',
      scope: 'mainland',
      rate: 0.001,
      rateMax: 0.003,
      minFee: 5000,
      metricLabel: { zh: '预计年度出口额（人民币）', en: 'Est. annual export value (RMB)' },
      hint: { zh: '按年度出口额 0.1%–0.3% 计，最低 ¥5,000/年。', en: '0.1%–0.3% of annual export value, min ¥5,000 / year.' },
    },
    'hk-audit-tax': {
      model: 'tier',
      scope: 'hk',
      tiers: 'hk-audit-ecom',
      metricLabel: { zh: '香港公司预计年营业额（港币）', en: 'Est. HK company annual turnover (HKD)' },
      hint: { zh: '按电商档位预估审计报税费；填 0 视为无运营档。', en: 'E-commerce audit tier estimate; enter 0 for dormant.' },
    },
  };

  function resolveTiers(key) {
    if (key === 'hk-audit-ecom') return HK_AUDIT_ECOM_TIERS;
    return Array.isArray(key) ? key : null;
  }

  function enrichModulePricing(mod) {
    if (!mod) return null;
    const rule = window.DAOITH_VOLUME_RULES[mod.serviceId || mod.id] || null;
    const pricingModel =
      mod.pricingModel ||
      (rule?.model) ||
      (Number(mod.priceValue) > 0 ? 'fixed' : 'percent');
    const volumeScope = mod.volumeScope || rule?.scope || null;
    return {
      id: mod.serviceId || mod.id || '',
      label: mod.label || '',
      priceValue: Number(mod.priceValue) || 0,
      priceLabel: mod.priceLabel || '',
      pricingModel,
      volumeScope,
      rate: mod.rate != null ? Number(mod.rate) : rule?.rate,
      minFee: mod.minFee != null ? Number(mod.minFee) : rule?.minFee,
      maxFee: mod.maxFee != null ? Number(mod.maxFee) : rule?.maxFee,
      tiers: mod.tiers || rule?.tiers || null,
    };
  }

  function isVolumeModule(mod) {
    const m = enrichModulePricing(mod);
    return m && (m.pricingModel === 'percent' || m.pricingModel === 'tier');
  }

  function feeFromVolume(mod, salesByScope) {
    const m = enrichModulePricing(mod);
    if (!m || !isVolumeModule(m)) return { fee: Math.max(0, Number(m?.priceValue) || 0), pending: false };
    const scope = m.volumeScope || 'mainland';
    const raw = salesByScope?.[scope];
    if (raw == null || raw === '') return { fee: 0, pending: true };
    const amount = Math.max(0, Number(raw) || 0);

    if (m.pricingModel === 'percent') {
      let fee = Math.round(amount * (Number(m.rate) || 0));
      if (m.minFee != null) fee = Math.max(fee, Number(m.minFee) || 0);
      if (m.maxFee != null) fee = Math.min(fee, Number(m.maxFee) || fee);
      return { fee, pending: false };
    }

    if (m.pricingModel === 'tier') {
      const tiers = resolveTiers(m.tiers);
      if (!tiers?.length) return { fee: 0, pending: true };
      if (amount <= 0) return { fee: Number(tiers[0].fee) || 0, pending: false };
      const hit = tiers.find((t, i) => i > 0 && amount <= Number(t.max)) || tiers[tiers.length - 1];
      return { fee: Number(hit?.fee) || 0, pending: false };
    }
    return { fee: 0, pending: false };
  }

  function repriceCartItem(item) {
    const salesByScope = item.salesByScope || {};
    const mods = Array.isArray(item.bundleSelection) ? item.bundleSelection.map(enrichModulePricing) : null;
    const service = window.getServiceById?.(item.id);

    if (!mods?.length) {
      const rule = window.DAOITH_VOLUME_RULES[item.id];
      if (!rule) {
        return {
          ...item,
          priceValue: Number(item.priceValue) || 0,
          priceLabel: item.priceLabel || window.formatServicePrice(item.priceValue),
          volumePending: false,
        };
      }
      const { fee, pending } = feeFromVolume({ serviceId: item.id, pricingModel: rule.model, volumeScope: rule.scope }, salesByScope);
      return {
        ...item,
        priceValue: pending ? 0 : fee,
        priceLabel: pending ? (window.DAOITH_getLocale?.() === 'en' ? 'Enter sales to estimate' : '填写销售额后计算') : window.formatServicePrice(fee),
        volumePending: pending,
        volumeScopes: [rule.scope],
      };
    }

    const fixed = mods.filter((m) => !isVolumeModule(m));
    const variable = mods.filter((m) => isVolumeModule(m));
    const fixedSub = fixed.reduce((s, m) => s + (Number(m.priceValue) || 0), 0);
    const count = mods.length;
    const bundle =
      (service?.details || []).find((b) => b.type === 'bundle-picker')?.bundle || null;
    const from = Number(bundle?.discountFrom) || 3;
    const rate = Number(bundle?.discountRate) || 1;
    const fixedDiscounted = count >= from && fixedSub > 0 ? Math.round(fixedSub * rate) : fixedSub;

    let volumeSum = 0;
    let pending = false;
    const pricedMods = mods.map((m) => {
      if (!isVolumeModule(m)) {
        return { ...m, computedFee: Number(m.priceValue) || 0 };
      }
      const r = feeFromVolume(m, salesByScope);
      if (r.pending) pending = true;
      volumeSum += r.fee;
      return { ...m, computedFee: r.fee, pending: r.pending };
    });

    const total = fixedDiscounted + volumeSum;
    const scopes = [...new Set(variable.map((m) => m.volumeScope).filter(Boolean))];
    let priceLabel = window.formatServicePrice(total);
    if (pending && !fixedDiscounted && !volumeSum) {
      priceLabel = window.DAOITH_getLocale?.() === 'en' ? 'Enter sales to estimate' : '填写销售额后计算';
    } else if (pending) {
      priceLabel = `${window.formatServicePrice(total)}+`;
    }

    return {
      ...item,
      bundleSelection: pricedMods,
      priceValue: total,
      priceLabel,
      volumePending: pending,
      volumeScopes: scopes,
      fixedSubtotal: fixedDiscounted,
      volumeSubtotal: volumeSum,
    };
  }

  window.DAOITH_pricing = {
    enrichModulePricing,
    isVolumeModule,
    feeFromVolume,
    repriceCartItem,
    volumeRule(serviceId) {
      return window.DAOITH_VOLUME_RULES[serviceId] || null;
    },
  };
})();
