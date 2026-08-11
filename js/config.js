/* Public API endpoints — no secrets in this file */
window.DAOITH_CONFIG = {
  difyApiBase: 'https://api.daoith.com',
  // Plan generation / HS / tax → 「道一合规方案助手」via /v1/chat-messages
  // Floating chatbot → 「道一财税诊断助手」Agent via /v1/diagnosis/chat-messages
  difyEndpoint: '/v1/chat-messages',
  difyDiagnosisEndpoint: '/v1/chat-messages',
  difyHsRateEndpoint: '/v1/chat-messages',
  difyTaxCalcEndpoint: '/v1/chat-messages',
  difyChatEndpoint: '/v1/diagnosis/chat-messages',
  // Left-side HS export rebate → Dataset Retrieve via Aliyun API (not Chat app)
  hsRefundApiPath: '/api/hs-refund-rate',
  // WeChat Open Platform — AppID is public; AppSecret stays server-side only
  wechatAppId: 'wx1706a25af11cde09',
  wechatRedirectUri: 'https://www.daoith.com/auth/wechat-callback.html',
  wechatScope: 'snsapi_login',
  // WeChat Official Account (服务号) — public AppID for OAuth / notify bind
  wechatOaAppId: 'wx97e47510bad476a0',
  // Same-origin Vercel API — Aliyun api.daoith.com currently times out on WeChat exchange
  authApiBase: '',
  // Notify bind / status live on Aliyun (OA AppSecret + DB)
  notifyApiBase: 'https://api.daoith.com',

  // 公安备案 / 网站公示信息（须与营业执照及实际办公地一致；勿使用虚拟地址）
  companyLegalName: '道一天成企业管理（深圳）有限责任公司',
  companyAddress: '深圳市龙华区龙华街道清华社区和平路和平时代广场一单元1412',
  companyEmail: 'service@daoith.com',
};
