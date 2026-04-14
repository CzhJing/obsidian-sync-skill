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

### Why This Saves Tokens & Context

- **Precision retrieval** — The model navigates the graph hierarchy instead of scanning the entire codebase, locating target files in seconds.
- **Focused context** — Only the relevant node summaries are loaded into the conversation, cutting token usage dramatically.
- **Persistent memory** — Architecture, design decisions, and dev logs are stored structurally and reused across sessions without repetition.
- **Fully local & private** — All graph data stays in your local Obsidian Vault. Zero cloud upload. Zero leakage risk.

---

## Installation

### Claude Code — Plugin Marketplace

```bash
# If this skill is published to a marketplace
claude plugin marketplace add CzhJing/obsidian-sync-skill
claude plugin install obsidian-sync@obsidian-sync-skill
```

### Claude Code — Local Plugin Install

```bash
git clone https://github.com/CzhJing/obsidian-sync-skill.git
cd obsidian-sync-skill
claude plugin install .
```

### Claude Code — Manual (skills folder)

Copy the skill into your Claude Code skills directory:

```bash
# Repo-level: inside your project
mkdir -p .claude/skills
cp -r skills/obsidian-sync .claude/skills/

# Or user-level: ~/.claude/skills/
ln -s $(pwd)/skills/obsidian-sync ~/.claude/skills/obsidian-sync
```

### Codex CLI

Copy the `skills/` directory into your Codex skills path:

```bash
mkdir -p ~/.codex/skills
cp -r skills/obsidian-sync ~/.codex/skills/
```

### OpenCode

Clone the full repo into the OpenCode skills directory (do **not** copy only the inner `skills/` folder):

```bash
git clone https://github.com/CzhJing/obsidian-sync-skill.git ~/.opencode/skills/obsidian-sync-skill
```

OpenCode auto-discovers all `SKILL.md` files under `~/.opencode/skills/`. Restart OpenCode to use the skill.

### npx skills

```bash
npx skills add git@github.com:CzhJing/obsidian-sync-skill.git
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
## Usage

You can use this skill in **two ways**. Choose the one that fits your workflow:

### Option A: Trigger on demand (manual)

Include `/obsidian-sync` at the beginning of your message whenever you want the agent to read the Obsidian architecture graph before handling a task. For example:

```
/obsidian-sync implement batch delete for shopping cart
/obsidian-sync fix the user login bug
/obsidian-sync write unit tests for OrderService
```

This is the simplest way — no extra setup required.

### Option B: Auto-load for every session (project-level)

If you want the "graph first, source code second" rule to apply **automatically** without typing `/obsidian-sync` each time, create a file named `.claude/CLAUDE.md` in your project root and paste the following content into it:

````markdown
# Project Development Workflow — Read Obsidian Architecture Graph First

> Place this file at `.claude/CLAUDE.md` in your project root. Claude Code will auto-load it in every session.

---

## Core Principle: Graph First, Source Code Second

Before handling any of the following request types, **do not grep/read source code directly**. Always read the Obsidian architecture documents first to gather context, then decide whether to read specific source files:

- Implementing new features / adding interfaces / developing modules
- Fixing bugs / troubleshooting issues
- Refactoring code / optimizing performance
- Explaining how a module, class, or method works
- Writing test cases

---

## Reading Order (Strict)

1. **Locate the project directory**
   Match the last segment of `cwd` against the `NN {project-name}` folders under `VAULT_PATH/10-19 Projects/`.
   Verify that the `**Location:**` field in the top-level file `NN.00 {project-name}.md` matches `cwd`.

2. **Read the top-level project file**
   `Read → VAULT_PATH/10-19 Projects/NN {project-name}/NN.00 {project-name}.md`
   Focus on: tech stack, module list (`## Hierarchy`), and core file mapping (`## Core Files`).

3. **Locate the relevant module/service based on the user's request**
   Use keywords from the user's message (e.g. "cart", "order", "user") to find the matching wikiLink in the top-level file's `## Hierarchy`, then read that module/service MD file.
   Example: user says "batch delete shopping cart" → read `NN.MM cart-service.md` → then `NN.MM.SS CartService.md`.

4. **Drill down to class/method level only when type is B-file-level-detail**
   If the project granularity is `B-文件级细节` and the user's question is specific enough, continue reading the relevant class/interface/method MD files (e.g. `NN.MM.SS.CC CartController.md`).

5. **Read source code last**
   Only after understanding the architecture context should you use `Grep` / `Glob` / `Read` on actual source code files.

---

## Fallback Strategy

- If **no matching project** is found under `10-19 Projects/`, prompt the user: "This project has not yet been synced to Obsidian. Would you like to run /obsidian-sync to generate the architecture graph first?"
- If the project is found but the relevant module MD file does not exist, fall back to the normal code-reading flow and inform the user: "Obsidian documentation for {module-name} was not found; reading source code directly."

---

## Key Constraints

- **Only read active files**: Check YAML `status: active` before reading; skip files with `deleted` status.
- **Use wikiLinks for navigation**: The `[[NN.MM.SS {name}]]` links in child-level files indicate the next file to read — parse and read them directly.
- **VAULT_PATH placeholder**: Before first use, replace `VAULT_PATH` in this file with your actual Obsidian Vault absolute path (e.g. `/Users/yourname/Documents/obsidian`).
````

> **Remember:** Replace `VAULT_PATH` with your actual Obsidian Vault absolute path (e.g. `/Users/yourname/Documents/obsidian`).
>
> Once this file is in place, Claude Code will load it into **every session** in this project.

---

## License

MIT
