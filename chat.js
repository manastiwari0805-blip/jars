const { gemini, persona, MODEL } = require("./_gemini");
const BASE = "https://generativelanguage.googleapis.com/v1beta/models/";
const OK_MIME = /^(image\/(png|jpeg|webp|gif)|application\/pdf)$/;

function toParts(m) {
  const p = [];
  if (m.text) p.push({ text: String(m.text).slice(0, 60000) });
  (m.files || []).forEach((f) => {
    if (f && OK_MIME.test(f.mime || "") && typeof f.data === "string") p.push({ inlineData: { mimeType: f.mime, data: f.data } });
  });
  return p.length ? p : [{ text: " " }];
}

function sources(j) {
  const g = j && j.candidates && j.candidates[0] && j.candidates[0].groundingMetadata;
  const ch = (g && g.groundingChunks) || [];
  const seen = {};
  return ch.map((c) => c.web).filter((w) => w && w.uri && !seen[w.uri] && (seen[w.uri] = 1)).map((w) => ({ title: w.title || w.uri, uri: w.uri }));
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  const code = process.env.ACCESS_CODE;
  if (!code || req.headers["x-jars-code"] !== code) return res.status(401).json({ error: "locked" });
  let body = req.body || {};
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }

  // Old simple mode: { prompt }
  if (!body.messages) {
    const prompt = String(body.prompt || "").slice(0, 12000);
    if (!prompt) return res.status(400).json({ error: "empty" });
    try { return res.status(200).json({ text: await gemini(prompt) }); }
    catch (e) { console.error(e.message); return res.status(502).json({ error: "ai_failed" }); }
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: "no_key" });
  const msgs = (Array.isArray(body.messages) ? body.messages : []).slice(-30);
  if (!msgs.length) return res.status(400).json({ error: "empty" });
  const model = /^[\w.\-]+$/.test(body.model || "") ? body.model : MODEL;
  let extra = String(body.extra || "").slice(0, 600);
  const L = body.location;
  if (L && isFinite(L.lat) && isFinite(L.lng)) extra += " The user chose to share their approximate location (latitude " + Number(L.lat).toFixed(3) + ", longitude " + Number(L.lng).toFixed(3) + "). Use it only for location questions.";
  const payload = {
    systemInstruction: { parts: [{ text: persona(extra) }] },
    contents: msgs.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: toParts(m) })),
  };
  if (body.search) payload.tools = [{ google_search: {} }];
  const headers = { "Content-Type": "application/json", "x-goog-api-key": key };

  try {
    if (!body.stream) {
      const r = await fetch(BASE + model + ":generateContent", { method: "POST", headers, body: JSON.stringify(payload) });
      const j = await r.json();
      if (!r.ok) throw new Error("Gemini " + r.status + ": " + JSON.stringify(j).slice(0, 300));
      const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
      return res.status(200).json({ text: parts.map((p) => p.text || "").join("").trim(), sources: sources(j) });
    }
    const r = await fetch(BASE + model + ":streamGenerateContent?alt=sse", { method: "POST", headers, body: JSON.stringify(payload) });
    if (!r.ok) throw new Error("Gemini " + r.status + ": " + (await r.text()).slice(0, 300));
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" });
    const reader = r.body.getReader(), dec = new TextDecoder();
    let buf = "", src = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!line.startsWith("data:")) continue;
        try {
          const j = JSON.parse(line.slice(5));
          const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
          const t = parts.map((p) => p.text || "").join("");
          if (t) res.write("data: " + JSON.stringify({ t }) + "\n\n");
          const s = sources(j); if (s.length) src = s;
        } catch (e) { /* ignore partial line */ }
      }
    }
    if (src.length) res.write("data: " + JSON.stringify({ src }) + "\n\n");
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (e) {
    console.error(e.message);
    if (!res.headersSent) return res.status(502).json({ error: "ai_failed" });
    res.write("data: " + JSON.stringify({ err: "ai_failed" }) + "\n\n"); res.end();
  }
};
