export function privateJson(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'private, no-store' },
  });
}
