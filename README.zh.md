**中文** | [English](README.md)

---

# Obsidian Sync for Claude Code

跨 Agent 可用的 Skill — 将代码库自动同步为 Obsidian 知识图谱。

> 本 Skill 遵循 [Agent Skills 规范](https://github.com/anthropics/skills)，兼容 **Claude Code**、**Codex CLI** 与 **OpenCode** 等支持 skills 的 Agent。

---

## 功能介绍

本 Skill 连接你的 Agent 与 Obsidian，自动分析项目代码库，拆分生成以下层级结构：

```
项目 → 模块 → 服务 → 外部 API → 类/接口 → 方法 → 数据表
```

每个层级生成独立的 Markdown 文件，自动添加 Obsidian 双向链接（wikiLink），在你的本地 Vault 中构建项目架构图谱。

![效果](preview.png)
### 与大模型对话的优势

- **精准检索**：大模型无需遍历整个代码库，即可通过图谱层级快速定位目标文件。
- **按需加载**：是减少探索性读取，不是替代源码。它像一个索引/目录，让大模型能精准定位。
- **上下文聚焦**：每次对话只需加载相关节点的 Markdown 摘要，而非完整源码，显著降低 token 消耗。
- **持久记忆**：项目结构、设计决策、开发日志都被结构化保存在本地，跨会话复用无需重复解释。
- **安全可控**：所有图谱数据仅存储在你的本地 Obsidian Vault 中，不上传云端，敏感代码零泄露风险。

---

## 安装

```bash
需要提前安装obsidian客户端
```

### Claude Code — Plugin Marketplace

```bash
/plugin marketplace add CzhJing/obsidian-sync-skill
/plugin install obsidian-sync@obsidian-sync-skill
```

---
### 首次使用

1. 系统会询问你的 Obsidian Vault 绝对路径（例如 `/Users/yourname/Documents/obsidian`）。
2. 输入路径后，Skill 会：
   - 创建 Vault 标准目录结构（`10-19 Projects` 等）
   - 识别当前项目，分配 JD 编号
   - 按你选择的粒度生成项目架构图谱

### 菜单选项

首次同步后，再次运行 `/obsidian-sync` 会出现以下菜单：

| 选项 | 说明 |
|------|------|
| 1 | 更新描述与技术栈 |
| 2 | 添加开发日志 |
| 3 | 更新项目仓库 |
| 4 | 完整同步 |

---

## 使用自动加载（项目级）

如果你希望**每次对话都自动**遵循"先图谱、后源码"的规则，请在项目根目录创建 `.claude/CLAUDE.md`，并将以下内容粘贴进去：

````markdown
## Obsidian Hook 输出处理

当工具调用前看到 `[Obsidian Context]` 开头的输出时，
优先将其作为当前任务的架构上下文，再执行搜索或代码操作。
````

---

## License

MIT
