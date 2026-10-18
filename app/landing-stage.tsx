'use client';

import { useRef } from 'react';
import { CATALOG } from '@/lib/cards';

const sparks = Array.from({ length: 16 }, (_, index) => ({
  left: `${(index * 37) % 100}%`,
  delay: `${index * -0.8}s`,
  duration: `${8 + (index % 5)}s`,
}));

export function LandingStage({ children }: { children: React.ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);

  function follow(event: React.PointerEvent<HTMLDivElement>) {
    const box = stage.current?.getBoundingClientRect();
    if (!box) return;
    stage.current?.style.setProperty('--mx', String((event.clientX - box.left) / box.width));
    stage.current?.style.setProperty('--my', String((event.clientY - box.top) / box.height));
  }

  const ribbon = [...CATALOG, ...CATALOG];

  return (
    <div className="stage" ref={stage} onPointerMove={follow}>
      <div className="stage-bg"><div className="stage-photo" /></div>
      <div className="stage-glow" />
      <div className="fireflies" aria-hidden="true">
        {sparks.map((spark) => <span key={spark.left + spark.delay} style={{ left: spark.left, animationDelay: spark.delay, animationDuration: spark.duration }} />)}
      </div>
      <div className="stage-front">
        {children}
        <div className="ribbon" aria-hidden="true">
          <div className="ribbon-track">
            {ribbon.map((card, index) => <img key={`${card.id}-${index}`} src={`/cards/${card.id}.jpg`} alt="" />)}
          </div>
        </div>
      </div>
    </div>
  );
}
