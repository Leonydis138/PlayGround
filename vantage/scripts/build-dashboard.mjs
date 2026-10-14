#!/usr/bin/env node
/**
 * VANTAGE dashboard build - dependency-free (Node 18+).
 * Copies index.html + the latest data/data.json into dashboard/dist/ (fetch
 * needs same-folder files), plus experiments.json, agent-memory.json,
 * ledger-summary.json and the analyst report for the side panels.
 * Used as the Cloudflare Pages build command for the dashboard project.
 */
import { cpSync, mkdirSync, existsSync } from 'node:fs';

mkdirSync('dashboard/dist', { recursive: true });
cpSync('dashboard/index.html', 'dashboard/dist/index.html');
cpSync('data/data.json', 'dashboard/dist/data.json');
for (const extra of ['experiments.json', 'agent-memory.json', 'ledger-summary.json']) {
  if (existsSync(`data/${extra}`)) cpSync(`data/${extra}`, `dashboard/dist/${extra}`);
}
// Analyst report (markdown, rendered as preformatted text)
if (existsSync('data/report-latest.md')) cpSync('data/report-latest.md', 'dashboard/dist/report-latest.md');
console.log('Dashboard built -> dashboard/dist/ (index.html + data.json + experiments + memory + ledger + report)');