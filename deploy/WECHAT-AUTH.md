# 微信扫码登录配置

## 微信开放平台

1. 在 [微信开放平台](https://open.weixin.qq.com/) 创建**网站应用**。
2. 配置授权回调域：`www.daoith.com`
3. 授权回调 URL（页面）：`https://www.daoith.com/auth/wechat-callback.html`

## 环境变量（Vercel / VPS `.env`）

| 变量 | 说明 |
|------|------|
| `WECHAT_APP_ID` | 微信开放平台 AppID |
| `WECHAT_APP_SECRET` | 微信开放平台 AppSecret（仅服务端） |
| `JWT_SECRET` | JWT 签名密钥（随机长字符串） |
| `LIBSQL_URL` | 可选；生产推荐 Turso。本地默认 `file:data/daoith-auth.db` |
| `LIBSQL_AUTH_TOKEN` | Turso 认证令牌（使用 Turso 时必填） |

## 前端公开配置

在 `js/config.js` 中仅配置 **AppID**（可公开），使用占位符 `wx_placeholder_app_id`，部署时替换为真实 AppID：

```js
wechatAppId: 'wx_your_real_app_id',
wechatRedirectUri: 'https://www.daoith.com/auth/wechat-callback.html',
```

**切勿**在前端写入 AppSecret。

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/wechat/login` | Body: `{ "code": "..." }`，返回 `{ token, user }` |
| GET | `/api/auth/wechat/me` | Header: `Authorization: Bearer <token>` |

## 健康检查

`GET /api/health` 返回 `wechat_configured` 与 `jwt_configured` 状态。

## 本地开发

```bash
cp .env.example .env
# 填写 WECHAT_APP_ID、WECHAT_APP_SECRET、JWT_SECRET

npm install
python3 server.py
# 访问 http://127.0.0.1:8080
```

本地回调需使用内网穿透或将微信回调域临时指向测试环境。
