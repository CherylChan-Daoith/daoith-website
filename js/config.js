/* Public API endpoints — no secrets in this file */
window.DAOITH_CONFIG = {
  difyApiBase: 'https://api.daoith.com',
  // Dify Chat App: POST /v1/chat-messages
  // Dify Workflow App: change endpoints to '/v1/workflows/run'
  difyEndpoint: '/v1/chat-messages',
  difyDiagnosisEndpoint: '/v1/chat-messages',
  difyHsRateEndpoint: '/v1/chat-messages',
  difyTaxCalcEndpoint: '/v1/chat-messages',
};
