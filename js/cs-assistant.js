/* DAOITH site-wide customer-service assistant
 * Guides users to AI diagnosis, services, inquiry, and hub — does not give tax advice.
 */
(function () {
  const ROOT_ID = 'csAssistant';
  const CONV_KEY = 'daoith_cs_conversation_id';
  const MSG_KEY = 'daoith_cs_messages_v3';
  const DRAFT_KEY = 'daoith_cs_inquiry_draft';
  const MAX_MESSAGES = 40;

  const SERVICE_INDEX = [
    { id: 'consult-1v1', title: '专家1v1财税咨询', en: 'Expert 1-on-1 advisory', keys: '1v1 专家 咨询 顾问 consult' },
    { id: 'consult-annual', title: '财税合规陪跑', en: 'Compliance coaching', keys: '陪跑 全年 顾问年' },
    { id: 'consult-tp', title: '转让定价文档编制', en: 'Transfer pricing documentation', keys: '转让定价 tp transfer' },
    { id: 'domestic-diagnosis', title: '跨境电商税务合规诊断', en: 'Cross-border tax diagnosis', keys: '人工诊断 合规评估 诊断报告' },
    { id: 'domestic-setup', title: '公司注册与资质办理', en: 'Company setup & licenses', keys: '内地公司 营业执照 进出口权 海关备案' },
    { id: 'domestic-bookkeeping', title: '代理记账报税', en: 'Bookkeeping & filing', keys: '记账 报税 账务' },
    { id: 'domestic-compliance-bookkeeping', title: '合规代账全托管', en: 'Full-service bookkeeping', keys: '全托管 代账' },
    { id: 'domestic-rebate-1210-9610', title: '1210/9610出口退税首单陪跑服务', en: '1210/9610 rebate coaching', keys: '9610 1210 小包退税 跨境直邮' },
    { id: 'domestic-rebate-9810', title: '9810出口退税首单陪跑服务', en: '9810 rebate coaching', keys: '9810 海外仓退税' },
    { id: 'domestic-1039-sole', title: '1039市场采购个体户服务', en: '1039 sole trader', keys: '1039 市场采购 个体户' },
    { id: 'domestic-arch-0110-hk', title: '「0110出口+香港公司」合规架构全托管', en: '0110 + HK structure', keys: '0110 一般贸易 香港架构' },
    { id: 'domestic-arch-1039-hk', title: '「1039出口+香港公司」合规架构全托管', en: '1039 + HK structure', keys: '1039架构 香港公司架构' },
    { id: 'domestic-rebate', title: '出口退税代办', en: 'Export rebate agency', keys: '出口退税 退税代办 退税' },
    { id: 'domestic-hte', title: '高新技术企业认定', en: 'High-tech enterprise', keys: '高新 高新技术' },
    { id: 'domestic-offshore-vat-exemption', title: '离岸服务增值税免征备案', en: 'Offshore VAT exemption', keys: '离岸 免征备案' },
    { id: 'overseas-odi', title: 'ODI境外投资备案', en: 'ODI filing', keys: 'odi 境外投资 对外投资' },
    { id: 'hk-company', title: '香港公司注册', en: 'Hong Kong company setup', keys: '香港公司 注册香港 hk company hongkong' },
    { id: 'hk-audit-tax', title: '香港审计与利得税申报', en: 'HK audit & profits tax', keys: '香港审计 利得税' },
    { id: 'hk-salary-tax', title: '香港薪俸税／个人所得税申报', en: 'HK salaries tax', keys: '薪俸税 香港个税' },
    { id: 'hk-identity', title: '香港身份办理辅导', en: 'HK identity advisory', keys: '香港身份 优才 高才' },
    { id: 'asia-sg-company', title: '新加坡公司注册与GST', en: 'Singapore company & GST', keys: '新加坡 gst singapore' },
    { id: 'asia-jp-tax', title: '日本消费税／法人税合规', en: 'Japan consumption tax', keys: '日本 消费税 jct' },
    { id: 'asia-sea-tax', title: '东南亚电商税务合规', en: 'Southeast Asia tax', keys: '东南亚 泰国 越南 印尼 马来' },
    { id: 'overseas-vat', title: '欧洲VAT注册申报', en: 'EU VAT registration', keys: '欧洲 vat 英国 德国 法国 意大利 西班牙 eu uk' },
    { id: 'europe-epr', title: '欧洲EPR／包装法合规', en: 'EU EPR / packaging', keys: 'epr 包装法 weee' },
    { id: 'overseas-us-sales-tax', title: '美国销售税合规', en: 'US sales tax', keys: '美国 销售税 sales tax amazon 加州 wayfair' },
    { id: 'namerica-ca-tax', title: '加拿大GST／HST合规', en: 'Canada GST/HST', keys: '加拿大 gst hst canada' },
    { id: 'namerica-mx-tax', title: '墨西哥税务合规', en: 'Mexico tax', keys: '墨西哥 rfc' },
    { id: 'samerica-br-tax', title: '巴西电商税务合规', en: 'Brazil tax', keys: '巴西 brazil' },
    { id: 'oceania-au-gst', title: '澳大利亚GST合规', en: 'Australia GST', keys: '澳洲 澳大利亚 gst au' },
    { id: 'oceania-nz-gst', title: '新西兰GST合规', en: 'New Zealand GST', keys: '新西兰 nz' },
  ];

  const COPY = {
    zh: {
      fabLabel: '智能客服',
      fabSub: '随时为您指引',
      title: '道一智能客服',
      subtitle: '引导使用官网功能',
      newChat: '新对话',
      close: '关闭',
      placeholder: '告诉我你想做什么…',
      send: '发送',
      welcome:
        '您好，我是**道一官网智能客服**。我可以告诉您如何使用「**AI解决方案**」生成合规方案，按您的需求推荐合规服务，提交询价或者进行服务管理。',
      chipAi: 'AI合规助手',
      chipService: '推荐服务',
      chipQuote: '提交询价',
      chipHub: '查询进度',
      next: '下一步可选择：',
      aiGuide: '已为您打开「道一合规助手」，请按页面提示作答，即可生成合规方案。',
      goAi: '打开 AI合规助手',
      taxRedirect:
        '合规细节请交给「AI解决方案」或预约专家，我这边不深入解答税务法规。点击下方即可开始诊断。',
      serviceAsk: '已为您打开「财税服务」。请告诉我您需要哪方面的服务，例如香港公司注册、出口退税、欧洲VAT等。',
      confirmQuote: '是，去提交',
      quoteCartAsk: '购物车里已有：{list}。是否提交目前这些服务的询价？',
      quoteCartEmpty:
        '购物车目前是空的。请告诉我您需要为哪项服务询价；也可以先考虑专家1v1财税咨询。',
      progressOpened: '已为您打开「服务进度跟踪」。登录后可查看办理进度。',
      serviceHit: '根据你提到的需求，可先看这些标准化服务：',
      serviceMiss: '暂未精确匹配到单项。你可以先浏览财税服务市场，或补充国家／平台后再问我。',
      browseServices: '浏览财税服务',
      viewDetail: '查看详情',
      addCart: '加入询价单',
      addedCart: '已加入询价单，可继续提交询价。',
      quoteGuide: '提交询价需要公司名称、联系人和联系电话。登录后我可以在此代填并生成询价记录；也可以去购物车填写。',
      goCart: '打开询价单',
      loginFirst: '请先微信登录后再提交询价或查看进度。',
      quoteFormLead: '请填写以下信息，顾问会尽快联系你。',
      company: '公司名称',
      contact: '联系人',
      phone: '联系电话',
      submitQuote: '提交询价',
      cancel: '取消',
      quoteNeedFields: '请填写公司名称、联系人和联系电话。',
      quoteNeedLogin: '请先微信登录后再提交询价。',
      quoteOk: '询价已提交。顾问将尽快联系你，也可在「服务管理」查看记录。',
      quoteFail: '提交失败，请稍后重试，或前往购物车填写询价表单。',
      submitting: '提交中…',
      hubGuide: '服务进度在官网「服务管理」中查看。请先登录，进入后可看到询价、订单与办理进度。',
      goHub: '打开服务管理',
      greet: '你好，想先做 AI 合规诊断、找一项服务，还是提交询价／查进度？',
      fallback: '我可以帮你：使用 AI 诊断、推荐服务、提交询价，或查询服务进度。请选一项，或简单说说国家、平台和需求。',
      busy: '正在回复…',
      error: '客服暂时繁忙，你也可以直接点下方选项继续。',
      onAiPage: '你已在 AI 解决方案页。请按左侧「道一合规助手」的提示作答，即可生成方案。',
    },
    en: {
      fabLabel: 'Assistant',
      fabSub: 'Here to guide you',
      title: 'DAOITH assistant',
      subtitle: 'Helps you use the site',
      newChat: 'New chat',
      close: 'Close',
      placeholder: 'Tell me what you need…',
      send: 'Send',
      welcome:
        'Hello, I am the **DAOITH site assistant**. I can show you how to use **AI Compliance** to generate a plan, recommend compliance services for your needs, submit an inquiry, or manage services.',
      chipAi: 'AI compliance assistant',
      chipService: 'Recommend services',
      chipQuote: 'Submit inquiry',
      chipHub: 'Check progress',
      next: 'Next, you can:',
      aiGuide: 'Opened the AI compliance assistant. Follow the on-page prompts to generate a plan.',
      goAi: 'Open AI assistant',
      taxRedirect:
        'For tax rules, please use AI Compliance or book an expert — I will not go into regulations here.',
      serviceAsk:
        'Opened Tax Services. Tell me what you need — e.g. HK company setup, export rebate, or EU VAT.',
      confirmQuote: 'Yes, submit',
      quoteCartAsk: 'Your cart has: {list}. Submit an inquiry for these services now?',
      quoteCartEmpty:
        'Your cart is empty. Tell me which service you want a quote for; you can also start with Expert 1-on-1 advisory.',
      progressOpened: 'Opened service progress tracking. Sign in to see your status.',
      serviceHit: 'Based on what you mentioned, these standard services may fit:',
      serviceMiss: 'No exact match yet. Browse the service marketplace, or add country / platform and ask again.',
      browseServices: 'Browse services',
      viewDetail: 'Details',
      addCart: 'Add to inquiry list',
      addedCart: 'Added to the inquiry list. You can submit an inquiry next.',
      quoteGuide: 'An inquiry needs company name, contact person and phone. After WeChat sign-in I can submit it here, or you can use the cart form.',
      goCart: 'Open inquiry list',
      loginFirst: 'Please sign in with WeChat first to submit an inquiry or check progress.',
      quoteFormLead: 'Fill in the fields below. An advisor will contact you shortly.',
      company: 'Company',
      contact: 'Contact',
      phone: 'Phone',
      submitQuote: 'Submit',
      cancel: 'Cancel',
      quoteNeedFields: 'Please fill in company, contact person and phone.',
      quoteNeedLogin: 'Please sign in with WeChat before submitting.',
      quoteOk: 'Inquiry submitted. An advisor will contact you. You can also track it in Service Hub.',
      quoteFail: 'Submit failed. Please try again or use the cart inquiry form.',
      submitting: 'Submitting…',
      hubGuide: 'Progress lives in Service Hub. Sign in, then open it to see inquiries, orders and status.',
      goHub: 'Open Service Hub',
      greet: 'Hi — would you like AI diagnosis, a service recommendation, an inquiry, or a progress check?',
      fallback: 'I can help with AI diagnosis, service recommendations, inquiries, or progress. Pick one, or tell me country, platform and need.',
      busy: 'Replying…',
      error: 'The assistant is busy. You can continue with the options below.',
      onAiPage: 'You are already on AI Compliance. Follow the prompts in the left-hand assistant to generate a plan.',
    },
  };

  let busy = false;
  let selectedServiceIds = [];

  function locale() {
    return window.DAOITH_getLocale?.() === 'en' ? 'en' : 'zh';
  }

  function t(key) {
    return (COPY[locale()] || COPY.zh)[key] || COPY.zh[key] || key;
  }

  function isEn() {
    return locale() === 'en';
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatBubble(text) {
    const safe = escapeHtml(text).replace(/\n/g, '<br>');
    return safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  function isHomePage() {
    const path = window.location.pathname || '/';
    return path === '/' || path === '' || /\/index\.html$/i.test(path);
  }

  function currentView() {
    if (!isHomePage()) return '';
    return document.body?.dataset?.activeView || '';
  }

  function go(target) {
    if (!target) return;
    if (target.startsWith('/service.html') || target.startsWith('/cart.html')) {
      window.location.href = target;
      return;
    }
    const hash = target.startsWith('#') ? target : `#${target.replace(/^\/?#/, '')}`;
    const id = hash.replace(/^#/, '');
    if (isHomePage()) {
      if (typeof window.DAOITH_showView === 'function') window.DAOITH_showView(id);
      else window.location.hash = hash;
      return;
    }
    window.location.href = `/${hash}`;
  }

  function scrollToId(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return false;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }

  function setResume(payload) {
    try {
      sessionStorage.setItem('daoith_cs_resume', JSON.stringify({ open: true, ...payload }));
    } catch {
      /* ignore */
    }
  }

  function goAndScroll(hash, elementId) {
    const hashVal = hash.startsWith('#') ? hash : `#${hash}`;
    const id = hashVal.replace(/^#/, '');
    if (isHomePage()) {
      const already = currentView() === id;
      if (!already) {
        if (typeof window.DAOITH_showView === 'function') window.DAOITH_showView(id);
        else window.location.hash = hashVal;
      }
      setTimeout(() => scrollToId(elementId), already ? 60 : 400);
      return;
    }
    persistMessages();
    setResume({ scrollId: elementId });
    window.location.href = `/${hashVal}`;
  }

  function isCartPage() {
    return /\/cart\.html$/i.test(window.location.pathname || '');
  }

  function serviceHref(id) {
    return `/service.html?id=${encodeURIComponent(id)}`;
  }

  function resolveService(id) {
    if (typeof window.getServiceById === 'function') {
      const full = window.getServiceById(id);
      if (full) return full;
    }
    return SERVICE_INDEX.find((s) => s.id === id) || null;
  }

  function serviceTitle(svc) {
    if (!svc) return '';
    if (isEn() && svc.en) return svc.en;
    return svc.title || '';
  }

  function matchServices(text) {
    const q = String(text || '').toLowerCase();
    if (!q) return [];
    const scored = SERVICE_INDEX.map((s) => {
      const blob = `${s.title} ${s.en || ''} ${s.keys}`.toLowerCase();
      let score = 0;
      blob.split(/\s+/).forEach((token) => {
        if (token.length >= 2 && q.includes(token)) score += token.length >= 4 ? 3 : 2;
      });
      if (q.includes(s.id)) score += 5;
      return { s, score };
    }).filter((x) => x.score > 0);
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map((x) => x.s);
  }

  function classify(text) {
    const q = String(text || '').trim();
    if (!q) return 'other';
    if (/^(你好|您好|hi+|hello|hey|在吗)$/i.test(q)) return 'greet';
    if (/进度|订单状态|服务管理|查(询)?(一下)?(进度|状态)|track|progress|hub/i.test(q)) return 'progress';
    if (/询价|报价|多少钱|怎么买|提交联系|leave (my )?contact|inquiry|quote/i.test(q)) return 'inquiry';
    if (
      /ai\s*合规助手|ai合规助手|ai\s*诊断|ai\s*方案|合规诊断|生成方案|不确定|不知道(该|怎么)|ai compliance|diagnosis/i.test(
        q
      )
    ) {
      return 'diagnosis';
    }
    const wantsService =
      /办理|代办|注册(香港|公司)|帮我(做|办)|推荐(一下)?服务|想买|购买|报名|book /i.test(q);
    const hits = matchServices(q);
    const taxAsk =
      /税率|退税率|要不要(注册|交税|申报)|是否(需要|必须).*(vat|税)|怎么(算税|申报|退税)|能不能(退税|走\s*96|走\s*98)|违法吗|税务风险|如何计算|hs\s*编码.*退税/i.test(
        q
      );
    if (hits.length && (wantsService || !taxAsk)) return 'service';
    if (wantsService) return 'service';
    if (taxAsk) return 'tax';
    if (/推荐服务|有什么服务|服务有哪些/i.test(q)) return 'service';
    return 'other';
  }

  function parseActions(raw) {
    const actions = [];
    const text = String(raw || '').replace(/\[\[action:([^\]]+)\]\]/gi, (_, code) => {
      actions.push(String(code).trim().toLowerCase());
      return '';
    });
    return { text: text.replace(/\n{3,}/g, '\n\n').trim(), actions };
  }

  function getRoot() {
    return document.getElementById(ROOT_ID);
  }

  function getMessagesEl() {
    return document.getElementById('csAssistantMessages');
  }

  function scrollToBottom() {
    const el = getMessagesEl();
    if (el) el.scrollTop = el.scrollHeight;
  }

  function persistMessages() {
    const el = getMessagesEl();
    if (!el) return;
    const items = [...el.querySelectorAll('[data-cs-msg]')].map((node) => ({
      who: node.getAttribute('data-cs-who') || 'bot',
      html: node.innerHTML,
    }));
    try {
      sessionStorage.setItem(MSG_KEY, JSON.stringify(items.slice(-MAX_MESSAGES)));
    } catch {
      /* ignore */
    }
  }

  function appendBubble(text, who) {
    const el = getMessagesEl();
    if (!el) return null;
    const div = document.createElement('div');
    div.className = `ai-chatbot-bubble ${who === 'user' ? 'is-user' : 'is-bot is-rich'}`;
    div.setAttribute('data-cs-msg', '1');
    div.setAttribute('data-cs-who', who);
    if (who === 'bot') div.innerHTML = formatBubble(text);
    else div.textContent = text;
    el.appendChild(div);
    scrollToBottom();
    persistMessages();
    return div;
  }

  function setBotHtml(node, html) {
    if (!node) return;
    node.classList.add('is-bot', 'is-rich');
    node.innerHTML = html;
    scrollToBottom();
    persistMessages();
  }

  function defaultChips() {
    return [
      { id: 'diagnosis', label: t('chipAi') },
      { id: 'service', label: t('chipService') },
      { id: 'inquiry', label: t('chipQuote') },
      { id: 'progress', label: t('chipHub') },
    ];
  }

  function renderChips(items) {
    const host = document.getElementById('csAssistantChips');
    if (!host) return;
    const chips = items && items.length ? items : defaultChips();
    host.innerHTML = chips
      .map(
        (c) =>
          `<button type="button" class="cs-chip" data-cs-chip="${escapeHtml(c.id)}">${escapeHtml(c.label)}</button>`
      )
      .join('');
    host.hidden = !chips.length;
  }

  function renderServiceCards(services) {
    const el = getMessagesEl();
    if (!el || !services.length) return;
    const wrap = document.createElement('div');
    wrap.className = 'cs-service-list';
    wrap.setAttribute('data-cs-msg', '1');
    wrap.setAttribute('data-cs-who', 'bot');
    wrap.innerHTML = services
      .map((s) => {
        const full = resolveService(s.id) || s;
        const price = full.priceLabel ? `<span class="cs-service-price">${escapeHtml(full.priceLabel)}</span>` : '';
        const desc = full.desc ? `<p>${escapeHtml(full.desc)}</p>` : '';
        return `<article class="cs-service-card">
          <strong>${escapeHtml(serviceTitle(full))}</strong>
          ${desc}${price}
          <div class="cs-service-actions">
            <button type="button" class="cs-chip" data-cs-nav="${escapeHtml(serviceHref(s.id))}">${escapeHtml(t('viewDetail'))}</button>
            <button type="button" class="cs-chip is-primary" data-cs-add="${escapeHtml(s.id)}">${escapeHtml(t('addCart'))}</button>
          </div>
        </article>`;
      })
      .join('');
    el.appendChild(wrap);
    scrollToBottom();
    persistMessages();
  }

  function renderInquiryForm(prefill) {
    const el = getMessagesEl();
    if (!el) return;
    el.querySelector('#csInquiryForm')?.closest('.cs-inquiry-card')?.remove();
    const card = document.createElement('div');
    card.className = 'cs-inquiry-card';
    card.setAttribute('data-cs-msg', '1');
    card.setAttribute('data-cs-who', 'bot');
    card.innerHTML = `<p>${escapeHtml(t('quoteFormLead'))}</p>
      <form id="csInquiryForm" class="cs-inquiry-form">
        <label>${escapeHtml(t('company'))}<input name="company" autocomplete="organization" value="${escapeHtml(prefill?.company || '')}" required></label>
        <label>${escapeHtml(t('contact'))}<input name="contact" autocomplete="name" value="${escapeHtml(prefill?.contact || '')}" required></label>
        <label>${escapeHtml(t('phone'))}<input name="phone" autocomplete="tel" inputmode="tel" value="${escapeHtml(prefill?.phone || '')}" required></label>
        <p class="cs-inquiry-error" id="csInquiryError" hidden></p>
        <div class="cs-inquiry-actions">
          <button type="button" class="cs-chip" data-cs-cancel-form>${escapeHtml(t('cancel'))}</button>
          <button type="submit" class="cs-chip is-primary" id="csInquirySubmit">${escapeHtml(t('submitQuote'))}</button>
        </div>
      </form>`;
    el.appendChild(card);
    scrollToBottom();
    card.querySelector('input')?.focus();
  }

  function showWelcome() {
    const el = getMessagesEl();
    if (!el) return;
    el.innerHTML = '';
    appendBubble(t('welcome'), 'bot');
    renderChips(defaultChips());
  }

  function restoreMessages() {
    const el = getMessagesEl();
    if (!el) return false;
    try {
      const raw = sessionStorage.getItem(MSG_KEY);
      const items = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(items) || !items.length) return false;
      el.innerHTML = '';
      items.forEach((item) => {
        const div = document.createElement('div');
        const who = item.who === 'user' ? 'user' : 'bot';
        div.className = `ai-chatbot-bubble ${who === 'user' ? 'is-user' : 'is-bot is-rich'}`;
        if (item.html && item.html.includes('cs-service-card')) {
          div.className = 'cs-service-list';
        } else if (item.html && item.html.includes('cs-inquiry-form')) {
          div.className = 'cs-inquiry-card';
        }
        div.setAttribute('data-cs-msg', '1');
        div.setAttribute('data-cs-who', who);
          if (who === 'user') {
            const tmp = document.createElement('div');
            tmp.innerHTML = item.html || '';
            div.textContent = tmp.textContent || '';
          } else {
            div.innerHTML = item.html;
          }
        el.appendChild(div);
      });
      renderChips(defaultChips());
      scrollToBottom();
      return true;
    } catch {
      return false;
    }
  }

  function setOpen(open) {
    const root = getRoot();
    if (!root) return;
    root.dataset.state = open ? 'open' : 'closed';
    const panel = document.getElementById('csAssistantPanel');
    if (panel) panel.hidden = !open;
    if (open) {
      document.getElementById('csAssistantInput')?.focus();
      scrollToBottom();
    }
  }

  function getDifyUserId() {
    const authUser = window.DAOITH_AUTH?.getUser?.();
    if (authUser?.openid) return `wx-${authUser.openid}`;
    const key = 'daoith_dify_user_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = `web-${crypto.randomUUID()}`;
      localStorage.setItem(key, id);
    }
    return id;
  }

  async function callDify(query, conversationId) {
    const cfg = window.DAOITH_CONFIG || {};
    const base = (cfg.difyApiBase || 'https://api.daoith.com').replace(/\/$/, '');
    const path = cfg.difyCsEndpoint || '/v1/cs/chat-messages';
    const payload = {
      inputs: {},
      query,
      response_mode: 'blocking',
      user: getDifyUserId(),
    };
    if (conversationId) payload.conversation_id = conversationId;
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || data.error || `HTTP ${res.status}`);
    }
    const text = typeof data.answer === 'string' ? data.answer.trim() : '';
    if (!text) throw new Error('empty');
    return {
      text,
      conversationId: data.conversation_id || conversationId || '',
    };
  }

  function applyActions(actions) {
    const chips = [];
    (actions || []).forEach((code) => {
      if (code === 'ai-solution' || code === 'diagnosis') chips.push({ id: 'go-ai', label: t('goAi') });
      else if (code === 'services') chips.push({ id: 'go-services', label: t('browseServices') });
      else if (code === 'inquiry' || code === 'quote') chips.push({ id: 'inquiry', label: t('chipQuote') });
      else if (code === 'hub' || code === 'progress') chips.push({ id: 'progress', label: t('chipHub') });
      else if (code === 'cart') chips.push({ id: 'go-cart', label: t('goCart') });
      else if (code.startsWith('service:')) {
        const id = code.slice(8);
        chips.push({ id: `open-service:${id}`, label: t('viewDetail') });
      }
    });
    if (!chips.length) renderChips(defaultChips());
    else renderChips([...chips, ...defaultChips().slice(0, 2)]);
  }

  function requireAuth(action, returnUrl) {
    if (window.DAOITH_AUTH?.isLoggedIn?.()) return true;
    if (window.DAOITH_AUTH?.requireLogin) {
      window.DAOITH_AUTH.requireLogin(action, returnUrl || `${window.location.pathname}${window.location.hash || ''}`);
      return false;
    }
    go('#hub');
    return false;
  }

  function handleDiagnosis() {
    appendBubble(t('aiGuide'), 'bot');
    renderChips(defaultChips());
    goAndScroll('#ai-solution', 'aiWorkspace');
  }

  function handleTax() {
    appendBubble(t('taxRedirect'), 'bot');
    renderChips([
      { id: 'diagnosis', label: t('chipAi') },
      { id: 'inquiry', label: t('chipQuote') },
    ]);
  }

  function handleService(text) {
    const q = String(text || '').trim();
    const justAsk = /^(推荐服务|recommend services?)$/i.test(q) || !q;
    const hits = justAsk ? [] : matchServices(q);
    if (justAsk || !hits.length) {
      appendBubble(t('serviceAsk'), 'bot');
      renderChips(defaultChips());
      if (isHomePage()) go('#services');
      else {
        persistMessages();
        setResume({});
        go('#services');
      }
      return;
    }
    selectedServiceIds = hits.map((s) => s.id);
    appendBubble(t('serviceHit'), 'bot');
    renderServiceCards(hits);
    renderChips([
      { id: 'inquiry', label: t('chipQuote') },
      { id: 'go-services', label: t('browseServices') },
    ]);
  }

  function handleInquiryArrive() {
    const items = window.DAOITH_CART?.getCart?.() || [];
    if (items.length) {
      const list = items
        .map((i) => `${i.title || i.id}${i.qty && i.qty > 1 ? ` ×${i.qty}` : ''}`)
        .join(isEn() ? '; ' : '、');
      appendBubble(t('quoteCartAsk').replace('{list}', list), 'bot');
      renderChips([
        { id: 'confirm-quote', label: t('confirmQuote') },
        { id: 'service', label: t('chipService') },
      ]);
      return;
    }
    appendBubble(t('quoteCartEmpty'), 'bot');
    const one = SERVICE_INDEX.find((s) => s.id === 'consult-1v1');
    if (one) {
      selectedServiceIds = ['consult-1v1'];
      renderServiceCards([one]);
    }
    renderChips(defaultChips());
  }

  function handleInquiry() {
    if (isCartPage()) {
      handleInquiryArrive();
      return;
    }
    persistMessages();
    setResume({ action: 'inquiry' });
    window.location.href = '/cart.html';
  }

  function handleProgress() {
    appendBubble(t('progressOpened'), 'bot');
    renderChips(defaultChips());
    goAndScroll('#hub', 'hub-progress');
  }

  function handleChip(id) {
    if (id === 'diagnosis') {
      appendBubble(t('chipAi'), 'user');
      return handleDiagnosis();
    }
    if (id === 'service') {
      appendBubble(t('chipService'), 'user');
      return handleService(t('chipService'));
    }
    if (id === 'inquiry') {
      appendBubble(t('chipQuote'), 'user');
      persistMessages();
      return handleInquiry();
    }
    if (id === 'progress') {
      appendBubble(t('chipHub'), 'user');
      return handleProgress();
    }
    if (id === 'go-ai') return handleDiagnosis();
    if (id === 'go-services') return go('#services');
    if (id === 'go-cart') {
      setResume({ action: 'inquiry' });
      window.location.href = '/cart.html';
      return;
    }
    if (id === 'go-hub') return goAndScroll('#hub', 'hub-progress');
    if (id === 'confirm-quote') {
      if (isCartPage()) {
        document.getElementById('openQuoteBtn')?.click();
        return;
      }
      setResume({ action: 'inquiry-confirm' });
      window.location.href = '/cart.html';
      return;
    }
    if (id.startsWith('open-service:')) {
      window.location.href = serviceHref(id.slice(13));
    }
  }

  async function submitInquiry(form) {
    const err = document.getElementById('csInquiryError');
    const submitBtn = document.getElementById('csInquirySubmit');
    const company = form.company?.value.trim() || '';
    const contact = form.contact?.value.trim() || '';
    const phone = form.phone?.value.trim() || '';
    const showErr = (msg) => {
      if (!err) return;
      err.hidden = false;
      err.textContent = msg;
    };
    if (!company || !contact || !phone) {
      showErr(t('quoteNeedFields'));
      return;
    }
    if (!window.DAOITH_AUTH?.isLoggedIn?.()) {
      showErr(t('quoteNeedLogin'));
      requireAuth('cs_inquiry');
      return;
    }

    const ids = selectedServiceIds.length ? selectedServiceIds : ['consult-1v1'];
    ids.forEach((sid) => window.DAOITH_CART?.addItem?.(sid));
    const cartItems = window.DAOITH_CART?.getCart?.() || [];
    const items = (cartItems.length ? cartItems : ids.map((sid) => resolveService(sid)).filter(Boolean)).map((i) => ({
      id: i.id,
      title: i.title,
      qty: i.qty || 1,
      priceValue: i.priceValue || 0,
    }));
    const total = items.reduce((sum, i) => sum + (Number(i.priceValue) || 0) * (Number(i.qty) || 1), 0);
    const payload = { company, contact, phone, total, items };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = t('submitting');
    }

    try {
      const cfg = window.DAOITH_CONFIG || {};
      const apiBase = (cfg.notifyApiBase || cfg.difyApiBase || 'https://api.daoith.com').replace(/\/$/, '');
      const token = window.DAOITH_AUTH.getToken();
      const res = await fetch(`${apiBase}/api/inquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      window.DAOITH_CART?.saveQuote?.({
        ...payload,
        inquiryId: data.inquiryId || '',
        status: '已提交',
        statusHistory: { 已提交: new Date().toISOString() },
        createdAt: new Date().toISOString(),
        quotedTotal: data.quotedTotal,
        standardTotal: data.standardTotal,
      });
      window.DAOITH_CART?.clearCart?.();
      form.closest('.cs-inquiry-card')?.remove();
      appendBubble(t('quoteOk'), 'bot');
      renderChips([
        { id: 'go-hub', label: t('goHub') },
        { id: 'diagnosis', label: t('chipAi') },
      ]);
    } catch (submitErr) {
      showErr(`${t('quoteFail')}（${submitErr.message || ''}）`);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = t('submitQuote');
      }
    }
  }

  async function sendMessage(raw, opts = {}) {
    const text = String(raw || '').trim();
    if (!text || busy) return;
    const input = document.getElementById('csAssistantInput');
    if (input) input.value = '';
    appendBubble(text, 'user');

    const intent = opts.intent || classify(text);
    if (intent === 'greet') {
      appendBubble(t('greet'), 'bot');
      renderChips(defaultChips());
      return;
    }
    if (intent === 'diagnosis') return handleDiagnosis();
    if (intent === 'tax') return handleTax();
    if (intent === 'service') return handleService(text);
    if (intent === 'inquiry') return handleInquiry();
    if (intent === 'progress') return handleProgress();

    busy = true;
    const typing = appendBubble(t('busy'), 'bot');
    try {
      const convId = localStorage.getItem(CONV_KEY) || '';
      const result = await callDify(text, convId);
      if (result.conversationId) localStorage.setItem(CONV_KEY, result.conversationId);
      const parsed = parseActions(result.text);
      const replyIntent = classify(parsed.text);
      if (replyIntent === 'tax') {
        setBotHtml(typing, formatBubble(t('taxRedirect')));
        renderChips([
          { id: 'go-ai', label: t('goAi') },
          { id: 'inquiry', label: t('chipQuote') },
        ]);
        return;
      }
      setBotHtml(typing, formatBubble(parsed.text || t('fallback')));
      const hits = matchServices(text + ' ' + parsed.text);
      if (hits.length) {
        selectedServiceIds = hits.map((s) => s.id);
        renderServiceCards(hits);
      }
      applyActions(parsed.actions);
    } catch {
      setBotHtml(typing, formatBubble(t('fallback')));
      renderChips(defaultChips());
    } finally {
      busy = false;
    }
  }

  function inject() {
    if (document.getElementById(ROOT_ID)) return;
    const aside = document.createElement('aside');
    aside.id = ROOT_ID;
    aside.className = 'ai-chatbot cs-assistant';
    aside.dataset.state = 'closed';
    aside.setAttribute('aria-label', t('title'));
    aside.innerHTML = `
      <button type="button" class="ai-chatbot-fab" id="csAssistantFab" aria-expanded="false">
        <span class="ai-chatbot-fab-ring" aria-hidden="true"></span>
        <img src="/images/cs-avatar.png" alt="" width="32" height="32">
        <span class="ai-chatbot-fab-copy">
          <span class="ai-chatbot-fab-label">${escapeHtml(t('fabLabel'))}</span>
          <span class="ai-chatbot-fab-sub">${escapeHtml(t('fabSub'))}</span>
        </span>
      </button>
      <div class="ai-chatbot-panel" id="csAssistantPanel" hidden>
        <div class="ai-chatbot-header">
          <div class="ai-chatbot-title">
            <img src="/images/cs-avatar.png" alt="" width="28" height="28">
            <div class="ai-chatbot-title-text">
              <strong>${escapeHtml(t('title'))}</strong>
              <span>${escapeHtml(t('subtitle'))}</span>
            </div>
          </div>
          <div class="ai-chatbot-header-actions">
            <button type="button" class="ai-chatbot-new" id="csAssistantNew">${escapeHtml(t('newChat'))}</button>
            <button type="button" class="ai-chatbot-close" id="csAssistantClose" aria-label="${escapeHtml(t('close'))}">&times;</button>
          </div>
        </div>
        <div class="ai-chatbot-messages" id="csAssistantMessages"></div>
        <div class="cs-chips" id="csAssistantChips"></div>
        <form class="ai-chatbot-form" id="csAssistantForm">
          <input type="text" id="csAssistantInput" maxlength="500" autocomplete="off" placeholder="${escapeHtml(t('placeholder'))}">
          <button type="submit" class="btn btn-primary ai-chatbot-send">${escapeHtml(t('send'))}</button>
        </form>
      </div>`;
    document.body.appendChild(aside);
  }

  function refreshChrome() {
    const root = getRoot();
    if (!root) return;
    const label = root.querySelector('.ai-chatbot-fab-label');
    const sub = root.querySelector('.ai-chatbot-fab-sub');
    const title = root.querySelector('.ai-chatbot-title-text strong');
    const subtitle = root.querySelector('.ai-chatbot-title-text span');
    const neu = document.getElementById('csAssistantNew');
    const input = document.getElementById('csAssistantInput');
    const send = root.querySelector('.ai-chatbot-send');
    if (label) label.textContent = t('fabLabel');
    if (sub) sub.textContent = t('fabSub');
    if (title) title.textContent = t('title');
    if (subtitle) subtitle.textContent = t('subtitle');
    if (neu) neu.textContent = t('newChat');
    if (input) input.placeholder = t('placeholder');
    if (send) send.textContent = t('send');
  }

  function bind() {
    const root = getRoot();
    if (!root || root.dataset.bound === '1') return;
    root.dataset.bound = '1';

    document.getElementById('csAssistantFab')?.addEventListener('click', () => setOpen(true));
    document.getElementById('csAssistantClose')?.addEventListener('click', () => setOpen(false));
    document.getElementById('csAssistantNew')?.addEventListener('click', () => {
      localStorage.removeItem(CONV_KEY);
      sessionStorage.removeItem(MSG_KEY);
      selectedServiceIds = [];
      showWelcome();
    });
    document.getElementById('csAssistantForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      sendMessage(document.getElementById('csAssistantInput')?.value || '');
    });
    root.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-cs-chip]');
      if (chip) {
        handleChip(chip.getAttribute('data-cs-chip') || '');
        return;
      }
      const nav = e.target.closest('[data-cs-nav]');
      if (nav) {
        window.location.href = nav.getAttribute('data-cs-nav') || '';
        return;
      }
      const add = e.target.closest('[data-cs-add]');
      if (add) {
        const id = add.getAttribute('data-cs-add');
        if (id && window.DAOITH_CART?.addItem) {
          const ok = window.DAOITH_CART.addItem(id);
          if (ok) {
            selectedServiceIds = [id];
            window.DAOITH_CART.updateCartBadge?.();
            appendBubble(t('addedCart'), 'bot');
            renderChips([
              { id: 'inquiry', label: t('chipQuote') },
              { id: 'go-cart', label: t('goCart') },
            ]);
            return;
          }
        }
        window.location.href = serviceHref(id);
        return;
      }
      if (e.target.closest('[data-cs-cancel-form]')) {
        e.target.closest('.cs-inquiry-card')?.remove();
        renderChips(defaultChips());
      }
    });
    root.addEventListener('submit', (e) => {
      if (e.target?.id !== 'csInquiryForm') return;
      e.preventDefault();
      submitInquiry(e.target);
    });
  }

  function resumeAfterLogin(action) {
    setOpen(true);
    if (action === 'cs_inquiry') handleInquiry();
    else if (action === 'cs_hub') handleProgress();
  }

  function consumeResume() {
    let resume;
    try {
      resume = JSON.parse(sessionStorage.getItem('daoith_cs_resume') || 'null');
      sessionStorage.removeItem('daoith_cs_resume');
    } catch {
      resume = null;
    }
    if (!resume) return;
    setOpen(true);
    if (resume.action === 'inquiry') handleInquiryArrive();
    if (resume.action === 'inquiry-confirm') {
      handleInquiryArrive();
      setTimeout(() => document.getElementById('openQuoteBtn')?.click(), 450);
    }
    if (resume.scrollId) setTimeout(() => scrollToId(resume.scrollId), 420);
  }

  function init() {
    if (document.body?.classList.contains('wechat-callback-page')) return;
    inject();
    bind();
    if (!restoreMessages()) showWelcome();
    refreshChrome();
    consumeResume();

    window.addEventListener('localechange', () => {
      refreshChrome();
      renderChips(defaultChips());
    });
    window.addEventListener('daoith-auth-pending', (event) => {
      const action = event.detail?.action;
      if (action === 'cs_inquiry' || action === 'cs_hub') {
        setTimeout(() => resumeAfterLogin(action), 0);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
