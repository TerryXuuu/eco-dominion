import { SiteHeader } from '../components/site-header';
import { CATALOG } from '@/lib/cards';
import { CARD_GUIDE } from '@/lib/card-guide';
import { Library, type LibraryCard } from './library-client';

export const dynamic = 'force-dynamic';

export default function LibraryPage() {
  const cards: LibraryCard[] = CATALOG.map((card) => ({
    id: card.id,
    name: card.name,
    kind: card.kind,
    cost: card.cost,
    power: card.power,
    regions: card.regions,
    copies: card.copies,
    effect: card.effect,
    play: CARD_GUIDE[card.id]?.play ?? card.effect,
    pair: CARD_GUIDE[card.id]?.pair ?? '',
  }));
  return (
    <>
      <SiteHeader />
      <main className="shell stack">
        <section className="hero compact">
          <h1>Card library</h1>
          <p className="lede">Every card in the deck, with its art, the rules text, and when it is actually worth playing.</p>
        </section>
        <Library cards={cards} />
      </main>
    </>
  );
}
