# Agent 须知（道一官网）

接手先读本机知识库，不要只靠 Git。

知识库（仅本机，不进 GitHub）：[`../daoith-project-kb/INDEX.md`](../daoith-project-kb/INDEX.md)

## 新对话按这个顺序读

1. 知识库 `INDEX.md` → `05-preferences.md` → `03-decisions.md` → `04-pitfalls.md`
2. 最新一篇 `daily/YYYY-MM-DD.md` 里的「未完成」
3. 本仓库 `git log` 最近几天
4. 按任务再下钻知识库 `topics/`（诊断、Dify、微信、Hub、前端）

## 本地怎么跑

```bash
cd ~/Projects/daoith-website
python3 server.py    # http://localhost:8080
```

改 `js/main.js` / `css/styles.css` 后必须 bump `index.html` 里对应 `?v=`，并提醒硬刷新。

## 收工

用户说「今天整理」：只读本仓库（及如有则 `daoith-pm`）的 Git 与未跟踪目录摘要，只写知识库 Markdown。记整个项目当天的改动，不限哪个聊天框。写法见知识库 `06-daily-workflow.md`。

## 硬约束

- 改 Dify 提示词必须联检官网：`.cursor/rules/dify-prompt-frontend-sync.mdc`
- 不要擅自 commit / push / 生产部署 / 往 Dify 粘贴发布；用户说了再做
- 不对访客说出路径字母（Y / D / X / Z / C / B / A）
