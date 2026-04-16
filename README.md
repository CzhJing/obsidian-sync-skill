[中文](README.zh.md) | **English**

---

# Obsidian Sync for Claude Code

A cross-agent skill that automatically transforms your codebase into an Obsidian knowledge graph.

> This skill follows the [Agent Skills specification](https://github.com/anthropics/skills) and works with any skills-compatible agent, including **Claude Code**, **Codex CLI**, and **OpenCode**.

---

## What It Does

This skill bridges your agent and Obsidian. It analyzes your project and generates a layered architecture graph:

```
project → module → service → external API → class/interface → method → database table
```

Each layer becomes a standalone Markdown file with Obsidian wikiLinks, forming a browsable, locally-stored architecture graph in your Vault.

![preview](preview.png)
### Why This Saves Tokens & Context

- **Precision retrieval** — The model navigates the graph hierarchy instead of scanning the entire codebase, locating target files in seconds.
- **On-demand loading** — Reduces exploratory reads without replacing source code. It acts as an index/table of contents, allowing the model to pinpoint exactly what it needs.
- **Focused context** — Only the relevant node summaries are loaded into the conversation, cutting token usage dramatically.
- **Persistent memory** — Architecture, design decisions, and dev logs are stored structurally and reused across sessions without repetition.
- **Fully local & private** — All graph data stays in your local Obsidian Vault. Zero cloud upload. Zero leakage risk.

---

## Installation

```bash
Obsidian client must be installed before using this skill.
```

### Claude Code — Plugin Marketplace

```bash
/plugin marketplace add CzhJing/obsidian-sync-skill
/plugin install obsidian-sync@obsidian-sync
```

---
### First Run

1. You will be prompted for your Obsidian Vault absolute path (e.g. `/Users/yourname/Documents/obsidian`).
2. After entering the path, the skill will:
   - Create standard Vault directories (`10-19 Projects`, etc.)
   - Identify the current project and assign a JD number
   - Generate the architecture graph at your chosen detail level

### Menu Options

After the first sync, running `/obsidian-sync` presents:

| Option | Description |
|--------|-------------|
| 1 | Update description & tech stack |
| 2 | Add dev log |
| 3 | Update repository (sync code changes) |
| 4 | Full sync (run all of the above) |

---

## Auto-load per session (project-level)

If you want the "graph first, source code second" rule to apply **automatically** for every session, create `.claude/CLAUDE.md` in your project root and paste the following:

````markdown
## Obsidian Hook Output Handling

When you see output starting with `[Obsidian Context]` before a tool call,
treat it as the architectural context for the current task before performing any search or code operation.
````

---

## License

MIT
