/* DAOITH service marketplace catalog
 * Categories: consult | mainland | hongkong | asia | europe | americas | africa-oceania
 */
(function () {
  function padFaqs(faqs) {
    const items = Array.isArray(faqs) ? faqs.slice() : [];
    if (items.length < 2) {
      items.push({
        q: '服务是否含政府规费与第三方费用？',
        a: '服务费覆盖约定范围内的顾问／代办工作；政府规费、翻译公证、审计等第三方费用通常另计，以签约方案为准。',
      });
    }
    if (items.length < 3) {
      items.push({
        q: '如何启动与交付？',
        a: '确认需求与资料清单后签约启动；按服务流程节点交付过程文件与最终成果，关键节点可安排线上沟通。',
      });
    }
    return items;
  }

  function resolveSteps(steps, process, timeline) {
    if (Array.isArray(steps) && steps.length) {
      return steps.map((s) => ({
        title: s.title || String(s),
        time: s.time || '按约定推进',
      }));
    }
    const list = Array.isArray(process) ? process : [];
    return list.map((title, i) => {
      let time = '按约定推进';
      if (i === 0) time = '启动后 1–5 个工作日';
      else if (i === list.length - 1) time = '收尾交付';
      else time = '推进中';
      return { title, time };
    });
  }

  function resolveDeliver(deliver, steps, timeline) {
    if (Array.isArray(deliver) && deliver.length) return deliver;
    const note = typeof timeline === 'string' ? timeline.replace(/。\s*$/, '') : '';
    return (steps || []).map((s, i) => [
      `${i + 1}. ${s.title}`,
      s.time,
      i === 0
        ? '需求确认／资料清单'
        : i === steps.length - 1
          ? note
            ? `办结材料／成果交付（${note}）`
            : '办结材料／成果交付'
          : '阶段确认与过程文档',
    ]);
  }

  /**
   * Unified detail layout aligned with 合规代账全托管:
   * 服务内容 → 服务收费 → 服务流程(timeline + deliver) → 常见问题
   */
  function blocks({
    content,
    bullets,
    pricing,
    pricingTable,
    process,
    timeline,
    steps,
    deliver,
    faqs,
  }) {
    const out = [];
    const resolvedSteps = resolveSteps(steps, process, timeline);
    const resolvedDeliver = resolveDeliver(deliver, resolvedSteps, timeline);

    out.push({ type: 'h2', text: '服务内容' });
    if (content) out.push({ type: 'p', text: content });
    const scopeItems = bullets?.length
      ? bullets
      : resolvedSteps.map((s) => s.title).filter(Boolean);
    if (scopeItems.length) {
      out.push({
        type: 'table',
        variant: 'scope',
        headers: ['服务范围'],
        rows: scopeItems.map((b) => [[{ mark: 'ok', text: b }]]),
      });
    }

    out.push({ type: 'h2', text: '服务收费' });
    if (pricing) out.push({ type: 'p', text: pricing });
    if (pricingTable?.headers && pricingTable?.rows) {
      out.push({
        type: 'table',
        variant: 'pricing',
        firstColHeader: true,
        headers: pricingTable.headers,
        rows: pricingTable.rows,
      });
    }

    out.push({ type: 'h2', text: '服务流程' });
    if (resolvedSteps.length) {
      out.push({ type: 'timeline', steps: resolvedSteps });
    }
    if (typeof timeline === 'string' && timeline && !steps?.length) {
      out.push({ type: 'p', text: `整体时效：${timeline}` });
    }
    if (resolvedDeliver.length) {
      out.push({
        type: 'table',
        variant: 'deliver',
        firstColHeader: true,
        headers: ['服务内容', '服务时效', '交付物'],
        rows: resolvedDeliver,
      });
    }

    out.push({ type: 'h2', text: '常见问题' });
    out.push({ type: 'faq', items: padFaqs(faqs) });
    return out;
  }

  window.DAOITH_SERVICE_CATEGORIES = [
    { id: 'all', label: '全部' },
    { id: 'consult', label: '财税咨询' },
    { id: 'mainland', label: '中国内地' },
    { id: 'hongkong', label: '中国香港' },
    { id: 'asia', label: '亚洲' },
    { id: 'europe', label: '欧洲' },
    { id: 'americas', label: '美洲' },
    { id: 'africa-oceania', label: '非洲／大洋洲' },
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
      id: 'domestic-compliance-bookkeeping',
      category: 'mainland',
      title: '合规代账全托管',
      desc: '数字化全托管代账：风险筛查、账务税务、经营分析与退税协同一站式交付',
      priceLabel: '¥5,000',
      priceValue: 5000,
      unit: '/年起',
      details: [
        { type: 'h2', text: '服务内容' },
        {
          type: 'table',
          variant: 'compare',
          firstColHeader: true,
          headers: ['服务项目', '合规代账全托管', '传统代账', '服务亮点'],
          rows: [
            [
              '服务团队配置',
              [
                { mark: 'ok', text: '5年以上财税工作经验' },
                { mark: 'ok', text: '人员相对稳定' },
                { mark: 'ok', text: '初级会计及以上资格' },
                { mark: 'ok', text: '专家团队保驾护航' },
              ],
              [
                { mark: 'ok', text: '多为应届或经验不足人员' },
                { mark: 'no', text: '低价配置导致经验与能力不足，仅能机械操作，难解复杂问题' },
              ],
              [
                '1）服务团队专业素养更高',
                '2）能够及时发现风险事项',
                '3）能够处理复杂的财税问题',
              ],
            ],
            [
              '调研真实业务情况',
              [
                { mark: 'ok', text: '了解企业商业模式' },
                { mark: 'ok', text: '了解收入、成本、费用结构并分析合理性' },
                { mark: 'ok', text: '了解四流：资金流、业务流、票据流、货物流' },
                { mark: 'ok', text: '梳理公司部门及人员情况' },
              ],
              [
                { mark: 'ok', text: '收集发票与公司账户流水' },
                { mark: 'no', text: '不了解真实业务与业务逻辑，易埋下风险隐患' },
              ],
              [
                '1）从被动接受碎片化信息，变为主动掌握企业全貌',
                '2）在理解业务基础上做财税处理，确保合法合规',
              ],
            ],
            [
              '财税风险筛查',
              [
                { mark: 'ok', text: '基于资料与访谈出具财税健康体检报告' },
                { mark: 'ok', text: '税负合理性分析（增值税、企业所得税、印花税、个税等）' },
                { mark: 'ok', text: '核心供应商风险（经营状态、采购占比、税务处罚等）' },
                { mark: 'ok', text: '发票风险（销采合理性、重点发票分析）' },
                { mark: 'ok', text: '财务分析（营收成本费用配比、资产负债效率与潜在风险）' },
                { mark: 'ok', text: '历史遗留问题清理（如股东借款长期挂账）' },
              ],
              [
                { mark: 'ok', text: '仅针对企业问题做简单回复' },
                { mark: 'no', text: '无定期复核与提前防范机制' },
                { mark: 'no', text: '无专家团队解决合规问题' },
                { mark: 'no', text: '风险处于“黑箱”，直至税务稽查才暴露' },
              ],
              [
                '对企业税种、核心供应商、发票、财务数据做风险扫描，提前预警并提供解决方案',
              ],
            ],
            [
              '数据交接及准备',
              [
                { text: '确认企业内部管理流程及账务处理方法' },
                { mark: 'ok', text: '内部流程管理建议' },
                { mark: 'ok', text: '资料收集交接' },
                { mark: 'ok', text: '财务期初数据确认' },
                { mark: 'ok', text: '历史账务问题调整' },
              ],
              [
                { mark: 'ok', text: '简单资料交接与数据确认' },
                { mark: 'no', text: '缺乏内部流程建议与历史问题专业意见' },
              ],
              [
                '提供基于业务流程的财务管理建议，保证财务记录反映业务真实性，确保证据链可追溯',
              ],
            ],
            [
              '账务处理',
              [
                { mark: 'ok', text: '业务真实数据整理：线上线下交易整理与差异分析' },
                { mark: 'ok', text: '真实资金情况整理：对公、第三方收款与私人流水' },
                { mark: 'ok', text: '发票数据整理与分析：销采汇总及不合规发票识别' },
                { mark: 'ok', text: '无票收入和支出统计，确保数据反映真实业务' },
                { mark: 'ok', text: '按法规、会计准则与行业规范选择正确收入确认与成本核算方法' },
              ],
              [
                { mark: 'ok', text: '按对公流水与发票机械做账' },
                { mark: 'no', text: '不考虑真实业务，数据无法反映经营实况' },
                { mark: 'no', text: '不考虑无票收支，数据失真，经不起税务检查' },
                { mark: 'no', text: '未按法规与准则做账，一旦被查难以合理解释' },
              ],
              [
                '1）基于企业全貌做账，数据真实，合理应对检查，降低税务风险',
                '2）反映真实经营，便于及时发现并调整经营与财务风险',
              ],
            ],
            [
              '税务申报',
              [
                { mark: 'ok', text: '常规申报：税种申报缴纳、社保公积金代缴、汇算清缴、工商年报' },
                { mark: 'ok', text: '各税种税负合理性分析' },
                { mark: 'ok', text: '合规前提下税务规划：申报前复核与纳税调整，做到不多交、不少交' },
              ],
              [
                { mark: 'ok', text: '常规税务申报' },
                { mark: 'no', text: '无法做各税种税负合理性分析' },
                { mark: 'no', text: '无税务规划意识，也不具备相应专业深度' },
              ],
              [
                '1）合规：基于真实账务与税法要求申报',
                '2）省税：合法合规前提下节约税负成本',
                '3）省心：申报真实合规，无惧税务检查',
              ],
            ],
            [
              '年度财税管理复盘',
              [
                { mark: 'ok', text: '财务管理分析：盈利能力、资产负债管理效率，及时发现账务问题' },
                { mark: 'ok', text: '税务问题及时预警：找合规与税负平衡点，供企业决策' },
              ],
              [
                { mark: 'no', text: '无财务数据分析' },
                { mark: 'no', text: '无税务问题及时预警' },
              ],
              [
                '1）为企业经营提供数据分析与判断',
                '2）及时发现税务问题，并按监管趋势合理调整',
              ],
            ],
            [
              '税务备查文档准备',
              [
                { text: '协助完成备查文档，确保四流一致与业务真实性，应对潜在税务检查' },
                { mark: 'ok', text: '针对财税处理、合同、发票、合规单据等提供文档建议' },
                { mark: 'ok', text: '抽查审阅四流对应文件，确保能应对业务真实性审查' },
                { mark: 'ok', text: '协助应对税务检查，在问询与争议中维护企业合法权益' },
              ],
              [
                { mark: 'ok', text: '仅留存基础财务与税务申报资料' },
                { mark: 'no', text: '未准备证明业务真实性的证据链文件' },
                { mark: 'no', text: '面对税务检查，无法提供专业应对建议' },
              ],
              [
                '1）税务备查文档留底，轻松应对税局检查',
                '2）专业团队保驾护航，在税务问询与争议中维护企业合法权益',
              ],
            ],
          ],
        },
        { type: 'h2', text: '服务收费' },
        {
          type: 'p',
          text: '按年销售额每 500 万人民币一档计价，服务费按年收取。不含出口退税按销售额 0.1%（封顶 ¥30,000）；含出口退税按销售额 0.2%（封顶 ¥60,000）。',
        },
        {
          type: 'table',
          variant: 'pricing',
          firstColHeader: true,
          headers: ['年销售额', '不含出口退税（0.1%）', '含出口退税（0.2%）'],
          rows: [
            ['500 万以内', '¥5,000', '¥10,000'],
            ['500–1,000 万', '¥10,000', '¥20,000'],
            ['1,000–1,500 万', '¥15,000', '¥30,000'],
            ['1,500–2,000 万', '¥20,000', '¥40,000'],
            ['2,000–2,500 万', '¥25,000', '¥50,000'],
            ['2,500–3,000 万', '¥30,000', '¥60,000'],
            ['3,000 万以上', '¥30,000（封顶）', '¥60,000（封顶）'],
          ],
        },
        {
          type: 'p',
          text: '不含政府规费、税控设备、第三方审计及加急窗口费用；最终以签约方案为准。多主体、多店铺或历史账务重建可按工作量另计。',
        },
        { type: 'h2', text: '服务流程' },
        {
          type: 'timeline',
          steps: [
            { title: '了解业务现状', time: '付款后一周' },
            { title: '财税风险筛查', time: '服务开始前或年中' },
            { title: '数据交接及准备', time: '付款后1个月内' },
            { title: '账务处理', time: '每月' },
            { title: '税务申报', time: '每月／季末' },
            { title: '财税分析', time: '每季度' },
            { title: '年度健康体检汇报', time: '每年1次' },
            { title: '账务备查文档检查', time: '年度' },
          ],
        },
        {
          type: 'table',
          variant: 'deliver',
          firstColHeader: true,
          headers: ['服务内容', '服务时效', '交付物'],
          rows: [
            ['1. 业务现状了解', '付款后一周', '《访谈提纲及调研报告》《业务流程梳理图》'],
            ['2. 财税风险筛查', '服务开始前或年中', '《存量财税风险评估报告》《风险整改方案》'],
            ['3. 数据交接及准备', '付款后1个月内', '《资料交接清单》《账务初始化数据确认表》'],
            ['4. 合规代账账务处理', '每月', '《记账凭证》《会计账簿》、月度三大表'],
            ['5. 合规代账税务申报', '每月／季末', '《各税种申报表》《完税证明／缴款凭证》'],
            ['6. 合规代账分析汇报', '每季度', '《季度管理会计分析报告》《经营异常预警提示》'],
            ['7. 年度健康体检汇报', '每年1次', '《年度所得税汇算清缴报告》《年度财税合规综合评估报告》'],
            ['8. 账务备查文档检查', '年度', '《年度全套电子／纸质会计档案》《年度外部审计配合底稿》'],
          ],
        },
        { type: 'h2', text: '常见问题' },
        {
          type: 'faq',
          items: [
            {
              q: '合规代账跟传统代账最大的区别是什么？',
              a: '传统代账侧重“做账报税”；合规代账全托管强调数字化抓取、更细核算颗粒度、实时风控预警、经营分析解读，并可将账务与出口退税协同管理，目标是降低错漏与稽查风险、支撑经营决策。',
            },
            {
              q: '我现在已经有代账公司，可以切换吗？',
              a: '可以。我们会在签约后完成资料交接、期初核对与风险筛查，再平滑切换月度账务与申报节奏。历史账务如需重建或专项整改，可按工作量另行评估。',
            },
            {
              q: '含出口退税与不含出口退税怎么选？',
              a: '若企业需要出口退（免）税申报协同、单证跟踪与退税进度管理，建议选择含出口退税档；仅需合规代账、税务申报与经营分析，可选不含出口退税档。',
            },
            {
              q: '服务费是否含政府规费、税盘等费用？',
              a: '服务费覆盖约定范围内的代账、申报与分析交付；政府规费、税控设备、第三方审计、加急窗口及超出范围的专项服务另计。',
            },
          ],
        },
      ],
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

    /* ——— 美洲 ——— */
    {
      id: 'overseas-us-sales-tax',
      category: 'americas',
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
      category: 'americas',
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
      category: 'americas',
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

    /* ——— 美洲（续） ——— */
    {
      id: 'samerica-br-tax',
      category: 'americas',
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
      category: 'americas',
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

    /* ——— 非洲／大洋洲 ——— */
    {
      id: 'africa-za-tax',
      category: 'africa-oceania',
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
      category: 'africa-oceania',
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

    /* ——— 非洲／大洋洲（续） ——— */
    {
      id: 'oceania-au-gst',
      category: 'africa-oceania',
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
      category: 'africa-oceania',
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
