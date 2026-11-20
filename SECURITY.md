# Security Policy

## Supported versions

Only the latest version on the `main` branch (served via GitHub Pages) is supported.

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Report privately through GitHub: **Security → Advisories → Report a vulnerability** on this repository
(private vulnerability reporting is enabled). Include steps to reproduce, the impact, and the browser you used.

You can expect an acknowledgement within 5 working days and a status update within 14 days.

## Security model (what this app does with your data)

- The app is a static page with **no backend**. Nothing you type is sent to the maintainer.
- Prompts are sent **directly from your browser** to the provider you select (OpenAI, Anthropic or Google) using **your own API key**.
- API keys are kept in memory by default. If you tick "Remember key", the key is stored in your browser's `localStorage` on that device only. Do not use "Remember" on shared computers.
- Saved prompts and chats are stored in your browser's `localStorage`. The Export file contains prompts and chats but **never API keys**.
- A strict Content-Security-Policy allows scripts only from this site and network calls only to the three provider APIs.

Recommendation: use API keys with a spending limit, scoped to a project, and rotate them regularly.
