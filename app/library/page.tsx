import { CATALOG } from '@/lib/cards';
import { CARD_GUIDE } from '@/lib/card-guide';
import { Library, type LibraryCard } from './library-client';
import { copy } from '@/lib/i18n';
import { getLang } from '@/lib/lang';
import { shownEffect, shownGuide } from '@/lib/locale-text';

export const dynamic = 'force-dynamic';

export default async function LibraryPage() {
  const lang = await getLang();
  const text = copy(lang).library;
  const cards: LibraryCard[] = CATALOG.map((card) => ({
    id: card.id,
    name: card.name,
    kind: card.kind,
    cost: card.cost,
    power: card.power,
    regions: card.regions,
    copies: card.copies,
    effect: shownEffect(lang, card.id, card.effect),
    play: shownGuide(lang, card.id, CARD_GUIDE[card.id]?.play ?? card.effect, CARD_GUIDE[card.id]?.pair ?? '').play,
    pair: shownGuide(lang, card.id, CARD_GUIDE[card.id]?.play ?? card.effect, CARD_GUIDE[card.id]?.pair ?? '').pair,
  }));
  return (
    <>
      <main className="shell stack">
        <section className="hero compact">
          <h1>{text.title}</h1>
          <p className="lede">{text.lede}</p>
        </section>
        <Library lang={lang} cards={cards} />
      </main>
    </>
  );
}
