'use client';

import { useState } from 'react';

export function PlayerPortrait({ handle, name, large }: { handle: string; name: string; large?: boolean }) {
  const [missing, setMissing] = useState(false);
  const initial = name.trim().slice(0, 1).toUpperCase() || '?';
  const size = large ? ' large' : '';
  if (missing) return <span className={`avatar-fallback${size}`} aria-hidden="true">{initial}</span>;
  return <img className={`avatar${size}`} src={`/api/players/${handle}/avatar`} alt="" onError={() => setMissing(true)} />;
}
