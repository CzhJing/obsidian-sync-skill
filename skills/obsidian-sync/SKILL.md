---
name: obsidian-sync
description: Obsidian 同步助手，连接 Agent 与 Obsidian，自动分析项目代码库，拆分生成 project → 模块 → 服务 → 外部API → 类(接口) → 方法 → 表 层级结构，每个层级单独 MD 文件，自动添加双向链接，创建本地项目架构图谱。
---

## 触发指令

| 指令 | 说明 |
|------|------|
| `/obsidian-sync` | 首次同步 / 主入口（等同于 init） |
| `/obsidian-sync:update-project` | 更新描述与技术栈 |
| `/obsidian-sync:log` | 添加开发日志 |
| `/obsidian-sync:update` | 更新项目仓库（增量同步）|

## 参考文件说明
执行本技能时，**自动加载以下参考文件**并严格遵循：

- **references/obsidian-sync-project.md**
  主执行流程：阶段步骤、菜单逻辑、动作执行、同步流程

- **references/obsidian-sync-spec.md**
  技术规范：文件命名、JD 编号、wikiLink、YAML 模板、标签规则、文件存储结构