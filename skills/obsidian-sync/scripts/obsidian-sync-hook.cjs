#!/usr/bin/env node

/**
 * Obsidian Sync Claude Code Hook
 *
 * PreToolUse  — intercepts Grep/Glob tool calls and injects the current
 *               project's Obsidian llm-wiki as architecture context.
 * PostToolUse — detects git mutations (commit/merge/rebase) and reminds
 *               the agent to run /obsidian-sync:update.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ─── Stdin ────────────────────────────────────────────────────────────────────

function readInput() {
    try {
        const data = fs.readFileSync(0, 'utf-8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

// ─── VAULT_PATH resolution ────────────────────────────────────────────────────

/**
 * Read VAULT_PATH from ~/.claude/skills/obsidian-sync/references/obsidian-sync-project.md.
 * Expects a line like:  VAULT_PATH = "/path/to/vault"
 * Returns the resolved path, or null if not configured.
 */
function readVaultPath() {
    const refFile = path.join(
        os.homedir(),
        '.claude',
        'skills',
        'obsidian-sync',
        'references',
        'obsidian-sync-project.md',
    );

    try {
        const content = fs.readFileSync(refFile, 'utf-8');
        const match = content.match(/^VAULT_PATH\s*=\s*"?([^"\n]+)"?\s*$/m);
        if (!match) return null;
        const value = match[1].trim();
        if (!value || value === '未配置') return null;
        return value;
    } catch {
        return null;
    }
}

// ─── Project directory in vault ──────────────────────────────────────────────

/**
 * Given a vault path and a project name (basename of cwd),
 * find the matching "NN {projectName}" directory under 10-19 Projects/.
 */
function findProjectDir(vaultPath, projectName) {
    const projectsDir = path.join(vaultPath, '10-19 Projects');
    try {
        const entries = fs.readdirSync(projectsDir, { withFileTypes: true });
        const match = entries.find(
            (e) => e.isDirectory() && e.name.replace(/^\d+\s+/, '') === projectName,
        );
        return match ? path.join(projectsDir, match.name) : null;
    } catch {
        return null;
    }
}

// ─── llm-wiki reader ─────────────────────────────────────────────────────────

/**
 * Read the llm-wiki file for the project.
 * Looks for a file named "llm-wiki.md" (or "NN.00 {projectName}.md" as fallback)
 * inside the project directory.
 */
function readLlmWiki(projectDir) {
    try {
        const files = fs.readdirSync(projectDir);
        const topFile = files.find((f) => f.match(/^\d+\.00\s+/) && f.endsWith('.md'));
        if (topFile) {
            return fs.readFileSync(path.join(projectDir, topFile), 'utf-8').trim();
        }
    } catch {
        /* ignore */
    }

    return null;
}

// ─── Hook response ────────────────────────────────────────────────────────────

function sendHookResponse(_hookEventName, message) {
    console.log(
        JSON.stringify({
            hookSpecificOutput: message,
        }),
    );
}

// ─── PreToolUse ───────────────────────────────────────────────────────────────

/**
 * On Grep or Glob calls, inject the project's Obsidian llm-wiki as context
 * so the agent prioritises the architecture graph before searching source code.
 */
function handlePreToolUse(input) {
    const toolName = input.tool_name || '';
    if (toolName !== 'Grep' && toolName !== 'Glob') return;

    const cwd = input.cwd || process.cwd();
    const projectName = path.basename(cwd);

    const vaultPath = readVaultPath();
    if (!vaultPath) return;

    const projectDir = findProjectDir(vaultPath, projectName);
    if (!projectDir) return;

    const wiki = readLlmWiki(projectDir);
    if (!wiki) return;

    sendHookResponse(
        'PreToolUse',
        `[Obsidian Context] Project: ${projectName}\n\n${wiki}`,
    );
}

// ─── PostToolUse ──────────────────────────────────────────────────────────────

/**
 * After a successful git commit/merge/rebase, remind the agent to sync
 * the Obsidian wiki so it stays up to date.
 */
function handlePostToolUse(input) {
    const toolName = input.tool_name || '';
    if (toolName !== 'Bash') return;

    const command = (input.tool_input || {}).command || '';
    if (!/\bgit\s+(commit|merge|rebase)(\s|$)/.test(command)) return;

    // Only remind when the command succeeded
    const toolOutput = input.tool_output || {};
    if (toolOutput.exit_code !== undefined && toolOutput.exit_code !== 0) return;

    const cwd = input.cwd || process.cwd();
    const vaultPath = readVaultPath();
    if (!vaultPath) return;

    const projectDir = findProjectDir(vaultPath, path.basename(cwd));
    if (!projectDir) {
        sendHookResponse(
            'PostToolUse',
            '[Obsidian] Project not synced yet. Run /obsidian-sync to create the wiki.',
        );
        return;
    }

    sendHookResponse(
        'PostToolUse',
        '[Obsidian] Reminder: run /obsidian-sync:update to sync the wiki after this commit.',
    );
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────

const handlers = {
    PreToolUse: handlePreToolUse,
    PostToolUse: handlePostToolUse,
};

function main() {
    try {
        const input = readInput();
        const handler = handlers[input.hook_event_name || ''];
        if (handler) handler(input);
    } catch (err) {
        if (process.env.OBSIDIAN_SYNC_DEBUG) {
            process.stderr.write(`obsidian-sync hook error: ${(err.message || '').slice(0, 200)}\n`);
        }
    }
}

main();
