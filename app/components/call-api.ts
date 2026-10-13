export type ApiResult<T> = { ok: boolean; status: number; data: T };

/** Same-origin JSON call; network failures surface as status 0 so callers can retry. */
export async function callApi<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      method: init.method ?? 'GET',
      headers: init.body === undefined ? undefined : { 'content-type': 'application/json' },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: 'no-store',
    });
    const data = (await response.json().catch(() => ({}))) as T;
    return { ok: response.ok, status: response.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: 'Connection lost; retrying' } as T };
  }
}
