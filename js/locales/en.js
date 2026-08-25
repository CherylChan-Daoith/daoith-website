window.DAOITH_I18N_ZH = {
  meta: {
    title: '道一跨境咨询 DAOITH Consulting - 跨境电商财税解决方案平台',
    description: '道一跨境咨询 DAOITH Consulting - 跨境电商财税合规一站式解决方案，融合AI智能技术与资深财税专家经验',
  },
  strings: {
    'loadMore.articles': '查看更多',
    'loadMore.policies': '查看更多',
    'loadMore.taxSystems': '查看更多',
    'loadMore.taxPolicies': '查看更多',
    'loadMore.platformPolicies': '查看更多',
    'loadMore.policiesRemaining': '查看更多（还有 {n} 条政策）',
    'services.showAll': '查看全部 {n} 个服务 ↓',
    'services.collapse': '收起服务列表 ↑',
    'tax.viewDetail': '查看税制详情',
    'tax.trade': '2025年贸易额',
    'article.readMore': '阅读原文',
    'ai.loading': 'Daoith Compliance Assistant is generating your plan…',
    'ai.generating': '生成中…',
    'ai.querying': '查询中…',
    'tax.calcLoading': '计算中…',
    'tax.fallback': '道一 AI 暂不可用，已使用本地公式估算：',
    'alert.platformCountry': '请至少选择从事的电商平台和发货模式',
    'alert.fieldRequired': '请选择或填写此项',
    'ai.refineHint': '如需更细化的合规建议，请在左侧业务信息栏补充店铺主体、目的国、HS编码、发票与出口方式等信息后重新生成。',
    'alert.hsCode': '请先输入HS编码',
    'alert.countryForDuty': '查询目的国关税前，请先选择目的国/地区',
    'alert.feedbackEmpty': '请输入内容',
    'alert.feedbackThanks': '感谢您的反馈，我们会尽快处理！',
    'alert.wechatOn': '微信通知已开启',
    'alert.wechatOff': '微信通知已关闭',
    'alert.wechatBindWaiting': '等待微信端完成绑定…',
    'alert.wechatBoundOk': '绑定成功',
    'alert.wechatBindFail': '微信通知设置失败，请稍后重试',
    'alert.wechatLinkCopied': '已复制',
    'auth.wechatLogin': '微信登录',
    'auth.logout': '退出',
    'auth.wechatUser': '微信用户',
    'auth.placeholderHint': '微信登录尚未配置，请在服务端设置 WECHAT_APP_ID 与 WECHAT_APP_SECRET，并将前端 config.js 中的 wechatAppId 替换为真实 AppID。',
    'auth.loginFailed': '微信登录失败，请重试',
    'auth.loginSuccess': '登录成功，正在跳转…',
    'auth.loggingIn': '正在完成登录…',
    'auth.missingCode': '未获取到微信授权码',
    'auth.invalidState': '登录状态校验失败，请重新扫码',
    'auth.loginRequired': '请先微信登录后再使用该功能，登录后将自动继续。',
    'form.hsPlaceholder': '请填写10位海关编码以获得准确退税率',
    'form.notesPlaceholder': '如：涉及多国VAT注册、转让定价、海外公司架构等...',
    'policy.searchPlaceholder': '搜索政策关键词...',
    'feedback.placeholder': '请描述您的问题或建议...',
    'article.back': '← 返回政策速递',
    'tax.back': '← 返回各地区税制列表',
    'article.loading': '加载中…',
    'tax.loading': '加载中…',
    'article.notFoundTitle': '文章未找到',
    'article.notFoundDesc': '请从专家解读列表选择文章阅读。',
    'tax.notFoundTitle': '未找到该国税制信息',
    'tax.notFoundDesc': '请从各地区税制介绍列表选择。',
    'article.tag': '专家解读',
    'tax.tag': '税路通摘编',
    'article.ctaPlan': '免费生成合规方案',
    'tax.ctaPlan': '生成跨境合规方案',
    'article.sourceLabel': '权威来源',
    'tax.tradeMeta': '数据来源',
  },
};

window.DAOITH_enServiceBlocks = function enServiceBlocks({
  content,
  bullets,
  pricing,
  process,
  timeline,
  faqs,
}) {
  function padFaqs(list) {
    const items = Array.isArray(list) ? list.slice() : [];
    if (items.length < 2) {
      items.push({
        q: 'Are government fees included?',
        a: 'The service fee covers agreed advisory/agency work. Government fees, translations, notarization, and third-party audits are usually billed separately.',
      });
    }
    if (items.length < 3) {
      items.push({
        q: 'How do kickoff and delivery work?',
        a: 'After confirming scope and documents, we start under contract and deliver by process milestones, with optional online reviews at key steps.',
      });
    }
    return items;
  }

  const steps = (Array.isArray(process) ? process : []).map((title, i, arr) => {
    let time = 'As scheduled';
    if (i === 0) time = 'Within 1–5 business days after kickoff';
    else if (i === arr.length - 1) time = 'Final delivery';
    else time = 'In progress';
    return { title, time };
  });

  const scope = bullets?.length ? bullets : steps.map((s) => s.title);
  const out = [];
  out.push({ type: 'h2', text: 'Service content' });
  if (content) out.push({ type: 'p', text: content });
  if (scope.length) {
    out.push({
      type: 'table',
      variant: 'scope',
      headers: ['Scope'],
      rows: scope.map((b) => [[{ mark: 'ok', text: b }]]),
    });
  }
  out.push({ type: 'h2', text: 'Pricing' });
  if (pricing) out.push({ type: 'p', text: pricing });
  out.push({ type: 'h2', text: 'Process' });
  if (steps.length) out.push({ type: 'timeline', steps });
  if (typeof timeline === 'string' && timeline) {
    out.push({ type: 'p', text: `Overall timing: ${timeline}` });
  }
  if (steps.length) {
    const note = typeof timeline === 'string' ? timeline.replace(/\.\s*$/, '') : '';
    out.push({
      type: 'table',
      variant: 'deliver',
      firstColHeader: true,
      headers: ['Workstream', 'Timing', 'Deliverables'],
      rows: steps.map((s, i) => [
        `${i + 1}. ${s.title}`,
        s.time,
        i === 0
          ? 'Scope confirmation / document checklist'
          : i === steps.length - 1
            ? note
              ? `Closing pack / final deliverables (${note})`
              : 'Closing pack / final deliverables'
            : 'Milestone confirmation and working papers',
      ]),
    });
  }
  out.push({ type: 'h2', text: 'FAQ' });
  out.push({ type: 'faq', items: padFaqs(faqs) });
  return out;
};

window.DAOITH_I18N_EN = {
  meta: {
    title: 'DAOITH Consulting - Cross-Border E-Commerce Tax Solutions',
    description: 'DAOITH Consulting — AI-powered cross-border e-commerce tax compliance, export rebates, VAT, and expert advisory.',
  },
  strings: {
    'loadMore.articles': 'Load more',
    'loadMore.policies': 'Load more',
    'loadMore.taxSystems': 'Load more',
    'loadMore.taxPolicies': 'Load more',
    'loadMore.platformPolicies': 'Load more',
    'loadMore.policiesRemaining': 'Load more ({n} more policies)',
    'services.showAll': 'View all {n} services ↓',
    'services.collapse': 'Collapse list ↑',
    'nav.cart': 'Cart',
    'nav.cartExpert': 'Add expert 1-on-1 to cart',
    'tax.viewDetail': 'View tax profile',
    'tax.trade': '2025 trade volume',
    'article.readMore': 'Read article',
    'ai.loading': 'DAOITH AI is generating your compliance plan…',
    'ai.generating': 'Generating…',
    'ai.querying': 'Querying…',
    'tax.calcLoading': 'Calculating…',
    'tax.fallback': 'DAOITH AI unavailable — local estimate used: ',
    'alert.platformCountry': 'Please select at least the ecommerce platform and shipping mode',
    'alert.fieldRequired': 'Please complete this field',
    'ai.refineHint': 'For more tailored compliance advice, add store entity, destination market, HS code, invoices, and export mode in the left business info panel, then regenerate.',
    'alert.hsCode': 'Please enter an HS code first',
    'alert.countryForDuty': 'Please select a destination country/region before querying duty rates',
    'alert.feedbackEmpty': 'Please enter your message',
    'alert.feedbackThanks': 'Thank you for your feedback. We will respond soon.',
    'alert.wechatOn': 'WeChat notifications enabled',
    'alert.wechatOff': 'WeChat notifications disabled',
    'alert.wechatBindWaiting': 'Waiting for WeChat bind…',
    'alert.wechatBoundOk': 'Bound successfully',
    'alert.wechatBindFail': 'Failed to update WeChat notifications. Please try again.',
    'alert.wechatLinkCopied': 'Copied',
    'auth.wechatLogin': 'WeChat Login',
    'auth.logout': 'Log out',
    'auth.wechatUser': 'WeChat user',
    'auth.placeholderHint': 'WeChat login is not configured yet. Set WECHAT_APP_ID and WECHAT_APP_SECRET on the server, and replace wechatAppId in config.js with your real App ID.',
    'auth.loginFailed': 'WeChat login failed. Please try again.',
    'auth.loginSuccess': 'Signed in. Redirecting…',
    'auth.loggingIn': 'Completing sign-in…',
    'auth.missingCode': 'WeChat authorization code missing',
    'auth.invalidState': 'State validation failed. Please scan again.',
    'auth.loginRequired': 'Please sign in with WeChat first. After login, we will continue automatically.',
    'form.hsPlaceholder': 'Enter 10-digit HS code for accurate rebate rate',
    'form.notesPlaceholder': 'e.g. multi-country VAT, transfer pricing, offshore structure…',
    'policy.searchPlaceholder': 'Search policies…',
    'feedback.placeholder': 'Describe your issue or suggestion…',
    'article.back': '← Back to policy hub',
    'tax.back': '← Back to regional tax',
    'article.loading': 'Loading…',
    'tax.loading': 'Loading…',
    'article.notFoundTitle': 'Article not found',
    'article.notFoundDesc': 'Please choose an article from the policy hub.',
    'tax.notFoundTitle': 'Tax profile not found',
    'tax.notFoundDesc': 'Please choose a region from the regional tax list.',
    'article.tag': 'Expert insight',
    'tax.tag': 'Tax Silk Road digest',
    'article.ctaPlan': 'Generate compliance plan',
    'tax.ctaPlan': 'Generate compliance plan',
    'article.sourceLabel': 'Authoritative source',
    'tax.tradeMeta': 'Data source',
  },
  selectors: {
    '.logo-text': { text: 'DAOITH Consulting' },
    '.nav a[href="#hero"]': { text: 'Home' },
    '.nav a[href="#ai-solution"]': { text: 'AI Solutions' },
    '.nav a[href="#services"]': { text: 'Services' },
    '.nav a[href="#hub"]': { text: 'Service Hub' },
    '.nav-dropdown-trigger': { text: 'Policies & Tax' },
    '.nav-dropdown-menu a[href="#tax-systems"]': { text: 'Regional Tax Systems' },
    '.nav-dropdown-menu a[href="#policy-tax"]': { text: 'Tax Authority Updates' },
    '.nav-dropdown-menu a[href="#policy-platform"]': { text: 'Marketplace Policies' },
    '.nav-dropdown-menu a[href="#policy-expert"]': { text: 'Expert Insights' },
    '.nav a[href="#about"]': { text: 'About' },
    '.header-inner > .btn-primary': { text: 'Free Plan' },
    '.hero h1': {
      html: true,
      text: 'Cross-Border E-Commerce Tax Compliance<br>All-in-One Solutions',
    },
    '.hero-subtitle': {
      text: 'AI-powered tax compliance for cross-border sellers — plan generation, compliance tax calculation, service marketplace, and progress tracking.',
    },
    '.hero-actions .btn-primary': { text: 'Generate Free Plan' },
    '.hero-actions .btn-outline': { text: 'Latest Policies' },
    '.process-card[data-step="1"] h4': { text: 'Enter Business Info' },
    '.process-card[data-step="2"] h4': { text: 'AI Analysis' },
    '.process-card[data-step="3"] h4': { text: 'Compliance Plan' },
    '.process-card[data-step="1"] .tag:nth-child(1)': { text: 'Platform' },
    '.process-card[data-step="1"] .tag:nth-child(2)': { text: 'Export Mode' },
    '.process-card[data-step="1"] .tag:nth-child(3)': { text: 'Product Type' },
    '.process-card[data-step="2"] .tag:nth-child(1)': {
      text: 'Industry expert experience',
    },
    '.process-card[data-step="3"] .tag:nth-child(1)': { text: 'Export Rebate' },
    '.process-card[data-step="3"] .tag:nth-child(2)': { text: 'Invoice-free exemption' },
    '.process-card[data-step="3"] .tag:nth-child(3)': { text: 'Multiple compliance setups' },
    '#heroFeatures .feature-card[data-step="1"] h4': { text: 'AI Plan Generation' },
    '#heroFeatures .feature-card[data-step="1"] p': {
      text: 'Match optimal export rebate and cross-border tax strategies from platform, HS code, destination, and more.',
    },
    '#heroFeatures .feature-card[data-step="2"] h4': { text: 'Tax Burden Calculator' },
    '#heroFeatures .feature-card[data-step="2"] p': {
      text: 'Automated domestic tax estimation covering corporate income tax and VAT / export rebate.',
    },
    '#heroFeatures .feature-card[data-step="3"] h4': { text: 'Online Ordering' },
    '#heroFeatures .feature-card[data-step="3"] p': {
      text: 'Transparent pricing, WeChat Pay checkout, and real-time service tracking.',
    },
    '#ai-solution .section-header h2': { text: 'AI Compliance Plan Generator' },
    '#ai-solution .section-header p': {
      text: 'Follow the flow into the Daoith AI assistant to generate your plan and matched services.',
    },
    '#aiSolutionJourney .process-card[data-step="1"] h4': {
      text: 'Daoith AI Compliance Assistant',
    },
    '#aiSolutionJourney .process-card[data-step="1"] .tag': {
      text: 'Limited-time free trial',
    },
    '#aiSolutionJourney .process-card[data-step="2"] h4': { text: 'Choose a service' },
    '#aiSolutionJourney .process-branch-row:nth-child(1) .process-branch-name': {
      text: 'Start guided diagnosis',
    },
    '#aiSolutionJourney .process-branch-row:nth-child(1) .tag': {
      text: 'Answer 7 questions prompted by the AI',
    },
    '#aiSolutionJourney .process-branch-row:nth-child(2) .process-branch-name': {
      text: 'Ask a specific question',
    },
    '#aiSolutionJourney .process-branch-row:nth-child(2) .tag': {
      text: 'Instant answers from the knowledge base',
    },
    '#aiSolutionJourney .process-card[data-step="3"] h4': {
      text: 'Generate your solution',
    },
    '#aiSolutionJourney .process-card[data-step="3"] .tag': {
      text: 'Ready in about 1–5 minutes',
    },
    '#aiSolutionJourney .process-card[data-step="4"] h4': {
      text: 'Exclusive services',
    },
    '#aiSolutionJourney .process-card[data-step="4"] .tag': {
      text: 'View AI-matched exclusive services',
    },
    '.ai-solution-guide .hub-scroll-hint span': {
      text: 'Click to try the AI solution',
    },
    '.ai-workspace > .hub-scroll-hint[data-ai-scroll="diagServiceRecs"] span': {
      text: 'Click to view exclusive services',
    },
    '.ai-workspace > .hub-scroll-hint[data-ai-scroll="taxCalcBlock"] span': {
      text: 'Click to try automated tax-burden calc',
    },
    '.diag-chat-title strong': { text: 'Daoith Compliance Assistant' },
    '#aiForm .form-required-hint': {
      text: 'Only “E-commerce platform” and “Shipping model” are required; leave the rest blank for a general plan first.',
    },
    '#aiForm .form-group:has(#platform) label': {
      html: true,
      text: 'E-commerce platform <span class="req-mark" aria-hidden="true">*</span>',
    },
    '#aiForm .form-group:has(#shipping) label': {
      html: true,
      text: 'Shipping model <span class="req-mark" aria-hidden="true">*</span>',
    },
    '#aiForm .form-group:has(#entity) label': {
      html: true,
      text: 'Store entity <span class="opt-mark">Optional</span>',
    },
    '#aiForm .form-group:has(#country) label': {
      html: true,
      text: 'Destination country/region <span class="opt-mark">Optional</span>',
    },
    '#aiForm .form-group:has(#hsCode) label': {
      html: true,
      text: 'HS Code <span class="opt-mark">Optional</span>',
    },
    '#aiForm .form-group:has(#revenue) label': {
      html: true,
      text: 'Annual revenue (CNY 10k) <span class="opt-mark">Optional</span>',
    },
    '#aiForm .form-group:has(#teamSize) label': {
      html: true,
      text: 'Team size <span class="opt-mark">Optional</span>',
    },
    '#aiForm .form-group:has(#invoice) label': {
      html: true,
      text: 'Supplier invoices <span class="opt-mark">Optional</span>',
    },
    '#aiForm .form-group:has(#exportMode) label': {
      html: true,
      text: 'Current export method <span class="opt-mark">Optional</span>',
    },
    '#aiForm .form-group:has(#notes) label': {
      html: true,
      text: 'Additional notes <span class="opt-mark">Optional</span>',
    },
    '#queryTax': { text: 'Query' },
    '.diag-hs-title': { text: 'Export rebate rate lookup' },
    '#hsCode': { placeholder: 'Enter 10-digit HS code' },
    '#refundRateBox': { placeholder: 'Rate' },
    '#hsHint': { text: 'Exact match on full HS; if fewer than 10 digits, try first 8.' },
    '.diag-quick-replies-label': { text: 'Choose an option below' },
    '#queryDuty': { text: 'Query destination duty rate' },
    '#refundRateBox': { placeholder: '—' },
    '#dutyRateBox': { placeholder: '—' },
    '.hs-hint': {
      text: 'Rebate rates refer to STA / GACC published schedules; destination duty refers to that country’s official customs tariff (select destination first).',
    },
    '#aiForm button[type="submit"]': { text: 'Generate AI Plan' },
    '#resultPlaceholder h4': { text: 'AI Plan Output' },
    '#resultPlaceholder p': {
      html: true,
      text: 'Fill in business details on the left,<br>then click "Generate AI Plan" for your custom plan.',
    },
    '.faq-panel h3': { text: 'FAQ' },
    '.tax-calc h3': { text: 'Compliance Tax Calculator' },
    '.tax-calc > p': {
      text: 'Estimate domestic corporate income tax and VAT / export rebate from your sales and cost ratios.',
    },
    '.tax-form-grid .form-group:has(#taxRevenue) label': {
      html: true,
      text: 'Annual export sales <span class="label-sub">(CNY 10k)</span>',
    },
    '.tax-form-grid .form-group:has(#taxRefund) label': { text: 'Export rebate rate (%)' },
    '.tax-form-grid .form-group:has(#taxRefundEligible) label': { text: 'Eligible for export rebate / exemption?' },
    '#taxRefundEligible option[value="yes"]': { text: 'Yes' },
    '#taxRefundEligible option[value="no"]': { text: 'No' },
    '.tax-form-grid .form-group:has(#taxIncome) label': { text: 'Applicable income tax rate (%)' },
    '.tax-form-grid .form-group:has(#taxProductCostRate) label': { text: 'Product cost ratio (%)' },
    '.tax-form-grid .form-group:has(#taxMarketingRate) label': {
      html: true,
      text: 'Marketing ratio (%) <span class="label-sub">(incl. platform fees)</span>',
    },
    '.tax-form-grid .form-group:has(#taxShippingRate) label': { text: 'Logistics ratio (%)' },
    '.tax-form-grid .form-group:has(#taxStaffRate) label': { text: 'Staff cost ratio (%)' },
    '.tax-form-grid .form-group:has(#taxOtherRate) label': { text: 'Other expense ratio (%)' },
    '.tax-form-grid .form-group:has(#taxSupplierInvoicePoint) label': {
      text: 'Supplier invoice VAT point (%)',
    },
    '.tax-form-note': {
      text: 'All ratios above refer to the share of annual costs/expenses in annual sales revenue. If eligible for rebate/exemption, export rebate is used; otherwise domestic VAT is used. Supplier invoice VAT point is the VAT rate on purchase invoices (e.g. 1%, 3%, 13%).',
    },
    '#calcTax': { text: 'Calculate tax burden' },
    '.tax-result-metric:nth-child(1) .tax-result-label': {
      text: 'Estimated annual compliance tax',
    },
    '.tax-result-metric:nth-child(2) .tax-result-label': { text: 'Tax burden rate' },
    '.tax-result-metric:nth-child(3) .tax-result-label': {
      text: 'Export rebate net benefit',
    },
    '.tax-actions .tax-cart-btn-text': { text: 'Expert 1-on-1' },
    '#services .section-header h2': { text: 'Tax & Compliance Marketplace' },
    '#services .section-header p': {
      text: 'Transparent pricing on all services; add to inquiry list for preferential quotes.',
    },
    '.filter-btn[data-filter="all"]': { text: 'All' },
    '.filter-btn[data-filter="consult"]': { text: 'Advisory' },
    '.filter-btn[data-filter="mainland"]': { text: 'Mainland China' },
    '.filter-btn[data-filter="hongkong"]': { text: 'Hong Kong' },
    '.filter-btn[data-filter="asia"]': { text: 'Asia' },
    '.filter-btn[data-filter="europe"]': { text: 'Europe' },
    '.filter-btn[data-filter="americas"]': { text: 'Americas' },
    '.filter-btn[data-filter="africa-oceania"]': { text: 'Africa & Oceania' },
    '#showMoreServices': { text: 'View all {n} services ↓' },
    '#hub .hub-hero h1': { text: 'Service Hub' },
    '#hub .hub-hero .hero-subtitle': {
      text: 'Manage inquiries, service orders, and delivery progress — with optional WeChat notifications.',
    },
    '#hubJourney [data-step="1"] h4': { text: 'Inquiries' },
    '#hubJourney [data-step="1"] .tag': { text: 'Submit an inquiry and pay' },
    '#hubJourney [data-step="2"] h4': { text: 'Service order management' },
    '#hubJourney [data-step="2"] .tag': { text: 'Look up orders after close-won' },
    '#hubJourney [data-step="3"] h4': { text: 'Service progress tracking' },
    '#hubJourney [data-step="3"] .tag': { text: 'Track delivery steps' },
    '#hub .hub-hero .stats > div:nth-child(1) .stat-label': { text: 'Clients served' },
    '#hub .hub-hero .stats > div:nth-child(2) .stat-label': { text: 'Satisfaction' },
    '#hub .hub-hero .stats > div:nth-child(3) .stat-label': { text: 'Cities covered' },
    '.hub-scroll-hint[data-hub-scroll="hub-inquiries"] span': { text: 'Click to view inquiries' },
    '.hub-scroll-hint[data-hub-scroll="hub-orders"] span': { text: 'Click to view service orders' },
    '.hub-scroll-hint[data-hub-scroll="hub-progress"] span': { text: 'Click to view service progress' },
    '.hub-notify-mini-label': { text: 'WeChat' },
    '#wechatBindTitle': { text: 'Bind WeChat notifications' },
    '#wechatBindLead': {
      text: 'Follow the Official Account first, then scan the bind QR to receive inquiry & service updates.',
    },
    '.wechat-bind-steps li:nth-child(1)': {
      text: 'Scan the left QR to follow 「道一跨境咨询DAOITH」',
    },
    '.wechat-bind-steps li:nth-child(2)': {
      text: 'Scan the right QR to authorize (or open the link in WeChat)',
    },
    '.wechat-bind-steps li:nth-child(3)': {
      text: 'Return here after authorizing — the switch will turn on',
    },
    '#wechatFollowQrLabel': { text: '① Follow OA' },
    '#wechatBindQrLabel': { text: '② Authorize' },
    '#wechatBindCopy': { text: 'Copy link' },
    '#wechatBindDone': { text: 'Done' },
    '#wechatBindHint': { text: 'Waiting for WeChat bind…' },
    '[data-hub-section="inquiries"] .hub-panel-head h4': { text: 'Inquiry management' },
    '[data-hub-section="orders"] .hub-panel-head h4': { text: 'Service orders' },
    '[data-hub-section="progress"] .hub-panel-head h4': { text: 'Service progress' },
    '#hubSlipTitle': { text: 'Upload payment slip' },
    '#hubSlipLead': { text: 'Upload the bank transfer slip and enter the payment time shown on it.' },
    'label[for="hubSlipFile"]': { text: 'Payment slip' },
    'label[for="hubSlipPaidAt"]': { text: 'Payment time on the slip' },
    '#hubSlipSubmit': { text: 'Upload' },
    '#hubSlipModal [data-close-hub-slip].btn': { text: 'Cancel' },
    '.feedback-form h4': { text: 'Submit feedback' },
    '.type-btn[data-type="complaint"]': { text: 'Complaint' },
    '.type-btn[data-type="suggestion"]': { text: 'Suggestion' },
    '.type-btn[data-type="praise"]': { text: 'Praise' },
    '.type-btn[data-type="inquiry"]': { text: 'Inquiry' },
    '#submitFeedback': { text: 'Submit' },
    '[data-hub-section="progress"] .empty-state h4': { text: 'No active services' },
    '[data-hub-section="progress"] .empty-state p': { text: 'Progress updates appear here after purchase.' },
    '#policy .section-header h2': { text: 'Policies & Tax Systems' },
    '#policy .section-header p': {
      text: 'Regional tax systems, authority rules, marketplace policies, and expert insights in one place.',
    },
    '#tax-systems .policy-block-header h3': { text: 'Regional Tax Systems' },
    '#tax-systems .policy-block-header p': {
      text: 'Key tax points for major trading partners.',
    },
    '#policy-expert .policy-block-header h3': { text: 'Expert Insights' },
    '#policy-expert .policy-block-header p': {
      text: 'Articles synced from our WeChat Official Account — tap to open the original post.',
    },
    '#policy-tax .policy-block-header h3': { text: 'Tax Authority Updates' },
    '#policy-tax .policy-block-header p': {
      text: 'Cross-border tax regulations published in the last six months — click through to official sources.',
    },
    '#policy-platform .policy-block-header h3': { text: 'Marketplace Policies' },
    '#policy-platform .policy-block-header p': {
      text: 'Latest tax and compliance policies from the top 10 cross-border marketplaces.',
    },
    '.policy-link-tag': { text: 'Official source' },
    '#loadMoreArticles': { text: 'Load more' },
    '#loadMoreTaxPolicies': { text: 'Load more' },
    '#loadMorePlatformPolicies': { text: 'Load more' },
    '#loadMoreTaxSystems': { text: 'Load more' },
    '#tax-systems .section-header h2': { text: 'Regional Tax Systems' },
    '.tax-systems-disclaimer': {
      html: true,
      text: 'Trade data: GACC Jan–Dec 2025. For reference only — see the <a href="https://www.chinatax.gov.cn/chinatax/n810219/n810744/index.html" target="_blank" rel="noopener noreferrer">official SAT guide portal</a> for full rules.',
    },
    '#about .section-header h2': { text: 'About Us' },
    '.about-intro': {
      text: 'Professional integrity and trusted guidance — helping SMEs move from compliance to excellence.',
    },
    '.values-grid .value-card:nth-child(1) h4': { text: 'Vision' },
    '.values-grid .value-card:nth-child(1) p': { text: 'A trusted navigator in tax intelligence' },
    '.values-grid .value-card:nth-child(2) h4': { text: 'Mission' },
    '.values-grid .value-card:nth-child(2) p': { text: 'Empowering SMEs through industry expertise' },
    '.values-grid .value-card:nth-child(3) h4': { text: 'Core values' },
    '.values-grid .value-card:nth-child(3) p': { text: 'Excellence, partnership, natural growth' },
    '.values-heading': { text: 'Our values in practice' },
    '.values-detail .value-detail-card:nth-child(1) h5': { text: 'Continuous excellence' },
    '.values-detail .value-detail-card:nth-child(2) h5': { text: 'Shared journey' },
    '.values-detail .value-detail-card:nth-child(3) h5': { text: 'Aligned success' },
    '.values-detail .value-detail-card:nth-child(1) p': {
      text: 'We keep learning and refining solutions so clients receive leading-edge, effective advice.',
    },
    '.values-detail .value-detail-card:nth-child(2) p': {
      text: 'Clients and partners are fellow travelers — we grow together through openness and mutual benefit.',
    },
    '.values-detail .value-detail-card:nth-child(3) p': {
      text: 'We respect market rules and professional ethics, creating value first — success follows naturally.',
    },
    '#team .section-header h2': { text: 'Founding Team' },
    '#team .section-header p': { text: 'Senior cross-border tax experts — 13+ years average experience.' },
    '.cta-section h2': { text: 'Professional tax services for your cross-border business' },
    '.cta-section p': {
      text: 'Try AI plan generation or contact our experts for one-on-one advisory.',
    },
    '.cta-actions .btn-primary': { text: 'Get started free' },
    '.cta-actions .btn-outline': { text: 'Contact experts' },
    '.footer-grid > div:nth-child(2) h4': { text: 'Features' },
    '.footer-grid > div:nth-child(3) h4': { text: 'Company' },
    '.footer-grid > div:nth-child(4) h4': { text: 'Contact' },
    '.footer-links a[href="#ai-solution"]': { text: 'AI solution generator' },
    '.footer-links a[href="#policy"]': { text: 'Industry policy & tax systems' },
    '.footer-links a[href="#services"]': { text: 'Tax service marketplace' },
    '.footer-links a[href="#hub"]': { text: 'Service tracking' },
    '.footer-links a[href="#about"]': { text: 'About' },
    '.footer-links a[href="#team"]': { text: 'Team' },
    '.footer-links a[href="mailto:service@daoith.com"]': { text: 'service@daoith.com' },
    '.footer-wechat-caption': { text: 'Follow our WeChat official account' },
    '.article-page .logo-text': { text: 'DAOITH Consulting' },
    '.article-page .nav a[href="/#hero"]': { text: 'Home' },
    '.article-page .nav a[href="/#policy-expert"]': { text: 'Insights' },
    '.article-page .nav a[href="/#policy"]': { text: 'Policies' },
    '.article-page .nav a[href="/#tax-systems"]': { text: 'Regional Tax' },
    '.article-page .nav a[href="/#services"]': { text: 'Services' },
    '.cart-page .nav a[href="/"]': { text: 'Home' },
    '.cart-page .nav a[href="/#services"]': { text: 'Services' },
    '.cart-page .nav a[href="/cart.html"]': { text: 'Cart' },
    '.cart-page .nav a[href="/#hub"]': { text: 'Service Hub' },
    '.service-page .nav a[href="/"]': { text: 'Home' },
    '.service-page .nav a[href="/#services"]': { text: 'Services' },
    '.article-page .header-inner > .btn-primary': { text: 'Free Plan' },
    '.footer-compact .footer-bottom a[href="/#policy-expert"]': { text: 'More insights' },
    '.footer-compact .footer-bottom a[href="/#tax-systems"]': { text: 'More regions' },
  },
  formOptions: {
    platform: {
      '': 'Select…',
      amazon: 'Amazon',
      walmart: 'Walmart',
      shopify: 'Shopify',
      ebay: 'eBay',
      aliexpress: 'AliExpress',
      temu: 'Temu',
      tiktok: 'TikTok Shop',
      mercadolibre: 'Mercado Libre',
      alibaba: 'Alibaba.com',
      other: 'Other',
    },
    entity: {
      '': 'Select…',
      cn: 'China company',
      cn_individual: 'China individual',
      hk: 'Hong Kong company',
      us: 'US company',
      uk: 'UK company',
      de: 'Germany company',
      nl: 'Netherlands company',
      mx: 'Mexico company',
      sg: 'Singapore company',
      ru: 'Russia company',
      br: 'Brazil company',
      jp: 'Japan company',
      vn: 'Vietnam company',
      in: 'India company',
      sa: 'Saudi Arabia company',
      other_overseas: 'Other overseas company',
    },
    country: {
      '': 'Select…',
      us: 'United States',
      uk: 'United Kingdom',
      de: 'Germany',
      fr: 'France',
      jp: 'Japan',
      ca: 'Canada',
      au: 'Australia',
      it: 'Italy',
      es: 'Spain',
      kr: 'South Korea',
      mx: 'Mexico',
      ru: 'Russia',
      sea: 'Southeast Asia',
      me: 'Middle East',
      other: 'Other',
    },
    revenue: {
      '': 'Select…',
      under500: 'Under CNY 5m',
      '500-2000': 'CNY 5–20m',
      '2000-5000': 'CNY 20–50m',
      '5000-10000': 'CNY 50–100m',
      above10000: 'Above CNY 100m',
    },
    teamSize: {
      '': 'Select…',
      under10: 'Under 10',
      '10-50': '10–50',
      '50-200': '50–200',
      above200: 'Above 200',
    },
    invoice: {
      '': 'Select…',
      special: 'VAT special invoice',
      general: 'VAT general invoice',
      none: 'No invoices available',
      mixed: 'Partial special + partial general',
      special_none: 'Partial special + partial no invoice',
      general_none: 'Partial general + partial no invoice',
    },
    shipping: {
      self_overseas: 'Self-fulfillment (overseas warehouse)',
      self_domestic: 'Self-fulfillment (ship from China)',
      platform_domestic: 'Platform domestic warehouse',
      platform_overseas: 'Platform overseas warehouse (e.g. FBA)',
    },
    exportMode: {
      '': 'Select…',
      trade_0110: '0110 General trade',
      market_1039: '1039 Market procurement export',
      cbec_9610: '9610 Cross-border retail export',
      cbec_9710: '9710 Cross-border B2B export',
      cbec_9810: '9810 Overseas warehouse export',
      bonded_1210: '1210 Bonded export',
      freight_forwarder: 'Export via freight forwarder',
      other: 'Other',
    },
  },
  faqs: [
    {
      q: 'Is the AI plan legally binding?',
      a: 'AI plans are for reference based on public policies and industry practice. Book expert 1-on-1 review (¥2,999/hr) for actionable advice tailored to your business.',
    },
    {
      q: 'How do I find an HS code?',
      a: 'Search product names on China Customs (customs.gov.cn). Enter the HS code here to query export rebate rates for tax estimation.',
    },
    {
      q: 'Does invoice-free exemption apply to all sellers?',
      a: 'No. It applies only to enterprises registered in cross-border e-commerce pilot zones with proper platform registration and tax filing.',
    },
    {
      q: 'Must I register for EU VAT?',
      a: 'Usually required when remote sales exceed €10,000 or goods are stored locally. Registration costs vary (e.g. UK £250–£400, Germany €300–€500).',
    },
    {
      q: 'Difference between 9810 and 9610?',
      a: '9810 is overseas warehouse (B2B2C); 9610 is direct small-parcel retail (B2C). Rebate procedures and documentation differ.',
    },
    {
      q: 'How is compliance tax calculated?',
      a: 'Use the tax calculator below with rebate rate, destination tax rate, and revenue for multi-tax estimation after generating a plan.',
    },
  ],
  services: [
    { title: 'Expert 1-on-1 advisory', desc: 'In-depth consulting on structure, compliance diagnosis, and rebate optimization.', detailBtn: 'Service details', cartBtn: 'Add to inquiry list', unit: '/ hour' },
    { title: 'Compliance coaching (annual)', desc: 'Year-round expert support across structure, accounting, rebates, and overseas tax.', detailBtn: 'Service details', cartBtn: 'Add to inquiry list', unit: '/ year' },
    { title: 'Cross-border tax diagnosis', desc: 'Full compliance assessment with remediation report and export rebate review.', detailBtn: 'Service details', cartBtn: 'Add to inquiry list', unit: '/ session' },
    { title: 'Bookkeeping & filing', desc: 'Bookkeeping, tax filing, and annual reconciliation for e-commerce businesses.', detailBtn: 'Service details', cartBtn: 'Add to inquiry list', unit: '/ month' },
    { title: 'Export rebate agency', desc: 'Full 9810/9610 rebate filing including documentation and authority liaison.', detailBtn: 'Service details', cartBtn: 'Add to inquiry list', unit: '/ case' },
    { title: 'Company setup & licenses', desc: 'Company registration, import/export rights, customs filing, and e-port setup.', detailBtn: 'Service details', cartBtn: 'Add to inquiry list', unit: ' from' },
    { title: 'EU VAT registration', desc: 'VAT registration and filing in UK, Germany, France, and other EU markets.', detailBtn: 'Service details', cartBtn: 'Add to inquiry list', unit: '/ country' },
    { title: 'US sales tax compliance', desc: 'State sales tax registration, filing, and economic nexus advisory.', detailBtn: 'Service details', cartBtn: 'Add to inquiry list', unit: '/ state' },
    { title: 'ODI filing agency', desc: 'End-to-end outbound investment filing (NDRC, commerce, SAFE).', detailBtn: 'Service details', cartBtn: 'Add to inquiry list', unit: ' from' },
    { title: 'Offshore company setup', desc: 'Incorporation and secretarial services in HK, Singapore, US, BVI, etc.', detailBtn: 'Service details', cartBtn: 'Add to inquiry list', unit: ' from' },
    { title: 'Transfer pricing documentation', desc: 'Local file, master file, and contemporaneous documentation for related-party transactions.', detailBtn: 'Service details', cartBtn: 'Add to inquiry list', unit: ' from' },
    { title: 'High-tech enterprise qualification', desc: 'Application support including R&D expense aggregation and IP planning.', detailBtn: 'Service details', cartBtn: 'Add to inquiry list', unit: ' from' },
  ],
  servicesCatalog: [
    {
      id: 'consult-1v1',
      title: 'Expert 1-on-1 advisory',
      desc: 'In-depth consulting on structure, compliance diagnosis, and rebate optimization.',
      unit: '/ hour',
      details: window.DAOITH_enServiceBlocks({
        content: 'One-on-one advisory covering platform choice, store entity, fulfillment model, invoicing chain, and export rebate pathways with actionable recommendations.',
        bullets: [
          'Business model and entity structure review',
          'Export rebate / overseas tax boundary assessment',
          'Priority risk list and action plan',
          'Session notes on request',
        ],
        pricing: 'From ¥2,999 / hour. Complex topics can be packaged by session. Government and third-party fees extra.',
        process: [
          'Share business background',
          'Book expert slot and confirm agenda',
          '1-on-1 consultation',
          'Notes and follow-up recommendations',
        ],
        timeline: 'First session usually within 1–3 business days after booking; notes within 2 business days.',
        faqs: [
          { q: 'What should I prepare?', a: 'Platform type, entity, fulfillment model, destination markets, HS codes, revenue range, and invoice status.' },
          { q: 'Is this a formal legal opinion?', a: 'Default is oral diagnosis plus notes. Formal written opinions can be scoped separately.' },
        ],
      }),
    },
    {
      id: 'consult-annual',
      title: 'Compliance coaching (annual)',
      desc: 'Year-round expert support across structure, accounting, rebates, and overseas tax.',
      unit: '/ year',
      details: window.DAOITH_enServiceBlocks({
        content: 'Annual coaching with quarterly reviews, policy updates, and support through key filings.',
        bullets: [
          'Annual compliance calendar',
          'Quarterly tax / operations reviews',
          'Policy change briefings',
          'Agreed expert sessions with notes',
        ],
        pricing: 'From ¥98,000 / year. Session counts and response levels follow the signed plan.',
        process: [
          'Discovery and scope confirmation',
          'Sign annual agreement and set up channel',
          'Publish compliance calendar',
          'Quarterly reviews and key-node support',
        ],
        timeline: 'Baseline diagnosis and calendar draft within 5–10 business days after signing.',
        faqs: [
          { q: 'Does coaching include bookkeeping?', a: 'Coaching is advisory. Bookkeeping or rebate agency can be added as separate services.' },
          { q: 'Can we expand mid-year?', a: 'Yes. Expanded scope is covered by a supplemental quote and agreement.' },
        ],
      }),
    },
    {
      id: 'consult-tp',
      title: 'Transfer pricing documentation',
      desc: 'Local file, master file, and contemporaneous documentation for related-party transactions.',
      unit: ' from',
      details: window.DAOITH_enServiceBlocks({
        content: 'Map related-party flows and prepare contemporaneous / local / master file documentation.',
        bullets: [
          'Related-party mapping and FAR analysis',
          'Pricing method recommendation',
          'Local / master / contemporaneous files',
          'Optional annual updates',
        ],
        pricing: 'From ¥50,000, varying by complexity and document tier.',
        process: [
          'Collect org chart and transaction data',
          'FAR analysis and method selection',
          'Draft and internal review',
          'Final delivery and walkthrough',
        ],
        timeline: 'Draft usually 15–30 business days after complete data.',
        faqs: [
          { q: 'Do small sellers need TP docs?', a: 'It depends on related-party volume and local thresholds. Start with an obligation check.' },
        ],
      }),
    },
    {
      id: 'domestic-diagnosis',
      title: 'Cross-border tax diagnosis',
      desc: 'Full compliance assessment with remediation report and export rebate review.',
      unit: '/ session',
      details: window.DAOITH_enServiceBlocks({
        content: 'Diagnose business model, documents, customs/rebate readiness, and entity structure; prioritize remediation actions.',
        bullets: [
          'Cash and operating flow mapping',
          'Export rebate compliance review',
          'Risk ranking and remediation roadmap',
          'One report walkthrough meeting',
        ],
        pricing: 'From ¥15,000 per engagement. Multi-entity or long history may add effort.',
        process: [
          'Questionnaire and document list',
          'Interviews and sample testing',
          'Issue diagnosis report',
          'Walkthrough and priority confirmation',
        ],
        timeline: 'Report usually within 10–20 business days after complete documents.',
        faqs: [
          { q: 'Is the diagnosis an official ruling?', a: 'No. It is professional advisory for internal remediation, not an authority decision.' },
        ],
      }),
    },
    {
      id: 'domestic-setup',
      title: 'Company setup & licenses',
      desc: 'Company registration, import/export rights, customs filing, and e-port setup.',
      unit: ' from',
      details: window.DAOITH_enServiceBlocks({
        content: 'Company formation and core cross-border licenses (import/export, customs, e-port).',
        bullets: [
          'Name check and company incorporation',
          'Bank account onboarding guidance',
          'Import/export, customs, and e-port filings',
          'Tax registration handoff notes',
        ],
        pricing: 'From ¥5,000. Government fees, chops, rush, and cross-city work are extra.',
        process: [
          'Confirm company type and business scope',
          'Prepare and submit formation packs',
          'Complete AIC / tax registrations',
          'Complete import/export and customs licenses',
        ],
        timeline: 'Formation often 5–15 business days; with trade licenses commonly 10–25 business days.',
        faqs: [
          { q: 'Can an individual hold import/export rights?', a: 'Usually rights sit with a company entity. Personal and company models differ—plan the entity first.' },
        ],
      }),
    },
    {
      id: 'domestic-bookkeeping',
      title: 'Bookkeeping & filing',
      desc: 'Bookkeeping, tax filing, and annual reconciliation for e-commerce businesses.',
      unit: '/ month',
      details: window.DAOITH_enServiceBlocks({
        content: 'Monthly bookkeeping and tax filings tailored to marketplace settlements and multi-currency flows.',
        bullets: [
          'Voucher processing and books',
          'VAT and surtax filings',
          'CIT prepaid and annual finalization support',
          'Marketplace settlement and FX guidance',
        ],
        pricing: 'From ¥800 / month, varying with volume and complexity. Annual CIT finalization may be billed yearly.',
        process: [
          'Contract and opening-balance handover',
          'Monthly document collection and posting',
          'Pre-filing review and confirmation',
          'File returns and share tax forms',
        ],
        timeline: 'Monthly close before filing deadlines; first setup often 5–15 business days.',
        faqs: [
          { q: 'Can we book purchases without invoices?', a: 'Yes, but it affects input VAT and rebate trails. We flag risks and recommend fixes.' },
        ],
      }),
    },
    {
      id: 'domestic-compliance-bookkeeping',
      title: 'Fully managed compliance bookkeeping',
      desc: 'Digital full-service bookkeeping with risk screening, filings, management reporting, and optional export-rebate coordination.',
      unit: '/ year from',
      details: [
        { type: 'h2', text: 'Service content' },
        {
          type: 'table',
          variant: 'compare',
          firstColHeader: true,
          headers: ['Item', 'Fully managed compliance bookkeeping', 'Traditional bookkeeping', 'Highlights'],
          rows: [
            [
              'Service team',
              [
                { mark: 'ok', text: '5+ years tax & finance experience' },
                { mark: 'ok', text: 'Relatively stable staffing' },
                { mark: 'ok', text: 'Junior accountant qualification or above' },
                { mark: 'ok', text: 'Expert team oversight' },
              ],
              [
                { mark: 'ok', text: 'Often fresh graduates or low experience' },
                { mark: 'no', text: 'Low-price staffing lacks depth; mechanical work only' },
              ],
              [
                '1) Higher professional capability',
                '2) Earlier risk detection',
                '3) Ability to handle complex tax issues',
              ],
            ],
            [
              'Real-business discovery',
              [
                { mark: 'ok', text: 'Understand the business model' },
                { mark: 'ok', text: 'Analyze revenue, cost and expense structure' },
                { mark: 'ok', text: 'Map four flows: cash, operations, documents, goods' },
                { mark: 'ok', text: 'Map departments and key personnel' },
              ],
              [
                { mark: 'ok', text: 'Collect invoices and bank statements only' },
                { mark: 'no', text: 'Little grasp of real operations; hidden risks remain' },
              ],
              [
                '1) From fragmented inputs to a full operating picture',
                '2) Tax work grounded in business reality for legality and control',
              ],
            ],
            [
              'Tax & finance risk screen',
              [
                { mark: 'ok', text: 'Health-check report based on documents and interviews' },
                { mark: 'ok', text: 'Tax-burden reasonableness (VAT, CIT, stamp duty, IIT, etc.)' },
                { mark: 'ok', text: 'Core supplier risk (status, share, penalties)' },
                { mark: 'ok', text: 'Invoice risk analysis' },
                { mark: 'ok', text: 'Financial ratio and efficiency review' },
                { mark: 'ok', text: 'Clear historical issues (e.g. long-term shareholder loans)' },
              ],
              [
                { mark: 'ok', text: 'Simple answers to ad-hoc questions' },
                { mark: 'no', text: 'No periodic review or early-warning mechanism' },
                { mark: 'no', text: 'No expert loop for compliance issues' },
                { mark: 'no', text: 'Risks stay in a black box until an audit' },
              ],
              [
                'Scan taxes, suppliers, invoices and financials; warn early and propose fixes',
              ],
            ],
            [
              'Data handover & setup',
              [
                { text: 'Confirm internal processes and accounting methods' },
                { mark: 'ok', text: 'Process-management recommendations' },
                { mark: 'ok', text: 'Document collection and handover' },
                { mark: 'ok', text: 'Opening-balance confirmation' },
                { mark: 'ok', text: 'Historical books remediation' },
              ],
              [
                { mark: 'ok', text: 'Simple file handover and data check' },
                { mark: 'no', text: 'Little process advice or historical remediation guidance' },
              ],
              [
                'Process-based finance advice with authentic, traceable records',
              ],
            ],
            [
              'Bookkeeping',
              [
                { mark: 'ok', text: 'Reconcile real online/offline transaction data' },
                { mark: 'ok', text: 'Reconcile real cash flows (bank, third-party, personal)' },
                { mark: 'ok', text: 'Invoice pack review and non-compliance analysis' },
                { mark: 'ok', text: 'Track income/expense without invoices' },
                { mark: 'ok', text: 'Apply laws, GAAP and industry norms for recognition methods' },
              ],
              [
                { mark: 'ok', text: 'Mechanical booking from bank statements and invoices' },
                { mark: 'no', text: 'Ignores real operations; books lack decision value' },
                { mark: 'no', text: 'Ignores non-invoice items; data distorts under audit' },
                { mark: 'no', text: 'Non-standard methods are hard to defend if reviewed' },
              ],
              [
                '1) Full-view books that stand up to inspection',
                '2) Reflect true operations so owners can adjust early',
              ],
            ],
            [
              'Tax filing',
              [
                { mark: 'ok', text: 'Routine filings: taxes, social security, annual CIT, AIC report' },
                { mark: 'ok', text: 'Tax-burden reasonableness by tax type' },
                { mark: 'ok', text: 'Compliant planning with pre-filing review and adjustments' },
              ],
              [
                { mark: 'ok', text: 'Routine tax filing only' },
                { mark: 'no', text: 'No tax-burden reasonableness analysis' },
                { mark: 'no', text: 'No planning depth or capability' },
              ],
              [
                '1) Compliance based on real books',
                '2) Lawful tax-cost optimization',
                '3) Peace of mind under inspection',
              ],
            ],
            [
              'Annual tax & finance review',
              [
                { mark: 'ok', text: 'Management analysis of profitability and balance-sheet efficiency' },
                { mark: 'ok', text: 'Timely tax-issue alerts and compliance/burden trade-offs' },
              ],
              [
                { mark: 'no', text: 'No financial analysis' },
                { mark: 'no', text: 'No timely tax alerts' },
              ],
              [
                '1) Data support for operating decisions',
                '2) Adjust promptly with regulatory trends',
              ],
            ],
            [
              'Audit-ready documentation',
              [
                { text: 'Prepare inspection packs for four-flow consistency and business authenticity' },
                { mark: 'ok', text: 'Guidance on books, contracts, invoices and supporting docs' },
                { mark: 'ok', text: 'Sample review of four-flow evidence' },
                { mark: 'ok', text: 'Support during tax inquiries and disputes' },
              ],
              [
                { mark: 'ok', text: 'Keep only basic books and filings' },
                { mark: 'no', text: 'No authenticity evidence chain' },
                { mark: 'no', text: 'Little professional defense support in inspections' },
              ],
              [
                '1) Ready documentation for easier inspections',
                '2) Expert protection of lawful rights in disputes',
              ],
            ],
          ],
        },
        { type: 'h2', text: 'Pricing' },
        {
          type: 'p',
          text: 'Annual fee by annual sales tiers (every RMB 5 million). Without export rebate: 0.1% of sales, capped at ¥30,000. With export rebate: 0.2% of sales, capped at ¥60,000.',
        },
        {
          type: 'table',
          variant: 'pricing',
          firstColHeader: true,
          headers: ['Annual sales', 'Without export rebate (0.1%)', 'With export rebate (0.2%)'],
          rows: [
            ['Up to RMB 5m', '¥5,000', '¥10,000'],
            ['RMB 5–10m', '¥10,000', '¥20,000'],
            ['RMB 10–15m', '¥15,000', '¥30,000'],
            ['RMB 15–20m', '¥20,000', '¥40,000'],
            ['RMB 20–25m', '¥25,000', '¥50,000'],
            ['RMB 25–30m', '¥30,000', '¥60,000'],
            ['Above RMB 30m', '¥30,000 (cap)', '¥60,000 (cap)'],
          ],
        },
        {
          type: 'p',
          text: 'Excludes government fees, tax-control devices, third-party audits, and rush window charges. Multi-entity or historical rebuild may be scoped separately.',
        },
        { type: 'h2', text: 'Process' },
        {
          type: 'timeline',
          steps: [
            { title: 'Understand the business', time: '1 week after payment' },
            { title: 'Tax & finance risk screen', time: 'Before start or mid-year' },
            { title: 'Data handover & setup', time: 'Within 1 month after payment' },
            { title: 'Bookkeeping', time: 'Monthly' },
            { title: 'Tax filing', time: 'Monthly / quarter-end' },
            { title: 'Finance analysis', time: 'Quarterly' },
            { title: 'Annual health-check report', time: 'Once a year' },
            { title: 'Audit-ready archive check', time: 'Annually' },
          ],
        },
        {
          type: 'table',
          variant: 'deliver',
          firstColHeader: true,
          headers: ['Workstream', 'Timing', 'Deliverables'],
          rows: [
            ['1. Business discovery', '1 week after payment', 'Interview outline & research report; process map'],
            ['2. Risk screening', 'Before start or mid-year', 'Legacy risk assessment; remediation plan'],
            ['3. Handover & setup', 'Within 1 month', 'Handover checklist; initialization confirmation'],
            ['4. Compliance bookkeeping', 'Monthly', 'Vouchers, ledgers, monthly financial statements'],
            ['5. Tax filings', 'Monthly / quarter-end', 'Tax returns; payment / clearance evidence'],
            ['6. Analysis & review', 'Quarterly', 'Management accounting report; anomaly alerts'],
            ['7. Annual health check', 'Once a year', 'CIT finalization report; annual compliance assessment'],
            ['8. Archive readiness', 'Annually', 'Full electronic/paper archive pack; audit support file'],
          ],
        },
        { type: 'h2', text: 'FAQ' },
        {
          type: 'faq',
          items: [
            {
              q: 'How is this different from traditional bookkeeping?',
              a: 'Traditional bookkeeping focuses on filing. This managed service adds digital capture, finer profitability views, proactive risk alerts, management reviews, and optional export-rebate coordination.',
            },
            {
              q: 'We already have a bookkeeping firm—can we switch?',
              a: 'Yes. After contracting we run handover, opening-balance checks, and a risk screen, then transition monthly books and filings. Historical rebuilds can be scoped separately.',
            },
            {
              q: 'Should we choose the package with export rebate?',
              a: 'Choose “with export rebate” if you need rebate filing coordination and document tracking. Choose “without” if you mainly need compliance bookkeeping, filings, and analysis.',
            },
            {
              q: 'Does the fee include government charges or tax-control devices?',
              a: 'No. The fee covers agreed bookkeeping, filing, and analysis deliverables. Government fees, devices, audits, and rush services are billed separately.',
            },
          ],
        },
      ],
    },
    {
      id: 'domestic-rebate-1210-9610',
      title: '1210/9610 first-claim rebate coaching',
      desc: 'Hands-on coaching for the first 1210 bonded / 9610 retail-export rebate claim: eligibility, documents, filing, and tax-bureau follow-up.',
      unit: '/ case',
      details: window.DAOITH_enServiceBlocks({
        content: 'Guide sellers through the first 1210 or 9610 export rebate (or exemption) cycle—from customs/list documents and input VAT invoices to filing and bureau responses.',
        bullets: [
          'Eligibility and customs-model fit (1210 / 9610)',
          'First-claim document pack coaching',
          'Filing submission support',
          'Tax-bureau supplement / interview support',
          'Post-claim playbook for later batches',
        ],
        pricing: 'Fixed ¥5,000 per first-claim coaching engagement. Rebate amounts, customs brokerage, logistics, and government fees are excluded.',
        process: [
          'Discovery and path confirmation',
          'Document checklist and gap closing',
          'First-claim filing',
          'Bureau response and close-out review',
        ],
        timeline: 'Kick-off usually within 3–5 business days after payment; filing often 5–10 business days after documents are complete.',
        faqs: [
          {
            q: '1210 vs 9610—which should I choose?',
            a: 'Stockable, non-custom SKUs often fit 1210 bonded fulfillment; order-driven or custom goods more often use 9610 / same-day bonded routes. Final choice depends on clearance capacity and local tax practice.',
          },
        ],
      }),
    },
    {
      id: 'domestic-rebate-9810',
      title: '9810 first-claim rebate coaching',
      desc: 'Hands-on coaching for the first 9810 overseas-warehouse rebate claim, including sales/FX evidence and bureau liaison.',
      unit: '/ case',
      details: window.DAOITH_enServiceBlocks({
        content: 'Help 9810 overseas-warehouse exporters align customs title, warehouse movements, overseas sales evidence, and FX proof for a first successful rebate filing.',
        bullets: [
          '9810 feasibility assessment',
          'Title, warehouse, and sales-flow mapping',
          'Sales / FX evidence coaching',
          'First-claim filing and bureau follow-up',
        ],
        pricing: 'Fixed ¥5,000 per first-claim coaching engagement. Third-party warehouse, freight, and government fees are excluded.',
        process: [
          'Model and local-practice discovery',
          'Evidence pack completion',
          'First-claim filing',
          'Supplements and close-out review',
        ],
        timeline: 'Kick-off usually within 3–5 business days; filing often 5–15 business days after documents are complete.',
        faqs: [
          {
            q: 'Is a 9810 rebate guaranteed?',
            a: 'No. Local evidence expectations vary. We prepare materials carefully but outcomes follow the tax authority. Where uncertainty is high, we may recommend a more stable 0110 + Hong Kong structure.',
          },
        ],
      }),
    },
    {
      id: 'domestic-1039-sole',
      title: '1039 market-procurement sole-proprietor package',
      desc: 'One-stop 1039 sole-proprietor setup: registration, assessed-collection application, bookkeeping, and tax filing.',
      unit: ' from',
      details: window.DAOITH_enServiceBlocks({
        content: 'For sellers using 1039 market procurement via a sole proprietorship: formation, assessed-collection filing, and first-year basic bookkeeping/tax returns.',
        bullets: [
          '1039 suitability check',
          'Sole-proprietor formation (typical market hubs)',
          'Assessed-collection application support',
          'First-year basic bookkeeping and filings',
        ],
        pricing: '¥5,000 package including formation, assessed-collection application, and first-year basic books/filings. Government fees, banking, rush services, and Hong Kong architecture are extra.',
        process: [
          'Suitability and location advice',
          'Sole-proprietor registration',
          'Assessed-collection application',
          'Books and periodic filings',
        ],
        timeline: 'Formation often 5–15 business days after documents are ready; assessed collection follows local timelines.',
        faqs: [
          {
            q: 'Does this include customs brokerage?',
            a: 'No. This package focuses on the entity, assessed collection, and books/tax. Customs and freight can be arranged separately.',
          },
        ],
      }),
    },
    {
      id: 'domestic-arch-0110-hk',
      title: '0110 export + Hong Kong fully managed architecture',
      desc: 'Fully managed 0110 general-trade + Hong Kong hub: design, PRC/HK incorporation, books, filings, and tax-inspection support.',
      unit: '/ year from',
      details: window.DAOITH_enServiceBlocks({
        content: 'Implement supplier → PRC exporter → Hong Kong company → store entity → overseas buyers under 0110, with incorporation, books/filings, and inspection readiness in one managed package.',
        bullets: [
          'Architecture design and four-flow alignment',
          'PRC and Hong Kong company formation',
          'Books, filings, and rebate coordination (as scoped)',
          'Documentation readiness and inspection support',
        ],
        pricing: '¥15,000–¥38,000 per year by sales band. Government fees, HK audit/secretary fees, and banking charges are separate.',
        process: [
          'Discovery and architecture plan',
          'PRC / Hong Kong formation',
          'Books and tax initialization',
          'Ongoing managed compliance',
          'Inspection support as needed',
        ],
        timeline: 'Architecture plan in 1–2 weeks after payment; formation often 2–6 weeks depending on location.',
        faqs: [
          {
            q: 'Why route through Hong Kong?',
            a: 'Exporting under 0110 to an overseas buyer (HKCo) helps align customs title with rebate eligibility before overseas resale. Transfer-pricing reasonableness still matters.',
          },
        ],
      }),
    },
    {
      id: 'domestic-arch-1039-hk',
      title: '1039 export + Hong Kong fully managed architecture',
      desc: 'Fully managed 1039 market procurement + Hong Kong hub: design, sole-proprietor & HK formation, books, filings, and inspection support.',
      unit: '/ year from',
      details: window.DAOITH_enServiceBlocks({
        content: 'Implement supplier → sole proprietor → Hong Kong company → store entity under 1039, with formation, assessed collection, books/filings, and inspection support.',
        bullets: [
          '1039 suitability and quota planning',
          'Sole-proprietor and Hong Kong formation',
          'Books and filings under assessed collection',
          'Inspection documentation support',
        ],
        pricing: '¥15,000–¥38,000 per year by sales band. Government fees, HK statutory fees, and extra sole proprietors are separate.',
        process: [
          'Suitability and architecture plan',
          'Sole-proprietor + Hong Kong formation',
          'Assessed collection and books setup',
          'Ongoing managed compliance',
          'Inspection support as needed',
        ],
        timeline: 'Plan in 1–2 weeks after payment; formation often 2–6 weeks.',
        faqs: [
          {
            q: '0110+HK vs 1039+HK—how to choose?',
            a: 'Prefer 1039+HK when special VAT invoices are hard to obtain and goods/quotas fit market procurement; prefer 0110+HK when invoices support formal rebate. Final choice depends on SKU, volume, and local practice.',
          },
        ],
      }),
    },
    {
      id: 'domestic-rebate',
      title: 'Export rebate agency',
      desc: 'Full 9810/9610 rebate filing including documentation and authority liaison.',
      unit: '/ case',
      details: window.DAOITH_enServiceBlocks({
        content: 'Prepare rebate packs, file claims, and support responses to tax authority queries.',
        bullets: [
          'Eligibility and model assessment',
          'Document completeness check',
          'Rebate filing agency',
          'Supplement and authority liaison',
        ],
        pricing: 'From ¥3,000 per case, or by batch / rebate amount. Complex cases scoped separately.',
        process: [
          'Assess rebate conditions and customs model',
          'Collect and verify documents',
          'Submit filing and track progress',
          'Support supplements through completion',
        ],
        timeline: 'Filing submission often 5–15 business days after documents are complete; authority review is separate.',
        faqs: [
          { q: 'Can we claim without import/export rights?', a: 'Usually you need the right export qualifications and documents. Start with an eligibility check.' },
        ],
      }),
    },
    {
      id: 'domestic-hte',
      title: 'High-tech enterprise qualification',
      desc: 'Application support including R&D expense aggregation and IP planning.',
      unit: ' from',
      details: window.DAOITH_enServiceBlocks({
        content: 'Application coaching for high-tech enterprise qualification, including R&D expense and IP readiness.',
        process: [
          'Eligibility gap analysis',
          'R&D expense and materials prep',
          'Filing coaching and form review',
          'Result follow-up and maintenance advice',
        ],
        timeline: 'Coaching usually 1–3 months; official review is separate.',
        pricing: 'From ¥20,000. IP agency and audit fees are extra; approval is by authorities.',
        faqs: [
          { q: 'Can cross-border e-commerce firms apply?', a: 'If R&D activity and IP meet criteria, we can assess feasibility without industry labels.' },
        ],
      }),
    },
    {
      id: 'domestic-offshore-vat-exemption',
      title: 'Offshore service VAT exemption filing',
      desc: 'Contract review, commerce-department contract filing, and tax-bureau VAT exemption filing for offshore outsourcing.',
      unit: '/ case',
      details: window.DAOITH_enServiceBlocks({
        content:
          'For firms providing ITO/BPO/KPO offshore outsourcing to overseas clients: contract compliance review, commerce-authority contract registration, and tax-bureau cross-border VAT exemption filing so eligible offshore service revenue can be reported as VAT-exempt.',
        bullets: [
          'Eligibility and contract-fit assessment',
          'Contract review and clause hardening',
          'Commerce outsourcing-system registration and confirmation materials',
          'Tax-bureau VAT exemption filing pack and submission coaching',
          'Post-filing reporting notes (separate accounting; no special VAT invoices on exempt items)',
        ],
        pricing:
          '¥2,500 per case (typically one contract batch through commerce + tax filing). Extra contracts, translation/notarization, or rush handling scoped separately. Outcomes depend on authorities.',
        process: [
          'Collect contracts and overseas-buyer materials; assess eligibility',
          'Review / strengthen contract elements into a filing-ready pack',
          'Complete commerce-system contract registration and obtain confirmation',
          'Prepare exemption forms and file with the competent tax bureau',
          'Hand over acknowledgements and ongoing filing notes',
        ],
        timeline:
          'Often 1–3 weeks on the advisory side after documents are ready; commerce review and tax acceptance vary by locality.',
        faqs: [
          {
            q: 'Is commerce filing required before tax exemption?',
            a: 'For offshore outsourcing, practice usually requires commerce-system registration (e.g. contract information sheet) before tax-bureau exemption filing. Local checklists may differ.',
          },
          {
            q: 'Does filing alone make revenue VAT-exempt?',
            a: 'Filing is a prerequisite. You must still separately account for exempt sales, report correctly, and avoid issuing special VAT invoices on exempt items. Material contract changes usually need re-registration / notice.',
          },
        ],
      }),
    },
    {
      id: 'domestic-atsi',
      title: 'Advanced technology service enterprise application',
      desc: 'End-to-end ATSI qualification coaching: eligibility, dossier, filing follow-up, and CIT preference handover.',
      unit: '/ case',
      details: window.DAOITH_enServiceBlocks({
        content:
          'Coach applications for Advanced Technology Service Enterprise (ATSI) status. Qualified firms may enjoy 15% CIT and enhanced staff-training deduction rules. Covers eligibility gaps, MOFCOM outsourcing data filing, science/tech platform submission, multi-agency review support, and post-approval tax-bureau preference handover.',
        bullets: [
          'Eligibility gap analysis (scope, staff mix, ATSI revenue share, offshore share)',
          'Revenue / headcount evidence checklist',
          'MOFCOM service-outsourcing system information and data filing support',
          'National ATSI platform registration and dossier assembly',
          'Support for provincial science/commerce/finance/tax/NDRC review supplements',
          'Post-approval CIT preference handover with the tax bureau',
        ],
        pricing:
          '¥50,000 per case. Special audits, translation/notarization, or rush/re-application scoped separately. Approval is by provincial authorities; not guaranteed.',
        process: [
          'Eligibility pre-check against national ATSI rules',
          'Coach MOFCOM outsourcing-system enterprise data filing',
          'Register and submit on the ATSI / local government platform',
          'Track form review, expert review, publicity, and national filing',
          'After approval, coach tax-bureau CIT preference procedures',
        ],
        timeline:
          'Advisory work often 1–3 months; official collection and review windows follow provincial annual notices and may span quarters.',
        faqs: [
          {
            q: 'What are the core ATSI conditions?',
            a: 'Typically: in-scope advanced technology services; ≥50% staff with college+ education; ≥50% revenue from ATSI services; ≥35% revenue from offshore outsourcing. Follow local annual rules.',
          },
          {
            q: 'Who decides? What does the tax bureau do?',
            a: 'Provincial science authorities jointly review with commerce, finance, tax, and NDRC. The tax bureau mainly administers CIT preferences after recognition and supervises ongoing eligibility.',
          },
        ],
      }),
    },
    {
      id: 'overseas-odi',
      title: 'ODI filing agency',
      desc: 'End-to-end outbound investment filing (NDRC, commerce, SAFE).',
      unit: ' from',
      details: window.DAOITH_enServiceBlocks({
        content: 'Prepare ODI materials and coordinate NDRC, commerce, and SAFE process steps.',
        bullets: [
          'Investment structure and path advice',
          'Document preparation and form review',
          'Authority process management',
          'Handoff notes for overseas setup / banking',
        ],
        pricing: 'From ¥30,000, varying by structure and approval complexity.',
        process: [
          'Confirm destination and shareholding',
          'Prepare filing / approval packs',
          'Submit and track each authority',
          'Hand over closing document pack',
        ],
        timeline: 'Commonly 4–12 weeks after materials are ready.',
        faqs: [
          { q: 'Is ODI always required?', a: 'Direct outbound investment by China entities usually needs the relevant filings. Path design should come first.' },
        ],
      }),
    },
    {
      id: 'overseas-vat',
      title: 'EU VAT registration',
      desc: 'VAT registration and filing in UK, Germany, France, and other EU markets.',
      unit: '/ country',
      details: window.DAOITH_enServiceBlocks({
        content: 'VAT registration support and filing cycle setup, clarifying platform withholding vs seller duties.',
        bullets: [
          'Registration obligation assessment',
          'VAT number application coaching',
          'Monthly / quarterly filing support',
          'IOSS / platform withholding boundary notes',
        ],
        pricing: 'From ¥3,500 per country. Ongoing filing can be annualized. Translation and authority fees extra.',
        process: [
          'Confirm sales countries and warehousing',
          'Prepare registration packs',
          'Submit and obtain VAT number',
          'Set filing cadence and archives',
        ],
        timeline: 'Numbers often take 2–8 weeks after complete materials, depending on country.',
        faqs: [
          { q: 'If we only use FBA, do we still need VAT?', a: 'Often yes, or you must track transactions not covered by platform withholding. Build a per-country checklist.' },
        ],
      }),
    },
    {
      id: 'overseas-us-sales-tax',
      title: 'US sales tax compliance',
      desc: 'State sales tax registration, filing, and economic nexus advisory.',
      unit: '/ state',
      details: window.DAOITH_enServiceBlocks({
        content: 'Nexus assessment, state registration, and filing arrangements.',
        process: [
          'Nexus and marketplace collection review',
          'Prepare state registration packs',
          'Complete registration and filing frequency',
          'First filing coaching and archives',
        ],
        timeline: 'Assessment 3–7 business days; single-state registration often 1–4 weeks.',
        pricing: 'From ¥5,000 per state; multi-state packages available.',
        faqs: [
          { q: 'Amazon already collects—do we still register?', a: 'Many states cover marketplace orders, but DTC, B2B, or uncovered sales may still require action.' },
        ],
      }),
    },
  ],
  taxPolicies: [
    { title: '2026 No.11: Export VAT and consumption tax policy', summary: 'Clarifies rebate/exemption conditions for exports. E-commerce firms should verify HS codes, documents, and filing models.' },
    { title: 'EU ViDA 2026 implementation work programme', summary: '2026 focus on e-invoice interoperability and platform VAT data exchange. Prepare ERP integrations early.' },
    { title: '2025 No.15: Platform tax information reporting', summary: 'Platforms must report quarterly transaction and revenue data to tax authorities from July 2025, including offshore platforms serving China.' },
    { title: '2025 No.3: Overseas warehouse "rebate upon departure"', summary: '9810 goods may claim rebates after customs departure and sales completion; provisional rebate available before sales finalize.' },
    { title: 'HMRC: Marketplace VAT rules for UK sales', summary: 'Platforms often act as deemed suppliers and withhold UK VAT. Sellers must verify platform calculations.' },
    { title: 'EU ViDA: VAT digital reform (2025–2035)', summary: 'EU package strengthens platform withholding, digital reporting, and e-invoicing. Monitor OSS/IOSS obligations.' },
    { title: 'IRD: Profit source and cross-border business', summary: 'Hong Kong taxes only Hong Kong-sourced profits. E-commerce firms should assess transaction flows and decision locus.' },
    { title: 'IRS: Marketplace facilitator legislation overview', summary: 'Most US states require platforms to collect sales tax. Sellers should verify state registration obligations.' },
    { title: 'California CDTFA: Marketplace facilitator rules', summary: 'Platforms with nexus must collect California sales/use tax. Retain transaction records for audit.' },
    { title: 'EU OSS: One-stop B2C VAT filing', summary: 'Remote B2C sales above €10,000 threshold must be declared via OSS across EU member states.' },
  ],
  platformPolicies: [
    { title: 'Amazon: US state sales tax collection', summary: 'Amazon collects tax in nexus states. Review Tax Collection reports and exemption certificates.' },
    { title: 'Walmart: State sales tax collection', summary: 'Walmart Marketplace collects tax where applicable. Maintain tax settings and download reports for reconciliation.' },
    { title: 'eBay: Seller tax information and collection', summary: 'eBay withholds sales tax/VAT in applicable markets. Complete tax registration and understand collection scope.' },
    { title: 'Shopify: Tax settings and automatic calculation', summary: 'Shopify calculates sales tax/VAT by destination. Configure registration locations, rates, and digital product rules.' },
    { title: 'AliExpress: Seller onboarding and compliance', summary: 'AliExpress requires compliance with platform rules, tax obligations, and export filing requirements.' },
    { title: 'TikTok Shop: US sales tax collection', summary: 'TikTok Shop withholds sales tax in nexus states. Complete tax registration and monitor platform notices.' },
    { title: 'Temu: Seller policy and compliance', summary: 'Temu sellers must follow platform product, logistics, and tax policies across fulfillment models.' },
    { title: 'Shopee: Cross-border seller tax guidance', summary: 'Shopee requires compliance with destination market tax rules. Platform may withhold in some markets.' },
    { title: 'Lazada: Tax invoice and collection policy', summary: 'Lazada applies platform collection and invoice rules across Southeast Asian markets.' },
    { title: 'Etsy: Seller tax policy', summary: 'Etsy withholds sales tax where applicable. Configure tax information and retain transaction records.' },
  ],
  team: [
    {
      title: 'Senior Tax Expert, DAOITH',
      edu: 'BA Sun Yat-sen University, CPA (China)',
      bullets: [
        '13+ years in tax; former Deloitte Shanghai Tax Manager, Fosun Group Head of Tax, and tax lead at a multinational internet unicorn. Experienced in tax planning and in-house tax management for cross-border e-commerce, large multinationals, and listed companies.',
      ],
    },
    {
      title: 'Founder, DAOITH Consulting',
      edu: 'BA Fudan University, CTA, CMA (US)',
      bullets: [
        '15+ years in cross-border e-commerce and tax. Held roles at Deloitte China, a listed cross-border group, and Alibaba.com. Hands-on experience in customs, tax, and foreign-exchange administration in cross-border trade.',
      ],
    },
    {
      title: 'Operations & Service Director, DAOITH',
      edu: 'Extensive cross-border tax and operations experience',
      bullets: [
        '15+ years in tax; former Alibaba.com tax expert and tax lead at a major cross-border e-commerce company. Hands-on experience in export rebates, tax-risk management, and building corporate finance systems.',
      ],
    },
  ],
  articleTexts: {
    'odi-architecture': {
      title: 'ODI in the era of transparent offshore structures',
      excerpt: 'ODI filing is a legal obligation. This article explains the process, risks of non-compliance, and compliant profit repatriation alternatives.',
    },
    'cit-rate-part2': {
      title: 'Unified cross-border e-commerce CIT rates: 2% and 4% (Part 2)',
      excerpt: '2026 compliance planning: supplier invoicing, export-rebate supply chains, and profit repatriation loops.',
    },
    'cit-rate-part1': {
      title: 'Unified cross-border e-commerce CIT rates: 2% and 4% (Part 1)',
      excerpt: '2025 CIT treatment trends and whether the "Saiwei model" still applies — local authority practice explained.',
    },
    'shop-type-comparison': {
      title: 'Natural person vs. sole prop vs. company store — which to choose?',
      excerpt: 'Legal, VAT, and income tax differences across entity types by revenue band.',
    },
    'natural-person-tax': {
      title: 'How do natural-person stores pay tax?',
      excerpt: 'Multi-platform income aggregation, deductions, temporary tax registration, and VAT exemption thresholds.',
    },
    '9610-export': {
      title: '9610 express export — the compliant small-parcel solution?',
      excerpt: 'Why 9610 is optimal in theory but faces customs data, incentive, and logistics hurdles in practice.',
    },
    '9810-warehouse': {
      title: 'Challenges of the 9810 overseas warehouse model',
      excerpt: 'Rebate difficulties persist despite "rebate upon departure" — and when offshore entities may work better.',
    },
    'not-saiwei-mode': {
      title: 'Most firms are not the "Saiwei model"',
      excerpt: 'Why copying template structures fails — build compliance around your own business substance.',
    },
    'compliance-journey': {
      title: 'Cross-border tax compliance cannot happen overnight',
      excerpt: 'Infrastructure gaps across customs modes — practical advice for businesses and authorities.',
    },
  },
  taxSummaries: {
    us: 'Federal and state tax system; cross-border sellers should watch corporate income tax, state sales tax, and withholding.',
    hk: 'Territorial profits tax, no VAT/GST; common hub for cross-border treasury and settlement.',
    kr: 'Corporate tax and 10% VAT; platform sales may trigger local registration and PE risks.',
    jp: 'Corporate and consumption taxes with local surcharges; import and platform rules apply.',
    tw: 'Business income tax and VAT-style business tax; cross-strait investment rules apply.',
    vn: 'CIT and VAT; manufacturing and e-commerce compliance requirements are rising.',
    ru: 'Profit tax and VAT; sanctions and FX channels affect practical compliance.',
    de: 'EU VAT hub; combined corporate and trade taxes near ~30% effective rate.',
    au: 'Company tax and 10% GST; low-value import GST rules affect e-commerce.',
    my: 'Corporate tax and SST; export-oriented supply chains are common.',
    br: 'Complex multi-level taxes including ICMS; e-commerce compliance is costly.',
    id: 'CIT and VAT; digital VAT rules apply to platforms and remote sellers.',
    in: 'GST and corporate tax with multiple rates; import IGST applies.',
    th: '20% CIT and reduced VAT rate; BOI incentives available.',
    sg: '17% corporate tax, 9% GST; regional holding and logistics hub.',
    nl: 'EU VAT gateway; 25.8% corporate tax and OSS/IOSS relevance.',
    mx: '30% CIT and 16% VAT; USMCA supply chain node.',
    sa: '20% CIT and 15% VAT under Vision 2030 reforms.',
    ae: '9% federal corporate tax from 2023; free-zone rules differ.',
    gb: '25% CIT and 20% VAT post-Brexit; marketplace rules apply.',
  },
};
