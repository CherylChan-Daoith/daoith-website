/* Public API endpoints — no secrets in this file */
window.DAOITH_CONFIG = {
  difyApiBase: 'https://api.daoith.com',
  // Plan generation / HS / tax → original Dify app via /v1/chat-messages
  // Floating chatbot → separate Chatflow via /v1/chatbot/chat-messages
  difyEndpoint: '/v1/chat-messages',
  difyDiagnosisEndpoint: '/v1/chat-messages',
  difyHsRateEndpoint: '/v1/chat-messages',
  difyTaxCalcEndpoint: '/v1/chat-messages',
  difyChatEndpoint: '/v1/chatbot/chat-messages',
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
  // TODO: 替换为营业执照上的公司全称与深圳实际办公地址（含门牌号）
  companyLegalName: '【请填写营业执照上的公司全称】',
  companyAddress: '【请填写深圳市具体实际办公地址（含门牌号）】',
  companyEmail: 'service@daoith.com',
};
