# 部署 www.daoith.com（Vercel + 阿里云 DNS）

GitHub：`CherylChan-Daoith/daoith-website`  
域名注册商：阿里云

---

## 一、推送代码到 GitHub

### 1. 在 GitHub 创建仓库

1. 登录 https://github.com/CherylChan-Daoith
2. 点击 **New repository**
3. 仓库名：`daoith-website`
4. 选 **Private** 或 Public（建议 Private，避免暴露业务细节）
5. **不要**勾选 "Add a README"（本地已有代码）
6. 创建仓库

### 2. 本地推送

```bash
cd ~/Projects/daoith-website

git remote add origin https://github.com/CherylChan-Daoith/daoith-website.git
git push -u origin main
```

若提示登录，用 GitHub Personal Access Token 作为密码。

---

## 二、Vercel 部署

1. 打开 https://vercel.com → 用 GitHub 登录
2. **Add New → Project** → 选择 `CherylChan-Daoith/daoith-website`
3. Framework Preset 选 **Other**（无需构建命令）
4. 点击 **Deploy**，等待约 1–2 分钟
5. 部署成功后进入项目 → **Settings → Environment Variables**

添加：

| Key | Value | 环境 |
|-----|-------|------|
| `DEEPSEEK_API_KEY` | 你的 `sk-...` 密钥 | Production + Preview |

6. 保存后到 **Deployments** → 最新部署右侧 **⋯** → **Redeploy**

### 验证（部署完成后）

访问 Vercel 给的临时地址，例如：

```
https://daoith-website-xxx.vercel.app/api/health
```

应返回：`{"ok":true,"deepseek_configured":true}`

---

## 三、Vercel 绑定域名

1. Vercel 项目 → **Settings → Domains**
2. 添加 `www.daoith.com`，再添加 `daoith.com`
3. Vercel 会显示需要配置的 DNS 记录（记下具体值）

通常类似：

| 用途 | 类型 | 主机记录 | 记录值 |
|------|------|----------|--------|
| www | CNAME | www | `cname.vercel-dns.com` |
| 根域名 | A | @ | `76.76.21.21` |

**以 Vercel 页面实时显示的为准。**

---

## 四、阿里云 DNS 配置

1. 登录 [阿里云控制台](https://dns.console.aliyun.com/)
2. 左侧 **域名解析** → 找到 `daoith.com` → **解析设置**
3. 点击 **添加记录**，按 Vercel 要求添加：

### 记录 1：www 子域名

| 字段 | 填写 |
|------|------|
| 记录类型 | CNAME |
| 主机记录 | www |
| 解析请求来源 | 默认 |
| 记录值 | `cname.vercel-dns.com`（以 Vercel 显示为准） |
| TTL | 10 分钟 |

### 记录 2：根域名 @

| 字段 | 填写 |
|------|------|
| 记录类型 | A |
| 主机记录 | @ |
| 记录值 | `76.76.21.21`（以 Vercel 显示为准） |
| TTL | 10 分钟 |

> 若阿里云提示「根域名不能使用 CNAME」，用 Vercel 提供的 **A 记录** 即可。

4. 删除冲突的旧解析（如有指向其他服务器的 A/CNAME 记录）
5. 等待 10 分钟～2 小时生效

### 验证 DNS

```bash
dig +short www.daoith.com
dig +short daoith.com
```

---

## 五、HTTPS

Vercel 会自动为自定义域名申请并续期 SSL 证书，无需在阿里云额外配置。

---

## 六、上线检查清单

- [ ] https://www.daoith.com 可打开首页
- [ ] https://daoith.com 自动跳转到 www
- [ ] https://www.daoith.com/api/health 返回 `deepseek_configured: true`
- [ ] AI 方案生成可用（/#ai-solution）

---

## 七、后续更新网站

本地改完代码后：

```bash
cd ~/Projects/daoith-website
git add .
git commit -m "更新说明"
git push
```

Vercel 会自动重新部署，约 1–2 分钟生效。

---

## 常见问题

**Q：域名解析不生效？**  
检查阿里云是否实名认证、是否有多条冲突记录、DNS 是否刚修改需等待。

**Q：AI 功能报错？**  
确认 Vercel 环境变量 `DEEPSEEK_API_KEY` 已设置并 Redeploy。

**Q：只想本地预览？**  
`python3 server.py` → http://localhost:8080
