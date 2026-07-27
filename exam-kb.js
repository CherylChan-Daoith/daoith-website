/* Dify 知识库同步模块 */
window.ExamKB = (function () {
  const KB_CONTENT_KEY = 'hkTaxExamKbContent';
  const KB_QUIZ_KEY = 'hkTaxExamKbQuiz';
  const LOCALE_KEY = 'hkTaxExamLocale';
  const DEFAULT_KB_SCOPE = '香港CTA 特许税务师 TIHK Paper 2 Paper 3 Paper 5 考纲 真题 税务条例 Cap.112';

  function getKbScope(cfg) {
    return (cfg?.kbScope || localStorage.getItem('hkTaxExamKbScope') || DEFAULT_KB_SCOPE).trim();
  }

  function getLocale() {
    return localStorage.getItem(LOCALE_KEY) || 'zh';
  }

  function setLocale(lang) {
    localStorage.setItem(LOCALE_KEY, lang);
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-HK';
  }

  function t(key, vars) {
    const locale = getLocale();
    let str = (window.EXAM_I18N?.[locale]?.[key]) || (window.EXAM_I18N?.zh?.[key]) || key;
    if (vars) Object.entries(vars).forEach(([k, v]) => { str = str.replace(`{${k}}`, v); });
    return str;
  }

  function getDayTopic(day, lang) {
    const meta = window.EXAM_I18N?.dayMeta?.[day];
    if (!meta) return '';
    return meta[lang || getLocale()] || meta.zh;
  }

  function getKbContent() {
    try { return JSON.parse(localStorage.getItem(KB_CONTENT_KEY) || '{}'); }
    catch (e) { return {}; }
  }

  function getKbQuiz() {
    try { return JSON.parse(localStorage.getItem(KB_QUIZ_KEY) || '{}'); }
    catch (e) { return {}; }
  }

  function setKbContentDay(day, lang, text) {
    const cache = getKbContent();
    if (!cache[day]) cache[day] = {};
    cache[day][lang] = text;
    localStorage.setItem(KB_CONTENT_KEY, JSON.stringify(cache));
  }

  function getKbContentDay(day, lang) {
    const cache = getKbContent();
    return cache[day]?.[lang || getLocale()] || '';
  }

  function setKbQuizDay(day, lang, questions) {
    const cache = getKbQuiz();
    if (!cache[day]) cache[day] = {};
    cache[day][lang] = questions;
    localStorage.setItem(KB_QUIZ_KEY, JSON.stringify(cache));
  }

  function getKbQuizDay(day, lang) {
    const cache = getKbQuiz();
    return cache[day]?.[lang || getLocale()] || null;
  }

  function clearKbCache() {
    localStorage.removeItem(KB_CONTENT_KEY);
    localStorage.removeItem(KB_QUIZ_KEY);
  }

  function buildScopeBlock(lang, scope) {
    const s = scope || DEFAULT_KB_SCOPE;
    if (lang === 'en') {
      return `STRICT SCOPE FILTER — Only retrieve from KB documents matching: ${s}

This is the HONG KONG CTA/TIHK exam — NOT mainland China 税务师 exam.
IGNORE: mainland China tax (增值税/VAT, 企业所得税法, 注册税务师, 税法一/二), import/export, customs, HS codes.
Answer ONLY from retrieved KB chunks. Do NOT use model training knowledge to supplement.
If no CTA/HK tax exam material is found, reply exactly: "No relevant CTA exam material found in KB".`;
    }
    return `【严格范围过滤】仅检索与以下关键词相关的知识库文档：${s}

这是香港 CTA/TIHK 特许税务师考试，不是中国大陆「税务师职业资格考试」。
严禁引用：中国税务师、注册税务师、税法一/税法二、增值税/企业所得税法、国家税务总局等大陆考试内容。
严禁用模型自身知识补充——仅根据知识库检索到的原文组织回答。
如知识库中无香港CTA相关资料，请明确回复「未找到相关税务师考试资料」，切勿编造或套用大陆考试内容。`;
  }

  function buildContentQuery(day, lang, scope) {
    const topic = getDayTopic(day, lang);
    const staticData = window.ExamLocale?.getDailyContent(day, lang) || window.EXAM_DAILY_CONTENT?.[day];
    const paper = staticData?.paper || '';
    const scopeBlock = buildScopeBlock(lang, scope);

    if (lang === 'en') {
      return `${scopeBlock}

Retrieve CTA (Chartered Tax Adviser / TIHK) exam study content for Day ${day}: "${topic}" (${paper}).

Include ONLY from CTA-relevant KB documents:
1) Syllabus requirements and exam scope
2) Detailed revision notes and key concepts
3) Relevant past paper questions analysis and exam techniques
4) Inland Revenue Ordinance (Cap.112) and IRD guidance references
5) Common exam traps and answering tips

Output in structured markdown with clear headings. Use English throughout.`;
    }
    return `${scopeBlock}

请检索香港特许税务师（CTA/TIHK）考试第${day}天学习内容「${topic}」（${paper}）。

仅基于税务师考试相关的考纲、复习资料和真题，输出：
1）考纲要点与考试范围
2）详细复习笔记和核心概念讲解
3）相关真题考点分析及答题技巧
4）税务条例（Cap.112）及税局（IRD）指引引用
5）常见考试陷阱和注意事项

用结构化 markdown 输出，分标题清晰，内容详实，紧扣考试要求。`;
  }

  function buildQuizQuery(day, lang, count, scope) {
    const topic = getDayTopic(day, lang);
    const n = count || 8;
    const scopeBlock = buildScopeBlock(lang, scope);

    if (lang === 'en') {
      return `${scopeBlock}

Retrieve CTA exam past paper / mock questions for Day ${day}: "${topic}".

Generate exactly ${n} multiple-choice questions ONLY from CTA-relevant KB material (past papers preferred).

Return ONLY a valid JSON array, no other text:
[{"question":"...","options":["A","B","C","D"],"answer":0,"explanation":"..."}]

Rules: answer is 0-based index (0-3); each question has exactly 4 options; explanations must cite relevant law/treaty where applicable.`;
    }
    return `${scopeBlock}

请检索香港CTA/TIHK考试第${day}天「${topic}」相关的真题和模拟题。

仅基于税务师考试知识库中的真题，生成${n}道单项选择题（优先真题改编）。

仅返回合法JSON数组，不要其他文字：
[{"question":"题目","options":["A选项","B选项","C选项","D选项"],"answer":0,"explanation":"解析"}]

规则：answer为正确选项索引(0-3)；每题4个选项；解析须引用相关法例或协定条文。`;
  }

  function isNoRelevantContent(text) {
    const t = (text || '').trim();
    return /未找到相关税务师|未找到.*CTA|No relevant CTA|no relevant.*exam material/i.test(t);
  }

  function looksMainlandTax(text) {
    const t = text || '';
    const mainland = [
      '中国税务师', '注册税务师', '税务师职业资格考试', '税法一', '税法二', '税法（一）', '税法（二）',
      '涉税服务', '金税四期', '国家税务总局', '企业所得税法', '增值税一般纳税人',
      '税务师协会', '全国税务师', 'china tax agent exam', 'mainland china tax'
    ];
    const hk = [
      '香港', 'CTA', 'TIHK', 'Cap.112', '税务条例', 'IRD', 'Inland Revenue',
      '薪俸税', '利得税', '物业税', '印花税', '个人入息课税', 'Paper 2', 'Paper 3', 'Paper 5',
      'salaries tax', 'profits tax', 'property tax', 'stamp duty'
    ];
    const mN = mainland.filter(k => t.includes(k)).length;
    const hN = hk.filter(k => t.toLowerCase().includes(k.toLowerCase())).length;
    return mN >= 1 && hN < 2;
  }

  function looksOffTopic(text) {
    if (looksMainlandTax(text)) return true;
    const lower = (text || '').toLowerCase();
    const off = ['hs编码', 'hs code', '报关单', '进出口贸易', '海关申报', '跨境物流', '报关实务'];
    const on = ['cta', 'tihk', '税务', 'tax', '利得税', '薪俸税', '物业税', 'profits tax', 'salaries tax',
      'property tax', 'stamp duty', 'cap.112', 'inland revenue', '常设机构', 'permanent establishment',
      '转让定价', 'transfer pricing', 'paper 2', 'paper 3', 'paper 5', '特许税务'];
    const offN = off.filter(k => lower.includes(k)).length;
    const onN = on.filter(k => lower.includes(k)).length;
    return offN >= 2 && onN < 2;
  }

  function parseQuizJson(text, day, lang) {
    const tryParse = (raw) => {
      try {
        const arr = JSON.parse(raw.trim());
        if (Array.isArray(arr)) return normalizeQuestions(arr, day, lang);
      } catch (e) { /* continue */ }
      return null;
    };

    let result = tryParse(text);
    if (result) return result;

    const codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeMatch) {
      result = tryParse(codeMatch[1]);
      if (result) return result;
    }

    const arrMatch = text.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      result = tryParse(arrMatch[0]);
      if (result) return result;
    }
    return null;
  }

  function normalizeQuestions(arr, day, lang) {
    const topic = day ? getDayTopic(day, lang) : t('sourceKb');
    const source = t('sourceKb');
    return arr.filter(q => q && q.question && Array.isArray(q.options) && q.options.length === 4)
      .map((q, i) => ({
        id: day != null ? `kb-${day}-${i}` : `kb-${i}`,
        topic,
        source,
        question: q.question,
        options: q.options,
        answer: typeof q.answer === 'number' ? q.answer : parseInt(q.answer, 10) || 0,
        explanation: q.explanation || ''
      }));
  }

  function getActiveQuizIds(day, lang) {
    const locale = lang || getLocale();
    const kbQuiz = getKbQuizDay(day, locale);
    if (kbQuiz && kbQuiz.length >= 5) {
      return { type: 'kb', questions: kbQuiz };
    }
    const ids = window.EXAM_DAILY_QUIZZES?.[day] || [];
    const bank = window.ExamLocale?.getQuestionBank(locale) || window.EXAM_QUESTION_BANK || [];
    const map = Object.fromEntries(bank.map(q => [q.id, q]));
    return { type: 'static', questions: ids.map(id => map[id]).filter(Boolean) };
  }

  return {
    getLocale, setLocale, t, getDayTopic,
    getKbContent, getKbQuiz, setKbContentDay, getKbContentDay,
    setKbQuizDay, getKbQuizDay, clearKbCache, getKbScope,
    buildContentQuery, buildQuizQuery, parseQuizJson,
    isNoRelevantContent, looksOffTopic, looksMainlandTax,
    getActiveQuizIds,
    KB_CONTENT_KEY, KB_QUIZ_KEY, LOCALE_KEY, DEFAULT_KB_SCOPE
  };
})();
