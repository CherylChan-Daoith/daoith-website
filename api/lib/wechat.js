const WECHAT_TOKEN_URL = 'https://api.weixin.qq.com/sns/oauth2/access_token';
const WECHAT_USERINFO_URL = 'https://api.weixin.qq.com/sns/userinfo';

function getWeChatCredentials() {
  const appId = process.env.WECHAT_APP_ID?.trim();
  const appSecret = process.env.WECHAT_APP_SECRET?.trim();
  if (!appId || !appSecret) {
    throw new Error('WECHAT_APP_ID or WECHAT_APP_SECRET is not configured');
  }
  return { appId, appSecret };
}

async function parseWeChatJson(response) {
  const data = await response.json();
  if (data.errcode) {
    const err = new Error(data.errmsg || `WeChat API error ${data.errcode}`);
    err.code = data.errcode;
    throw err;
  }
  return data;
}

export async function exchangeWeChatCode(code) {
  const { appId, appSecret } = getWeChatCredentials();
  const params = new URLSearchParams({
    appid: appId,
    secret: appSecret,
    code,
    grant_type: 'authorization_code',
  });

  const response = await fetch(`${WECHAT_TOKEN_URL}?${params.toString()}`);
  return parseWeChatJson(response);
}

export async function fetchWeChatUserInfo(accessToken, openid) {
  const params = new URLSearchParams({
    access_token: accessToken,
    openid,
    lang: 'zh_CN',
  });

  const response = await fetch(`${WECHAT_USERINFO_URL}?${params.toString()}`);
  return parseWeChatJson(response);
}
