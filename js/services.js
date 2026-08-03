/* DAOITH service marketplace catalog
 * Categories: consult | mainland | hongkong | asia | europe | namerica | samerica | africa | oceania
 */
(function () {
  function blocks({ content, bullets, pricing, process, timeline, faqs }) {
    const out = [];
    out.push({ type: 'h2', text: '服务内容' });
    if (content) out.push({ type: 'p', text: content });
    if (bullets?.length) out.push({ type: 'ul', items: bullets });
    out.push({ type: 'h2', text: '服务收费' });
    out.push({ type: 'p', text: pricing });
    out.push({ type: 'h2', text: '服务流程和时效' });
    if (process?.length) out.push({ type: 'ol', items: process });
    if (timeline) out.push({ type: 'p', text: timeline });
    out.push({ type: 'h2', text: '常见问题' });
    if (faqs?.length) out.push({ type: 'faq', items: faqs });
    return out;
  }

  window.DAOITH_SERVICE_CATEGORIES = [
    { id: 'all', label: '全部' },
    { id: 'consult', label: '财税咨询' },
    { id: 'mainland', label: '中国内地财税合规' },
    { id: 'hongkong', label: '中国香港财税合规' },
    { id: 'asia', label: '亚洲' },
    { id: 'europe', label: '欧洲' },
    { id: 'namerica', label: '北美洲' },
    { id: 'samerica', label: '南美洲' },
    { id: 'africa', label: '非洲' },
    { id: 'oceania', label: '大洋洲' },
  ];

  window.DAOITH_SERVICES = [
    /* ——— 财税咨询 ——— */
    {
      id: 'consult-1v1',
      category: 'consult',
      title: '专家1v1财税咨询',
      desc: '资深跨境财税专家一对一深度咨询，覆盖架构规划、合规诊断、退税优化',
      priceLabel: '¥2,999',
      priceValue: 2999,
      unit: '/小时',
      details: blocks({
        content: '由资深跨境财税专家提供一对一深度咨询，围绕平台选择、店铺主体、发货模式、发票链条与出口退税路径进行诊断，并给出可落地的合规与节税建议。',
        bullets: [
          '业务模式与主体架构梳理',
          '出口退税 / 海外税义务边界判断',
          '高风险点提示与优先级行动清单',
          '咨询后可提供要点纪要',
        ],
        pricing: '¥2,999／小时起。超时按实际时长计费；复杂专题可按场次打包报价。官方规费、第三方鉴证费用另计。',
        process: [
          '提交业务背景（平台、主体、发货模式、主要市场等）',
          '预约专家时段并确认咨询议题',
          '线上／线下 1v1 咨询',
          '输出要点纪要与后续建议（如需）',
        ],
        timeline: '一般可在预约后 1–3 个工作日内完成首次会诊；纪要通常于会后 2 个工作日内发送。',
        faqs: [
          { q: '需要提前准备哪些材料？', a: '建议准备平台类型、店铺主体、发货模式、主要目的国、HS 编码、年销售额区间及发票情况，便于专家快速定位问题。' },
          { q: '咨询是否等同于书面合规意见书？', a: '默认提供口头诊断与要点纪要；如需正式书面意见或专项报告，可另签项目服务。' },
        ],
      }),
    },
    {
      id: 'consult-annual',
      category: 'consult',
      title: '财税合规陪跑',
      desc: '全年财税合规陪跑服务，专家团队持续跟进，覆盖架构、账务、退税、海外税全链路',
      priceLabel: '¥98,000',
      priceValue: 98000,
      unit: '/年',
      details: blocks({
        content: '全年陪伴式合规支持：季度复盘、政策更新解读、关键节点陪跑（退税申报、海外税注册、汇算清缴等），专家团队远程／线上持续跟进。',
        bullets: [
          '年度合规日历与节点提醒',
          '季度经营／税务复盘会',
          '政策变化要点解读',
          '约定次数的专家会诊与书面纪要',
        ],
        pricing: '¥98,000／年起。具体含服务次数、响应级别以签约方案为准；超出范围的专项项目可另行报价。',
        process: [
          '需求访谈与服务范围确认',
          '签订年度陪跑协议并建立对接群',
          '输出年度合规日历',
          '按季度复盘并处理关键节点事项',
        ],
        timeline: '签约后 5–10 个工作日内完成基线诊断与日历初稿；其后按约定节奏持续服务。',
        faqs: [
          { q: '陪跑是否包含代理记账或代报税？', a: '陪跑侧重顾问陪同与决策支持；日常代理记账、退税代办等可叠加对应落地服务。' },
          { q: '可否中途升级服务范围？', a: '可以。范围扩大时将补充报价与补充协议。' },
        ],
      }),
    },
    {
      id: 'consult-tp',
      category: 'consult',
      title: '转让定价文档编制',
      desc: '关联交易转让定价同期资料、本地文档与主文档编制',
      priceLabel: '¥50,000',
      priceValue: 50000,
      unit: '/起',
      details: blocks({
        content: '梳理境内外关联交易，协助选择合理定价方法，编制同期资料、本地文档与主文档，并提示转让定价风险点。',
        bullets: [
          '关联交易梳理与功能风险分析',
          '定价方法建议',
          '同期资料／本地文档／主文档编制',
          '年度更新服务可选',
        ],
        pricing: '¥50,000／起，按交易复杂度与文档层级浮动；多主体集团可打包报价。',
        process: [
          '收集组织架构与关联交易数据',
          '功能风险分析与方法选择',
          '起草文档并内部复核',
          '交付终稿并做解读说明',
        ],
        timeline: '资料齐全后通常 15–30 个工作日完成初稿；终稿视反馈轮次调整。',
        faqs: [
          { q: '小规模卖家是否需要转让定价文档？', a: '取决于关联交易规模与当地申报门槛。可先做义务评估，再决定是否编制正式文档。' },
        ],
      }),
    },

    /* ——— 中国内地财税合规 ——— */
    {
      id: 'domestic-diagnosis',
      category: 'mainland',
      title: '跨境电商税务合规诊断',
      desc: '全面诊断企业跨境税务合规状况，出具整改建议报告，含出口退税合规评估',
      priceLabel: '¥15,000',
      priceValue: 15000,
      unit: '/次',
      details: blocks({
        content: '对企业跨境业务模式、发票与单证、报关与退税、主体架构进行全面诊断，输出整改优先级与行动清单。',
        bullets: [
          '业务与资金流梳理',
          '出口退税合规评估',
          '风险分级与整改路线图',
          '一次报告解读会议',
        ],
        pricing: '¥15,000／次起。多主体、多平台或历史跨度较长的项目，可按工作量加价。',
        process: [
          '问卷与资料清单确认',
          '访谈＋抽样核查',
          '出具《跨境税务合规诊断报告》',
          '解读会与整改优先级确认',
        ],
        timeline: '资料齐备后一般 10–20 个工作日出具报告。',
        faqs: [
          { q: '诊断是否等同于税局认可？', a: '诊断为专业顾问意见，供内部整改参考，不构成行政机关结论。' },
        ],
      }),
    },
    {
      id: 'domestic-setup',
      category: 'mainland',
      title: '公司注册与资质办理',
      desc: '跨境电商公司注册、进出口权、海关备案、电子口岸等资质一站式办理',
      priceLabel: '¥5,000',
      priceValue: 5000,
      unit: '/起',
      details: blocks({
        content: '覆盖中国内地公司设立及跨境经营常见资质：进出口权、海关备案、电子口岸等，并提供流程辅导。',
        bullets: [
          '公司核名与工商设立',
          '银行开户辅导（视地区）',
          '进出口权／海关备案／电子口岸',
          '后续税务登记衔接说明',
        ],
        pricing: '¥5,000／起。政府规费、刻章、加急及异地办理费用另计；最终以方案报价为准。',
        process: [
          '确认公司类型与经营范围',
          '准备设立材料并提交',
          '完成工商／税务等登记',
          '办理进出口及海关相关资质',
        ],
        timeline: '普通设立约 5–15 个工作日；含进出口资质通常 10–25 个工作日（视地方窗口而定）。',
        faqs: [
          { q: '个人能否直接办进出口权？', a: '进出口权通常挂靠企业主体。个人店铺模式与公司模式义务不同，建议先做主体规划咨询。' },
        ],
      }),
    },
    {
      id: 'domestic-bookkeeping',
      category: 'mainland',
      title: '代理记账报税',
      desc: '跨境电商企业代理记账、纳税申报、汇算清缴一站式服务',
      priceLabel: '¥800',
      priceValue: 800,
      unit: '/月起',
      details: blocks({
        content: '日常记账、增值税与附加税申报、企业所得税预缴与汇算清缴协助，适配跨境电商平台回款与多币种场景。',
        bullets: [
          '凭证整理与账务处理',
          '增值税／附加税申报',
          '企业所得税预缴与汇算协助',
          '平台结算与汇兑差处理辅导',
        ],
        pricing: '¥800／月起，随票量、主体数量与业务复杂度浮动；汇算清缴可按年加收。',
        process: [
          '签约并交接期初账务',
          '按月收集单据并记账',
          '申报前核对与确认',
          '完成申报并回传税表',
        ],
        timeline: '常规月结于申报期前完成；首次建账视历史资料完整度约需 5–15 个工作日。',
        faqs: [
          { q: '无票采购能否记账？', a: '可以入账但影响进项与退税资料链，我们会单独标注风险并给出规范建议。' },
        ],
      }),
    },
    {
      id: 'domestic-rebate',
      category: 'mainland',
      title: '出口退税代办',
      desc: '9810海外仓／9610零售出口等退税申报全程代办，含单证整理与税局沟通',
      priceLabel: '¥3,000',
      priceValue: 3000,
      unit: '/次起',
      details: blocks({
        content: '协助整理出口报关、发票、物流与销售单据，完成退（免）税申报，并就补正材料与税局沟通提供支持。',
        bullets: [
          '退税资格与模式评估',
          '单证齐套检查与整理',
          '退（免）税申报代办',
          '补正与税局沟通支持',
        ],
        pricing: '¥3,000／次起，亦可按批次或退税额比例报价；复杂案件另行评估。',
        process: [
          '评估退税条件与适用监管方式',
          '收集并核对单证',
          '提交申报并跟踪进度',
          '配合补正直至办结',
        ],
        timeline: '单证齐套后通常 5–15 个工作日完成申报提交；税局审核周期另计。',
        faqs: [
          { q: '无进出口权能否退税？', a: '通常需具备相应出口资质与合规单证。可先做资格评估再启动代办。' },
        ],
      }),
    },
    {
      id: 'domestic-hte',
      category: 'mainland',
      title: '高新技术企业认定',
      desc: '高新技术企业资质申请辅导，含研发费用归集与知识产权布局建议',
      priceLabel: '¥20,000',
      priceValue: 20000,
      unit: '/起',
      details: blocks({
        content: '辅导高新技术企业认定材料准备，协助研发费用归集与知识产权布局建议，提高申报材料完整性。',
        pricing: '¥20,000／起。知识产权代理、审计等第三方费用另计；认定结果由主管部门审定。',
        process: [
          '资格初评与缺口分析',
          '研发费用归集与材料准备',
          '申报辅导与形式审核配合',
          '结果跟进与后续维护建议',
        ],
        timeline: '辅导周期通常 1–3 个月，视知识产权与研发台账完备度而定；官方评审周期另计。',
        faqs: [
          { q: '跨境电商企业能否申请高企？', a: '若具备符合条件的研发活动与知识产权，可评估申报可行性，不以行业标签一刀切。' },
        ],
      }),
    },
    {
      id: 'overseas-odi',
      category: 'mainland',
      title: 'ODI境外投资备案',
      desc: '境外投资备案全流程代办，含发改、商务、外汇相关路径辅导',
      priceLabel: '¥30,000',
      priceValue: 30000,
      unit: '/起',
      details: blocks({
        content: '协助准备 ODI 材料，推进发改、商务与外汇相关流程，对接境外持股与资金出境路径说明。',
        bullets: [
          '投资架构与路径建议',
          '材料准备与形式审核',
          '主管部门流程推进',
          '与境外注册／开户衔接说明',
        ],
        pricing: '¥30,000／起，按投资结构与审批复杂度浮动；审批结果取决于主管部门。',
        process: [
          '确认投资目的地与持股结构',
          '准备备案／核准材料',
          '提交并跟进各部门进度',
          '办结后交接材料包',
        ],
        timeline: '材料齐备后常见 4–12 周，视地方政策与项目类型而定。',
        faqs: [
          { q: '一定要做 ODI 吗？', a: '境内企业直接对外投资通常需依法履行境外投资相关手续。具体路径建议先做架构咨询。' },
        ],
      }),
    },

    /* ——— 中国香港财税合规 ——— */
    {
      id: 'hk-company',
      category: 'hongkong',
      title: '香港公司注册',
      desc: '香港公司注册、公司秘书、注册地址及基础年检合规服务',
      priceLabel: '¥3,800',
      priceValue: 3800,
      unit: '/起',
      details: blocks({
        content: '办理香港有限公司注册，并提供公司秘书、注册地址及首年基础合规说明，衔接后续开户与税务登记。',
        bullets: [
          '公司名称查册与注册',
          '公司秘书／注册地址（首年可选）',
          '法团成立表格与商业登记说明',
          '开户与报税衔接要点',
        ],
        pricing: '¥3,800／起。政府规费、秘书年费、加急及开户协助另计。',
        process: [
          '确认公司名称与股权结构',
          '准备董事／股东身份资料',
          '提交注册并取得公司文件',
          '交接后续年检与报税日历',
        ],
        timeline: '资料齐全后通常 1–5 个工作日完成注册（电子注册更快）。',
        faqs: [
          { q: '注册后是否自动有银行账户？', a: '否。开户需另行申请，银行有独立 KYC 要求，可另购开户协助服务。' },
        ],
      }),
    },
    {
      id: 'hk-audit-tax',
      category: 'hongkong',
      title: '香港审计与利得税申报',
      desc: '香港公司法定审计、利得税报税表编制与提交辅导',
      priceLabel: '¥6,000',
      priceValue: 6000,
      unit: '/年起',
      details: blocks({
        content: '为香港公司提供核数（审计）及利得税报税支持，协助整理账目、对接核数师并完成报税表相关文件。',
        pricing: '¥6,000／年起，随营业额、交易量与账目整洁度浮动。',
        process: [
          '收集银行流水、发票与合同',
          '整理账目／试算表',
          '核数并出具审计报告',
          '利得税报税表编制与提交辅导',
        ],
        timeline: '账目齐全后常见 3–6 周；临近截止日期建议尽早启动。',
        faqs: [
          { q: '无业务是否还要审计？', a: '仍可能有申报与备存账目义务。休眠公司也建议按年检与报税日历处理，避免罚款。' },
        ],
      }),
    },
    {
      id: 'hk-salary-tax',
      category: 'hongkong',
      title: '香港薪俸税／个人所得税申报',
      desc: '香港薪俸税报税辅导，含雇主报表与个人报税协调',
      priceLabel: '¥2,500',
      priceValue: 2500,
      unit: '/人年起',
      details: blocks({
        content: '协助处理香港薪俸税相关申报，包括雇主报税表格与个人报税协调，说明跨境双重征税关注点。',
        pricing: '¥2,500／人／年起；多名雇员或董事可打包优惠。',
        process: [
          '收集薪酬与福利资料',
          '核对课税年度收入项目',
          '编制／辅导填写报税表格',
          '跟进税单与缴税安排说明',
        ],
        timeline: '资料齐全后通常 5–10 个工作日完成报税准备。',
        faqs: [
          { q: '在内地与香港同时有收入怎么办？', a: '可能涉及双边征税安排，建议结合居民身份与收入性质做专项咨询。' },
        ],
      }),
    },
    {
      id: 'hk-identity',
      category: 'hongkong',
      title: '香港身份办理辅导',
      desc: '香港人才／投资等相关身份路径评估与申请材料辅导',
      priceLabel: '¥28,000',
      priceValue: 28000,
      unit: '/起',
      details: blocks({
        content: '评估适合的香港身份路径（如人才相关计划等），协助准备申请材料、时间线规划与补件辅导。最终审批结果由主管部门决定。',
        pricing: '¥28,000／起。政府申请费、翻译公证、第三方评估另计；不承诺获批结果。',
        process: [
          '背景评估与路径建议',
          '材料清单与证据准备',
          '提交申请与进度跟进',
          '补件／面谈辅导（如有）',
        ],
        timeline: '材料准备常见 2–8 周；官方审理周期因计划与个案差异较大。',
        faqs: [
          { q: '是否保证获批？', a: '不保证。我们提供路径评估与材料辅导，审批权在主管部门。' },
        ],
      }),
    },

    /* ——— 亚洲（不含内地／香港专区已列服务） ——— */
    {
      id: 'asia-sg-company',
      category: 'asia',
      title: '新加坡公司注册与GST',
      desc: '新加坡公司注册、秘书合规及 GST 注册申报辅导',
      priceLabel: '¥8,800',
      priceValue: 8800,
      unit: '/起',
      details: blocks({
        content: '协助新加坡公司设立与基础秘书合规，并按业务情况评估 GST 注册义务与申报安排。',
        pricing: '¥8,800／起。政府规费、秘书年费、GST 持续申报可另签年服务。',
        process: [
          '确认股权与本地董事／秘书安排',
          '提交公司注册',
          '评估 GST 注册门槛',
          '交接开户与报税日历',
        ],
        timeline: '公司注册常见 1–5 个工作日；GST 注册视 IRAS 审批另计。',
        faqs: [
          { q: '一定要本地董事吗？', a: '新加坡公司法对本地董事有要求，可通过合规安排解决，详情在签约前说明。' },
        ],
      }),
    },
    {
      id: 'asia-jp-tax',
      category: 'asia',
      title: '日本消费税／法人税合规',
      desc: '日本站卖家消费税（JCT）等税务注册与申报辅导',
      priceLabel: '¥6,500',
      priceValue: 6500,
      unit: '/起',
      details: blocks({
        content: '针对亚马逊日本站等场景，评估消费税注册与申报义务，协助理解平台代扣与卖家责任边界。',
        pricing: '¥6,500／起；持续申报可按年报价。',
        process: [
          '业务模式与销售额评估',
          '注册义务判断',
          '注册材料准备与提交辅导',
          '申报周期与资料归档建议',
        ],
        timeline: '评估 3–5 个工作日；注册办理视资料与窗口 2–6 周。',
        faqs: [
          { q: '平台已代扣是否还要注册？', a: '视具体交易类型与门槛而定，建议做个案评估，避免遗漏自行申报义务。' },
        ],
      }),
    },
    {
      id: 'asia-sea-tax',
      category: 'asia',
      title: '东南亚电商税务合规',
      desc: '印尼、越南、泰国、马来西亚等主流市场税务注册与申报辅导',
      priceLabel: '¥4,800',
      priceValue: 4800,
      unit: '/国起',
      details: blocks({
        content: '面向 Shopee、Lazada、TikTok 等东南亚市场，协助评估本地税务注册、代扣规则与申报节奏。',
        pricing: '¥4,800／国起；多国打包可优惠。',
        process: [
          '确认目标国家与平台',
          '义务评估与材料清单',
          '注册／申报辅导',
          '持续合规日历交接',
        ],
        timeline: '单国评估约 3–7 个工作日；注册周期因国家而异，常见 2–8 周。',
        faqs: [
          { q: '四国能否一起办？', a: '可以打包推进，但各国材料与审批独立，时效按最慢国家估算。' },
        ],
      }),
    },

    /* ——— 欧洲 ——— */
    {
      id: 'overseas-vat',
      category: 'europe',
      title: '欧洲VAT注册申报',
      desc: '英国、德国、法国、意大利、西班牙等欧洲国家 VAT 注册与申报服务',
      priceLabel: '¥3,500',
      priceValue: 3500,
      unit: '/国起',
      details: blocks({
        content: '协助完成目标国家 VAT 注册、申报周期安排与日常申报材料准备，说明平台代扣与卖家义务边界。',
        bullets: [
          '注册义务评估',
          'VAT 号申请辅导',
          '月度／季度申报支持',
          'IOSS／平台代扣边界说明',
        ],
        pricing: '¥3,500／国起。含注册与首期申报辅导；持续申报可另签年服务。翻译公证与税局规费另计。',
        process: [
          '确认销售国家与仓储模式',
          '准备注册材料',
          '提交注册并获取税号',
          '建立申报节奏与资料归档',
        ],
        timeline: '材料齐备后常见 2–8 周获号（因国家而异）；申报按当地周期执行。',
        faqs: [
          { q: '只用 FBA 是否还要自己报 VAT？', a: '许多情况下仍需注册或关注平台代扣未覆盖的交易。建议按国家做义务清单。' },
        ],
      }),
    },
    {
      id: 'europe-epr',
      category: 'europe',
      title: '欧洲EPR／包装法合规',
      desc: '德国、法国等包装法、WEEE、电池法等生产者责任延伸注册辅导',
      priceLabel: '¥2,800',
      priceValue: 2800,
      unit: '/国起',
      details: blocks({
        content: '协助卖家完成目标国家 EPR 相关注册与授权代表安排说明，降低平台下架与合规处罚风险。',
        pricing: '¥2,800／国／类目起；多类目打包报价。官方注册费另计。',
        process: [
          '确认销售国家与产品类目',
          '匹配所需 EPR 类型',
          '注册／授权安排辅导',
          '年费与持续申报提醒',
        ],
        timeline: '常见 1–4 周，视类目与国家系统而定。',
        faqs: [
          { q: '与 VAT 是一回事吗？', a: '不是。VAT 属流转税；EPR 属环保生产者责任，平台常一并核查。' },
        ],
      }),
    },

    /* ——— 北美洲 ——— */
    {
      id: 'overseas-us-sales-tax',
      category: 'namerica',
      title: '美国销售税合规',
      desc: '美国各州销售税注册、申报与合规咨询，覆盖经济关联度规则',
      priceLabel: '¥5,000',
      priceValue: 5000,
      unit: '/州起',
      details: blocks({
        content: '评估经济关联（nexus）、协助州税注册与申报安排，梳理平台代收代缴与卖家自报边界。',
        pricing: '¥5,000／州起；多州打包可优惠。持续申报可按年报价。',
        process: [
          'Nexus 与平台代收情况评估',
          '目标州注册材料准备',
          '完成注册并设置申报频率',
          '首期申报辅导与归档建议',
        ],
        timeline: '评估 3–7 个工作日；单州注册常见 1–4 周。',
        faqs: [
          { q: '亚马逊已代收是否还要注册？', a: '多数州对平台交易有代收，但仍可能存在自营站、B2B 或未覆盖交易，需个案确认。' },
        ],
      }),
    },
    {
      id: 'namerica-ca-tax',
      category: 'namerica',
      title: '加拿大GST／HST合规',
      desc: '加拿大 GST／HST 注册与申报辅导，适配亚马逊加拿大站等场景',
      priceLabel: '¥4,500',
      priceValue: 4500,
      unit: '/起',
      details: blocks({
        content: '评估加拿大 GST／HST 注册义务，协助注册与申报节奏安排，并说明平台代扣规则。',
        pricing: '¥4,500／起；持续申报另签年服务。',
        process: [
          '销售额与仓储地评估',
          '注册材料准备',
          '完成注册',
          '申报日历与资料归档',
        ],
        timeline: '常见 2–6 周（含注册审批）。',
        faqs: [
          { q: '只有 FBA 加拿大仓要不要注册？', a: '仓储与销售额可能触发义务，建议做快速评估后再决定。' },
        ],
      }),
    },
    {
      id: 'namerica-mx-tax',
      category: 'namerica',
      title: '墨西哥税务合规',
      desc: '墨西哥电商税务注册与合规辅导，适配美客多等平台',
      priceLabel: '¥5,500',
      priceValue: 5500,
      unit: '/起',
      details: blocks({
        content: '协助了解墨西哥电商相关税务注册与发票／申报要求，梳理平台代扣与本地合规要点。',
        pricing: '¥5,500／起；含本地代理人安排的项目另计。',
        process: [
          '业务模式访谈',
          '义务评估与路径建议',
          '注册／申报辅导',
          '持续合规提醒',
        ],
        timeline: '评估约 1 周；落地办理常见 3–8 周。',
        faqs: [
          { q: '必须有本地公司吗？', a: '视经营模式与平台要求而定，可先评估远程销售与本地主体方案。' },
        ],
      }),
    },

    /* ——— 南美洲 ——— */
    {
      id: 'samerica-br-tax',
      category: 'samerica',
      title: '巴西电商税务合规',
      desc: '巴西站／美客多巴西等场景下的税务与合规路径辅导',
      priceLabel: '¥6,800',
      priceValue: 6800,
      unit: '/起',
      details: blocks({
        content: '针对巴西跨境电商复杂税负环境，提供合规路径评估、本地合作衔接建议与申报节奏说明。',
        pricing: '¥6,800／起；涉及本地公司设立或代理的费用另计。',
        process: [
          '确认销售与物流模式',
          '税负与合规路径评估',
          '落地步骤与合作方衔接',
          '关键节点跟进',
        ],
        timeline: '评估 5–10 个工作日；落地周期因是否设本地主体差异较大。',
        faqs: [
          { q: '能否只做税务咨询不做落地？', a: '可以。可先购买路径评估，再决定是否启动注册／代理服务。' },
        ],
      }),
    },
    {
      id: 'samerica-cl-co-tax',
      category: 'samerica',
      title: '智利／哥伦比亚等市场税务辅导',
      desc: '南美新兴电商市场税务注册与平台合规要点辅导',
      priceLabel: '¥5,200',
      priceValue: 5200,
      unit: '/国起',
      details: blocks({
        content: '为进入智利、哥伦比亚等市场的卖家提供税务义务评估与注册申报辅导，降低平台入驻合规风险。',
        pricing: '¥5,200／国起；多国打包优惠。',
        process: [
          '目标国与平台确认',
          '义务评估',
          '注册／申报辅导',
          '合规日历交接',
        ],
        timeline: '单国评估约 1 周；注册常见 3–8 周。',
        faqs: [
          { q: '与巴西服务能否一起买？', a: '可以组合询价，我们会按国家拆分交付与时效。' },
        ],
      }),
    },

    /* ——— 非洲 ——— */
    {
      id: 'africa-za-tax',
      category: 'africa',
      title: '南非VAT与公司合规',
      desc: '南非公司／VAT 相关注册与申报辅导，服务进入非洲电商的卖家',
      priceLabel: '¥7,500',
      priceValue: 7500,
      unit: '/起',
      details: blocks({
        content: '协助评估南非经营主体与 VAT 义务，提供注册与基础申报辅导，并说明跨境供货常见注意点。',
        pricing: '¥7,500／起；本地代理与审计费用另计。',
        process: [
          '业务目标访谈',
          '主体与 VAT 路径建议',
          '注册材料辅导',
          '申报节奏说明',
        ],
        timeline: '评估 1 周内；注册办理常见 4–10 周。',
        faqs: [
          { q: '只做跨境小包是否需要南非 VAT？', a: '取决于本地仓储、销售额与供应模式，建议先做义务筛查。' },
        ],
      }),
    },
    {
      id: 'africa-ng-ke-tax',
      category: 'africa',
      title: '尼日利亚／肯尼亚等市场税务辅导',
      desc: '非洲新兴电商市场税务与本地合规入门辅导',
      priceLabel: '¥6,200',
      priceValue: 6200,
      unit: '/国起',
      details: blocks({
        content: '为拓展尼日利亚、肯尼亚等市场的团队提供税务与本地合规入门评估，协助对接后续落地路径。',
        pricing: '¥6,200／国起。',
        process: [
          '市场与模式确认',
          '合规要点评估',
          '落地步骤清单',
          '可选本地伙伴衔接',
        ],
        timeline: '评估报告一般 7–14 个工作日交付。',
        faqs: [
          { q: '是否包含本地公司注册？', a: '标准版以评估与辅导为主；注册落地可升级为专项项目。' },
        ],
      }),
    },

    /* ——— 大洋洲 ——— */
    {
      id: 'oceania-au-gst',
      category: 'oceania',
      title: '澳大利亚GST合规',
      desc: '澳大利亚 GST 注册与申报辅导，适配亚马逊澳洲站等',
      priceLabel: '¥4,800',
      priceValue: 4800,
      unit: '/起',
      details: blocks({
        content: '评估澳洲 GST 注册门槛与平台代扣规则，协助注册与申报安排。',
        pricing: '¥4,800／起；持续申报可按年报价。',
        process: [
          '销售额与供货模式评估',
          'ABN／GST 注册辅导',
          '申报周期设置',
          '资料归档建议',
        ],
        timeline: '常见 2–5 周完成注册相关安排。',
        faqs: [
          { q: '低价值商品是否还要管 GST？', a: '澳洲对跨境低价值商品有特殊机制，需结合平台与供货方式判断。' },
        ],
      }),
    },
    {
      id: 'oceania-nz-gst',
      category: 'oceania',
      title: '新西兰GST合规',
      desc: '新西兰 GST 远程卖家注册与申报辅导',
      priceLabel: '¥4,200',
      priceValue: 4200,
      unit: '/起',
      details: blocks({
        content: '协助远程卖家评估新西兰 GST 义务，完成注册与申报辅导。',
        pricing: '¥4,200／起。',
        process: [
          '义务评估',
          '注册材料准备',
          '完成注册',
          '申报辅导',
        ],
        timeline: '常见 2–4 周。',
        faqs: [
          { q: '与澳洲 GST 能否一起办？', a: '可以组合询价，材料与税号体系相互独立。' },
        ],
      }),
    },
  ];

  window.getServiceById = function getServiceById(id) {
    return (window.DAOITH_SERVICES || []).find((s) => s.id === id) || null;
  };

  window.formatServicePrice = function formatServicePrice(value) {
    const n = Number(value) || 0;
    return `¥${n.toLocaleString('zh-CN')}`;
  };
})();
