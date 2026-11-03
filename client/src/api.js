export async function getJson(path, options = {}) {
  const res = await fetch(path, options);
  const body = await res.json().catch(() => null);
  if (!res.ok || body?.error) {
    throw new Error(body?.msg || `Request failed: ${res.status}`);
  }
  if (!body || body.error !== false) {
    throw new Error('Invalid API response');
  }
  return body.data;
}
