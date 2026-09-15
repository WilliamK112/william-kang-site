import assert from 'node:assert/strict';
import test from 'node:test';

import { createContactHandler } from '../api/contact.js';
import { createMemoryStore } from '../api/rate-limit.js';

function createMockResponse() {
  return {
    body: null,
    headers: {},
    statusCode: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function request({ body, method = 'POST', origin = 'https://williamkang.com', ip = '203.0.113.10' } = {}) {
  return {
    method,
    body,
    headers: {
      origin,
      'x-forwarded-for': ip,
    },
  };
}

test('contact rejects non-POST methods', async () => {
  const response = createMockResponse();
  await createContactHandler()(request({ method: 'GET', body: {} }), response);
  assert.equal(response.statusCode, 405);
});

test('contact ignores honeypot submissions without sending mail', async () => {
  let called = 0;
  const fetchImpl = async () => {
    called += 1;
    return { ok: true };
  };
  const response = createMockResponse();
  await createContactHandler({ fetchImpl, now: () => 10_000 })(
    request({
      body: {
        email: 'a@example.com',
        message: 'hello from a recruiter',
        company: 'Spam Bot Inc',
        startedAt: 1,
      },
    }),
    response,
  );
  assert.equal(response.statusCode, 200);
  assert.equal(called, 0);
});

test('contact rate-limits repeated sends from the same IP', async () => {
  const store = createMemoryStore();
  let now = 20_000;
  let sent = 0;
  const handler = createContactHandler({
    store,
    now: () => now,
    fetchImpl: async () => {
      sent += 1;
      return { ok: true };
    },
  });

  const first = createMockResponse();
  await handler(request({ body: { email: 'a@example.com', message: 'hello there', startedAt: 1 } }), first);
  assert.equal(first.statusCode, 200);

  const burst = createMockResponse();
  await handler(request({ body: { email: 'a@example.com', message: 'hello again', startedAt: 1 } }), burst);
  assert.equal(burst.statusCode, 429);
  assert.equal(sent, 1);

  now += 46_000;
  const afterBurst = createMockResponse();
  await handler(request({ body: { email: 'a@example.com', message: 'hello later', startedAt: 1 } }), afterBurst);
  assert.equal(afterBurst.statusCode, 200);
  assert.equal(sent, 2);
});

test('contact forwards a valid message to FormSubmit', async () => {
  let url = '';
  let payload = null;
  const handler = createContactHandler({
    inbox: 'inbox@example.com',
    now: () => 10_000,
    fetchImpl: async (nextUrl, options) => {
      url = String(nextUrl);
      payload = JSON.parse(options.body);
      return { ok: true };
    },
  });
  const response = createMockResponse();
  await handler(
    request({
      body: {
        email: 'recruiter@example.com',
        message: 'Loved the badminton tracker.',
        startedAt: 1,
      },
    }),
    response,
  );
  assert.equal(response.statusCode, 200);
  assert.match(url, /formsubmit\.co\/ajax\/inbox%40example.com/);
  assert.equal(payload.email, 'recruiter@example.com');
  assert.equal(payload._captcha, 'false');
  assert.equal(JSON.stringify(response.body).includes('inbox@example.com'), false);
});
