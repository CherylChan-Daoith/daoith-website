---
name: daily-kb-log
description: Appends DAOITH local project notes when the user says 今天整理, 记到知识库, 收工, 写日报, or 更新项目知识库. Reads this repo's git for the whole day; writes only ~/Projects/daoith-project-kb; never edits the website, Dify, or servers.
---

# 每日整理（只写知识库）

从本仓库收工时同样适用。完整步骤以 `~/Projects/daoith-project-kb/.cursor/skills/daily-kb-log/SKILL.md` 为准。

只改 `~/Projects/daoith-project-kb`。可只读本仓库与 `~/Projects/daoith-pm` 的 Git。不要改本仓库代码、不要登录 Dify、不要 SSH、不要 git commit / push。

1. 按 `daily/_template.md` 写或追加当天 `daily/YYYY-MM-DD.md`。
2. 内容以**当天（及上一篇日记之后）的 Git 全项目**为准，不限当前聊天框。未跟踪只写目录摘要。
3. 新决策 / 新坑写知识库 `03` / `04`。更新 `INDEX.md` 截止日与「现在进行中」。
4. 向用户汇报写了哪些笔记文件。
