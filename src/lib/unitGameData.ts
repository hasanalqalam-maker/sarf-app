/**
 * Generic per-unit game data, for units whose content is "an irregularity
 * applied across existing bāb patterns" (Units 3–9) — the same shape as
 * Units 1–2, just with the extra irregularity dimension. Reuses the exact
 * generic generators already in gameData.ts (generateFillTableData,
 * generateFlashcards, generateMatchUpItems all read config.unit already);
 * this module adds the two generators that were unit-2-specific
 * (which-bab, dictionary-form) as unit-parametrized versions, plus a
 * registry of hand-authored per-unit game manifests.
 */
import { getBabsByUnit, getConjugationForBab } from './data';
import { shuffle } from './gameData';
import type { GameConfig, Paradigm } from './gameData';

export interface WhichBabOption {
  babId: string;
  arabicName: string;
  madi: string;
}

export interface WhichBabQuestion {
  id: string;
  form: string;
  paradigm: Paradigm;
  sighaId: string;
  correctBabId: string;
  correctBabArabicName: string;
  options: WhichBabOption[];
}

export function generateWhichBabQuestions(unit: number, paradigm: Paradigm, count = 10): WhichBabQuestion[] {
  const babs = getBabsByUnit(unit);
  const questions: WhichBabQuestion[] = [];

  for (const bab of babs) {
    const conj = getConjugationForBab(bab.id);
    if (!conj) continue;
    const paradigmData = conj[paradigm];
    if (!paradigmData) continue;

    const samples = shuffle([...paradigmData]).slice(0, 2);
    for (const entry of samples) {
      const wrongBabs = shuffle(babs.filter((b) => b.id !== bab.id)).slice(0, 3);
      if (wrongBabs.length < 3) continue;
      const options = shuffle([
        { babId: bab.id, arabicName: bab.arabic_name, madi: bab.madi },
        ...wrongBabs.map((b) => ({ babId: b.id, arabicName: b.arabic_name, madi: b.madi })),
      ]);
      questions.push({
        id: `u${unit}wb-${bab.id}-${paradigm}-${entry.sigha_id}`,
        form: entry.form,
        paradigm,
        sighaId: entry.sigha_id,
        correctBabId: bab.id,
        correctBabArabicName: bab.arabic_name,
        options,
      });
    }
  }

  return shuffle(questions).slice(0, count);
}

// ── Game manifest registry ────────────────────────────────────────────────────

const REGISTRIES: Record<number, GameConfig[]> = {};
const SECTION_ORDERS: Record<number, string[]> = {};

export const UNIT3_SECTION_ORDER = ['التَّصْرِيْف', 'التَّعَرُّف عَلَى الأَبْوَاب'];

export const UNIT3_GAMES: GameConfig[] = [
  { id: 'u3-madi-fill', unit: 3, section: 'التَّصْرِيْف', title: 'Fill the Table — Māḍī Maʿlūm', description: 'Reveal all 14 māḍī forms for each of the 11 mahmūz example verbs.', type: 'fill-table', format: 'fill-table', paradigm: 'madi_malum', unlockAfter: [] },
  { id: 'u3-mudari-fill', unit: 3, section: 'التَّصْرِيْف', title: 'Fill the Table — Muḍāriʿ Maʿlūm', description: 'Reveal all 14 muḍāriʿ forms for each verb.', type: 'fill-table', format: 'fill-table', paradigm: 'mudari_malum', unlockAfter: ['u3-madi-fill'] },
  { id: 'u3-majhul-madi-fill', unit: 3, section: 'التَّصْرِيْف', title: 'Fill the Table — Māḍī Majhūl', description: 'Reveal the passive māḍī table for each verb.', type: 'fill-table', format: 'fill-table', paradigm: 'madi_majhul', unlockAfter: ['u3-mudari-fill'] },
  { id: 'u3-majhul-mudari-fill', unit: 3, section: 'التَّصْرِيْف', title: 'Fill the Table — Muḍāriʿ Majhūl', description: 'Reveal the passive muḍāriʿ table for each verb.', type: 'fill-table', format: 'fill-table', paradigm: 'mudari_majhul', unlockAfter: ['u3-majhul-madi-fill'] },
  { id: 'u3-amr-fill', unit: 3, section: 'التَّصْرِيْف', title: 'Fill the Table — Amr', description: 'Reveal all 6 command forms. Note the taḵẖfīf and ḥaḏf changes.', type: 'fill-table', format: 'fill-table', paradigm: 'amr', unlockAfter: ['u3-majhul-mudari-fill'] },
  { id: 'u3-bab-flashcards', unit: 3, section: 'التَّعَرُّف عَلَى الأَبْوَاب', title: 'Flashcards — Mahmūz Verbs', description: 'Review all 11 mahmūz example verbs with flip cards.', type: 'flashcards', format: 'flashcards', paradigm: 'madi_malum', unlockAfter: ['u3-amr-fill'] },
  { id: 'u3-bab-mudari-matchup', unit: 3, section: 'التَّعَرُّف عَلَى الأَبْوَاب', title: 'Match: Māḍī ↔ Muḍāriʿ', description: 'Match each mahmūz māḍī form to its muḍāriʿ counterpart.', type: 'match-up', format: 'match-up', paradigm: 'mudari_malum', matchType: 'bab-mudari', unlockAfter: ['u3-bab-flashcards'] },
  { id: 'u3-which-bab-madi', unit: 3, section: 'التَّعَرُّف عَلَى الأَبْوَاب', title: 'Which Verb? — Māḍī', description: 'Given a māḍī form, identify which mahmūz example it belongs to.', type: 'which-bab', format: 'quiz', paradigm: 'madi_malum', unlockAfter: ['u3-bab-mudari-matchup'] },
];

REGISTRIES[3] = UNIT3_GAMES;
SECTION_ORDERS[3] = UNIT3_SECTION_ORDER;

export function getUnitGames(unit: number): GameConfig[] {
  return REGISTRIES[unit] ?? [];
}

export function getUnitGameConfig(unit: number, id: string): GameConfig | undefined {
  return getUnitGames(unit).find((g) => g.id === id);
}

export function getUnitGameSections(unit: number) {
  const order = SECTION_ORDERS[unit] ?? [];
  const games = getUnitGames(unit);
  return order.map((section) => ({
    section,
    games: games.filter((g) => g.section === section),
  }));
}

export function computeUnitCompletion(unit: number, progress: Record<string, { completed?: boolean }>): number {
  const games = getUnitGames(unit);
  const total = games.length;
  const done = games.filter((g) => progress[g.id]?.completed).length;
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

export function hasUnitGames(unit: number): boolean {
  return getUnitGames(unit).length > 0;
}
