export type Seat = 0 | 1;
export type Region = 'forest' | 'water' | 'wild' | 'domain';
export type CardKind = 'species' | 'tactic' | 'interference' | 'event';

export type CardDef = {
  id: string;
  name: string;
  kind: CardKind;
  cost?: number;
  regions?: Region[];
  power?: number;
  copies: number;
  effect: string;
};

export type CardInstance = { uid: string; card: string };
export type BoardSpecies = CardInstance & { owner: Seat; region: Region };

export type Choice =
  | { kind: 'discard'; owner: Seat; count: number }
  | { kind: 'rest'; owner: Seat; options: Region[] }
  | { kind: 'migration'; owner: Seat }
  | { kind: 'invasion'; owner: Seat; options: Region[] };

export type GameResult = { winner: Seat | null; reason: string; scores?: [number, number] };

export type GameState = {
  rules: string;
  version: number;
  rng: number;
  first: Seat;
  active: Seat;
  phase: string;
  players: { hand: CardInstance[]; turns: number; max: number; energy: number; reserve: number }[];
  board: BoardSpecies[];
  choices: Choice[];
  result: GameResult | null;
  accepted: { id: string; seat: Seat; version: number }[];
  [key: string]: unknown;
};

export type EngineCommand = {
  id: string;
  version: number;
  type: string;
  uid?: string;
  region?: string;
  target?: string;
  species?: string;
  uids?: string[];
  skip?: boolean;
};

export type Projection = {
  rules: string;
  version: number;
  active: Seat;
  first: Seat;
  phase: string;
  event: string | null;
  result: GameResult | null;
  players: { turns: number; max: number; energy: number; reserve: number; handCount: number; hand?: CardInstance[] }[];
  board: BoardSpecies[];
  regions: Record<Region, { stability: number; power: [number, number]; controller: Seat | null; penalty: [number, number] }>;
  deckCount: number;
  eventDeckCount: number;
  discard: CardInstance[];
  eventDiscard: string[];
  pending: ({ owner: Seat; kind: Choice['kind'] } & Partial<Choice>) | null;
};

export const CARDS: CardDef[];
export const REGIONS: Region[];
export function stability(state: GameState, region: Region): number;
export function power(state: GameState, region: Region, seat: Seat, temporary?: boolean): number;
export function controller(state: GameState, region: Region, temporary?: boolean): Seat | null;
export function newGame(seed?: number): GameState;
export function apply(state: GameState, seat: number, command: EngineCommand): GameState;
export function project(state: GameState, seat?: number | null): Projection;
