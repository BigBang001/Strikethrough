// Strikethrough: zero-dependency Node server. Serves /public and POST /api/resolve (Gemma).
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = process.env.PORT || 3000;
const MODEL = process.env.GEMMA_MODEL || 'gemma-3-27b-it';
const KEY = process.env.GEMMA_API_KEY;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css' };

const PROMPT = `You are resolving a conversation whose facts change over time.
For each numbered message:
- "live": the information remains current
- "superseded": a later message changed, cancelled, corrected, or replaced it
- "noise": it contains no useful state (greetings, questions already answered, reactions)
For superseded messages, give "superseded_by": the id of the later message that replaced them.
Then list the latest current facts ("current") with the "source" message id that establishes each. Use short lowercase topics (venue, time, booking, and others the chat needs, e.g. cake, driver).
Do not summarize the conversation. Do not invent facts. Prefer the latest explicit confirmation.
Return ONLY valid JSON, no markdown:
{"messages":[{"id":1,"status":"live|superseded|noise","superseded_by":7,"reason":"short"}],"current":[{"topic":"venue","value":"Olive House","source":12}]}

Conversation:
`;

function extractJSON(t) {
  t = String(t).replace(/```json|```/gi, '');
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b < 0) throw new Error('no json');
  t = t.slice(a, b + 1);
  try { return JSON.parse(t); } catch { return JSON.parse(t.replace(/,\s*([}\]])/g, '$1')); } // one repair pass
}

function validate(raw, msgs) {
  const ids = new Set(msgs.map(m => m.id)), seen = {};
  for (const m of raw.messages || []) {
    if (!ids.has(m.id)) continue;
    let status = ['live', 'superseded', 'noise'].includes(m.status) ? m.status : 'live';
    let by = Number(m.superseded_by) || null;
    if (status === 'superseded' && !(ids.has(by) && by > m.id)) status = 'live', by = null;
    seen[m.id] = { id: m.id, status, superseded_by: status === 'superseded' ? by : null, reason: String(m.reason || '').slice(0, 80) };
  }
  const messages = msgs.map(m => seen[m.id] || { id: m.id, status: 'noise', superseded_by: null, reason: '' });
  const current = (raw.current || []).filter(c => c && c.topic && c.value && ids.has(c.source))
    .map(c => ({ topic: String(c.topic).toLowerCase().slice(0, 30), value: String(c.value).slice(0, 80), source: c.source }));
  if (!current.length) throw new Error('empty');
  return { messages, current };
}

async function callGemma(msgs) {
  const convo = msgs.map(m => `#${m.id} ${m.time ? '[' + m.time + '] ' : ''}${m.speaker}: ${m.text}`).join('\n');
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: PROMPT + convo }] }], generationConfig: { temperature: 0 } })
  });
  if (!r.ok) throw new Error('upstream ' + r.status);
  const j = await r.json();
  return validate(extractJSON(j.candidates[0].content.parts.map(p => p.text).join('')), msgs);
}

http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/resolve') {
    let body = ''; req.on('data', d => { body += d; if (body.length > 60000) req.destroy(); });
    req.on('end', async () => {
      res.setHeader('Content-Type', 'application/json');
      try {
        const msgs = JSON.parse(body).messages;
        if (!Array.isArray(msgs) || !msgs.length || msgs.length > 150 || !KEY) throw new Error('bad');
        res.end(JSON.stringify(await callGemma(msgs)));
      } catch (e) { console.error(e.message); res.statusCode = 502; res.end('{"error":"failed"}'); }
    });
    return;
  }
  const f = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : path.normalize(req.url.split('?')[0]).replace(/^(\.\.[\/\\])+/, ''));
  fs.readFile(f, (e, d) => {
    if (e) { res.statusCode = 404; return res.end('Not found'); }
    res.setHeader('Content-Type', TYPES[path.extname(f)] || 'application/octet-stream'); res.end(d);
  });
}).listen(PORT, () => console.log('Strikethrough on :' + PORT));
