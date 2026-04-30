import express from 'express';
import dotenv from 'dotenv';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

dotenv.config();

const execFileAsync = promisify(execFile);
const app = express();
app.use(express.json({ limit: '15mb' }));

const PORT = Number(process.env.PORT || 8787);
const GEMINI_MODE = (process.env.GEMINI_MODE || 'apikey').toLowerCase(); // apikey | oauth
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const PROXY_BEARER_TOKEN = process.env.PROXY_BEARER_TOKEN || '';
const GEMINI_CLI_PATH = process.env.GEMINI_CLI_PATH || 'gemini';
const GEMINI_CLI_TIMEOUT_MS = Number(process.env.GEMINI_CLI_TIMEOUT_MS || 120000);
const GEMINI_CLI_USE_MODEL = (process.env.GEMINI_CLI_USE_MODEL || 'false').toLowerCase() === 'true';

if (GEMINI_MODE === 'apikey' && !GEMINI_API_KEY) {
  console.warn('[warn] GEMINI_API_KEY missing while GEMINI_MODE=apikey.');
}

function mapMessagesToGeminiContents(messages = []) {
  return messages.map((m) => {
    const role = m?.role === 'assistant' ? 'model' : 'user';
    const content = m?.content;

    if (Array.isArray(content)) {
      const parts = content
        .map((p) => {
          if (p?.type === 'text') return { text: String(p.text || '') };
          if (p?.type === 'image_url') {
            const url = p?.image_url?.url;
            if (typeof url === 'string' && url.startsWith('data:image/')) {
              const [meta, base64] = url.split(',');
              const mimeType = meta.match(/^data:(.*?);base64$/)?.[1] || 'image/jpeg';
              return { inlineData: { mimeType, data: base64 } };
            }
          }
          return null;
        })
        .filter(Boolean);
      return { role, parts: parts.length ? parts : [{ text: '' }] };
    }

    return { role, parts: [{ text: String(content ?? '') }] };
  });
}

function messagesToPrompt(messages = []) {
  return messages
    .map((m) => {
      const role = m?.role || 'user';
      const content = Array.isArray(m?.content)
        ? m.content
            .map((p) => {
              if (p?.type === 'text') return p.text || '';
              if (p?.type === 'image_url') return '[image]';
              return '';
            })
            .join('\n')
        : String(m?.content ?? '');
      return `${role.toUpperCase()}: ${content}`;
    })
    .join('\n\n');
}

async function callGeminiViaApiKey({ model, messages, temperature, max_tokens }) {
  if (!GEMINI_API_KEY) {
    return { status: 500, body: { error: 'GEMINI_API_KEY missing on proxy' } };
  }

  const payload = {
    contents: mapMessagesToGeminiContents(messages),
    generationConfig: {
      temperature,
      maxOutputTokens: max_tokens
    }
  };

  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  );

  const body = await r.json();
  if (!r.ok) {
    return {
      status: r.status,
      body: { error: 'Gemini API error', details: body }
    };
  }

  const text = body?.candidates?.[0]?.content?.parts
    ?.map((p) => p?.text)
    .filter(Boolean)
    .join('\n') || '';

  return { status: 200, text, raw: body };
}

async function callGeminiViaOauthCli({ model, messages }) {
  const prompt = messagesToPrompt(messages);
  const args = GEMINI_CLI_USE_MODEL ? ['-m', model, '-p', prompt] : ['-p', prompt];

  try {
    const childEnv = { ...process.env };
    // Avoid leaking proxy-side vars into Gemini CLI auth/model selection.
    delete childEnv.GEMINI_MODEL;
    delete childEnv.GEMINI_API_KEY;
    delete childEnv.GOOGLE_API_KEY;
    delete childEnv.GOOGLE_GENAI_API_KEY;

    const { stdout, stderr } = await execFileAsync(GEMINI_CLI_PATH, args, {
      timeout: GEMINI_CLI_TIMEOUT_MS,
      maxBuffer: 10 * 1024 * 1024,
      env: childEnv
    });

    const output = (stdout || '').trim();
    if (!output) {
      return {
        status: 502,
        body: { error: 'Gemini CLI returned empty output', stderr: (stderr || '').trim() }
      };
    }

    return { status: 200, text: output, raw: { stderr: (stderr || '').trim() } };
  } catch (error) {
    return {
      status: 500,
      body: {
        error: 'Gemini OAuth CLI execution failed',
        message: error?.message || String(error)
      }
    };
  }
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, model: GEMINI_MODEL, mode: GEMINI_MODE });
});

app.post('/v1/chat/completions', async (req, res) => {
  try {
    if (PROXY_BEARER_TOKEN) {
      const auth = req.header('authorization') || '';
      if (auth !== `Bearer ${PROXY_BEARER_TOKEN}`) {
        return res.status(401).json({ error: 'Unauthorized proxy token' });
      }
    }

    const { model, messages = [], temperature = 0.7, max_tokens = 1024 } = req.body || {};
    const targetModel = model || GEMINI_MODEL;

    const result = GEMINI_MODE === 'oauth'
      ? await callGeminiViaOauthCli({ model: targetModel, messages })
      : await callGeminiViaApiKey({ model: targetModel, messages, temperature, max_tokens });

    if (result.status !== 200) {
      return res.status(result.status).json(result.body);
    }

    return res.json({
      id: `gemini-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: targetModel,
      choices: [
        {
          index: 0,
          finish_reason: 'stop',
          message: {
            role: 'assistant',
            content: result.text
          }
        }
      ],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      },
      raw: result.raw || null
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Proxy exception',
      message: error?.message || String(error)
    });
  }
});

app.listen(PORT, () => {
  console.log(`[gemini-proxy] listening on :${PORT} (mode=${GEMINI_MODE})`);
});
