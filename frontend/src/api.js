export async function request(path = "", options = {}) {
  const response = await fetch(`/api/todos${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    signal: options.signal ?? AbortSignal.timeout(15000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      body.error || "Could not reach your tasks. Please try again.",
    );
  return body;
}
