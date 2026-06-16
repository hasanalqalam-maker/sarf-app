import exercisesJson from '../../data/exercises-unit1.json';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ExerciseType =
  | 'fill-table'
  | 'identify-sigha'
  | 'translate-arabic-to-english'
  | 'translate-english-to-arabic'
  | 'change-gender'
  | 'change-tense'
  | 'identify-bab'
  | 'identify-tense-voice'
  | 'identify-sigha-and-irab'
  | 'negate-and-translate'
  | 'negate-with-particle'
  | 'active-passive-table'
  | 'fill-tasrif-saghir'
  | 'verbal-practice';

export interface ExerciseItem {
  number: number;
  arabic?: string;
  english?: string;
  pattern?: string;
  sigha?: string;
  masdar?: string;
  bab?: string;
  formType?: string;
  particle?: string;
  answer?: unknown;
  answer_tense?: string;
  answer_voice?: string;
  sigha_note?: string;
  word_1?: string;
  word_2?: string;
  word_3?: string;
  word_4?: string;
  unclear: boolean;
  unclearNote?: string;
  note?: string;
}

export interface Exercise {
  id: string;
  globalIndex: number;
  exerciseNumber: number;
  page: number;
  unit: number;
  part: string;
  instructionText: string;
  exerciseType: ExerciseType;
  items: ExerciseItem[];
  unclear: boolean;
  note?: string;
  unclearNote?: string;
  // fill-table
  givenRow?: Record<string, string>;
  given_words?: string[];
  sighas?: string[];
  table_type?: string;
  pdfDiscrepancyNote?: string;
  // verbal-practice
  vocabVerbs?: Array<{ madi: string; mudari: string; masdar: string; english: string }>;
  // identify-tense-voice
  example?: unknown;
  recognitionRules?: Record<string, string>;
  // fill-tasrif-saghir
  referenceTable?: unknown;
  changeDirection?: string;
}

export interface ExerciseSessionEntry {
  score: number;
  total: number;
  completed: boolean;
  attempts: number;
  bestPct: number;
}

// ── Data access ───────────────────────────────────────────────────────────────

const ALL_EXERCISES = (exercisesJson as { exercises: Exercise[] }).exercises;

export function getAllExercises(): Exercise[] {
  return ALL_EXERCISES;
}

export function getExercise(id: string): Exercise | undefined {
  return ALL_EXERCISES.find((e) => e.id === id);
}

// Unique parts in order
export function getExerciseParts(): string[] {
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const ex of ALL_EXERCISES) {
    if (!seen.has(ex.part)) {
      seen.add(ex.part);
      parts.push(ex.part);
    }
  }
  return parts;
}

export function getExercisesByPart(part: string): Exercise[] {
  return ALL_EXERCISES.filter((e) => e.part === part);
}

// ── Unlock logic ──────────────────────────────────────────────────────────────

export function isExerciseUnlocked(
  exercise: Exercise,
  exerciseSessions: Record<string, ExerciseSessionEntry>,
): boolean {
  // Verbal practice is always available (reference card)
  if (exercise.exerciseType === 'verbal-practice') return true;

  // Within the same part, find non-verbal-practice exercises in order
  const partExercises = ALL_EXERCISES.filter(
    (e) => e.part === exercise.part && e.exerciseType !== 'verbal-practice',
  );
  const idx = partExercises.findIndex((e) => e.id === exercise.id);

  // First in part: always unlocked
  if (idx <= 0) return true;

  const prev = partExercises[idx - 1];
  return exerciseSessions[prev.id]?.completed === true;
}

// ── Completion stats ──────────────────────────────────────────────────────────

export function computeUnit1ExerciseCompletion(
  exerciseSessions: Record<string, ExerciseSessionEntry>,
): number {
  const scoreable = ALL_EXERCISES.filter((e) => e.exerciseType !== 'verbal-practice');
  if (scoreable.length === 0) return 0;
  const done = scoreable.filter((e) => exerciseSessions[e.id]?.completed).length;
  return Math.round((done / scoreable.length) * 100);
}

// ── Display helpers ───────────────────────────────────────────────────────────

export const TYPE_LABELS: Record<ExerciseType, string> = {
  'identify-sigha': 'Identify the sīgha',
  'change-gender': 'Change gender',
  'change-tense': 'Change tense',
  'translate-arabic-to-english': 'Translate',
  'translate-english-to-arabic': 'Translate',
  'fill-table': 'Fill the table',
  'identify-bab': 'Identify the bāb',
  'identify-tense-voice': 'Tense & voice',
  'identify-sigha-and-irab': 'Sīgha & iʿrāb',
  'negate-and-translate': 'Negate & translate',
  'negate-with-particle': 'Negate',
  'active-passive-table': 'Active / passive',
  'fill-tasrif-saghir': 'Taṣrīf ṣaghīr',
  'verbal-practice': 'Verbal practice',
};

export function parsePart(part: string): { label: string; arabic: string } {
  // "Part 1: الْمَاضِي" → { label: "Part 1", arabic: "الْمَاضِي" }
  // "Part 3: الأبواب — بَاب سَمِعَ يَسْمَعُ" → { label: "Part 3", arabic: "الأبواب — بَاب سَمِعَ يَسْمَعُ" }
  const m = part.match(/^(Part \d+):\s*(.+)$/);
  if (m) return { label: m[1], arabic: m[2] };
  return { label: '', arabic: part };
}

// ── Distractor generation ─────────────────────────────────────────────────────

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// The 14 sigha Arabic names used as the distractor pool for identify-sigha exercises
export const SIGHA_NAMES_AR = [
  'الْغَائِب', 'الْغَائِبَان', 'الْغَائِبُوْن',
  'الْغَائِبَة', 'الْغَائِبَتَان', 'الْغَائِبَات',
  'الْمُخَاطَب', 'الْمُخَاطَبَان', 'الْمُخَاطَبُوْن',
  'الْمُخَاطَبَة', 'الْمُخَاطَبَتَان', 'الْمُخَاطَبَات',
  'الْمُتَكَلِّم', 'الْمُتَكَلِّمُوْن',
];

export const IRAB_OPTIONS = [
  { ar: 'مَرْفُوْع', en: 'Default state (marfūʿ)' },
  { ar: 'مَنْصُوْب', en: 'After نَاصِب particle (manṣūb)' },
  { ar: 'مَجْزُوْم', en: 'After جَازِم particle (majzūm)' },
  { ar: 'مَبْنِي', en: 'Non-declinable (mabnī)' },
];

export const BAB_OPTIONS = [
  { code: 'ف', madi: 'فَتَحَ', mudari: 'يَفْتَحُ', pattern: 'فَعَلَ يَفْعَلُ' },
  { code: 'س', madi: 'سَمِعَ', mudari: 'يَسْمَعُ', pattern: 'فَعِلَ يَفْعَلُ' },
  { code: 'ض', madi: 'ضَرَبَ', mudari: 'يَضْرِبُ', pattern: 'فَعَلَ يَفْعِلُ' },
  { code: 'ن', madi: 'نَصَرَ', mudari: 'يَنْصُرُ', pattern: 'فَعَلَ يَفْعُلُ' },
  { code: 'ك', madi: 'كَرُمَ', mudari: 'يَكْرُمُ', pattern: 'فَعُلَ يَفْعُلُ' },
  { code: 'ح', madi: 'حَسِبَ', mudari: 'يَحْسِبُ', pattern: 'فَعِلَ يَفْعِلُ' },
];

function getAnswerText(item: ExerciseItem, exerciseType: ExerciseType): string | null {
  const a = item.answer as Record<string, unknown> | unknown[] | undefined;
  if (!a) return null;
  switch (exerciseType) {
    case 'translate-arabic-to-english':
      return (a as Record<string, string>).english ?? null;
    case 'translate-english-to-arabic':
      return (a as Record<string, string>).arabic ?? null;
    case 'change-gender':
    case 'change-tense': {
      if (Array.isArray(a)) return (a[0] as Record<string, string>).arabic ?? null;
      return (a as Record<string, string>).arabic ?? null;
    }
    case 'negate-and-translate':
    case 'negate-with-particle':
      return (a as Record<string, string>).negated ?? null;
    case 'identify-sigha':
      return (a as Record<string, string>).sigha ?? null;
    case 'identify-sigha-and-irab':
      return (a as Record<string, string>).sigha ?? null;
    case 'active-passive-table':
      return (a as Record<string, string>).passive ?? null;
    default:
      return null;
  }
}

export function generateDistractors(
  correctAnswer: string,
  items: ExerciseItem[],
  exerciseType: ExerciseType,
  count = 3,
): string[] {
  // For identify-sigha, draw from the full sigha pool
  if (exerciseType === 'identify-sigha' || exerciseType === 'identify-sigha-and-irab') {
    const pool = SIGHA_NAMES_AR.filter((s) => s !== correctAnswer);
    return shuffle(pool).slice(0, count);
  }

  const pool = items
    .filter((item) => !item.unclear)
    .map((item) => getAnswerText(item, exerciseType))
    .filter((t): t is string => !!t && t !== correctAnswer);

  const unique = [...new Set(pool)];
  const result = shuffle(unique).slice(0, count);

  // Pad if necessary (shouldn't normally happen with 10+ item exercises)
  while (result.length < count) {
    result.push(`—`);
  }
  return result;
}

// Build a complete set of 4 shuffled options: 1 correct + 3 distractors
export interface MCOption {
  text: string;
  correct: boolean;
}

export function buildOptions(
  correctAnswer: string,
  items: ExerciseItem[],
  exerciseType: ExerciseType,
): MCOption[] {
  const distractors = generateDistractors(correctAnswer, items, exerciseType, 3);
  return shuffle([
    { text: correctAnswer, correct: true },
    ...distractors.map((d) => ({ text: d, correct: false })),
  ]);
}
