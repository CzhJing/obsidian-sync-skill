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

### 与大模型对话的优势

- **精准检索**：大模型无需遍历整个代码库，即可通过图谱层级快速定位目标文件。
- **上下文聚焦**：每次对话只需加载相关节点的 Markdown 摘要，而非完整源码，显著降低 token 消耗。
- **持久记忆**：项目结构、设计决策、开发日志都被结构化保存在本地，跨会话复用无需重复解释。
- **安全可控**：所有图谱数据仅存储在你的本地 Obsidian Vault 中，不上传云端，敏感代码零泄露风险。

---

## 安装

### Claude Code — Plugin Marketplace

```bash
# 若本 Skill 已发布到 Marketplace
claude plugin marketplace add CzhJing/obsidian-sync-skill
claude plugin install obsidian-sync@obsidian-sync-skill
```

### Claude Code — 本地插件安装

```bash
git clone https://github.com/CzhJing/obsidian-sync-skill.git
cd obsidian-sync-skill
claude plugin install .
```

### Claude Code — 手动复制到 skills 目录

将 skill 复制到 Claude Code 的 skills 目录：

```bash
# 项目级：放在当前项目内
mkdir -p .claude/skills
cp -r skills/obsidian-sync .claude/skills/

# 或用户级：~/.claude/skills/
ln -s $(pwd)/skills/obsidian-sync ~/.claude/skills/obsidian-sync
```

### Codex CLI

将 `skills/` 目录复制到 Codex skills 路径：

```bash
mkdir -p ~/.codex/skills
cp -r skills/obsidian-sync ~/.codex/skills/
```

### OpenCode

将完整仓库克隆到 OpenCode skills 目录（**不要**只复制内部的 `skills/` 文件夹）：

```bash
git clone https://github.com/CzhJing/obsidian-sync-skill.git ~/.opencode/skills/obsidian-sync-skill
```

OpenCode 会自动发现 `~/.opencode/skills/` 下的所有 `SKILL.md` 文件。重启 OpenCode 后即可使用。

### npx skills

```bash
npx skills add git@github.com:CzhJing/obsidian-sync-skill.git
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

## 使用

本 Skill 提供**两种方式**使用，选择适合你工作流的一种：

### 方式 A：按需触发（手动）

每次需要 Agent 先读取 Obsidian 架构图谱时，在消息开头加上 `/obsidian-sync`。例如：

```
/obsidian-sync 实现购物车批量删除功能
/obsidian-sync 修复用户登录的 bug
/obsidian-sync 帮我写 OrderService 的单元测试
```

这种方式最简单，无需额外配置。

### 方式 B：自动加载（项目级）

如果你希望**每次对话都自动**遵循"先图谱、后源码"的规则，而不需要每次都手动输入 `/obsidian-sync`，请在项目根目录创建 `.claude/CLAUDE.md`，并将以下内容粘贴进去：

````markdown
# 项目开发工作流 — 优先读取 Obsidian 架构图谱

> 将本文件放入你的项目根目录 `.claude/CLAUDE.md`，Claude Code 会在每次会话中自动加载。

---

## 核心原则：先图谱，后源码

在处理任何以下类型的请求时，**不要先直接 grep/read 源码**。必须优先从 Obsidian 架构文档中获取上下文，再决定是否读取具体代码文件：

- 实现新功能 / 添加接口 / 开发模块
- 修复 Bug / 排查问题
- 重构代码 / 优化性能
- 解释某个模块、类或方法的工作原理
- 编写测试用例

---

## 读取顺序（严格遵循）

1. **定位项目目录**
   根据当前 `cwd` 最后一级目录名，在 `VAULT_PATH/10-19 Projects/` 下匹配 `NN {项目名}` 文件夹。
   验证顶层文件 `NN.00 {项目名}.md` 中的 `**Location:**` 字段与 `cwd` 一致。

2. **读取顶层项目文件**
   `Read → VAULT_PATH/10-19 Projects/NN {项目名}/NN.00 {项目名}.md`
   重点获取：技术栈、模块列表（`## 层级结构`）、核心文件映射（`## 核心文件`）。

3. **根据用户请求定位相关模块/服务**
   通过用户提到的关键词（如"购物车"、"订单"、"用户"等），在顶层文件的 `## 层级结构` 中找到对应的 wikiLink，然后读取该模块/服务的 MD 文件。
   例如：用户说"购物车批量删除" → 读取 `NN.MM cart-service.md` → 再读 `NN.MM.SS CartService.md`。

4. **按需下钻到类/方法层级（仅当 type 为 B-文件级细节 时）**
   如果项目粒度为 `B-文件级细节`，且用户问题足够具体，继续读取相关的类/接口/方法 MD 文件（如 `NN.MM.SS.CC CartController.md`）。

5. **最后才读取源码**
   在理解了架构上下文后，再使用 `Grep` / `Glob` / `Read` 去读取具体的源代码文件进行实现。

---

## 回退策略

- 如果在 `10-19 Projects/` 下**未找到匹配项目**，提示用户："当前项目尚未同步到 Obsidian，是否先执行 /obsidian-sync 生成架构图谱？"
- 如果找到项目但相关模块的 MD 文件不存在，回到常规代码读取流程，但应告知用户："Obsidian 中未找到 {模块名} 的文档，将直接读取源码。"

---

## 关键约束

- **只读 active 状态文件**：读取前检查 YAML `status: active`，`deleted` 状态的文件跳过。
- **利用 wikiLink 导航**：子层级文件中的 `[[NN.MM.SS {名称}]]` 就是下一层需要读取的文件名，直接解析并读取。
- **VAULT_PATH 占位符**：首次使用前，请将本文件中的 `VAULT_PATH` 替换为你的 Obsidian Vault 实际绝对路径（如 `/Users/yourname/Documents/obsidian`）。
````

> **注意：** 粘贴后，将 `VAULT_PATH` 替换为你实际的 Obsidian Vault 绝对路径（例如 `/Users/yourname/Documents/obsidian`）。
>
> 放置该文件后，Claude Code 会在**该项目每次会话中自动加载**它。

---

## License

MIT
