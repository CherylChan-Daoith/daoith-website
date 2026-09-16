/* DAOITH service marketplace catalog
 * Source of truth: 服务产品发布页_260912.docx（发布页格式与内容）
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

    pushLines('服务内容', bundle ? '' : content);
    if (bundle) {
      out.push({ type: 'h2', text: '服务内容' });
      out.push({ type: 'bundle-picker', bundle });
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
        content: `合规风险识别：识别合规漏洞与核心税务风险点，出具针对性整改建议
跨境架构规划：设计税务架构方案，合理降低整体税负，提升资金流转效率
股权架构设计：合理规划控股架构、资金路径与利润分配机制
涉税风险处理：针对税务疑点、风险任务、税务处罚等提供专业应对策略
退税优化方案：挖掘退税空间，优化退税路径与申报材料
财税处理：跨境电商、海外仓、多平台经营等复杂场景定制化记账报税方案
个性化答疑：针对具体业务场景一对一深度答疑`,
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
      title: `跨境电商财税合规方案定制`,
      desc: `基于企业业务情况、财务数据、平台大数据，多维度匹配定制化解决方案`,
      priceLabel: `¥28,000`,
      priceValue: 28000,
      unit: `/次`,
      details: excelBlocks({
        content: `深度访谈与业务摸底：经营模式、业务链条、组织架构、历史遗留问题全面摸排
业务资料搜集整理：业务合同、平台销售数据、报关/物流/收汇单证、发票台账、银行流水
财务报表审阅：近一年三大报表，核查收入确认、成本结构、往来款项与公私混用风险
纳税申报表核对：增值税申报类别、企业所得税收入与平台数据一致性
财税风险诊断与报告出具：发票风险筛查、税负率比对、财务指标合理性分析
合规整改意见：具体整改建议及优先级排序，可落地的整改方案`,
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
        content: `合规方案落地拆解：拆解为可执行步骤，形成《财税合规落地执行计划表》
落地执行计划制定：按经营节奏制定时间表，明确里程碑节点
定期复盘与进度跟进：月度/季度复盘会议，逐项核对完成情况并纠偏
税局对接与风险管理：风险提示/纳税评估等事项及时介入，协助准备说明材料、陪同税务约谈
日常财税合规支持：日常合规问题解答、重大经营决策事前建议、政策变化跟踪`,
        cycle: `服务开启后 1 年（按年签约）`,
        processSteps: [{ title: `方案对接`, time: `签约后 1 周内` }, { title: `落地拆解`, time: `2 周内完成` }, { title: `计划确认`, time: `1 周内` }, { title: `执行跟进`, time: `全年持续` }, { title: `定期复盘`, time: `按月/季度` }, { title: `税局应对`, time: `重大税局事项随时响应` }, { title: `阶段验收`, time: `每阶段结束后` }, { title: `持续优化`, time: `贯穿服务期` }],
        process: ``,
        pricing: ``,
        pricingNote: `按年签约；周期内线上沟通不限次数，重大税局事项随时响应；尚未完成诊断者可搭配「跨境电商财税合规方案定制」先行出方案再进入陪跑。`,
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
        content: `现状调研与目标设定：财务核算/报表/资金/流程诊断，明确 AI 落地可量化指标
周期与路径规划：按 2/4/6 个月周期制定分阶段落地计划与里程碑
流程与工具搭建：重构核算、报销、资金流程；部署财务 AI 工具、自动化报表与数据看板
带教与验收：分角色实操带教，建立 SOP 与内控机制，直至团队独立运转`,
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
        content: `申报条件诊断（知识产权、研发费用占比、高新收入占比、科技人员占比等核心指标）、知识产权规划、研发费用辅助账与财务规范、专项审计协调、创新能力评价材料撰写与系统填报、评审跟进至领证及证后维护（15% 优惠税率等政策落地）。`,
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
        content: `申报条件诊断（软著、研发占比、软件收入占比）、软件著作权与检测材料整理、软件收入单独核算规范、评估平台填报与跟进、证后"两免三减半"及增值税即征即退等优惠落地辅导。`,
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
        content: `认定条件诊断（离岸服务外包收入占比不低于 35%、技术人员占比等）、离岸业务证据链梳理、带验证码专项审计报告协调、认定材料编制与平台填报、证后 15% 所得税优惠等落地辅导。`,
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
        content: `日常账务处理：凭证审核、记账凭证编制、总账/明细账/日记账登记，出口企业专项账务
财务报表编制：月/季资产负债表、利润表、现金流量表及辅助报表
纳税申报：增值税及附加、企业所得税预缴、个税代扣代缴、印花税等地方税种、社保公积金；出口企业同步完成退税申报
凭证整理与档案保管：分类装订成册，规范会计档案管理
税务合规与风险提示：定期核查、政策优惠提示、异常预警、稽查协助
财务分析与管理建议：定期财务分析报告与管理建议
工商年报协助：年报公示与数据核对`,
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
        content: ``,
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
        bundle: {"id": "0110", "discountFrom": 3, "discountRate": 0.9, "discountLabel": "3项及以上全托管可享受9折", "modules": [{"label": "①出口公司设立", "serviceId": "domestic-setup", "priceValue": 500, "priceLabel": "¥500"}, {"label": "②进出口权办理", "serviceId": "domestic-trade-license", "priceValue": 2000, "priceLabel": "¥2,000"}, {"label": "③首单退税辅导", "serviceId": "domestic-rebate-first", "priceValue": 10000, "priceLabel": "¥10,000"}, {"label": "④代理退税申报", "serviceId": "domestic-rebate", "priceValue": 0, "priceLabel": "按出口额0.1%", "pricingModel": "percent", "volumeScope": "mainland", "rate": 0.001, "minFee": 5000, "maxFee": 30000}, {"label": "⑤退税公司记账报税", "serviceId": "domestic-compliance-bookkeeping", "priceValue": 5000, "priceLabel": "¥5,000起"}, {"label": "⑥香港公司年审", "serviceId": "hk-annual", "priceValue": 3000, "priceLabel": "¥3,000"}, {"label": "⑦香港公司审计报税", "serviceId": "hk-audit-tax", "priceValue": 0, "priceLabel": "按营业额分级", "pricingModel": "tier", "volumeScope": "hk", "tiers": "hk-audit-ecom"}]},
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
        content: ``,
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
        content: `名称申报（核名）、基本信息确定与申请材料填报、执照领取、刻章协助、税务登记指导、社保/公积金开户指导、银行开户预约协助。办理形式支持网上办理与线下办理。`,
        cycle: `内资企业约 5 个工作日；外资企业约 20 个工作日`,
        processSteps: [{ title: `核名`, time: `1–2 个工作日` }, { title: `确定信息/填报材料`, time: `1–2 个工作日` }, { title: `执照领取`, time: `内资约 5 个工作日 / 外资约 20 个工作日` }, { title: `刻章`, time: `1 个工作日` }, { title: `税务登记`, time: `1–2 个工作日` }, { title: `社保公积金开户`, time: `1–2 个工作日` }],
        process: ``,
        pricing: `500 元/次（代办服务费；境外人员无法线上双录需现场办理的，服务费另计）`,
        pricingNote: ``,
        advantages: ``,
        audience: `新设有限责任公司
需全流程注册代办的企业`,
        conditions: `股东符合法定人数（有限责任公司 50 名以下股东）
有符合章程规定的认缴出资额
股东共同制定章程
有公司名称与组织机构
有公司住所`,
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
        content: `名称核准：拟备 3–5 个备选名称并完成查重
工商注册：全套材料线上提交，无需到场，3–5 个工作日下证，同步刻章备案
税务登记：实名认证、税种核定、发票票种核定、电子税局账号配置
核定征收申请：填报《个体工商户核定定额申请表》，申请定期定额核定征收
后续申报维护：按月/季完成增值税、个人经营所得税申报，年度工商年报提醒`,
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
        content: `商品备案：市场采购贸易联网信息平台录入出口商品信息，审核禁限类目录，生成可用于报关的商品清单
组货报关：具备 1039 资质的报关行双抬头报关；单票报关货值上限 15 万美元，支持多票多批、全国口岸 24 小时电子通关，支持整柜/拼柜/散货
阳光收汇结汇：国外货款打入代理公司外币账户，结汇后付人民币至个体户公户；不受个人 5 万美元结汇额度限制；个体户公户人民币可直接转入经营者个人账户`,
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
        content: `经营范围核验及辅助：核查"货物进出口"等法定表述，协助办理经营范围变更
海关收发货人备案：提交《报关单位备案信息表》，取得 10 位海关编码及备案证明（约 1–3 个工作日）
电子口岸入网及 IC 卡申领：法人卡与操作员卡申领（约 3–5 个工作日）
出口退税备案：一般纳税人通过电子税务局提交《出口退（免）税备案表》，绑定退税账户
材料预审与全程跟进：提前规避信息不一致、盖章不规范等高频驳回风险，专属顾问一对一跟进`,
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
        content: `出口退税资质审核：一般纳税人身份、海关编码备案、退税备案等资格全面把关
基本信息资料辅导：《出口企业首次申报核查情况表》填写、出口业务情况说明撰写
生产经营场地资料辅导：租赁合同/产权证明、水电费发票、付款回单、场地照片
员工情况资料辅导：社保记录、工资表及银行代发回单
出口业务辅导：报关单、出口发票、出口合同、货运单据、收汇凭证等全套单证规范
外购业务资料辅导：采购合同、进货凭证、付款凭证、运输单据及供应商沟通记录
税务自查整改辅导：增值税、企业所得税、印花税自查`,
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
      priceLabel: `0.1%`,
      priceValue: 5000,
      unit: `/年起`,
      details: excelBlocks({
        content: `退税资格核查：海关备案、退税备案、外汇名录等关键资质有效性
出口单证审核协助：报关单、出口发票、采购发票合规性及备案单证完整性
退税申报资料编制及系统操作：汇总表/明细表编制、系统申报、退单异常跟进
退税审核配合与跟进：配合税局审核、跟踪退税款到账、协助出具情况说明
退税台账与数据分析：专属退税台账、定期进度报表、退税周期异常预警
税务合规辅导：单证管理长效合规机制、退税相关税务问询支持`,
        cycle: `服务开启后 1 年`,
        processSteps: [{ title: `需求沟通与资质复核`, time: `1 周内` }, { title: `资料交接`, time: `单证齐全后 2–3 个工作日` }, { title: `单证审核`, time: `3–5 个工作日` }, { title: `资料编制`, time: `3–5 个工作日` }, { title: `系统申报`, time: `申报后持续跟踪` }, { title: `审核配合`, time: `按税局进度` }, { title: `退税到账`, time: `审核通过后到账审核通过后按国库退付进度到账` }, { title: `归档维护`, time: `按月` }],
        process: ``,
        pricing: `年度出口额人民币 0.1%，最低 5,000 元/年起，封顶 30,000 元/年（含全年退税申报代理、单证管理合规辅导、退税台账管理；多年度补申报、涉敏产品频繁函调、四类企业等复杂情况费用另议）`,
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
        content: `模式与条件确认：确认 1210（保税跨境电商）/ 9610（跨境电商直邮）适用模式，核查备案与进项发票等前置条件，提供 9610/1210 服务商资源对接
单证与备案准备：退（免）税备案及单一窗口、电子口岸权限开通；报关单、清单、平台销售数据、进项发票、收汇凭证"四单一致"核对；商品归类与 HS 编码规范
首单申报辅导：申报口径与账务处理方案、退税申报系统填报辅导、进项发票勾选认证指导
税局核查应对：首单实地核查与真实性核查辅导，访谈与佐证材料准备
复盘与常态化建议：输出标准化操作清单与后续风控建议`,
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
        content: `模式与条件确认：确认 9810（出口海外仓）适用性与"离境即退税"最新政策口径，核查海外仓备案等条件
单证与备案准备：海外仓备案、报关单与入仓/销售清单梳理、进项发票归集、库存台账规范
首单申报辅导：凭销售清单办理预退税、销售完成后清算的申报流程辅导，预退与清算差额处理
税局核查应对：离境、入仓、销售、收汇链条说明与补正
复盘与常态化建议：形成可复用操作规范与风控建议`,
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
        content: `公司名称服务：2–3 个备选名称查册，规避敏感词汇
注册资本与股权结构规划：标准注册资本 10,000 港币认缴制；至少 1 名董事及 1 名股东，可为同一人，无国籍限制
经营范围规划：合规表述拟定，核对限制类行业
法定文件起草与递交：章程大纲及细则（M&A）、法团成立表格（NNC1）等，注册处电子平台在线递交
注册地址与法定秘书：香港本地真实注册地址（首年）+ 持 TCSP 牌照法定秘书
注册证书交付：CI、BR、NNC1 及印章、股份证书、绿盒资料全套交付`,
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
        content: `周年申报表（NAR1）制作与递交：更新董事、股东、秘书、地址、股本等核心备案信息
商业登记证（BR）续期：向香港税务局商业登记署换领新年度 BR
法定秘书服务续期：政府文书收发、信件代收发、挂水牌、SCR 重要控制人备案
注册地址续期：香港本地真实有效注册地址
SCR 重要控制人登记册维护：满足香港反洗钱合规要求`,
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
        content: `账务整理与财务报表编制：全年单据归集审核、按《香港财务报告准则》记账、三大报表编制
审计执行：香港持牌核数师（HKICPA 执业会员）独立核查，函证、内控评估
审计报告出具：无保留意见 / 保留意见 / 否定意见 / 无法表示意见，核数师签字盖章
税务申报配合：利得税报税表（BIR51/BIR52）填写提交、评税跟进
无运营公司审计：《无营运审计报告》与零申报处理`,
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
        content: `银行匹配与方案定制：一类银行（汇丰、恒生、香港星展、香港花旗，需有关联公司）；二类银行（如建设银行（亚洲），无需关联公司，香港公司本地有实质运营或成立满 18 个月）
开户资料清单梳理：按成立年限分档整理公司资料、董事身份材料、流水与购销合同、KYC 问卷
银行预约：预约开户时间、高频面试问答模拟演练、视频见证协助、补件跟进
账户激活与后续：审批跟进、网银及跨境收付款开通、账户维护与防冻卡指引`,
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
        content: `变更事项梳理与合规评估（含未年审、股份质押等前置障碍处理及银行/合同连带影响提示）、股东决议与法定表格编制、注册处（CR）与商业登记证（税务局）同步变更及政府规费代缴、最新 CI/BR/章程/会议记录本/印章等全套文件交付。`,
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
        content: `注销方案评估（运营状态、债务、税款、诉讼核查与时间表制定）、银行账户与资产处理、税务清理事宜（最后年度申报、不反对撤销确认函申请）、注销申请与法定文件递交、注销确认与归档。`,
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
      desc: `注册 + 秘书 + 开户打包 · 合规落地 · 后续年审衔接。`,
      priceLabel: `¥12,800`,
      priceValue: 12800,
      unit: ``,
      details: excelBlocks({
        content: `设立方案设计（私人有限公司 Sdn Bhd 为主，评估外资持股、行业准入及本地董事要求）、名称查册与保留、向马来西亚公司委员会（SSM）递交注册、商业登记及行业许可、持牌公司秘书与注册地址、本地银行账户开户协助、全套文件交付与年审衔接。`,
        cycle: `整体约 4–8 周（含银行开户尽调周期）`,
        processSteps: [{ title: `设立方案确认`, time: `1 周` }, { title: `名称查册与保留`, time: `1–2 个工作日` }, { title: `资料准备`, time: `1 周` }, { title: `SSM 注册`, time: `约 3–5 个工作日` }, { title: `秘书与地址就位`, time: `注册后即时` }, { title: `银行开户`, time: `约 2–4 周，视银行尽调` }, { title: `文件交付`, time: `开户后 1 周内` }],
        process: ``,
        pricing: `12,800 元（含公司注册 + 秘书费 + 开户；如需代理（挂名）董事另收 23,000 元/人/年起；政府规费、差旅等实报实销）`,
        pricingNote: ``,
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
        content: `按马来西亚财务报告标准（MFRS）建账理账、月度管理报表与年度财务报表、企业所得税（CIT）申报（Form C/C-S）、税款缴纳与 LHDN 沟通。`,
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
        content: `年度申报（Annual Return）递交、公司秘书与注册地址维护、实益拥有人（BO）备案及年度更新、合规到期提醒。`,
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
      desc: `注册 + 秘书 + 名义董事 + 注册地址 · 一步到位。`,
      priceLabel: `¥39,000`,
      priceValue: 39000,
      unit: ``,
      details: excelBlocks({
        content: `设立方案设计（私人有限公司 Pte Ltd，含本地董事合规要求）、ACRA 名称核准与注册、持牌公司秘书/名义（本地）董事/商业注册地址、注册文件交付、后续做账审计年审衔接。`,
        cycle: `整体约 2 周`,
        processSteps: [{ title: `设立方案确认`, time: `1 周` }, { title: `名称核准`, time: `ACRA 1–2 个工作日` }, { title: `资料准备`, time: `3–5 个工作日` }, { title: `ACRA 注册`, time: `1–3 个工作日` }, { title: `秘书/名义董事/地址就位`, time: `注册后即时` }, { title: `文件交付`, time: `整体约 2 周` }],
        process: ``,
        pricing: `39,000 元（含注册 + 秘书代理 + 名义董事 + 注册地址；政府规费等实报实销；名义董事为合规挂名安排，不参与经营）`,
        pricingNote: ``,
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
        content: `按新加坡财务报告准则（SFRS）记账、财务报表编制与 XBRL 填报、ECI 及 Form C/CS 税务代理申报。`,
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
      desc: `法定审计豁免条件确认、审计实施（分析性与实质性程序、函证、盘点）、按新加坡审计准则出具独立审计报告、与企业所得税报税表衔接。`,
      priceLabel: `¥34,200`,
      priceValue: 34200,
      unit: `起`,
      details: excelBlocks({
        content: `法定审计豁免条件确认、审计实施（分析性与实质性程序、函证、盘点）、按新加坡审计准则出具独立审计报告、与企业所得税报税表衔接。`,
        cycle: `整体约 8–12 周`,
        processSteps: [{ title: `审计条件确认`, time: `1 周` }, { title: `资料收集`, time: `1–2 周` }, { title: `期初余额与凭证审阅`, time: `2–3 周` }, { title: `审计程序执行`, time: `3–4 周` }, { title: `报告出具`, time: `1–2 周` }],
        process: ``,
        pricing: `34,200 元起（含法定审计及期初余额程序；政府规费、做账报税另计）`,
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
        content: `设立方案设计（Private Limited Company、SIC 经营范围）、Companies House 名称核准与注册、注册办公地址与公司秘书服务、注册证书与备案记录交付、VAT 注册/做账报税/年度确认书等后续衔接。`,
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
        content: `注册义务评估（远程销售阈值、平台代收规则）、HMRC 递交 VAT 注册、进销项发票与台账规范、季度申报与税款缴纳、MTD 电子申报合规提醒。`,
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
        content: `按英国会计准则记账、年度财务报表编制、公司税（Corporation Tax）计算与 CT600 报税表申报。`,
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
        content: `公司类型设计（GmbH/UG，GmbH 最低实缴 25,000 欧元）、验资账户开立与注资、章程公证（Notar）、商业登记簿（Handelsregister）登记、商业注册地址与秘书支持、全套登记证明交付、VAT/年报等后续衔接。`,
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
        content: `注册义务评估、德国税务机关 VAT 号申请、进销项台账规范、月/季预申报（UStVA）与年度申报（Jahreserklärung）、ELSTER 电子申报合规提醒。`,
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
        content: `按德国商法典（HGB）/GoBD 记账、年度财务报表编制、企业所得税（KSt）及团结附加计算、营业税（GewSt）测算、ELSTER 年度申报。`,
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
        content: `公司类型设计（SARL/SAS）、名称与经营范围核定、章程起草与设立公告刊登、单一窗口（Guichet unique/INPI）注册、取得 SIREN/SIRET 及 Kbis 营业执照、注册地址与秘书支持、后续做账报税衔接。`,
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
        content: `注册义务评估（含进口 VAT 与 OSS 适用边界）、法国税务机关 VAT 号申请、发票与台账规范、CA3（或 CA12）申报、2026 年起电子开票合规提醒。`,
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
        content: `按法国通用会计准则（PCG）记账、年度财务报表编制、企业所得税（IS）计算与 liasse fiscale 申报（2065 等表格）。`,
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
        content: `注册州评估（特拉华、怀俄明、科罗拉多、佛罗里达等的法律、税收、年报与开户差异）、C-Corp/LLC 架构与股权设计、州务卿注册、联邦雇主识别号（EIN）申请、注册地址与注册代理服务、全套注册文件交付。`,
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
        content: `按美国会计准则（US GAAP）记账、年度财务报表编制、按实体类型编制联邦所得税申报、州所得税/销售税（Sales Tax）/特许经营税（Franchise Tax）申报、1099/W-8BEN-E/BOI 等合规提醒。`,
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
      minFee: 5000,
      maxFee: 30000,
      metricLabel: { zh: '预计年度出口额（人民币）', en: 'Est. annual export value (RMB)' },
      hint: { zh: '按年度出口额 0.1% 计，最低 ¥5,000 / 封顶 ¥30,000。', en: '0.1% of annual export value, min ¥5,000 / max ¥30,000.' },
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
