import cards from '../data/cards.json' with { type: 'json' };
import type { CardDef, Region } from '../src/engine.mjs';

/** Client-safe catalogue; the engine module reads files and stays server-side. */
export const CATALOG = cards as CardDef[];
export const CARD_BY_ID: Record<string, CardDef> = Object.fromEntries(CATALOG.map((card) => [card.id, card]));
export const REGION_ORDER: Region[] = ['forest', 'water', 'wild', 'domain'];
export const REGION_LABEL: Record<Region, string> = { forest: 'Forest', water: 'Water', wild: 'Wild', domain: 'Highland' };
export const KIND_LABEL: Record<string, string> = { species: 'Species', tactic: 'Tactic', interference: 'Interference', event: 'Event' };

const SPELLS_WITH_REGION = new Set(['fortify', 'bloom', 'infuse', 'erode', 'break', 'veil', 'destroy', 'migrate']);
export const spellNeedsRegion = (id: string) => SPELLS_WITH_REGION.has(id);

/** Printed English titles. Internal ids stay short; artwork filenames stay on the Chinese catalog name. */
export const EN_TITLE: Record<string, string> = {
  mouse: 'Meadow Rodent',
  beetle: 'Moss Beetle',
  deer: 'Canopy Stag',
  fox: 'Brush Fox',
  lizard: 'Rock Lizard',
  beaver: 'Beaver Engineer',
  heron: 'Grey Heron',
  snake: 'Tidal Serpent',
  ray: 'Reef Manta',
  bison: 'Wild Bison',
  falcon: 'Highland Falcon',
  panther: 'Canyon Leopard',
  oak: 'Ancient Oak',
  guardian: 'Primordial Watcher',
  algae: 'Abyssal Mother Algae',
  fortify: 'Territorial Fortification',
  bloom: 'Biological Surge',
  migrate: 'Habitat Migration',
  charge: 'Energy Stockpile',
  infuse: 'Ecological Infusion',
  reinforce: 'Call Reinforcements',
  erode: 'Erosion',
  break: 'Broken Synergy',
  veil: 'Polluted Veil',
  steal: 'Resource Plunder',
  destroy: 'Terrain Destruction',
  heat: 'Heat Wave',
  monsoon: 'Monsoon Surge',
  rest: 'Quiet Bloom',
  quake: 'Tectonic Tremor',
  migration: 'Migration Tide',
  revival: 'Ecological Revival',
  drought: 'Dry Season',
  storm: 'Passing Storm',
  invasion: 'Species Invasion',
  balance: 'Natural Balance',
};

export const titleOf = (id: string) => EN_TITLE[id] ?? id.charAt(0).toUpperCase() + id.slice(1);
