import { NormalizedDesign } from '../types';

/**
 * Modular Importer Abstraction Interface.
 * Allows adding future formats (DXF, CDR, AI, PNG) without rewriting the nesting engine.
 */
export interface DesignImporter {
  canImport(file: File): boolean;
  import(file: File): Promise<NormalizedDesign>;
}
