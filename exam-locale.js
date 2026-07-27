/* Locale-aware content, questions & i18n */
window.ExamLocale = (function () {
  const LOCALE_KEY = 'hkTaxExamLocale';

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

  function getDailyContent(day, lang) {
    const locale = lang || getLocale();
    const zh = window.EXAM_DAILY_CONTENT?.[day];
    const en = window.EXAM_DAILY_CONTENT_EN?.[day];
    if (locale === 'en') return en || zh || null;
    return zh || null;
  }

  function getQuestionBank(lang) {
    const locale = lang || getLocale();
    if (locale === 'en' && window.EXAM_QUESTION_BANK_EN?.length) {
      return window.EXAM_QUESTION_BANK_EN;
    }
    return window.EXAM_QUESTION_BANK || [];
  }

  function getDayQuestionIds(day) {
    return window.EXAM_DAILY_QUIZZES?.[day] || [];
  }

  function getDayQuestions(day, lang) {
    const bank = getQuestionBank(lang);
    const map = Object.fromEntries(bank.map(q => [q.id, q]));
    return getDayQuestionIds(day).map(id => map[id]).filter(Boolean);
  }

  function getTopicLabel(topic, lang) {
    const locale = lang || getLocale();
    const map = window.EXAM_I18N?.topicLabels;
    if (map?.[topic]) return map[topic][locale] || map[topic].zh || topic;
    return topic;
  }

  return {
    getLocale, setLocale, t, getDayTopic,
    getDailyContent, getQuestionBank,
    getDayQuestionIds, getDayQuestions, getTopicLabel,
    LOCALE_KEY
  };
})();
