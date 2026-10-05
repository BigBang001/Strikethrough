# Strikethrough

**Everything they said. What's still true?**

Strikethrough turns a changing group conversation into a **current-state view**.

Paste a chat and it identifies messages that were later **changed, cancelled, corrected, or replaced**. Outdated messages are crossed out, while the latest confirmed information is collected into a **Current Reality** view.

Every current fact links back to the message that established it, so you can trace the answer to its source instead of relying on an unexplained summary.

<br>
<img width="1316" height="906" alt="Screenshot 2026-10-05 123239" src="https://github.com/user-attachments/assets/c571b6bc-a0cd-45e2-b5eb-e231362ee150" />
<br>

## Why?

Group chats have plenty of history, but no version control.

Plans change. Venues get cancelled. Times move. Someone posts an update, followed by another correction, followed by 30 more messages. The old information never disappears.

That makes a simple question surprisingly difficult:

> **What did we actually decide?**

Strikethrough is built for exactly that problem.

## How it works

```text
Paste conversation
        ↓
      Gemma
        ↓
Understand changing facts
        ↓
live / superseded / noise
        ↓
Link obsolete messages to replacements
        ↓
Build Current Reality
```

For each message, the model determines whether it is:

* `live` — the information is still current
* `superseded` — a later message replaced or cancelled it
* `noise` — it does not affect the current state

It also identifies the message that replaced obsolete information and returns the latest facts with their source message IDs.

For example:

```text
"Dinner is at 8."

        ↓

"Actually, make it 9."
```

Strikethrough understands that **8 PM is now obsolete** and that **9 PM is the current value**.

## The Interface

The result is deliberately visual.

Instead of turning the conversation into another block of AI-generated text, Strikethrough treats it like a proofread document:

* obsolete messages are crossed out with a red strike-through
* margin notes show what replaced them
* current facts are collected into **Current Reality**
* clicking a fact's `#n` jumps back to its source message

The interface is designed to make the model's reasoning visible rather than hiding it behind a chat response.

## Open AI

**Gemma performs the core reasoning.**

It is not being used simply to summarize the conversation. Its job is to reason about how information changes over time:

* Which statements are still valid?
* Which statements were replaced?
* What message caused the replacement?
* What is the latest confirmed value?
* Which message is the evidence for that value?

The server validates the structured model response before displaying it, including checking source-message references and handling malformed JSON.

### Why open weights matter

Conversations can contain private plans, addresses, schedules, family information, and other personal details.

Using an open-weight model gives the project an important option: **the reasoning layer can be self-hosted and controlled** instead of being permanently tied to a proprietary model.

The model can also be swapped, adapted, or fine-tuned without changing the core product.

### Deployment note

The public deployment currently uses a **hosted Gemma endpoint through Google AI Studio** rather than local inference.

The application keeps the API key server-side and is structured so the model layer can be pointed at a self-hosted Gemma deployment instead.

The built-in example conversation uses a cached result, so the main product experience remains available even without a live model request. Custom conversations are sent to Gemma for analysis.

## Tech

The project intentionally has very little infrastructure.

* Plain HTML / CSS / JavaScript frontend
* Small zero-dependency Node.js server
* Gemma for conversation reasoning
* No database
* No authentication
* No user accounts
* No unnecessary backend services

The server handles the model request through:

```text
POST /api/resolve
```

and keeps the API key away from the browser.

## Input formats

Strikethrough supports simple pasted conversation formats such as:

```text
[9:02 AM] Aisha: Dinner is at The Terrace at 8.
[9:15 AM] Rahul: The Terrace said they're full.
[9:17 AM] Aisha: Okay, moved to Olive House.
```

and:

```text
Aisha: Dinner is at The Terrace at 8.
Rahul: The Terrace said they're full.
Aisha: Okay, moved to Olive House.
```

The goal is not to recreate a complete WhatsApp parser. The focus is the reasoning problem: **resolving changing information inside a conversation**.

## Run locally

Clone the repository and install Node.js if it is not already available.

Set your Gemma API key and start the server:

```bash
GEMMA_API_KEY=your_key node server.js
```

Then open:

```text
http://localhost:3000
```

On Windows PowerShell:

```powershell
$env:GEMMA_API_KEY="your_key"
node server.js
```

Without an API key, the built-in example still works using its cached result.

## Environment variables

```text
GEMMA_API_KEY=your_api_key
GEMMA_MODEL=your_supported_gemma_model
PORT=3000
```

The API key should never be committed to the repository or placed in frontend code.

## Live deployment

**Live:** https://strikethrough.onrender.com

The application is deployed on **Render** as a single web service.

Render serves:

* the static frontend
* the Node.js server
* the `/api/resolve` endpoint

The `GEMMA_API_KEY` is stored as a Render environment variable and is never exposed to the browser.

## Project structure

```text
strikethrough/
├── public/
│   └── index.html
├── server.js
├── render.yaml
├── package.json
├── .gitignore
└── README.md
```

## Partners

### Gemma

Gemma powers the core reasoning that determines which messages are current, superseded, or irrelevant and how the current state should be reconstructed.

### Render

Render hosts the public application and the backend service that handles `/api/resolve`.

## Built for a Friend

Strikethrough started from a simple real-world problem while planning a group trip through WhatsApp.

As the conversation grew, times, places, and bookings changed while every old message remained visible. Eventually, finding the latest plan meant scrolling back through the conversation and asking:

> **“Wait, what did we finally decide?”**

Strikethrough is the answer to that small problem.
