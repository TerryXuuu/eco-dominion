import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

type Engine = typeof import('../src/engine.mjs');

// The reference engine reads data/cards.json via import.meta.url, which bundlers rewrite. Load it with Node's own
// loader so production runs the same unmodified module the reference tests exercise. Requires cwd = project root.
const engine = (await import(/* turbopackIgnore: true */ /* webpackIgnore: true */ pathToFileURL(join(process.cwd(), 'src', 'engine.mjs')).href)) as Engine;

export const { REGIONS, apply, newGame, project } = engine;
