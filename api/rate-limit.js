export function createMemoryStore() {
  return new Map();
}

export function pruneStore(store, now = Date.now()) {
  for (const [key, timestamps] of store) {
    const next = timestamps.filter((timestamp) => timestamp > now);
    if (next.length) store.set(key, next);
    else store.delete(key);
  }
}

export function hitRateLimit(store, key, { windowMs, maxHits, now = Date.now() }) {
  const cutoff = now - windowMs;
  const recent = (store.get(key) || []).filter((timestamp) => timestamp > cutoff);
  if (recent.length >= maxHits) {
    store.set(key, recent);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((recent[0] - cutoff) / 1000)),
    };
  }

  recent.push(now);
  store.set(key, recent);
  return {
    allowed: true,
    remaining: Math.max(0, maxHits - recent.length),
    retryAfterSeconds: 0,
  };
}

export function clientIp(request) {
  const forwarded = request.headers?.['x-forwarded-for'] || request.headers?.['X-Forwarded-For'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return request.socket?.remoteAddress || 'unknown';
}
