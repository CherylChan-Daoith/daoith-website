# www.daoith.com 部署指南

## 前置条件

1. **域名** `daoith.com` 已在注册商完成实名并持有管理权
2. **云服务器**（阿里云 / 腾讯云 / 华为云等）Ubuntu 22.04+ 或 CentOS 7+
3. 服务器已开放 **80、443** 端口
4. 本地已配置 SSH 免密或密码登录

---

## 一、DNS 配置（在域名注册商控制台）

| 类型 | 主机记录 | 记录值 |
|------|----------|--------|
| A | @ | 你的服务器公网 IP |
| A | www | 你的服务器公网 IP |

生效后验证：

```bash
dig +short www.daoith.com
```

---

## 二、服务器首次初始化（SSH 登录后执行一次）

```bash
# 安装依赖
sudo apt update
sudo apt install -y nginx python3 certbot python3-certbot-nginx

# 创建目录
sudo mkdir -p /var/www/daoith-website
sudo chown -R $USER:$USER /var/www/daoith-website
```

---

## 三、本地上传代码

在项目根目录执行：

```bash
chmod +x deploy/deploy.sh
./deploy/deploy.sh root@你的服务器IP
```

**首次部署后**，在服务器上创建 API 密钥（不要从本地上传 .env）：

```bash
ssh root@你的服务器IP
sudo nano /var/www/daoith-website/.env
```

写入：

```env
DEEPSEEK_API_KEY=sk-你的密钥
```

然后重启 API：

```bash
sudo systemctl restart daoith-api
curl http://127.0.0.1:8787/api/health
```

---

## 四、Nginx + HTTPS

```bash
# 先使用 HTTP 配置申请证书（可临时注释 nginx 中 SSL 块，仅用 80 端口）
sudo cp /var/www/daoith-website/deploy/nginx.daoith.conf /etc/nginx/sites-available/daoith
sudo ln -sf /etc/nginx/sites-available/daoith /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# 申请 Let's Encrypt 证书
sudo certbot --nginx -d www.daoith.com -d daoith.com

sudo nginx -t && sudo systemctl reload nginx
```

---

## 五、验证

- https://www.daoith.com — 首页
- https://www.daoith.com/api/health — 应返回 `{"ok":true,"deepseek_configured":true}`
- https://www.daoith.com/#ai-solution — AI 方案生成

---

## 更新网站

代码修改后重新执行：

```bash
./deploy/deploy.sh root@你的服务器IP
```

`.env` 不会被 rsync 覆盖（已排除）。
