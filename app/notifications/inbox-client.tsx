'use client';

import { callApi } from '../components/call-api';
import { say } from '@/lib/locale-text';
import type { Lang } from '@/lib/i18n';

export function MarkRead({ lang }: { lang: Lang }) {
  return (
    <button
      className="secondary"
      type="button"
      onClick={async () => {
        await callApi('/api/notifications', { method: 'POST', body: { ids: 'all' } });
        location.reload();
      }}
    >
      {say(lang, 'Mark all as read', '全部标为已读')}
    </button>
  );
}
