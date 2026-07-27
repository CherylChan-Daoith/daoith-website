/* CTA 资格考试风格题库 · 参考 TIHK 考纲、复习资料与真题（Paper 2/3/5） */
window.EXAM_QUESTION_BANK = [
  // ═══ 物业税 (1-6, 71-78) ═══
  { id:1, topic:'物业税', source:'CTA Paper 2', question:'香港物业税的标准税率是多少？', options:['10%','15%','16.5%','20%'], answer:1, explanation:'《税务条例》第5B条：物业税标准税率为15%。' },
  { id:2, topic:'物业税', source:'CTA Paper 2', question:'物业税的评税基期是？', options:['1月1日至12月31日','4月1日至翌年3月31日','公司成立日起12个月','纳税人自选'], answer:1, explanation:'香港课税年度为4月1日至翌年3月31日。' },
  { id:3, topic:'物业税', source:'CTA Paper 2', question:'以下哪项租金收入可获豁免物业税？', options:['商业楼宇租金','自住物业租金','政府或公营机构物业租金','海外物业租金'], answer:2, explanation:'政府或公共机构拥有的物业租金可获豁免。' },
  { id:4, topic:'物业税', source:'CTA Paper 2', question:'物业税的纳税人是？', options:['租客','物业业主','管理公司','承租公司'], answer:1, explanation:'物业税向拥有土地/建筑物的业主征收。' },
  { id:5, topic:'物业税', source:'CTA Paper 2', question:'物业税可扣除的「修葺费及支出」上限为？', options:['应评税值的10%','应评税值的20%','实际支出全额','不可扣除'], answer:1, explanation:'第12(1)(a)条：修葺费及支出上限为应评税值的20%。' },
  { id:6, topic:'物业税', source:'CTA Paper 2', question:'业主选择个人入息课税后，物业税如何处理？', options:['仍单独缴纳','纳入个人入息课税合并计算','全额退还','税率降至10%'], answer:1, explanation:'个人入息课税将三税收入合并，可能获得更优惠税负。' },
  { id:71, topic:'物业税', source:'CTA Paper 2 计算题', question:'某业主2024/25课税年度收租$600,000，差饷$30,000，无其他扣除。应评税净值及物业税约为？', options:['$570,000 / $85,500','$456,000 / $68,400','$480,000 / $72,000','$600,000 / $90,000'], answer:1, explanation:'应评税净值=600,000-30,000-(600,000×20%)=$456,000；税=456,000×15%=$68,400。' },
  { id:72, topic:'物业税', source:'CTA Paper 2', question:'联权业主A和B共同拥有出租物业，税务处理正确的是？', options:['仅A申报全部租金','A和B各自申报其应占租金','由租客代扣代缴','自动豁免'], answer:1, explanation:'每位联权/分权业主均须申报其应占租金。' },
  { id:73, topic:'物业税', source:'CTA Paper 2', question:'租户支付的一次性顶费（Premium）应如何处理？', options:['不计入应评税值','全部计入收取年度','分摊至租约各课税年度','由租客缴纳物业税'], answer:2, explanation:'顶费属应评税值，通常分摊至租约涵盖的课税年度。' },
  { id:74, topic:'物业税', source:'CTA Paper 2', question:'法团出租物业，税务上通常如何评税？', options:['一定评物业税','一定评利得税','视乎是否经营行业以出租为目的','自动豁免'], answer:2, explanation:'如出租属经营业务一部分，可能评利得税而非物业税。' },
  { id:75, topic:'物业税', source:'CTA Paper 2', question:'业主未收到报税表但有租金收入，须何时通知税务局？', options:['7月31日前','评税基期结束后4个月内','年底','无需通知'], answer:1, explanation:'未收到报税表者须在评税基期结束后4个月内书面通知局方。' },
  { id:76, topic:'物业税', source:'CTA Paper 2', question:'已缴物业税而同一收入亦纳入利得税评税，如何处理？', options:['两税均须缴付','已缴物业税抵销利得税','利得税加倍','退还物业税'], answer:1, explanation:'已缴物业税可用作抵销应缴利得税，多缴退还。' },
  { id:77, topic:'物业税', source:'CTA Paper 2', question:'个人入息课税下，业主可就何项获得额外扣除？', options:['差饷','为赚取租金而贷款的按揭利息','装修费用','管理费'], answer:1, explanation:'个人入息课税下可扣除为赚取租金收入的按揭贷款利息。' },
  { id:78, topic:'物业税', source:'CTA Paper 2', question:'「应评税值」的定义是？', options:['市值租金','就物业使用权付出的代价','净值租金','账面租金'], answer:1, explanation:'应评税值指就物业使用权付出的代价，包括相关服务或利益。' },

  // ═══ 薪俸税 (7-12, 79-86) ═══
  { id:7, topic:'薪俸税', source:'CTA Paper 2', question:'薪俸税采用何种计税方式？', options:['单一税率','累进税率与标准税率15%孰低','固定20%','仅累进税率'], answer:1, explanation:'薪俸税取累进税项与标准税项之较低者。' },
  { id:8, topic:'薪俸税', source:'CTA Paper 2', question:'2024/25课税年度基本免税额为？', options:['$108,000','$132,000','$150,000','$200,000'], answer:1, explanation:'基本免税额$132,000。' },
  { id:9, topic:'薪俸税', source:'CTA Paper 2', question:'以下哪项属于应课税入息？', options:['资本增值','雇主提供居所的租值','遗产','偶然赌博赢款'], answer:1, explanation:'住房福利属应课税入息，租值一般为应课税入息10%。' },
  { id:10, topic:'薪俸税', source:'CTA Paper 2', question:'雇主强积金供款部分应如何处理？', options:['全额计入入息','不计入雇员应课税入息','50%计入','由雇员扣除'], answer:1, explanation:'雇主强制性供款不计入雇员应课税入息。' },
  { id:11, topic:'薪俸税', source:'CTA Paper 2', question:'薪俸税最高边际税率是？', options:['15%','16.5%','17%','20%'], answer:2, explanation:'累进税率最高边际17%。' },
  { id:12, topic:'薪俸税', source:'CTA Paper 2', question:'雇员被派往海外工作，香港薪俸税如何判定？', options:['一律免税','视乎工作地与停留天数','一律全额课税','由海外缴税'], answer:1, explanation:'须审视服务提供地、停留天数及税收安排。' },
  { id:79, topic:'薪俸税', source:'CTA Paper 2 计算题', question:'单身纳税人，扣除$132,000免税额后应课税入息实额$168,000，累进税项约为？', options:['$11,520','$15,000','$24,000','$30,000'], answer:0, explanation:'50k×2%+50k×6%+50k×10%+18k×14%=$1,000+$3,000+$5,000+$2,520=$11,520。' },
  { id:80, topic:'薪俸税', source:'CTA Paper 2', question:'认可慈善捐款扣除上限为？', options:['入息的10%','应评税入息的35%','$50,000','无上限'], answer:1, explanation:'慈善捐款不超过应评税入息35%。' },
  { id:81, topic:'薪俸税', source:'CTA Paper 2', question:'雇员强积金强制性供款最高可扣？', options:['$12,000','$15,000','$18,000','$20,000'], answer:2, explanation:'雇员MPF供款扣除上限$18,000/年。' },
  { id:82, topic:'薪俸税', source:'CTA Paper 2', question:'雇主为雇员提供居所，租值一般按什么计算？', options:['市值租金','应课税入息的10%','固定$100,000','租金实报实销'], answer:1, explanation:'雇主提供居所：租值=应课税入息×10%（一般规则）。' },
  { id:83, topic:'薪俸税', source:'CTA Paper 2', question:'暂缴薪俸税的调整机制是？', options:['不退不补','年终评税后多退少补','按季度调整','自动豁免'], answer:1, explanation:'暂缴税基于上年度税额预缴，评税后调整。' },
  { id:84, topic:'薪俸税', source:'CTA Paper 2', question:'海员在香港停留不超过多少天可能获豁免？', options:['30天','60天','90天','120天'], answer:1, explanation:'海员/飞机服务员有特别停留天数豁免规定（一般60天规则）。' },
  { id:85, topic:'薪俸税', source:'CTA Paper 2', question:'退休时收取的遣散费，税务处理一般视乎？', options:['一律课税','服务年资及性质判定','一律免税','按20%征税'], answer:1, explanation:'长期服务金/遣散费视乎雇佣合约性质及《税务条例》规定。' },
  { id:86, topic:'薪俸税', source:'CTA Paper 2', question:'反对薪俸税评税的时限为？', options:['14天','1个月','3个月','6个月'], answer:1, explanation:'评税通知书发出后1个月内提出反对。' },

  // ═══ 利得税 (13-18, 87-94) ═══
  { id:13, topic:'利得税', source:'CTA Paper 2', question:'法团利得税标准税率是？', options:['8.25%','15%','16.5%','17%'], answer:2, explanation:'法团标准税率16.5%，首$200万8.25%。' },
  { id:14, topic:'利得税', source:'CTA Paper 2', question:'利得税的征税原则是？', options:['居民原则','地域来源原则','全球征税','自愿原则'], answer:1, explanation:'仅对香港产生或得自香港的利润征税。' },
  { id:15, topic:'利得税', source:'CTA Paper 2', question:'以下哪项须缴纳利得税？', options:['海外纯投资收益（非香港来源）','香港贸易公司香港来源利润','资本出售物业收益','海外分公司利润（全非香港产生）'], answer:1, explanation:'在香港经营并从香港产生利润须课税。' },
  { id:16, topic:'利得税', source:'CTA Paper 2', question:'机械及装置的初期免税额是？', options:['10%','20%','60%','100%'], answer:2, explanation:'机械及工业装置：初期免税额60%。' },
  { id:17, topic:'利得税', source:'CTA Paper 2', question:'独资业务的利得税如何计算？', options:['16.5%统一','累进税率与15%标准税率孰低','8.25%','固定10%'], answer:1, explanation:'非法团业务采用累进税率并与15%标准税率比较。' },
  { id:18, topic:'利得税', source:'CTA Paper 2', question:'已确认坏帐的税务处理是？', options:['不可扣除','可扣除','50%扣除','延至下年度'], answer:1, explanation:'符合条例规定的坏帐可扣除。' },
  { id:87, topic:'利得税', source:'CTA Paper 2 案例', question:'香港公司向海外客户销售货物，合约在香港以外签订，货物不经过香港。利润来源地最可能是？', options:['香港','海外','两地各50%','视乎客户所在地'], answer:1, explanation:'DIPN 21：贸易利润看购销合约生效地，均在海外的通常非香港来源。' },
  { id:88, topic:'利得税', source:'CTA Paper 2', question:'以下哪项不可在利得税扣除？', options:['员工薪金','为赚利而借款的利息','资本性装修支出','坏帐'], answer:2, explanation:'资本性支出不可扣除。' },
  { id:89, topic:'利得税', source:'CTA Paper 2', question:'工业建筑物初期免税额比例为？', options:['4%','10%','20%','60%'], answer:2, explanation:'工业建筑物：初期免税额20%，每年4%。' },
  { id:90, topic:'利得税', source:'CTA Paper 2 计算题', question:'法团应评税利润$250万（首$200万8.25%，余额16.5%），利得税约为？', options:['$247,500','$288,750','$330,000','$375,000'], answer:0, explanation:'200万×8.25%=$165,000；50万×16.5%=$82,500；合计$247,500。' },
  { id:91, topic:'利得税', source:'CTA Paper 2', question:'研发开支税务扣除（合资格）最高可达？', options:['100%','200%','300%','400%'], answer:2, explanation:'合资格研发首$200万可享300%扣除。' },
  { id:92, topic:'利得税', source:'CTA Paper 2', question:'支付给合伙人配偶的薪酬在合伙业务中？', options:['可全额扣除','不可扣除','50%扣除','视同股息'], answer:1, explanation:'支付给合伙人/东主及其配偶的薪酬不可扣除。' },
  { id:93, topic:'利得税', source:'CTA Paper 2', question:'海外利润汇回香港是否触发利得税？', options:['是，立即课税','否，不因子汇回而课税','按50%课税','仅课税于法团'], answer:1, explanation:'海外来源利润不因汇入香港而变成应税。' },
  { id:94, topic:'利得税', source:'CTA Paper 2', question:'商业建筑物每年免税额为原始成本的？', options:['2%','4%','10%','20%'], answer:1, explanation:'商业建筑物每年免税额4%（无初期免税额）。' },

  // ═══ 个人入息课税 (19-21, 95-99) ═══
  { id:19, topic:'个人入息课税', source:'CTA Paper 2', question:'个人入息课税适用于？', options:['所有法团','个人纳税人（含独资/合伙）','仅雇员','仅业主'], answer:1, explanation:'适用于个人纳税人合并三税收入。' },
  { id:20, topic:'个人入息课税', source:'CTA Paper 2', question:'个人入息课税的主要优势？', options:['税率更高','可申索免税额及按揭利息扣除','免除报税','仅适用于高收入'], answer:1, explanation:'可合并收入并申索免税额，可能降低税负。' },
  { id:21, topic:'个人入息课税', source:'CTA Paper 2', question:'已婚人士可选择？', options:['仅合并评税','合并或分开评税','不可选择','仅分开评税'], answer:1, explanation:'可选择合并或分开评税，择低者。' },
  { id:95, topic:'个人入息课税', source:'CTA Paper 2 计算题', question:'业主租金收入$200,000，按揭利息$80,000，无其他收入。选择个人入息课税的主要好处是？', options:['税率升至17%','可扣除按揭利息及免税额','须缴双倍税','无分别'], answer:1, explanation:'分类评税下物业税不可扣按揭利息，个人入息课税可以。' },
  { id:96, topic:'个人入息课税', source:'CTA Paper 2', question:'高收入雇员（边际17%）同时有租金收入，选择个人入息课税？', options:['一定有利','可能不利，税务局或发分类评税','一定不利','自动选择'], answer:1, explanation:'高边际税率人士合入租金可能增加税负。' },
  { id:97, topic:'个人入息课税', source:'CTA Paper 2', question:'选择个人入息课税的时限一般为？', options:['报税时任意选择','评税通知书发出后2个月内','1年','不可更改'], answer:1, explanation:'须在评税或补加评税通知书发出后2个月内选择。' },
  { id:98, topic:'个人入息课税', source:'CTA Paper 2', question:'个人入息课税是？', options:['第四种直接税','税务宽减安排','强制制度','仅适用于外籍人士'], answer:1, explanation:'并非独立税种，是宽减安排。' },
  { id:99, topic:'个人入息课税', source:'CTA Paper 2', question:'如个人入息课税不利，税务局会？', options:['强制征收','以分类评税方式发出通知','退还全部税款','不予评税'], answer:1, explanation:'税务局会选择对纳税人更有利的评税方式。' },

  // ═══ 印花税 (22-24, 100-105) ═══
  { id:22, topic:'印花税', source:'CTA Paper 2', question:'住宅物业从价印花税（Scale 1）最高税率约为？', options:['4.25%','8.5%','15%','20%'], answer:0, explanation:'住宅AVD按价值分档，最高约4.25%（另可能有BSD等）。' },
  { id:23, topic:'印花税', source:'CTA Paper 2', question:'额外印花税（SSD）适用于？', options:['所有物业','住宅36个月内转售','商业物业','租赁'], answer:1, explanation:'住宅取得后36个月内转售须缴SSD。' },
  { id:24, topic:'印花税', source:'CTA Paper 2', question:'3年期租约印花税率为？', options:['0.25%','0.5%','1%','4.25%'], answer:2, explanation:'3年以上租约印花税率为租金总额1%。' },
  { id:100, topic:'印花税', source:'CTA Paper 2', question:'非香港永久居民购买住宅须缴？', options:['仅AVD','BSD（买家印花税）','SSD','免税'], answer:1, explanation:'非永居买家须缴BSD 15%。' },
  { id:101, topic:'印花税', source:'CTA Paper 2', question:'SSD持有6个月内转售税率为？', options:['10%','15%','20%','36%'], answer:2, explanation:'持有6个月以内转售SSD 20%。' },
  { id:102, topic:'印花税', source:'CTA Paper 2', question:'股权转让印花税税率为？', options:['0.1%','0.13%（买卖双方各）','1%','4.25%'], answer:1, explanation:'香港股票转让买卖双方各缴0.13%。' },
  { id:103, topic:'印花税', source:'CTA Paper 2', question:'买卖协议须在签署后多少天内加盖印花？', options:['7天','14天','30天','60天'], answer:2, explanation:'一般须在签署后30天内加盖印花。' },
  { id:104, topic:'印花税', source:'CTA Paper 2', question:'近亲之间住宅转让可能？', options:['一律缴全额印花税','符合条件下获部分豁免','完全免税','缴双倍税'], answer:1, explanation:'某些近亲转让在符合条件下可申请印花税豁免。' },
  { id:105, topic:'印花税', source:'CTA Paper 2', question:'租约不足1年印花税率为？', options:['0.25%','0.5%','1%','豁免'], answer:0, explanation:'1年以下租约按租金总额0.25%。' },

  // ═══ 反避税 (25-28, 106-110) ═══
  { id:25, topic:'反避税', source:'CTA Paper 2', question:'第61A条针对？', options:['所有跨境交易','主要目的为获税务利益的交易','低税率国家','关联交易'], answer:1, explanation:'唯一或主要目的为获税务利益的交易可被否定。' },
  { id:26, topic:'反避税', source:'CTA Paper 2', question:'转让定价调整属于？', options:['国内反避税','国际反避税','刑事调查','自愿披露'], answer:1, explanation:'转让定价是国际反避税核心机制。' },
  { id:27, topic:'反避税', source:'CTA Paper 2', question:'事先裁定的好处是？', options:['免税','交易前获税务确认','降低税率','延期5年'], answer:1, explanation:'降低税务不确定性。' },
  { id:28, topic:'反避税', source:'CTA Paper 2', question:'反对评税时限？', options:['14天','1个月','3个月','6个月'], answer:1, explanation:'1个月内提出反对。' },
  { id:106, topic:'反避税', source:'CTA Paper 2', question:'第61B条属于？', options:['预设反避税规则','印花税条款','国际协定','免税额规定'], answer:0, explanation:'第61B条为预设反避税条文。' },
  { id:107, topic:'反避税', source:'CTA Paper 2', question:'税务局否定交易后有权？', options:['仅罚款','调整入息/亏损','监禁纳税人','吊销执照'], answer:1, explanation:'局方可作出入息或亏损调整。' },
  { id:108, topic:'反避税', source:'CTA Paper 2', question:'转让定价文档不合规的后果包括？', options:['无后果','补加评税及罚款','自动免税','仅警告'], answer:1, explanation:'可能补加评税及处以罚款。' },
  { id:109, topic:'反避税', source:'CTA Paper 2', question:'纳税人抗辩第61A条的关键是？', options:['证明有商业目的','证明亏损','证明低收入','证明外籍身份'], answer:0, explanation:'须证明交易有真实商业目的。' },
  { id:110, topic:'反避税', source:'CTA Paper 2', question:'税务上诉的下一级（局内复核后）是？', options:['税务局局長','税务上诉法庭','立法会','廉政公署'], answer:1, explanation:'局内复核后可向税务上诉法庭上诉。' },

  // ═══ 科目二综合 (29-32, 111-118) ═══
  { id:29, topic:'科目二综合', source:'CTA Paper 2', question:'个人税务居民判定主要看？', options:['国籍','在港居住天数','雇主所在地','护照'], answer:1, explanation:'通常>180天或连续两年度>300天。' },
  { id:30, topic:'科目二综合', source:'CTA Paper 2', question:'暂缴税的性质是？', options:['罚款','预缴下年度税款','额外税','仅法团'], answer:1, explanation:'基于上年度税额预缴。' },
  { id:31, topic:'科目二综合', source:'CTA Paper 2', question:'税务局职能不包括？', options:['评税','制定税法','收税','税务审计'], answer:1, explanation:'税法由立法会制定。' },
  { id:32, topic:'科目二综合', source:'CTA Paper 2', question:'本地双重征税宽免指？', options:['跨境收入','同一收入被两税种重复征收','仅印花税','自动退还'], answer:1, explanation:'如收入同时被薪俸税和利得税征收。' },
  { id:111, topic:'科目二综合', source:'CTA Paper 2', question:'《税务条例》的法定编号是？', options:['Cap.112','Cap.32','Cap.571','Cap.615'], answer:0, explanation:'税务条例为香港法例第112章。' },
  { id:112, topic:'科目二综合', source:'CTA Paper 2', question:'业务纪录须保存至少？', options:['3年','5年','7年','10年'], answer:2, explanation:'须保存足够纪录至少7年。' },
  { id:113, topic:'科目二综合', source:'CTA Paper 2', question:'税项宽减（2025/26）百分之一百宽减上限约为？', options:['$1,000','$1,500','$3,000','$10,000'], answer:2, explanation:'2025/26年度宽减100%，每宗$3,000上限。' },
  { id:114, topic:'科目二综合', source:'CTA Paper 2', question:'法团在香港的管理地点在港，通常被视为？', options:['非居民','香港税务居民','免税','仅海外征税'], answer:1, explanation:'管理或控制地点在港的法团通常为香港居民。' },
  { id:115, topic:'科目二综合', source:'CTA Paper 2', question:'漏报入息的最高罚款可达少征税款的？', options:['等额','两倍','三倍','十倍'], answer:2, explanation:'严重漏报可被罚少征税款三倍及检控。' },
  { id:116, topic:'科目二综合', source:'CTA Paper 2', question:'薪俸税入息来源地判定主要看？', options:['雇主注册地','受雇工作地点','员工国籍','发薪银行'], answer:1, explanation:'入息来源取决于服务提供地。' },
  { id:117, topic:'科目二综合', source:'CTA Paper 2', question:'合伙业务的评税方式是？', options:['合并评税','各合伙人按其应占利润评税','仅评首位合伙人','由税务局任选'], answer:1, explanation:'合伙业务利润按合伙人份额分配评税。' },
  { id:118, topic:'科目二综合', source:'CTA Paper 2', question:'离岸索偿（offshore claim）的关键是？', options:['证明利润非香港来源','证明亏损','证明低收入','证明外资'], answer:0, explanation:'须证明利润非于香港产生或得自香港。' },

  // ═══ 国际税务 (33-36, 119-125) ═══
  { id:33, topic:'国际税务概述', source:'CTA Paper 3', question:'OECD范本的作用是？', options:['法律约束力','协定谈判参考模板','取代国内法','WTO规则'], answer:1, explanation:'范本本身不具约束力。' },
  { id:34, topic:'国际税务概述', source:'CTA Paper 3', question:'居民管辖权与来源管辖权的区别？', options:['相同','居民对全球收入征税，来源仅对本地收入','来源更广','居民仅对个人'], answer:1, explanation:'两种管辖权冲突导致双重征税。' },
  { id:35, topic:'国际税务概述', source:'CTA Paper 3', question:'UN范本较OECD范本更注重？', options:['居民国','来源国征税权','免税','全球最低税'], answer:1, explanation:'UN范本保护来源国。' },
  { id:36, topic:'国际税务概述', source:'CTA Paper 3', question:'BEPS的核心目标是？', options:['消除税收','防止税基侵蚀和利润转移','统一税率','取消协定'], answer:1, explanation:'BEPS防止跨国企业逃避纳税。' },
  { id:119, topic:'国际税务概述', source:'CTA Paper 3', question:'法律性双重征税指？', options:['两国对同一收入均征税','经济重复','无重复','仅个人'], answer:0, explanation:'两国法律均对同一收入主张征税权。' },
  { id:120, topic:'国际税务概述', source:'CTA Paper 3', question:'Pillar Two全球最低税率约为？', options:['10%','12%','15%','21%'], answer:2, explanation:'OECD Pillar Two规定15%全球最低税。' },
  { id:121, topic:'国际税务概述', source:'CTA Paper 3', question:'税收协定与国内法冲突时，香港一般？', options:['国内法优先','协定优先（在不抵触宪法下）','均不适用','由纳税人选择'], answer:1, explanation:'税收安排通常优先于国内法适用。' },
  { id:122, topic:'国际税务概述', source:'CTA Paper 3', question:'双重征税的经济性重复指？', options:['两国法律重复','同一收入被两国实际各征一次','无征税','仅公司'], answer:1, explanation:'经济重复是实际税负重复。' },
  { id:123, topic:'国际税务概述', source:'CTA Paper 3', question:'香港解决国际双重征税主要靠？', options:['仅豁免法','税收抵免及税收安排','提高税率','禁止跨境'], answer:1, explanation:'FTC及双边安排是主要机制。' },
  { id:124, topic:'国际税务概述', source:'CTA Paper 3', question:'转让定价属于BEPS第几项行动？', options:['Action 1','Action 8-10','Action 13','Action 15'], answer:1, explanation:'Action 8-10涉及转让定价及无形资产业务。' },
  { id:125, topic:'国际税务概述', source:'CTA Paper 3', question:'CbCR属于BEPS第几项行动？', options:['Action 5','Action 13','Action 15','Action 1'], answer:1, explanation:'Action 13规定三层文档及CbCR。' },

  // ═══ OECD范本 (126-131) ═══
  { id:126, topic:'国际税务概述', source:'CTA Paper 3', question:'范本第4条解决什么问题？', options:['PE定义','双重居民身份','股息征税','转让定价'], answer:1, explanation:'第4条定义居民及加比规则。' },
  { id:127, topic:'国际税务概述', source:'CTA Paper 3', question:'第7条营业利润的核心原则是？', options:['全球征税','PE原则','固定税率','免税'], answer:1, explanation:'无PE则来源国不征税，有PE则仅就归属利润征税。' },
  { id:128, topic:'国际税务概述', source:'CTA Paper 3', question:'第9条关联企业条款基于？', options:['固定加成','独立企业原则','全球公式','免税'], answer:1, explanation:'Arm\'s Length Principle。' },
  { id:129, topic:'国际税务概述', source:'CTA Paper 3', question:'公司双重居民身份加比规则首选？', options:['国籍','实际管理机构所在地','注册地','股东所在地'], answer:1, explanation:'OECD范本：实际管理机构所在地优先。' },
  { id:130, topic:'国际税务概述', source:'CTA Paper 3', question:'OECD范本注释的地位是？', options:['无法律效力但具重要参考价值','法律强制','仅对欧盟有效','取代协定'], answer:0, explanation:'注释是解释协定的重要工具。' },
  { id:131, topic:'国际税务概述', source:'CTA Paper 3', question:'第10条股息预提税上限（范本一般）常为？', options:['0%','5%/15%分档','25%','50%'], answer:1, explanation:'范本对股息设有分级预提税上限。' },

  // ═══ 常设机构 (37-40, 132-139) ═══
  { id:37, topic:'常设机构', source:'CTA Paper 3', question:'PE定义主要来源于？', options:['IRD','OECD范本第5条','WTO','基本法'], answer:1, explanation:'第5条是PE定义核心。' },
  { id:38, topic:'常设机构', source:'CTA Paper 3', question:'建筑工地PE的时间门槛通常为？', options:['3个月','6个月','12个月','24个月'], answer:2, explanation:'OECD范本及内地-香港安排均为12个月。' },
  { id:39, topic:'常设机构', source:'CTA Paper 3', question:'哪种代理人构成依存代理人PE？', options:['独立佣金代理','惯常行使签约权的代理人','仅做广告宣传者','物流承运人'], answer:1, explanation:'有并惯常行使签约权的非独立代理人构成PE。' },
  { id:40, topic:'常设机构', source:'CTA Paper 3', question:'归属于PE的营业利润，来源国？', options:['无权征税','可对归属利润征税','全额征税','免税'], answer:1, explanation:'第7条PE原则。' },
  { id:132, topic:'常设机构', source:'CTA Paper 3', question:'准备性/辅助性活动场所一般？', options:['构成PE','不构成PE','按6个月算','全额征税'], answer:1, explanation:'纯辅助功能场所豁免构成PE。' },
  { id:133, topic:'常设机构', source:'CTA Paper 3', question:'内地-香港安排中建筑工地PE期限为？', options:['6个月','9个月','12个月','18个月'], answer:2, explanation:'内地-香港税收安排：12个月。' },
  { id:134, topic:'常设机构', source:'CTA Paper 3', question:'固定场所PE须满足？', options:['固定性+营业活动','仅租用办公室','任何短期访问','仅制造业'], answer:0, explanation:'须为固定营业场所并进行营业活动。' },
  { id:135, topic:'常设机构', source:'CTA Paper 3', question:'仓储活动是否一定构成PE？', options:['是','视乎是否属辅助性活动','一定不构成','仅超过12个月构成'], answer:1, explanation:'纯储存可能属辅助活动而不构成PE。' },
  { id:136, topic:'常设机构', source:'CTA Paper 3 案例', question:'内地公司在港设代表处仅做市场调研，不签合同。最可能？', options:['构成PE','不构成PE','构成依存代理人PE','须缴利得税'], answer:1, explanation:'纯辅助/准备活动通常不构成PE。' },
  { id:137, topic:'常设机构', source:'CTA Paper 3', question:'电子商务下服务器是否可能构成PE？', options:['绝不可能','视乎服务器功能及持久性','自动构成','仅适用于B2C'], answer:1, explanation:'OECD：仅当服务器功能超出辅助性质时可能构成PE。' },
  { id:138, topic:'常设机构', source:'CTA Paper 3', question:'无PE时，来源国对营业利润的一般权利是？', options:['全额征税','不得征税（协定限制）','按10%征税','由双方协商'], answer:1, explanation:'无PE则来源国通常不得征税营业利润。' },
  { id:139, topic:'常设机构', source:'CTA Paper 3', question:'PE利润归属采用的原则是？', options:['全球利润分摊','独立企业原则','固定10%','按营业额'], answer:1, explanation:'视同独立企业所能取得的利润。' },

  // ═══ 转让定价 (41-44, 140-146) ═══
  { id:41, topic:'转让定价', source:'CTA Paper 3', question:'三层文档包括？', options:['主文档、本地文档、CbCR','年报、审计、税务','仅本地文档','仅CbCR'], answer:0, explanation:'BEPS Action 13三层文档。' },
  { id:42, topic:'转让定价', source:'CTA Paper 3', question:'CUP法的前提是？', options:['无关联','存在可比非受控交易','仅服务','仅无形资产'], answer:1, explanation:'CUP需要严格可比性。' },
  { id:43, topic:'转让定价', source:'CTA Paper 3', question:'APA的主要优势？', options:['降税率','预先确定TP方法','免报税','退税'], answer:1, explanation:'提供税务确定性。' },
  { id:44, topic:'转让定价', source:'CTA Paper 3', question:'TNMM适用于？', options:['复杂无形资产业务','功能简单的关联交易','所有交易','金融衍生品'], answer:1, explanation:'TNMM常用于合约制造/分销。' },
  { id:140, topic:'转让定价', source:'CTA Paper 3', question:'RPM（再销售价格法）适用于？', options:['制造业务','分销业务','融资','研发'], answer:1, explanation:'RPM以毛利率为基准，适用于分销商。' },
  { id:141, topic:'转让定价', source:'CTA Paper 3', question:'成本加成法适用于？', options:['分销','制造或服务提供','无形资产','融资'], answer:1, explanation:'以成本加合理利润为基准。' },
  { id:142, topic:'转让定价', source:'CTA Paper 3', question:'利润分割法适用于？', options:['简单交易','双方独特贡献的复杂交易','所有交易','内部贷款'], answer:1, explanation:'双方均有独特无形贡献时使用。' },
  { id:143, topic:'转让定价', source:'CTA Paper 3', question:'可比性分析五要素不包括？', options:['特性','功能分析','员工人数','经济环境'], answer:2, explanation:'五要素：特性、功能、合同条款、经济环境、商业策略。' },
  { id:144, topic:'转让定价', source:'CTA Paper 3', question:'香港CbCR申报门槛（集团收入）约为？', options:['$40亿','$68亿','$100亿','$200亿'], answer:1, explanation:'集团综合收入≥68亿港元。' },
  { id:145, topic:'转让定价', source:'CTA Paper 3', question:'关联交易不符合公平交易原则，税务局可？', options:['仅警告','调整入息','吊销执照','拘留'], answer:1, explanation:'局方可作出转让定价调整。' },
  { id:146, topic:'转让定价', source:'CTA Paper 3', question:'MAP（相互协商程序）用于？', options:['国内争议','解决双重征税争议','刑事调查','印花税'], answer:1, explanation:'MAP解决协定解释及双重征税争议。' },

  // ═══ CFC/MLI (45-48, 147-152) ═══
  { id:45, topic:'受控外国公司', source:'CTA Paper 3', question:'CFC规则目的是？', options:['鼓励投资','防止利润滞留低税地','降税率','简化报税'], answer:1, explanation:'防止延迟纳税。' },
  { id:46, topic:'受控外国公司', source:'CTA Paper 3', question:'香港CFC规则现状？', options:['已全面实施','尚未全面实施','仅对银行','仅个人'], answer:1, explanation:'香港仍在跟进立法。' },
  { id:47, topic:'受控外国公司', source:'CTA Paper 3', question:'MLI的功能是？', options:['取代所有协定','快速修改现有协定','仅OECD','取消PE'], answer:1, explanation:'一次签署修改多个协定。' },
  { id:48, topic:'受控外国公司', source:'CTA Paper 3', question:'MLI最低标准是？', options:['PPT','全球最低税','CbCR','APA'], answer:0, explanation:'PPT为主要目的测试。' },
  { id:147, topic:'受控外国公司', source:'CTA Paper 3', question:'PPT测试的标准是？', options:['唯一目的','主要目的之一为获协定优惠','任何目的','无标准'], answer:1, explanation:'如获优惠是主要目的之一，则不得享受优惠。' },
  { id:148, topic:'受控外国公司', source:'CTA Paper 3', question:'内地-香港安排已加入？', options:['仅LOB','PPT条款','全球最低税','无修改'], answer:1, explanation:'MLI修改后加入了PPT。' },
  { id:149, topic:'受控外国公司', source:'CTA Paper 3', question:'导管公司安排的主要风险是？', options:['无风险','无法通过受益所有人/PPT测试','自动免税','双重免税'], answer:1, explanation:'导管公司常被拒绝协定优惠。' },
  { id:150, topic:'受控外国公司', source:'CTA Paper 3', question:'CFC通常针对的收入类型是？', options:['主动经营利润','被动收入（利息、股息等）','工资','印花税'], answer:1, explanation:'CFC多针对被动收入。' },
  { id:151, topic:'受控外国公司', source:'CTA Paper 3', question:'APA与事先裁定的区别是？', options:['相同','APA针对转让定价','APA仅个人','无区别'], answer:1, explanation:'APA专门用于转让定价安排。' },
  { id:152, topic:'受控外国公司', source:'CTA Paper 3', question:'MLI中协定序言的修改目的是？', options:['降低税率','表明协定意图不包括造成双重非征税','取消PE','增加预提税'], answer:1, explanation:'序言强调协定不应被滥用。' },

  // ═══ 双重征税 (49-52, 153-158) ═══
  { id:49, topic:'双重征税', source:'CTA Paper 3', question:'FTC基本原则是？', options:['双重全额缴税','外国已缴税额抵免本国税额','全部豁免','仅公司'], answer:1, explanation:'避免双重征税的核心机制。' },
  { id:50, topic:'双重征税', source:'CTA Paper 3', question:'税收饶让是？', options:['来源国放弃征税','居民国视同已征税款含优惠未征部分','两国均免','仅个人'], answer:1, explanation:'饶让抵免常见于发展中国家协定。' },
  { id:51, topic:'双重征税', source:'CTA Paper 3', question:'内地-香港安排股息预提税上限（持股≥25%）？', options:['5%','10%','15%','20%'], answer:0, explanation:'符合条件股息预提税5%。' },
  { id:52, topic:'双重征税', source:'CTA Paper 3', question:'间接抵免适用于？', options:['直接持股','通过中间公司间接取得外国收入','仅个人','工资'], answer:1, explanation:'母子公司间接抵免。' },
  { id:153, topic:'双重征税', source:'CTA Paper 3', question:'香港FTC采用？', options:['全球限额','分国限额','自动全额','无抵免'], answer:1, explanation:'香港采用分国限额。' },
  { id:154, topic:'双重征税', source:'CTA Paper 3', question:'内地-香港安排利息预提税上限？', options:['5%','7%','10%','15%'], answer:1, explanation:'利息预提税上限7%。' },
  { id:155, topic:'双重征税', source:'CTA Paper 3', question:'特许权使用费预提税上限（内地-香港）？', options:['5%','7%','10%','15%'], answer:1, explanation:'特许权使用费上限7%。' },
  { id:156, topic:'双重征税', source:'CTA Paper 3', question:'超额外国税款在香港可？', options:['结转抵免','不可结转','双倍退还','自动豁免'], answer:1, explanation:'香港不允许FTC结转。' },
  { id:157, topic:'双重征税', source:'CTA Paper 3', question:'受益所有人测试主要防止？', options:['逃汇','协定滥用','洗钱','关税'], answer:1, explanation:'防止导管公司滥用优惠税率。' },
  { id:158, topic:'双重征税', source:'CTA Paper 3', question:'安排与国内税法税率冲突时，纳税人一般？', options:['选高者','选低者（在不违反安排下）','均不适用','由税务局决定'], answer:1, explanation:'可取协定与国内法中有利者。' },

  // ═══ 科目三综合 (159-165) ═══
  { id:159, topic:'国际税务概述', source:'CTA Paper 3', question:'第5条PE与第7条营业利润的关系是？', options:['无关','先判定PE再归属利润','直接全额征税','仅对股息'], answer:1, explanation:'先PE判定，再利润归属。' },
  { id:160, topic:'国际税务概述', source:'CTA Paper 3', question:'独立代理人测试的关键是？', options:['代表多家企业','法律上和经济上独立','仅收取佣金','在港注册'], answer:1, explanation:'须在法律和经济上独立于委托人。' },
  { id:161, topic:'国际税务概述', source:'CTA Paper 3', question:'香港签署的MLI影响？', options:['无影响','修改现有双边协定','取代国内法','取消所有预提税'], answer:1, explanation:'MLI修改已匹配的税收协定。' },
  { id:162, topic:'国际税务概述', source:'CTA Paper 3', question:'转让定价文档主文档由谁准备？', options:['各子公司','集团总部','税务局','会计师事务所'], answer:1, explanation:'主文档由集团总部统筹。' },
  { id:163, topic:'国际税务概述', source:'CTA Paper 3', question:'第11条利息条款通常允许来源国？', options:['禁止征税','有限征税','全额征税','免税'], answer:1, explanation:'协定对利息设预提税上限。' },
  { id:164, topic:'国际税务概述', source:'CTA Paper 3', question:'双重非征税（double non-taxation）是？', options:['两国均征税','两国均未征税','仅香港征税','仅海外征税'], answer:1, explanation:'BEPS旨在防止双重非征税。' },
  { id:165, topic:'国际税务概述', source:'CTA Paper 3', question:'CoR（居民证明书）用于？', options:['入境','证明居民身份以享受协定','开户','上市'], answer:1, explanation:'向来源国证明香港居民身份。' },

  // ═══ 税务筹划 (53-56, 166-171) ═══
  { id:53, topic:'跨境税务筹划', source:'CTA Paper 5', question:'筹划与逃税的区别？', options:['无区别','筹划合法、逃税非法','均非法','均合法'], answer:1, explanation:'关键在合法性。' },
  { id:54, topic:'跨境税务筹划', source:'CTA Paper 5', question:'Substance要求核心是？', options:['注册公司','真实经济活动和人员','一个账户','代理董事'], answer:1, explanation:'须有实质经济活动。' },
  { id:55, topic:'跨境税务筹划', source:'CTA Paper 5', question:'中间控股公司选址首要看？', options:['注册费','协定网络及反避税规则','语言','时区'], answer:1, explanation:'综合税务及合规因素。' },
  { id:56, topic:'跨境税务筹划', source:'CTA Paper 5', question:'受益所有人概念用于？', options:['注册','防止协定滥用','折旧','会计'], answer:1, explanation:'防止导管安排。' },
  { id:166, topic:'跨境税务筹划', source:'CTA Paper 5', question:'激进税务筹划的风险是？', options:['无风险','可能被第61A条挑战','自动批准','退税'], answer:1, explanation:'灰色地带安排可能被否定。' },
  { id:167, topic:'跨境税务筹划', source:'CTA Paper 5', question:'离岸架构规划须考虑香港？', options:['全球征税','地域来源及反避税规则','VAT','资本管制'], answer:1, explanation:'地域来源是核心。' },
  { id:168, topic:'跨境税务筹划', source:'CTA Paper 5', question:'双重非征税安排是BEPS重点打击对象？', options:['否','是','仅对个人','仅对印花税'], answer:1, explanation:'BEPS防止双重非征税及协定滥用。' },
  { id:169, topic:'跨境税务筹划', source:'CTA Paper 5', question:'香港财资中心合资格利润可享？', options:['100%豁免','50%税务豁免','无优惠','8.25%固定'], answer:1, explanation:'合资格财资交易利润50%豁免。' },
  { id:170, topic:'跨境税务筹划', source:'CTA Paper 5', question:'税务合规计划服务（原税收策划）强调？', options:['逃避纳税','在合规框架内规划','隐瞒收入','离岸保密'], answer:1, explanation:'CTA考试强调合规。' },
  { id:171, topic:'跨境税务筹划', source:'CTA Paper 5', question:'经济实质法（如BVI/Cayman）要求？', options:['无要求','在注册地有实质活动','仅缴年费','仅一个董事'], answer:1, explanation:'离岸辖区须有实质。' },

  // ═══ 集团架构 (57-59, 172-177) ═══
  { id:57, topic:'集团架构', source:'CTA Paper 5', question:'香港允许集团亏损抵消吗？', options:['允许','不允许','自动','仅同业'], answer:1, explanation:'各公司独立评税。' },
  { id:58, topic:'集团架构', source:'CTA Paper 5', question:'香港控股公司优势包括？', options:['零税率保证','广泛DTA及离岸收入可能豁免','无合规要求','免印花税'], answer:1, explanation:'协定网络是核心优势。' },
  { id:59, topic:'集团架构', source:'CTA Paper 5', question:'分拆交易主要税务考量？', options:['无','是否构成应税处置','仅会计','仅审计'], answer:1, explanation:'可能触发利得税/印花税。' },
  { id:172, topic:'集团架构', source:'CTA Paper 5', question:'红筹架构中香港中间层的主要功能是？', options:['制造','控股及融资平台','零售','仓储'], answer:1, explanation:'常见为控股及融资中间层。' },
  { id:173, topic:'集团架构', source:'CTA Paper 5', question:'股息预提税规划须考虑？', options:['仅香港法','协定网络及受益所有人','仅内地法','仅印花税'], answer:1, explanation:'须满足协定适用条件。' },
  { id:174, topic:'集团架构', source:'CTA Paper 5', question:'香港无参与豁免法，但可能适用？', options:['全球免税','离岸收入豁免索偿','自动退税','CFC'], answer:1, explanation:'外国来源收入可能离岸免税。' },
  { id:175, topic:'集团架构', source:'CTA Paper 5', question:'集团重组可能涉及的税种包括？', options:['仅利得税','利得税、印花税','仅薪俸税','无'], answer:1, explanation:'重组常涉及多项税。' },
  { id:176, topic:'集团架构', source:'CTA Paper 5', question:'Pillar Two对香港控股架构的影响是？', options:['无影响','可能适用全球最低税规则','取消利得税','仅影响个人'], answer:1, explanation:'跨国集团可能受全球最低税影响。' },
  { id:177, topic:'集团架构', source:'CTA Paper 5', question:'合资企业与分公司的税务差异主要在？', options:['无差异','利润汇出及责任','仅会计','仅审计'], answer:1, explanation:'分公司利润可能即时在港征税。' },

  // ═══ 跨境交易 (60-62, 178-183) ═══
  { id:60, topic:'跨境交易', source:'CTA Paper 5', question:'CoR的用途是？', options:['入境','证明香港居民享受协定','签证','上市'], answer:1, explanation:'申请协定优惠时使用。' },
  { id:61, topic:'跨境交易', source:'CTA Paper 5', question:'香港在VAT/GST方面的特点是？', options:['征收5%','不征收VAT/GST','20%','仅进口'], answer:1, explanation:'香港无VAT/GST。' },
  { id:62, topic:'跨境交易', source:'CTA Paper 5', question:'特许权使用费预提税取决于？', options:['仅国内法','协定及国内法','WTO','IRD酌情'], answer:1, explanation:'协定通常降低预提税率。' },
  { id:178, topic:'跨境交易', source:'CTA Paper 5', question:'香港公司收取海外股息，香港一般？', options:['全额征税','视乎来源可能离岸免税','按20%','按薪俸税'], answer:1, explanation:'非香港来源股息可能免税。' },
  { id:179, topic:'跨境交易', source:'CTA Paper 5', question:'跨境服务可能触发？', options:['仅印花税','PE风险及预提税','仅物业税','无税务'], answer:1, explanation:'跨境服务须审视PE及预提税。' },
  { id:180, topic:'跨境交易', source:'CTA Paper 5', question:'申请CoR通常须证明？', options:['仅注册','在港有实质管理及控制','仅一个员工','仅银行账户'], answer:1, explanation:'须证明香港税务居民身份。' },
  { id:181, topic:'跨境交易', source:'CTA Paper 5', question:'利息收入预提税规划须关注？', options:['仅汇率','受益所有人及协定条款','仅时间','仅金额'], answer:1, explanation:'协定适用条件关键。' },
  { id:182, topic:'跨境交易', source:'CTA Paper 5', question:'数字服务税（DST）香港目前？', options:['已实施','未实施','20%','5%'], answer:1, explanation:'香港目前无DST。' },
  { id:183, topic:'跨境交易', source:'CTA Paper 5', question:'关联交易披露在港主要依据？', options:['公司法','税务条例及DIPN','证券条例','劳动法'], answer:1, explanation:'转让定价规则在税务条例下。' },

  // ═══ 案例 (65-68, 184-192) ═══
  { id:65, topic:'案例', source:'CTA Paper 5', question:'香港贸易公司海外购销，港办公室仅行政。利得税？', options:['全额课税','可能仅有限利润课税','完全免税','20%'], answer:1, explanation:'核心活动在海外则利润可能非香港来源。' },
  { id:66, topic:'案例', source:'CTA Paper 5', question:'港公司向内地子公司收管理费，应？', options:['无需评估','证明服务实质及公平价格','一律不可扣','10%固定'], answer:1, explanation:'转让定价合规要求。' },
  { id:67, topic:'案例', source:'CTA Paper 5', question:'港雇员被派内地工作一年，薪俸税？', options:['一定免税','视乎天数及协定','一定全额','内地税代替'], answer:1, explanation:'须分析工作地点及停留天数。' },
  { id:68, topic:'案例', source:'CTA Paper 5', question:'财资中心主要税务优势？', options:['无','50%利润豁免','全免','无预提税'], answer:1, explanation:'合资格财资利润50%豁免。' },
  { id:184, topic:'案例', source:'CTA Paper 5 案例', question:'A公司在港签订销售合约，货物经港转运至海外。利润来源最可能？', options:['香港','海外','一半一半','免税'], answer:0, explanation:'合约在港签订且货物经港，可能属香港来源。' },
  { id:185, topic:'案例', source:'CTA Paper 5 案例', question:'母公司向港子公司收取高额品牌费，税务局最可能质疑？', options:['印花税','转让定价及受益测试','薪俸税','物业税'], answer:1, explanation:'无形资产业务转让定价是重点。' },
  { id:186, topic:'案例', source:'CTA Paper 5 案例', question:'内地居民在港工作超过183天，可能构成？', options:['仅香港居民','内地及香港双重居民','仅内地居民','无居民身份'], answer:1, explanation:'须适用加比规则解决双重居民。' },
  { id:187, topic:'案例', source:'CTA Paper 5 案例', question:'并购后整合中发现的未披露税务负债应在？', options: ['SPA中处理','忽略','仅会计处理','延期10年'], answer:0, explanation:'应在股份购买协议中通过陈述保证及赔偿条款处理。' },
  { id:188, topic:'案例', source:'CTA Paper 5 案例', question:'香港公司向BVI子公司贷款收取利息，主要风险？', options:['无','转让定价及受控交易','印花税','物业税'], answer:1, explanation:'关联贷款须符合公平交易原则。' },
  { id:189, topic:'案例', source:'CTA Paper 5 案例', question:'员工股份期权利益一般计入？', options:['薪俸税入息','利得税','物业税','印花税'], answer:0, explanation:'股份认购权利益属薪俸税入息。' },
  { id:190, topic:'案例', source:'CTA Paper 5 案例', question:'跨境电子商务通过平台销售，税务上首要分析？', options:['平台佣金','PE及利润来源地','印花税','物业税'], answer:1, explanation:'电商须审视PE及利润归属。' },
  { id:191, topic:'案例', source:'CTA Paper 5 案例', question:'目标公司历史转让定价不合规，买方应？', options:['忽略','在SPA中要求税务赔偿','自动免责','仅审计调整'], answer:1, explanation:'税务尽调发现应在交易文件中保护。' },
  { id:192, topic:'案例', source:'CTA Paper 5 案例', question:'港公司收购海外目标，后续整合选址应优先考虑？', options:['最低注册费','实质、协定及反避税','保密性','语言'], answer:1, explanation:'跨境并购后架构须合规且有实质。' },

  // ═══ 尽调 (63-64, 193-197) ═══
  { id:63, topic:'税务尽职调查', source:'CTA Paper 5', question:'税务尽调主要目的？', options:['替代审计','识别税务风险及或有负债','算印花税','申请优惠'], answer:1, explanation:'发现历史合规问题。' },
  { id:64, topic:'税务尽职调查', source:'CTA Paper 5', question:'尽调中转让定价应关注？', options:['仅合同','定价合规及文档','仅利润','忽略'], answer:1, explanation:'TP是尽调重点。' },
  { id:193, topic:'税务尽职调查', source:'CTA Paper 5', question:'尽调通常覆盖多少年历史？', options:['1年','3-7年（视情况）','20年','仅当年'], answer:1, explanation:'通常审查3-7年，法定时效内。' },
  { id:194, topic:'税务尽职调查', source:'CTA Paper 5', question:'未决税务审计应在尽调中？', options:['忽略','量化风险并反映于估值','自动免责','仅口头披露'], answer:1, explanation:'须量化对交易价格的影响。' },
  { id:195, topic:'税务尽职调查', source:'CTA Paper 5', question:'SPA税务赔偿条款通常涵盖？', options:['未来所有税','卖方披露日前未知负债','仅印花税','无赔偿'], answer:1, explanation:'保护买方免受历史税务负债。' },
  { id:196, topic:'税务尽职调查', source:'CTA Paper 5', question:'员工税务不合规（MPF/薪俸税）在尽调中？', options:['不重要','须关注及量化','仅HR处理','自动豁免'], answer:1, explanation:'雇员税务合规是尽调范围。' },
  { id:197, topic:'税务尽职调查', source:'CTA Paper 5', question:'尽调发现重大税务风险后，买方可以？', options:['仅取消交易','调价、赔偿或退出','自动免责','忽略'], answer:1, explanation:'多种交易保护机制可用。' },

  // ═══ 总复习 (69-70, 198-210) ═══
  { id:69, topic:'总复习', source:'CTA 综合', question:'香港税制特点不包括？', options:['地域来源','低税率','全球征税','无VAT'], answer:2, explanation:'香港采用地域来源原则。' },
  { id:70, topic:'总复习', source:'CTA 综合', question:'Paper 2/3/5的关系是？', options:['无关','本地法→国际法→实务','仅印花税','仅个人税'], answer:1, explanation:'三科递进结构。' },
  { id:198, topic:'总复习', source:'CTA 综合', question:'CTA考试笔试时长？', options:['1小时','3小时','5小时','开卷'], answer:1, explanation:'每科3小时闭卷。' },
  { id:199, topic:'总复习', source:'CTA 综合', question:'合格分数为？', options:['40%','50%','60%','70%'], answer:1, explanation:'50分合格（满分100）。' },
  { id:200, topic:'总复习', source:'CTA 综合', question:'单科成绩有效期？', options:['2年','5年','10年','永久'], answer:1, explanation:'5年有效。' },
  { id:201, topic:'总复习', source:'CTA 综合', question:'Paper 2/3/5笔试语言？', options:['中文','英文','任选','粤语'], answer:1, explanation:'除Paper 4外均英文作答。' },
  { id:202, topic:'总复习', source:'CTA 综合', question:'考试主办机构是？', options:['HKICPA','TIHK（香港税务学会）','IRD','考评局独立'], answer:1, explanation:'TIHK主办，考评局承办。' },
  { id:203, topic:'总复习', source:'CTA 综合', question:'第61A条、PE、TP分别属？', options:['均Paper 2','国内反避税/国际PE/国际TP','均Paper 5','均印花税'], answer:1, explanation:'61A属Paper 2，PE/TP属Paper 3。' },
  { id:204, topic:'总复习', source:'CTA 综合', question:'答题引用法例时应？', options:['不必引用','引用Cap.112及条文编号','仅写中文','仅写案例'], answer:1, explanation:'考试要求引用法例条文。' },
  { id:205, topic:'总复习', source:'CTA 综合', question:'案例题答题结构最佳是？', options:['仅写结论','事实→法律原则→应用→结论','抄题目','仅计算'], answer:1, explanation:'IRAC结构是笔试关键。' },
  { id:206, topic:'总复习', source:'CTA 综合', question:'内地-香港安排下常设机构利润征税权？', options:['仅内地','仅香港','双方可能均有权（视归属）','免税'], answer:2, explanation:'来源国可就归属PE利润征税，居民国FTC。' },
  { id:207, topic:'总复习', source:'CTA 综合', question:'离岸索偿与PE判定关系？', options:['相同','不同概念：来源地vs协定PE','均印花税','均薪俸税'], answer:1, explanation:'离岸索偿看利润来源，PE看协定征税权。' },
  { id:208, topic:'总复习', source:'CTA 综合', question:'个人入息课税、FTC、APA的共同点是？', options:['均增税','均可能减轻税负或提供确定性','均非法','均仅法团'], answer:1, explanation:'均为税务规划/宽减工具。' },
  { id:209, topic:'总复习', source:'CTA 综合', question:'考试答题时间管理建议？', options:['只做选择题','计算与论述均衡分配','留空','倒序作答'], answer:1, explanation:'3小时须合理分配。' },
  { id:210, topic:'总复习', source:'CTA 综合', question:'香港税务条例修正案截止日期（考试适用）一般参考？', options:['考试当天','财政年度预算案后','IRD不定期','仅OECD'], answer:1, explanation:'考试大纲列明适用法例截止日期。' }
];

// 每日 5-10 题映射
window.EXAM_DAILY_QUIZZES = {
  1:  [1,2,71,72,73,74,75,76],           // 8题 物业税基础
  2:  [3,4,5,77,78,6,72,73],             // 8题 物业税实务
  3:  [7,8,79,80,81,9,10,11],            // 8题 薪俸税基础
  4:  [12,82,83,84,85,86,79,80],         // 8题 薪俸税实务
  5:  [13,14,87,88,15,16,89,90],        // 8题 利得税基础
  6:  [17,18,91,92,93,94,87,88],        // 8题 利得税扣除
  7:  [19,20,95,96,97,98,99,21],        // 8题 个人入息课税
  8:  [22,23,100,101,102,24,103,104],   // 8题 印花税
  9:  [25,106,107,108,26,109,27,28],    // 8题 反避税
  10: [110,29,30,111,112,31,113,32],    // 8题 税务行政
  11: [114,115,116,117,118,29,30,111], // 8题 科目二综合一
  12: [112,113,31,32,114,115,116,117], // 8题 科目二综合二
  13: [33,34,119,120,121,35,122,36],   // 8题 国际税务概述
  14: [126,127,128,129,130,131,33,34], // 8题 OECD范本
  15: [37,38,132,133,134,39,135,136], // 8题 常设机构一
  16: [40,137,138,139,132,133,37,38],  // 8题 营业利润
  17: [41,42,140,141,142,143,44,145], // 8题 转让定价
  18: [43,144,146,41,42,140,141,143],  // 8题 APA与文档
  19: [45,46,150,151,47,48,147,149],   // 8题 CFC
  20: [148,152,147,149,45,46,47,48],   // 8题 MLI
  21: [49,50,153,154,51,155,156,52],   // 8题 外国税收抵免
  22: [157,158,159,160,161,162,163,164], // 8题 科目三复习
  23: [53,54,166,167,168,55,169,170], // 8题 税务筹划
  24: [56,171,57,58,172,173,174,175], // 8题 集团架构
  25: [59,60,178,179,61,180,62,181],  // 8题 跨境交易
  26: [157,158,165,56,182,183,60,62], // 8题 居民证明与协定
  27: [65,184,66,185,67,186,87,136],  // 8题 案例一
  28: [68,188,189,190,66,185,188,191], // 8题 案例二
  29: [63,64,193,194,195,196,197,191], // 8题 尽调
  30: [69,70,198,199,200,201,202,203,204,205] // 10题 总复习
};
