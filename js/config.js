/* Public API endpoints — no secrets in this file */
window.DAOITH_CONFIG = {
  difyApiBase: 'https://api.daoith.com',
  // Dify Chat App: POST /v1/chat-messages
  // Dify Workflow App: change endpoints to '/v1/workflows/run'
  difyEndpoint: '/v1/chat-messages',
  difyDiagnosisEndpoint: '/v1/chat-messages',
  difyHsRateEndpoint: '/v1/chat-messages',
  difyTaxCalcEndpoint: '/v1/chat-messages',
  // WeChat Open Platform — AppID is public; AppSecret stays server-side only
  wechatAppId: 'wx1706a25af11cde09',
  wechatRedirectUri: 'https://www.daoith.com/auth/wechat-callback.html',
  wechatScope: 'snsapi_login',
  authApiBase: '',
};
