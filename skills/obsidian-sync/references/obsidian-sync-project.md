# Obsidian 同步助手（项目层级自动拆分 + 双向链接）

连接 Agent 与 Obsidian，自动分析项目代码库，拆分生成 project → 模块 → 服务 → 外部API → 类(接口) → 方法 → 表 层级结构，每个层级单独 MD 文件，自动添加双向链接，创建用户本地 project 架构图谱。

> 格式规范、文件模板、标签推断规则统一参见：@obsidian-sync-spec

## 配置

```
VAULT_PATH = "未配置"
```

## 前置条件

在执行任何阶段前，请确认以下环境已满足：

- 已安装 `git`（阶段 2 需要执行 `git remote -v` 和 `git log`）
- 当前工作目录（`cwd`）为目标项目的根目录
- Claude Code 具有对 `VAULT_PATH` 的读写权限
- **语言检测**：根据用户的客户端语言、项目代码注释，判断用户常用语言（中文 / 英文等），后续所有提示信息与生成的 MD 文件内容均使用该语言输出

---

## 执行流程

---

### 阶段 1：Obsidian Vault 配置

**如果 `VAULT_PATH` 已配置（非"未配置"），跳过本阶段直接进入阶段 2。**

1. 询问用户：
    - "请输入 Obsidian Vault 的绝对路径（例如：/Users/yourname/MyVault）"
2. 待用户输入后，将路径写入本文件 `VAULT_PATH` 字段

---

### 阶段 2：环境验证 & 项目识别

#### 环境验证

1. 验证 `VAULT_PATH` 路径存在；不存在则停止执行，提示用户修正
2. 验证以下目录是否存在，缺失则创建：

| 目录 | 描述 |
|------|------|
| `00-09 System` | Meta, templates, vault config |
| `10-19 Projects` | Active builds, archive, skills |
| `20-29 Writing` | Essays, notes, daily journal |
| `30-39 Knowledge` | Resources, reading list |
| `40-49 Tracking` | Finance, routines, to-dos |
| `50-59 Creative` | Drawings, media, experiments |

```bash
mkdir -p "$VAULT_PATH/00-09 System" \
          "$VAULT_PATH/10-19 Projects" \
          "$VAULT_PATH/20-29 Writing" \
          "$VAULT_PATH/30-39 Knowledge" \
          "$VAULT_PATH/40-49 Tracking" \
          "$VAULT_PATH/50-59 Creative"
```

#### 项目识别（两级验证）

**第一级：目录名匹配**
在 `VAULT_PATH/10-19 Projects/` 中，找所有 `NN {项目名}` 文件夹，将去除编号和空格后的 `{项目名}` 与 `cwd` 最后一级目录名做完全匹配。

**第二级：Location 字段验证**
找到候选文件夹后，读取其中 `NN.00 {项目名}.md` 的 `**Location:**` 字段，与 `cwd` 做完全匹配：
- 匹配 → 判定为当前项目，进入阶段 3 的已有项目流程
- 不匹配 → 记录"未找到"，进入阶段 3 的新建流程

若存在多个候选项，列出所有候选供用户确认。

#### 读取已有项目文件

若找到匹配文件，完整读取：解析 YAML 前置信息、所有章节与页脚，作为后续更新的基准。

---

### 阶段 3：操作菜单

**如果项目文件已存在于 Obsidian：**

| 选项 | 说明 |
|------|------|
| 1. 更新描述与技术栈 | 刷新项目描述、技术栈表格与 YAML 元数据 |
| 2. 添加开发日志 | 为今日工作添加带日期的记录 |
| 3. 更新项目仓库 | 分析代码变更，更新对应层级 MD 文件 |
| 4. 完整同步（执行以上全部） | 依次执行选项 1、2、3 |

**如果未找到项目文件，询问架构图谱细节粒度：**

- **选项 A：高层系统（15–40 个节点）**
  生成层级：项目 → 模块 → 服务 → 外部 API
  适合快速建立项目全貌，聚焦主要组件、数据流与外部依赖

- **选项 B：文件级细节（40+ 个节点）**
  在 A 基础上继续生成：类/接口 → 方法 → 表
  适合深度代码导航与知识检索

> 用户选择写入顶层文件 `type` 字段，整个会话保持一致。

---

### 阶段 4：层级提取规则

根据阶段 3 用户选择，扫描分析整个项目，并生成一个**代码知识图谱（Obsidian风格）**。**文件命名、模板格式参见 @obsidian-sync-spec。**

**粒度必须严格遵循以下规则：**

【节点类型】
- Repository
- Directory / Module
- File
- Class
- Interface
- Function
- Method
- Variable / Constant
- Enum / TypeAlias
- Table
- Endpoint（若可推导）
- TestCase（若可推导）
- ConfigRation

【节点关系类型】:节点关系不生成md文件，只定义节点之间关联关系，通过[[wikiLink]]连接相关的节点
- CONTAINS
- DECLARES
- EXPORTS
- IMPORTS
- CALLS
- EXTENDS
- IMPLEMENTS
- USES_TYPE
- RETURNS
- INSTANTIATES
- REFERENCES
- TESTS

【抽取规则】
- 如果是{选项 A：高层系统}，节点的级别是：Repository 、Directory / Module
- 如果是{选项 B：文件级细节}，节点的级别是：所有节点类型，每个 Function / Method 必须单独成节点，每个函数调用必须建立 CALLS 关系，使用[[wikiLink]]链接
- 文件必须拆到 Symbol 级，不允许仅停留在文件级
- 每个 Import 必须建立 IMPORTS 关系，使用[[wikiLink]]链接
- 类继承/接口实现必须建立 EXTENDS / IMPLEMENTS 关系，使用[[wikiLink]]链接
- 构造实例必须建立 INSTANTIATES 关系，使用[[wikiLink]]链接
- 类型引用必须建立 USES_TYPE 关系，使用[[wikiLink]]链接
- 输出 Obsidian 格式,配套规范参考@obsidian-sync-spec 

**同时提取：**
- 每个层级的上下级关联关系（用于生成双向 wikiLink）
- 类/接口的作用、方法的功能、表的字段（从注释简化提取）
- 从代码注释尝试读取：作者、创建时间

**文件存储：** 所有层级 MD 文件统一平铺至 `VAULT_PATH/10-19 Projects/NN {项目名}/`，不按层级建子目录。

目录不存在时执行：
```bash
mkdir -p "$VAULT_PATH/10-19 Projects/NN {项目名}/01 DailyLog" \
          "$VAULT_PATH/10-19 Projects/NN {项目名}/02 Delete"
```

---

### 阶段 5：核心动作执行

---

#### 动作 A：创建新项目文件（首次同步）
1. **分配 JD 编号**：按 @obsidian-sync-spec 命名规范分配（扫描同层级最大编号后递增 1）。

2. **生成顶层文件**：路径 `VAULT_PATH/10-19 Projects/NN {项目名}/NN.00 {项目名}.md`，使用 @obsidian-sync-spec 中的**顶层文件模板**。

3. **生成子层级文件**：路径 `VAULT_PATH/10-19 Projects/NN {项目名}/NN.MM... {名称}.md`，使用 @obsidian-sync-spec 中的**子层级文件模板**。

4. **标签推断**：参见 @obsidian-sync-spec 中的**标签推断规则**，自动生成 2–5 个标签。

5. **不展示创建md细节**：每次创建md文件，不需要向用户展示创建内容，只需要生成md文件即可
---

#### 动作 B：更新描述与技术栈
##### 触发指令 /obsidian-sync:update-project
1. 重新分析代码库（`package.json`、`pom.xml`、`build.gradle`、目录结构等）
2. 更新顶层 `NN.00 {项目名}.md` 中：
    - `desc` 字段与描述段落
    - 技术栈表格（新依赖、更新版本）
    - `**Location:**`、`**GitHub:**`、`**Port:**` 字段
    - `updateTime` 为当前日期
    - 技术栈变化时同步更新 YAML `tags`
3. 展示 diff，请求用户确认后写入

---

#### 动作 C：添加开发日志
##### 触发指令 /obsidian-sync:log
1. **日志文件**：`VAULT_PATH/10-19 Projects/NN {项目名}/01 DailyLog/NN.01 DailyLog.md`
    - 已存在则直接更新，不存在则新建
    - **首次创建后**，在顶层文件 `## 核心文件` 章节后追加：
      ```markdown
      ## 开发日志
      - [[NN.01 DailyLog]]
      ```

2. **日志内容来源**：
    - `git log --oneline --since="00:00" --author="{用户名}"` 的提交记录
    - 当前会话中讨论、调试、决策的内容
    - 按功能模块归类，重点说明"为什么"而非只记录"改了什么"

3. **日志格式与插入规则**参见 @obsidian-sync-spec 第五节「日志格式模板」。

---

#### 动作 D：更新项目仓库
##### 触发指令 /obsidian-sync:update
##### 执行前准备（必须完成，再进入后续步骤）

**第一步：读取同步粒度**

读取 `VAULT_PATH/10-19 Projects/NN {项目名}/NN.00 {项目名}.md` 的 YAML `type` 字段：

| type 值 | 对应规则 | 更新范围 |
|---------|---------|---------|
| `A-高层系统` | 阶段 4 选项 A | 仅处理层级 1–4（项目 → 模块 → 子系统 → 外部依赖） |
| `B-文件级细节` | 阶段 4 选项 B | 处理全部层级 1–7 |

> **异常处理：**
> - 文件不存在 → 停止执行，提示用户先运行动作 A 完成首次同步
> - `type` 字段缺失或值不合法 → 询问用户确认当前粒度后继续

**第二步：选择更新来源**

询问用户：

| 选项 | 说明 | 适用场景 |
|------|------|---------|
| 1. Git 变更分析 | 从今日 git 提交记录识别变更 | 有规律提交习惯，想精确追踪每次改动 |
| 2. 全量文件比对 | 扫描代码库与 Obsidian 现有文档做差异比对 | 长期未同步、跨多天改动、无 git 提交记录 |

---

##### 来源 1：Git 变更分析

1. 执行 `git log --oneline --since="00:00" --author="{用户名}"` 获取今日提交
2. 分析识别新增、修改、删除了哪些文件
3. 将变更文件映射到对应层级，进入**差异处理流程**

---

##### 来源 2：全量文件比对

1. **扫描代码库**，按阶段 4 的层级提取规则，重新识别当前项目的完整层级结构（模块 → 子系统 → 外部依赖 → 代码单元 → 方法 → 存储）
2. **扫描 Obsidian 现有文档**，读取 `VAULT_PATH/10-19 Projects/NN {项目名}/` 下所有 `status: active` 的 MD 文件，提取其 `jd-id`、`name`、`**Location:**` 字段，构建已有文档清单
3. **三向比对**，识别以下三类差异：

| 差异类型 | 判定条件 | 处理方式 |
|----------|---------|---------|
| 新增 | 代码库中存在，Obsidian 中无对应 MD | 按规范创建新 MD 文件 |
| 变更 | MD 文件存在，但 `desc`/`tags`/层级结构与代码库不一致 | 更新对应字段 |
| 删除 | Obsidian 中有 MD，但代码库中已无对应文件或结构 | 归档处理（见下方） |

4. 输出比对结果清单，格式如下，请求用户确认后再执行：

```markdown
比对结果
新增（N 个）：
- [ ] NN.MM.SS {名称}（新增代码单元）

变更（N 个）：
- [ ] NN.MM {名称}（desc 已变更 / 新增子层级）

待归档（N 个）：
- [ ] NN.MM.SS {名称}（源文件已不存在）
```

##### 差异处理流程（两种来源共用）

按粒度选项更新：
- **选项 A**：仅处理项目 → 模块 → 子系统 → 外部依赖四层的差异
- **选项 B**：处理所有层级的差异

**代码文件已删除 / 结构已移除时：** 参见 @obsidian-sync-spec 第八节「删除归档规范」。

每次写入前展示 diff，请求用户确认后执行。

---

## 阶段 6：结果汇报

```
## Obsidian 同步完成

**项目：** {name}（{jd-id}）
**仓库路径：** 10-19 Projects/NN {项目名}/

**已执行操作：**
- [x] 操作1
- [x] 操作2
- [x] 操作3

**生成/更新文件列表：**
- NN.00 {项目名}.md（顶层）
- NN.01 {模块1}.md
- NN.01.01 {服务1}.md
- ...（完整列表）

**需要手动处理的事项：**
- {已移入 02 Delete/ 的归档文件}
- {其他需人工介入的事项}
```

---

## 使用准则

- **不经用户确认不永久删除任何 MD 文件**，源码删除只做归档标记并迁移至 `02 Delete/`
- **开发日志只追加、不修改历史**，绝不覆盖已有条目
- **标签从技术栈和代码特征自动推断**，不凭空编造
- **描述基于真实代码分析**，不生成无依据的内容
- **wikiLink 必须使用含 JD 编号的完整文件名**，确保 Obsidian 正确解析
- **所有层级文件统一平铺存储**，不按层级建子目录
- **`type` 字段全层级继承**，子层级与顶层保持一致
- **每次写入前展示 diff**，请求用户确认后再执行