# 道一跨境咨询 DAOITH Consulting 官网

跨境电商财税合规一站式解决方案官方网站。

- **域名**: [daoith.com](https://daoith.com)
- **首页**: [www.daoith.com](https://www.daoith.com)

## 项目结构

```
daoith-website/
├── index.html          # 主页面（单页应用）
├── css/
│   └── styles.css      # 样式文件
├── js/
│   └── main.js         # 交互逻辑
├── images/
│   └── logo.png        # 品牌 Logo
└── README.md
```

## 功能模块

- **首页 Hero** — 品牌展示、核心数据、功能亮点
- **AI 解决方案** — 业务信息表单、AI 方案生成、FAQ、税负计算器
- **专家解读** — 财税洞察文章列表
- **财税服务** — 服务交易商城，支持分类筛选
- **服务管理** — 订单追踪、投诉建议、微信通知
- **政策速递** — 政策搜索与区域/来源筛选
- **关于我们** — 企业愿景、使命、价值观
- **创始团队** — 核心团队成员介绍

## 本地预览

使用内置服务器（含 DeepSeek API 代理）：

```bash
cd daoith-website

# 1. 配置 API Key（复制 .env.example 为 .env 并填入密钥）
cp .env.example .env

# 2. 启动服务
python3 server.py
```

然后访问 http://localhost:8080

AI 方案生成与税负计算通过 `POST /api/deepseek` 调用 DeepSeek 大模型。未配置 Key 时会提示错误，税负计算会回退到本地公式。

仅静态预览（无 AI）：

```bash
python3 -m http.server 8080
```

## 部署

### 方式一：Nginx / Apache

将项目文件上传至服务器 Web 根目录，配置域名指向即可。

Nginx 配置示例：

```nginx
server {
    listen 80;
    server_name www.daoith.com daoith.com;
    root /var/www/daoith-website;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 方式二：Vercel / Netlify

1. 将代码推送到 GitHub
2. 在 Vercel 或 Netlify 中导入仓库
3. 配置自定义域名 `www.daoith.com`
4. 在域名 DNS 中添加 CNAME 记录指向部署平台

### 方式三：阿里云 OSS / 腾讯云 COS

1. 创建存储桶并开启静态网站托管
2. 上传所有文件
3. 绑定自定义域名并配置 CDN 加速

## DNS 配置

在域名注册商处添加以下记录：

| 类型  | 主机记录 | 记录值              |
|-------|----------|---------------------|
| A     | @        | 服务器 IP 地址       |
| CNAME | www      | 部署平台提供的地址   |

## 技术栈

- 纯静态 HTML / CSS / JavaScript
- 无需构建工具，开箱即用
- 响应式设计，支持移动端

## 联系方式

- 客服热线：400-888-6688
- 邮箱：service@daoith.com
