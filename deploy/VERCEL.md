# Vercel 部署 www.daoith.com

## 1. 安装 Vercel CLI（一次性）

```bash
npm i -g vercel
```

或使用 npx（无需全局安装）：

```bash
npx vercel
```

## 2. 登录并部署

在项目根目录：

```bash
cd ~/Projects/daoith-website
npx vercel login
npx vercel --prod
```

首次会问项目名，直接回车即可。

## 3. 配置 DeepSeek 密钥

Vercel 控制台 → 你的项目 → **Settings → Environment Variables**

| Name | Value |
|------|-------|
| `DEEPSEEK_API_KEY` | `sk-你的密钥` |

勾选 Production、Preview，保存后 **Redeploy** 一次。

## 4. 绑定域名 www.daoith.com

Vercel 控制台 → **Settings → Domains** → 添加：

- `www.daoith.com`
- `daoith.com`（自动跳转到 www）

Vercel 会给出 DNS 记录，到域名注册商添加：

| 类型 | 主机 | 值 |
|------|------|-----|
| CNAME | www | `cname.vercel-dns.com` |
| A | @ | `76.76.21.21`（以 Vercel 页面显示为准） |

生效后访问：https://www.daoith.com

## 5. 验证

```bash
curl https://www.daoith.com/api/health
```

应返回：`{"ok":true,"deepseek_configured":true}`

## 后续更新

```bash
npx vercel --prod
```

或连接 GitHub 仓库，推送代码后自动部署。
