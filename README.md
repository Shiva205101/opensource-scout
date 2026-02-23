<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/12O2Bh407RAhoJEeSIIQ2HdsFkekGj2Xi

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Add keys in `.env.local`:
   - `GEMINI_API_KEY=...` (optional, enables Gemini models)
   - `OPENAI_API_KEY=...` (optional, enables OpenAI models like GPT-4o)
3. Run the app:
   `npm run dev`

## CLI Version

Run interactive CLI:

`npm run cli`

Run with flags:

`npm run cli -- --query "beginner friendly react repos" --model gpt-4o --sort stars --min-stars 500 --good-first-issues`

Useful flags:
- `--query`
- `--model` (`gemini-3-flash-preview`, `gemini-3-pro-preview`, `gpt-4o`, `gpt-4.1`)
- `--language`
- `--min-stars`
- `--sort` (`best-match`, `stars`, `forks`, `updated`)
- `--good-first-issues`
- `--repo-index` (1-based index from listed repositories)
