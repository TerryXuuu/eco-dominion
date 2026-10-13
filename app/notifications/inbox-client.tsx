'use client';

import { callApi } from '../components/call-api';

export function MarkRead() {
  return (
    <button
      className="secondary"
      type="button"
      onClick={async () => {
        await callApi('/api/notifications', { method: 'POST', body: { ids: 'all' } });
        location.reload();
      }}
    >
      Mark all as read
    </button>
  );
}
