import cards from '../data/cards.json';
import type { CardDef, Region } from '../src/engine.mjs';

/** Client-safe catalogue; the engine module reads files and stays server-side. */
export const CATALOG = cards as CardDef[];
export const CARD_BY_ID: Record<string, CardDef> = Object.fromEntries(CATALOG.map((card) => [card.id, card]));
export const REGION_ORDER: Region[] = ['forest', 'water', 'wild', 'domain'];
export const REGION_LABEL: Record<Region, string> = { forest: 'Forest', water: 'Water', wild: 'Wild', domain: 'Domain' };
export const KIND_LABEL: Record<string, string> = { species: 'Species', tactic: 'Tactic', interference: 'Interference', event: 'Event' };

const SPELLS_WITH_REGION = new Set(['fortify', 'bloom', 'infuse', 'erode', 'break', 'veil', 'destroy', 'migrate']);
export const spellNeedsRegion = (id: string) => SPELLS_WITH_REGION.has(id);
export const titleOf = (id: string) => id.charAt(0).toUpperCase() + id.slice(1);
