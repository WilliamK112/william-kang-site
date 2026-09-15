import { clientIp, createMemoryStore, hitRateLimit } from './rate-limit.js';

const MAX_MESSAGE_LENGTH = 2000;
const MAX_EMAIL_LENGTH = 254;
const MIN_ELAPSED_MS = 2000;
const MAX_ELAPSED_MS = 1000 * 60 * 60 * 12;
const HOURLY_LIMIT = 5;
const HOURLY_WINDOW_MS = 60 * 60 * 1000;
const BURST_LIMIT = 1;
const BURST_WINDOW_MS = 45 * 1000;

const ALLOWED_ORIGINS = new Set([
  'https://williamkang.com',
  'https://www.williamkang.com',
  'https://william-kang-site.vercel.app',
  'http://127.0.0.1:8000',
  'http://localhost:8000',
]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const defaultStore = createMemoryStore();

function json(response, status, body, extraHeaders = {}) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Cache-Control', 'no-store');
  Object.entries(extraHeaders).forEach(([name, value]) => response.setHeader(name, value));
  return response.status(status).json(body);
}

function readOrigin(request) {
  const origin = request.headers?.origin || request.headers?.Origin;
  if (typeof origin === 'string' && origin) return origin;
  const referer = request.headers?.referer || request.headers?.Referer;
  if (typeof referer !== 'string' || !referer) return '';
  try {
    return new URL(referer).origin;
  } catch {
    return '';
  }
}

function parseBody(request) {
  const body = request.body;
  if (body && typeof body === 'object' && !Buffer.isBuffer(body)) return body;
  if (typeof body === 'string' && body.trim()) {
    return JSON.parse(body);
  }
  return {};
}

export function createContactHandler({
  fetchImpl = fetch,
  store = defaultStore,
  now = () => Date.now(),
  inbox = process.env.CONTACT_EMAIL || 'ckang53@wisc.edu',
} = {}) {
  return async function contactHandler(request, response) {
    if (request.method && request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      return json(response, 405, { error: 'Method not allowed' });
    }

    const origin = readOrigin(request);
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return json(response, 403, { error: 'Forbidden' });
    }

    let payload;
    try {
      payload = parseBody(request);
    } catch {
      return json(response, 400, { error: 'Invalid request' });
    }

    const email = typeof payload.email === 'string' ? payload.email.trim() : '';
    const message = typeof payload.message === 'string' ? payload.message.trim() : '';
    const honeypot = typeof payload.company === 'string' ? payload.company.trim() : '';
    const startedAt = Number(payload.startedAt);
    const elapsed = now() - startedAt;

    if (honeypot) {
      return json(response, 200, { ok: true });
    }

    if (!EMAIL_PATTERN.test(email) || email.length > MAX_EMAIL_LENGTH || !message) {
      return json(response, 400, { error: 'Invalid request' });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return json(response, 413, { error: 'Message too long' });
    }

    if (!Number.isFinite(startedAt) || elapsed < MIN_ELAPSED_MS || elapsed > MAX_ELAPSED_MS) {
      return json(response, 400, { error: 'Invalid request' });
    }

    const ip = clientIp(request);
    const burst = hitRateLimit(store, `contact:burst:${ip}`, {
      windowMs: BURST_WINDOW_MS,
      maxHits: BURST_LIMIT,
      now: now(),
    });
    const hourly = hitRateLimit(store, `contact:hour:${ip}`, {
      windowMs: HOURLY_WINDOW_MS,
      maxHits: HOURLY_LIMIT,
      now: now(),
    });

    if (!burst.allowed || !hourly.allowed) {
      const retryAfter = Math.max(burst.retryAfterSeconds, hourly.retryAfterSeconds);
      return json(response, 429, { error: 'Too many requests' }, { 'Retry-After': String(retryAfter) });
    }

    const upstream = await fetchImpl(`https://formsubmit.co/ajax/${encodeURIComponent(inbox)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email,
        message: message.slice(0, MAX_MESSAGE_LENGTH),
        _subject: 'New portfolio message',
        _captcha: 'false',
        _template: 'table',
      }),
    });

    if (!upstream.ok) {
      return json(response, 502, { error: 'Delivery failed' });
    }

    return json(response, 200, { ok: true });
  };
}

export default createContactHandler();
