# 将 www.daoith.com 从 Vercel 迁回阿里云

目标：国内访问稳定。`api.daoith.com` / `pm.daoith.com` 已在阿里云 `47.107.136.37`；目前 `www` 仍指 Vercel。

**重要：** 同机默认站点目前是 PM（Next.js）。若 DNS 先切、www 的 nginx 未配好，访问 www 会落到 PM 登录页。务必 **先上站再切 DNS**。

---

## 0. 前置

- [ ] 本机能 `ssh` 登录该机（文档示例主机名 `daoith-pm`，或 `ubuntu@47.107.136.37` + 密钥）
- [ ] 阿里云安全组已放行 **80 / 443**
- [ ] 备案主体仍覆盖 `www.daoith.com`（你们已有粤 ICP / 公安备案）

---

## 1. 同步官网代码到服务器

在仓库根目录：

```bash
chmod +x deploy/deploy.sh
./deploy/deploy.sh daoith-pm
# 或：./deploy/deploy.sh ubuntu@47.107.136.37
```

脚本会 rsync 到 `/var/www/daoith-website`，并尝试重启 `daoith-auth`（8787）。

确认：

```bash
ssh daoith-pm 'curl -sf http://127.0.0.1:8787/api/health'
# 期望含 wechat / jwt / database 等字段
ls /var/www/daoith-website/index.html
```

若 8787 未起：检查 `/var/www/daoith-website/.env`（勿从本机覆盖），再：

```bash
sudo cp /var/www/daoith-website/deploy/daoith-api.service /etc/systemd/system/daoith-auth.service
# 或沿用现有 daoith-auth unit
sudo systemctl daemon-reload
sudo systemctl enable --now daoith-auth
```

---

## 2. 配置 www 的 Nginx（与 api/pm 并存）

```bash
sudo cp /var/www/daoith-website/deploy/nginx.daoith.conf /etc/nginx/sites-available/daoith-www
sudo ln -sf /etc/nginx/sites-available/daoith-www /etc/nginx/sites-enabled/daoith-www
sudo nginx -t && sudo systemctl reload nginx
```

该配置会：

- `www.daoith.com` → 静态站 `/var/www/daoith-website`
- `/api/*` → `127.0.0.1:8787`（微信登录等同域，不再依赖 Vercel Functions）
- `daoith.com` → 301 到 `https://www.daoith.com`

---

## 3. 申请 www 证书（DNS 未切前可用 HTTP-01 + 临时解析，或 DNS-01）

**推荐顺序（少中断）：**

1. 先在阿里云 DNS **临时**加一条：`www-aliyun` A → `47.107.136.37`（或用已有服务器域名做预览）
2. 或：临时把 `www` TTL 降到 600，准备好后一次切 A 记录，立刻：

```bash
sudo certbot --nginx -d www.daoith.com -d daoith.com
sudo nginx -t && sudo systemctl reload nginx
```

证书目录需与 `nginx.daoith.conf` 一致：

`/etc/letsencrypt/live/www.daoith.com/`

**切 DNS 前自检（用 Host 头，不依赖公网解析）：**

```bash
curl -sI -H 'Host: www.daoith.com' http://127.0.0.1/ | head
# 配好 HTTPS 后：
curl -skI --resolve www.daoith.com:443:127.0.0.1 https://www.daoith.com/ | head
curl -sk --resolve www.daoith.com:443:127.0.0.1 https://www.daoith.com/api/health
```

页面应是官网首页，**不是** PM 的 `/auth/refresh`。

---

## 4. 切换 DNS（阿里云控制台）

域名：`daoith.com` → 解析设置：

| 主机记录 | 原值（示意） | 改为 |
|----------|--------------|------|
| `www` | CNAME → `*.vercel-dns.com` | **A → `47.107.136.37`** |
| `@` | Vercel A | **A → `47.107.136.37`**（由 nginx 跳 www） |

TTL 建议先 **600 秒**。删掉冲突的旧 CNAME/A。

验证：

```bash
dig +short www.daoith.com A
# 应出现 47.107.136.37
curl -sI https://www.daoith.com/ | head
curl -s https://www.daoith.com/api/health
```

---

## 5. 上线检查清单

- [ ] https://www.daoith.com 首页（国内网络）
- [ ] https://daoith.com → www
- [ ] `/service.html?id=domestic-compliance-bookkeeping`
- [ ] 微信扫码登录（回调域仍是 `www.daoith.com`）
- [ ] AI 方案 / 智能客服（仍走 `https://api.daoith.com`）
- [ ] `api` / `pm` 不受影响

---

## 6. Vercel（切稳后再做）

- 生产域名可先保留作回滚；确认国内稳定 1–2 天后再在 Vercel **Domains** 解绑 `www.daoith.com` / `daoith.com`
- GitHub → Vercel 自动部署可继续用于预览，但不再服务生产 www

---

## 7. 日常更新

```bash
git push   # 存档
./deploy/deploy.sh daoith-pm
```

（可选后续）加 GitHub Actions：push `main` 后 SSH rsync，接近原 Vercel 体验。

---

## 回滚

把 `www` / `@` DNS 改回 Vercel 记录即可（保留原 CNAME/A 截图）。服务器上的 `/var/www/daoith-website` 可保留不动。
