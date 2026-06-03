import babsJson from '../../data/babs.json';
import conjugationsJson from '../../data/conjugations.json';
import sighasJson from '../../data/sighas.json';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Bab {
  id: string;
  unit: number;
  arabic_name: string;
  madi: string;
  mudari: string;
  pattern_madi?: string;
  pattern_mudari?: string;
  madi_ayn?: string;
  mudari_ayn?: string;
  masdar: string;
  masdar_2?: string;
  ism_fail: string | null;
  ism_maful: string | null;
  roman_numeral: string | null;
  page: number;
  has_majhul: boolean;
  _note?: string;
  zaid_harf?: string;
  example_verb?: string;
  verb_type?: string;
}

export interface SighaEntry {
  id: string;
  arabic_name: string;
  pronoun?: string;
  pattern?: string;
  english: string;
  person?: string;
  person_english?: string;
  gender: string;
  gender_english?: string;
  number: string;
  number_english?: string;
}

export interface ConjugationEntry {
  sigha_id: string;
  form: string;
}

export interface BabConjugation {
  bab_id: string;
  _note?: string;
  madi_malum: ConjugationEntry[];
  mudari_malum: ConjugationEntry[];
  madi_majhul: ConjugationEntry[] | null;
  mudari_majhul: ConjugationEntry[] | null;
  amr: ConjugationEntry[];
  nahy: ConjugationEntry[];
}

export interface SighasData {
  madi_mudari: SighaEntry[];
  amr: SighaEntry[];
  nahy: SighaEntry[];
  ism_fail: SighaEntry[];
  ism_maful: SighaEntry[];
}

// ─── Data accessors ───────────────────────────────────────────────────────────

export function getBabs(): Bab[] {
  return babsJson.babs as Bab[];
}

export function getBabById(id: string): Bab | null {
  return (babsJson.babs as Bab[]).find((b) => b.id === id) ?? null;
}

export function getBabsByUnit(unit: number): Bab[] {
  return (babsJson.babs as Bab[]).filter((b) => b.unit === unit);
}

export function getConjugationForBab(babId: string): BabConjugation | null {
  return (
    (conjugationsJson.conjugations as BabConjugation[]).find(
      (c) => c.bab_id === babId,
    ) ?? null
  );
}

export function getSighas(): SighasData {
  return sighasJson as unknown as SighasData;
}

/** Build lookup maps from sigha_id → SighaEntry for fast rendering */
export function buildSighaLookups(sighas: SighasData) {
  return {
    madi_mudari: Object.fromEntries(sighas.madi_mudari.map((s) => [s.id, s])),
    amr: Object.fromEntries(sighas.amr.map((s) => [s.id, s])),
    nahy: Object.fromEntries(sighas.nahy.map((s) => [s.id, s])),
  };
}
