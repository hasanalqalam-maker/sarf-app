import { getBabsByUnit, getConjugationForBab } from './data';
import { shuffle } from './gameData';
import type { GameConfig, Paradigm, FlashCard } from './gameData';
import unit2VocabJson from '../../data/unit2-vocab.json';

// ── Types ─────────────────────────────────────────────────────────────────────

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

export interface DictionaryFormOption {
  babId: string;
  form: string;
}

export interface DictionaryFormQuestion {
  id: string;
  conjugatedForm: string;
  paradigm: Paradigm;
  sighaId: string;
  correctBabId: string;
  correctDictForm: string;
  options: DictionaryFormOption[];
}

// ── Section labels ────────────────────────────────────────────────────────────

export const UNIT2_SECTION_ORDER = [
  'الْمَاضِي وَالْمُضَارِع',
  'التَّعَرُّف عَلَى الأَبْوَاب',
  'الْمَجْهُول وَالأَمْر',
  'الْمُفْرَدَات',
];

// ── Game manifest ─────────────────────────────────────────────────────────────

export const UNIT2_GAMES: GameConfig[] = [
  // الْمَاضِي وَالْمُضَارِع
  { id: 'u2-madi-fill', unit: 2, section: 'الْمَاضِي وَالْمُضَارِع', title: 'Fill the Table — Māḍī Maʿlūm', description: 'Reveal all 14 māḍī forms for each of the 10 mazīd bābs.', type: 'fill-table', format: 'fill-table', paradigm: 'madi_malum', unlockAfter: [] },
  { id: 'u2-mudari-fill', unit: 2, section: 'الْمَاضِي وَالْمُضَارِع', title: 'Fill the Table — Muḍāriʿ Maʿlūm', description: 'Reveal all 14 muḍāriʿ forms for each mazīd bāb.', type: 'fill-table', format: 'fill-table', paradigm: 'mudari_malum', unlockAfter: ['u2-madi-fill'] },
  { id: 'u2-bab-flashcards', unit: 2, section: 'الْمَاضِي وَالْمُضَارِع', title: 'Flashcards — All 10 Bābs', description: 'Review all 10 mazīd bāb patterns with flip cards.', type: 'flashcards', format: 'flashcards', paradigm: 'madi_malum', unlockAfter: ['u2-mudari-fill'] },

  // التَّعَرُّف عَلَى الأَبْوَاب
  { id: 'u2-which-bab-madi', unit: 2, section: 'التَّعَرُّف عَلَى الأَبْوَاب', title: 'Which Bāb? — Māḍī', description: 'Given a māḍī form, identify which mazīd bāb it belongs to.', type: 'which-bab', format: 'quiz', paradigm: 'madi_malum', unlockAfter: ['u2-bab-flashcards'] },
  { id: 'u2-which-bab-mudari', unit: 2, section: 'التَّعَرُّف عَلَى الأَبْوَاب', title: 'Which Bāb? — Muḍāriʿ', description: 'Given a muḍāriʿ form, identify which mazīd bāb it belongs to.', type: 'which-bab', format: 'quiz', paradigm: 'mudari_malum', unlockAfter: ['u2-which-bab-madi'] },
  { id: 'u2-bab-zaid-matchup', unit: 2, section: 'التَّعَرُّف عَلَى الأَبْوَاب', title: 'Match: Bāb → حُرُوف زَائِدَة', description: 'Match each bāb pattern to its description of extra letters.', type: 'match-up', format: 'match-up', paradigm: 'madi_malum', matchType: 'bab-zaid', unlockAfter: ['u2-bab-flashcards'] },
  { id: 'u2-bab-mudari-matchup', unit: 2, section: 'التَّعَرُّف عَلَى الأَبْوَاب', title: 'Match: Māḍī ↔ Muḍāriʿ', description: 'Match each mazīd māḍī base form to its muḍāriʿ counterpart.', type: 'match-up', format: 'match-up', paradigm: 'mudari_malum', matchType: 'bab-mudari', unlockAfter: ['u2-bab-flashcards'] },

  // الْمَجْهُول وَالأَمْر
  { id: 'u2-majhul-madi-fill', unit: 2, section: 'الْمَجْهُول وَالأَمْر', title: 'Fill the Table — Māḍī Majhūl', description: 'Reveal the passive māḍī table for each mazīd bāb.', type: 'fill-table', format: 'fill-table', paradigm: 'madi_majhul', unlockAfter: ['u2-which-bab-mudari'] },
  { id: 'u2-majhul-mudari-fill', unit: 2, section: 'الْمَجْهُول وَالأَمْر', title: 'Fill the Table — Muḍāriʿ Majhūl', description: 'Reveal the passive muḍāriʿ table for each mazīd bāb.', type: 'fill-table', format: 'fill-table', paradigm: 'mudari_majhul', unlockAfter: ['u2-majhul-madi-fill'] },
  { id: 'u2-amr-fill', unit: 2, section: 'الْمَجْهُول وَالأَمْر', title: 'Fill the Table — Amr', description: 'Reveal all 6 command forms. Note which bābs need hamzat al-waṣl.', type: 'fill-table', format: 'fill-table', paradigm: 'amr', unlockAfter: ['u2-majhul-madi-fill'] },
  { id: 'u2-nahy-fill', unit: 2, section: 'الْمَجْهُول وَالأَمْر', title: 'Fill the Table — Nahy', description: 'Reveal all 6 prohibition forms for the mazīd bābs.', type: 'fill-table', format: 'fill-table', paradigm: 'nahy', unlockAfter: ['u2-amr-fill'] },

  // الْمُفْرَدَات
  { id: 'u2-dict-form', unit: 2, section: 'الْمُفْرَدَات', title: 'Dictionary Form', description: 'Given a conjugated form, identify the māḍī ghaib (citation form).', type: 'dictionary-form', format: 'quiz', paradigm: 'mudari_malum', unlockAfter: ['u2-amr-fill'] },
  { id: 'u2-vocab-flashcards', unit: 2, section: 'الْمُفْرَدَات', title: 'Vocabulary Flashcards', description: 'Review the vocabulary verbs from pages 81–99 of the textbook.', type: 'flashcards', format: 'flashcards', paradigm: 'madi_malum', unlockAfter: ['u2-dict-form'] },
];

export function getUnit2GameConfig(id: string): GameConfig | undefined {
  return UNIT2_GAMES.find((g) => g.id === id);
}

export function getUnit2GameSections() {
  return UNIT2_SECTION_ORDER.map((section) => ({
    section,
    games: UNIT2_GAMES.filter((g) => g.section === section),
  }));
}

export function computeUnit2Completion(progress: Record<string, { completed?: boolean }>): number {
  const total = UNIT2_GAMES.length;
  const done = UNIT2_GAMES.filter((g) => progress[g.id]?.completed).length;
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

// ── WhichBab generator ────────────────────────────────────────────────────────

export function generateWhichBabQuestions(paradigm: Paradigm, count = 10): WhichBabQuestion[] {
  const babs = getBabsByUnit(2);
  const questions: WhichBabQuestion[] = [];

  for (const bab of babs) {
    const conj = getConjugationForBab(bab.id);
    if (!conj) continue;
    const paradigmData = conj[paradigm];
    if (!paradigmData) continue;

    const samples = shuffle([...paradigmData]).slice(0, 2);
    for (const entry of samples) {
      const wrongBabs = shuffle(babs.filter((b) => b.id !== bab.id)).slice(0, 3);
      const options = shuffle([
        { babId: bab.id, arabicName: bab.arabic_name, madi: bab.madi },
        ...wrongBabs.map((b) => ({ babId: b.id, arabicName: b.arabic_name, madi: b.madi })),
      ]);
      questions.push({
        id: `wb-${bab.id}-${paradigm}-${entry.sigha_id}`,
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

// ── DictionaryForm generator ──────────────────────────────────────────────────

export function generateDictionaryFormQuestions(count = 10): DictionaryFormQuestion[] {
  const babs = getBabsByUnit(2);
  const questions: DictionaryFormQuestion[] = [];

  const dictForms: Record<string, string> = {};
  for (const bab of babs) {
    const conj = getConjugationForBab(bab.id);
    const form = conj?.madi_malum?.find((e) => e.sigha_id === 'ghaib')?.form;
    if (form) dictForms[bab.id] = form;
  }

  const paradigmsToSample: Paradigm[] = ['mudari_malum', 'amr'];

  for (const bab of babs) {
    const conj = getConjugationForBab(bab.id);
    if (!conj || !dictForms[bab.id]) continue;

    for (const paradigm of paradigmsToSample) {
      const paradigmData = conj[paradigm];
      if (!paradigmData) continue;

      const sample = shuffle([...paradigmData])[0];
      if (!sample) continue;

      const wrongBabs = shuffle(babs.filter((b) => b.id !== bab.id && dictForms[b.id])).slice(0, 3);
      const options = shuffle([
        { babId: bab.id, form: dictForms[bab.id] },
        ...wrongBabs.map((b) => ({ babId: b.id, form: dictForms[b.id] })),
      ]);

      questions.push({
        id: `df-${bab.id}-${paradigm}-${sample.sigha_id}`,
        conjugatedForm: sample.form,
        paradigm,
        sighaId: sample.sigha_id,
        correctBabId: bab.id,
        correctDictForm: dictForms[bab.id],
        options,
      });
    }
  }

  return shuffle(questions).slice(0, count);
}

// ── Vocab flashcard generator ─────────────────────────────────────────────────

export function generateUnit2VocabFlashcards(): FlashCard[] {
  const babs = getBabsByUnit(2);
  const babMap = Object.fromEntries(babs.map((b) => [b.id, b]));
  const cards: FlashCard[] = [];

  for (const babVocab of unit2VocabJson.babs) {
    const bab = babMap[babVocab.babId];
    if (!bab) continue;
    for (const verb of babVocab.verbs) {
      cards.push({
        id: `vocab-${babVocab.babId}-${verb.madi}`,
        frontForm: verb.madi,
        backSigha: verb.meaning,
        backPronoun: '',
        backEnglish: bab.arabic_name,
        backBabId: babVocab.babId,
        backBabForm: bab.madi,
      });
    }
  }

  return shuffle(cards);
}
