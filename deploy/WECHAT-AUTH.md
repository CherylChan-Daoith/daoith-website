# 微信扫码登录配置

## 微信开放平台

1. 在 [微信开放平台](https://open.weixin.qq.com/) 创建**网站应用**。
2. 配置授权回调域：`www.daoith.com`
3. 授权回调 URL（页面）：`https://www.daoith.com/auth/wechat-callback.html`

## 环境变量

| 变量 | 说明 |
|------|------|
| `WECHAT_APP_ID` | 微信开放平台 AppID |
| `WECHAT_APP_SECRET` | 微信开放平台 AppSecret（仅服务端） |
| `JWT_SECRET` | JWT 签名密钥（随机长字符串） |
| `DATABASE_URL` | PostgreSQL 连接串，指向新建库 `daoith_users` |
| `DATABASE_SSL` | 可选，设为 `true` 时启用 SSL |

## 第四步：共用 Dify 的 PostgreSQL（推荐）

Dify Docker Compose 已带 Postgres 容器。为网站登录**单独建库**，不要往 Dify 的 `dify` 库里写表。

### 1. 找到 Postgres 容器与密码

在 Dify 部署目录执行：

```bash
docker compose ps
# 常见容器名类似：docker-db-1 / dify-db-1

# 密码一般在 .env 里，例如：
grep -E 'DB_PASSWORD|POSTGRES_PASSWORD' .env
```

常见默认（以你实际 `.env` 为准）：

- 用户：`postgres`
- 密码：`.env` 中的 `DB_PASSWORD` / `POSTGRES_PASSWORD`
- 端口：宿主机映射多为 `5432`

### 2. 新建数据库 `daoith_users`

```bash
# 把 <db-container> 换成实际容器名
docker exec -it <db-container> psql -U postgres -c "CREATE DATABASE daoith_users;"
```

表结构会在首次登录时由后端自动创建／迁移，也可手动执行：

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  openid TEXT NOT NULL UNIQUE,
  unionid TEXT,
  nickname TEXT,
  avatar_url TEXT,
  country TEXT,
  province TEXT,
  city TEXT,
  phone TEXT,
  last_login_at TIMESTAMPTZ,
  login_count INTEGER NOT NULL DEFAULT 0,
  last_login_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_openid ON users(openid);
```

额外环境变量（推送到 `pm.daoith.com` 网站用户分析）：

| 变量 | 说明 |
|------|------|
| `PM_SYNC_URL` | 可选，默认 `https://pm.daoith.com` |
| `PM_SYNC_SECRET` | 与 PM 的 `WEBSITE_SYNC_SECRET` 相同 |
### 3. 配置 `DATABASE_URL`

在网站服务端 `.env` / Vercel 环境变量中设置：

```bash
DATABASE_URL=postgresql://postgres:你的密码@127.0.0.1:5432/daoith_users
```

说明：

- **登录 API 与 Dify 在同一台阿里云服务器**：用 `127.0.0.1` 或 Docker 网络主机名即可。
- **网站仍在 Vercel，而 Postgres 只在内网**：Vercel **连不上** Docker 内网库。请二选一：
  1. 把 `/api/auth/*` 跑在阿里云（Nginx 反代到本机 `server.py`），或
  2. 仅对受信 IP 安全暴露 5432（不推荐对公网完全开放）。

本地 Python 开发若用 Postgres，需安装：

```bash
pip install psycopg2-binary
```

未配置 `DATABASE_URL` 时，本地 `server.py` 会回退到 SQLite 文件 `data/daoith-auth.db`。

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

`GET /api/health` 返回 `wechat_configured`、`jwt_configured`、`database_configured`。

## 本地开发

```bash
cp .env.example .env
# 填写 WECHAT_APP_ID、WECHAT_APP_SECRET、JWT_SECRET、DATABASE_URL

npm install
pip install psycopg2-binary   # 使用 Postgres 时
python3 server.py
# 访问 http://127.0.0.1:8080
```
