import { features } from 'web-features';
import type { WebFeaturesData } from './parser/parser.js';

/**
 * The web-features dataset (`features` from the `web-features` package).
 *
 * `web-features` is ESM-only; the CommonJS build of this package relies on
 * Node's require(esm) support (Node 20.19+ / 22.12+).
 */
export const webFeatures: WebFeaturesData = features;
