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
};
