# Strikethrough

Paste a chaotic group chat. Strikethrough works out which messages were later changed, cancelled, corrected or superseded, crosses them out, and leaves the current truth with a source message for every fact.

## What it is
Strikethrough turns changing group conversations into a current-state view by visually crossing out information that later messages replaced. Click any fact's `#n` to jump to the message that established it.

## Why it matters
Group chats have no version control. Plans evolve, but every old message stays visible forever, so people act on stale information.

## Open AI
**Gemma isn't being used to write a summary. It determines which facts in a conversation survived later corrections and which became obsolete.** It labels each message `live`, `superseded` or `noise`, links superseded messages to their replacement, and returns current facts with source IDs, as strict JSON that the server validates (bad references are downgraded, malformed JSON gets one repair pass).

Why open weights matter here: chats are sensitive, the model can be self-hosted, it can be swapped or fine-tuned, and nothing ties the project to a proprietary reasoning API.

**Honesty note:** the deployment calls a *hosted* Gemma endpoint (Google AI Studio, `gemma-3-27b-it`). To self-host, point `server.js` at any Gemma server. The built-in example chat is served from a cached result so the demo always works; any other pasted chat goes to Gemma live.

## Tech
Plain HTML/CSS/JS frontend, a ~100-line zero-dependency Node server, no database, no auth.

## Run locally
```
GEMMA_API_KEY=your_key node server.js   # http://localhost:3000
```
Get a key at https://aistudio.google.com. Without a key the example still works.

## Deploy on Render
Push to GitHub, then Render → New → Blueprint → select the repo (`render.yaml`). Set `GEMMA_API_KEY` when prompted. Render hosts the whole app: the static page and the `/api/resolve` endpoint, as one web service. The key stays in a Render environment variable and never reaches the browser.

## Partners
- **Gemma**: the reasoning model.
- **Render**: hosts the public web service (once deployed, see status in the submission).
