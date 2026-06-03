import { getBabsByUnit, getConjugationForBab, getSighas } from './data';

// ── Types ─────────────────────────────────────────────────────────────────────

export type GameType = 'name-sigha' | 'fill-table' | 'flashcards' | 'match-up' | 'which-bab' | 'dictionary-form';
export type Paradigm = 'madi_malum' | 'mudari_malum' | 'madi_majhul' | 'mudari_majhul' | 'amr' | 'nahy';
export type MatchType = 'bab-madi' | 'bab-mudari' | 'ism-fail' | 'ism-maful' | 'bab-zaid';

export interface GameConfig {
  id: string;
  section: string;
  title: string;
  description: string;
  type: GameType;
  format: string;
  paradigm: Paradigm;
  sighaFilter?: string[];
  matchType?: MatchType;
  unit?: number;
  unlockAfter: string[];
}

export interface SighaOption {
  sighaId: string;
  arabicName: string;
  pronoun: string;
  english: string;
}

export interface NameSighaQuestion {
  id: string;
  form: string;
  babId: string;
  babArabicName: string;
  paradigm: Paradigm;
  correctSighaId: string;
  options: SighaOption[];
  rule: string;
}

export interface FillTableRow {
  sighaId: string;
  sighaArabicName: string;
  pronoun: string;
  english: string;
  form: string;
}

export interface FillTableBab {
  babId: string;
  babArabicName: string;
  rows: FillTableRow[];
}

export interface FlashCard {
  id: string;
  frontForm: string;
  backSigha: string;
  backPronoun: string;
  backEnglish: string;
  backBabId: string;
  backBabForm: string;
  sighaId?: string;
  cardParadigm?: string;
}

export interface MatchItem {
  chipId: string;
  chipArabic: string;
  zoneId: string;
  zoneLabel: string;
}

// ── Sigha sets ────────────────────────────────────────────────────────────────

export const SIGHA_PART1 = ['ghaib', 'ghaibaan', 'ghaiboon', 'ghaiba', 'ghaibataan', 'ghaibaat'];
export const SIGHA_PART2 = ['muxatab', 'muxaatabaan', 'muxaataboon', 'muxaataba', 'muxaatabataan', 'muxaatabaat', 'mutakallim', 'mutakallimoon'];

// ── Grammar rules for feedback ────────────────────────────────────────────────

const RULES: Record<string, Record<string, string>> = {
  madi_malum: {
    ghaib:           'No suffix on the root = 3rd masc. singular هُوَ — the base citation form of the māḍī.',
    ghaibaan:        'The ـَا suffix always marks dual masculine هُمَا in the māḍī.',
    ghaiboon:        'The ـُوْا suffix marks 3rd masc. plural هُمْ.',
    ghaiba:          'The ـَتْ suffix (tā marbūṭa + sukūn) marks 3rd fem. singular هِيَ.',
    ghaibataan:      'The ـَتَا suffix (tā + dual alif) marks dual feminine هُمَا.',
    ghaibaat:        'The ـْنَ suffix marks 3rd fem. plural هُنَّ — the "nūn of the women".',
    muxatab:         'The ـْتَ suffix (tā with fatḥa) marks 2nd masc. singular أَنْتَ.',
    muxaatabaan:     'The ـْتُمَا suffix marks 2nd person dual أَنْتُمَا (both genders).',
    muxaataboon:     'The ـْتُمْ suffix marks 2nd masc. plural أَنْتُمْ.',
    muxaataba:       'The ـْتِ suffix (tā with kasra) marks 2nd fem. singular أَنْتِ.',
    muxaatabataan:   'The ـْتُمَا suffix marks 2nd fem. dual — identical ending to masc. dual.',
    muxaatabaat:     'The ـْتُنَّ suffix (tā + nūn with shadda) marks 2nd fem. plural أَنْتُنَّ.',
    mutakallim:      'The ـْتُ suffix (tā with ḍamma) marks 1st singular أَنَا.',
    mutakallimoon:   'The ـْنَا suffix marks 1st plural نَحْنُ — note the alif, unlike ـْنَ (هُنَّ).',
  },
  mudari_malum: {
    ghaib:           'The يَـ prefix alone (no special ending) marks 3rd masc. singular هُوَ.',
    ghaibaan:        'يَـ + ـَانِ marks 3rd masc. dual هُمَا.',
    ghaiboon:        'يَـ + ـُوْنَ marks 3rd masc. plural هُمْ.',
    ghaiba:          'The تَـ prefix alone marks 3rd fem. singular هِيَ — context separates it from أَنْتَ (same form).',
    ghaibataan:      'تَـ + ـَانِ marks 3rd fem. dual هُمَا.',
    ghaibaat:        'يَـ + ـْنَ marks 3rd fem. plural هُنَّ.',
    muxatab:         'The تَـ prefix alone marks 2nd masc. singular أَنْتَ — same form as هِيَ; context distinguishes them.',
    muxaatabaan:     'تَـ + ـَانِ marks 2nd masc. dual أَنْتُمَا.',
    muxaataboon:     'تَـ + ـُوْنَ marks 2nd masc. plural أَنْتُمْ.',
    muxaataba:       'The ـِيْنَ ending uniquely marks 2nd fem. singular أَنْتِ — no other sīgha has this ending.',
    muxaatabataan:   'تَـ + ـَانِ marks 2nd fem. dual أَنْتُمَا.',
    muxaatabaat:     'تَـ + ـْنَ marks 2nd fem. plural أَنْتُنَّ.',
    mutakallim:      'The أَـ prefix (hamza with fatḥa) marks 1st singular أَنَا.',
    mutakallimoon:   'The نَـ prefix (nūn with fatḥa) marks 1st plural نَحْنُ.',
  },
  madi_majhul: {
    ghaib:           'Majhūl base: ḍamma on fā, kasra on ʿayn — no suffix = هُوَ.',
    ghaibaan:        'Same suffix rules as the maʿlūm: ـَا = dual masc. هُمَا.',
    ghaiboon:        'ـُوْا = 3rd masc. plural هُمْ — suffix system identical to the maʿlūm.',
    ghaiba:          'ـَتْ = 3rd fem. singular هِيَ — tā marbūṭa works the same in the majhūl.',
    ghaibataan:      'ـَتَا = dual feminine هُمَا.',
    ghaibaat:        'ـْنَ = 3rd fem. plural هُنَّ.',
    muxatab:         'ـْتَ = 2nd masc. singular أَنْتَ — suffix rules are identical to the maʿlūm.',
    muxaatabaan:     'ـْتُمَا = 2nd person dual أَنْتُمَا.',
    muxaataboon:     'ـْتُمْ = 2nd masc. plural أَنْتُمْ.',
    muxaataba:       'ـْتِ = 2nd fem. singular أَنْتِ.',
    muxaatabataan:   'ـْتُمَا = 2nd fem. dual — same as masc. dual suffix.',
    muxaatabaat:     'ـْتُنَّ = 2nd fem. plural أَنْتُنَّ.',
    mutakallim:      'ـْتُ = 1st singular أَنَا.',
    mutakallimoon:   'ـْنَا = 1st plural نَحْنُ.',
  },
  mudari_majhul: {
    ghaib:           'يُـ (ḍamma on yā) + fatḥa on ʿayn: two hallmarks of the majhūl. No ending = هُوَ.',
    ghaibaan:        'يُـ + ـَانِ = 3rd masc. dual هُمَا.',
    ghaiboon:        'يُـ + ـُوْنَ = 3rd masc. plural هُمْ.',
    ghaiba:          'تُـ prefix (ḍamma on tā) = 3rd fem. singular هِيَ.',
    ghaibataan:      'تُـ + ـَانِ = 3rd fem. dual هُمَا.',
    ghaibaat:        'يُـ + ـْنَ = 3rd fem. plural هُنَّ.',
    muxatab:         'تُـ alone = 2nd masc. singular أَنْتَ.',
    muxaatabaan:     'تُـ + ـَانِ = 2nd masc. dual أَنْتُمَا.',
    muxaataboon:     'تُـ + ـُوْنَ = 2nd masc. plural أَنْتُمْ.',
    muxaataba:       'تُـ + ـِيْنَ uniquely marks 2nd fem. singular أَنْتِ.',
    muxaatabataan:   'تُـ + ـَانِ = 2nd fem. dual أَنْتُمَا.',
    muxaatabaat:     'تُـ + ـْنَ = 2nd fem. plural أَنْتُنَّ.',
    mutakallim:      'أُـ (ḍamma on hamza) = 1st singular أَنَا.',
    mutakallimoon:   'نُـ (ḍamma on nūn) = 1st plural نَحْنُ.',
  },
};

// ── Game manifest ─────────────────────────────────────────────────────────────

export const UNIT1_GAMES: GameConfig[] = [
  // Introduction
  { id: 'intro-name-sigha', section: 'Introduction', title: 'Name that Sīgha', description: 'Identify 8 māḍī forms — the first 6 sīghas across all bābs.', type: 'name-sigha', format: 'quiz', paradigm: 'madi_malum', sighaFilter: SIGHA_PART1, unlockAfter: [] },
  { id: 'intro-match-up', section: 'Introduction', title: 'Bāb Match Up', description: 'Match each māḍī base form to its vowel pattern.', type: 'match-up', format: 'match-up', paradigm: 'madi_malum', matchType: 'bab-madi', unlockAfter: [] },

  // الماضي
  { id: 'madi-part1', section: 'الْمَاضِي', title: 'Name that Sīgha — Part 1', description: 'The first 6 sīghas (الغائب group) across all 6 bābs.', type: 'name-sigha', format: 'quiz', paradigm: 'madi_malum', sighaFilter: SIGHA_PART1, unlockAfter: ['intro-name-sigha'] },
  { id: 'madi-part2', section: 'الْمَاضِي', title: 'Name that Sīgha — Part 2', description: 'The remaining 8 sīghas — المخاطب and المتكلم groups.', type: 'name-sigha', format: 'quiz', paradigm: 'madi_malum', sighaFilter: SIGHA_PART2, unlockAfter: ['madi-part1'] },
  { id: 'madi-fill-table', section: 'الْمَاضِي', title: 'Fill the Table', description: 'Reveal all 14 māḍī maʿlūm forms. Tap each cell to uncover it.', type: 'fill-table', format: 'fill-table', paradigm: 'madi_malum', unlockAfter: ['madi-part2'] },

  // المضارع
  { id: 'mudari-part1', section: 'الْمُضَارِع', title: 'Name that Sīgha — Part 1', description: 'The first 6 sīghas of the muḍāriʿ maʿlūm across all bābs.', type: 'name-sigha', format: 'quiz', paradigm: 'mudari_malum', sighaFilter: SIGHA_PART1, unlockAfter: ['madi-fill-table'] },
  { id: 'mudari-part2', section: 'الْمُضَارِع', title: 'Name that Sīgha — Part 2', description: 'The remaining 8 muḍāriʿ sīghas.', type: 'name-sigha', format: 'quiz', paradigm: 'mudari_malum', sighaFilter: SIGHA_PART2, unlockAfter: ['mudari-part1'] },
  { id: 'mudari-fill-table', section: 'الْمُضَارِع', title: 'Fill the Table', description: 'Reveal all 14 muḍāriʿ maʿlūm forms for each bāb.', type: 'fill-table', format: 'fill-table', paradigm: 'mudari_malum', unlockAfter: ['mudari-part2'] },

  // الأبواب
  { id: 'abwab-match-up', section: 'الْأَبْوَاب', title: 'Match the Bābs', description: 'Match each muḍāriʿ form to its māḍī — connecting the two pillars of each bāb.', type: 'match-up', format: 'match-up', paradigm: 'mudari_malum', matchType: 'bab-mudari', unlockAfter: ['mudari-fill-table'] },
  { id: 'abwab-flashcards', section: 'الْأَبْوَاب', title: 'Flashcards — All Bābs', description: 'Review all 6 bāb patterns with flip cards.', type: 'flashcards', format: 'flashcards', paradigm: 'madi_malum', unlockAfter: ['mudari-fill-table'] },

  // المجهول
  { id: 'majhul-madi-name', section: 'الْمَجْهُول', title: 'Name that Sīgha — Māḍī Majhūl', description: 'Identify sīghas in the passive māḍī across 5 bābs.', type: 'name-sigha', format: 'quiz', paradigm: 'madi_majhul', sighaFilter: SIGHA_PART1, unlockAfter: ['abwab-match-up'] },
  { id: 'majhul-mudari-name', section: 'الْمَجْهُول', title: 'Name that Sīgha — Muḍāriʿ Majhūl', description: 'Identify sīghas in the passive muḍāriʿ.', type: 'name-sigha', format: 'quiz', paradigm: 'mudari_majhul', sighaFilter: SIGHA_PART1, unlockAfter: ['majhul-madi-name'] },
  { id: 'majhul-madi-fill', section: 'الْمَجْهُول', title: 'Fill the Table — Māḍī Majhūl', description: 'Reveal the full passive māḍī table for each bāb.', type: 'fill-table', format: 'fill-table', paradigm: 'madi_majhul', unlockAfter: ['majhul-madi-name'] },
  { id: 'majhul-mudari-fill', section: 'الْمَجْهُول', title: 'Fill the Table — Muḍāriʿ Majhūl', description: 'Reveal the full passive muḍāriʿ table.', type: 'fill-table', format: 'fill-table', paradigm: 'mudari_majhul', unlockAfter: ['majhul-mudari-name'] },

  // الأمر والنهي
  { id: 'amr-fill', section: 'الْأَمْر وَالنَّهْي', title: 'Fill the Table — Amr', description: 'Reveal all 6 command forms for each bāb.', type: 'fill-table', format: 'fill-table', paradigm: 'amr', unlockAfter: ['majhul-mudari-fill'] },
  { id: 'nahy-fill', section: 'الْأَمْر وَالنَّهْي', title: 'Fill the Table — Nahy', description: 'Reveal all 6 prohibition forms for each bāb.', type: 'fill-table', format: 'fill-table', paradigm: 'nahy', unlockAfter: ['amr-fill'] },
  { id: 'amr-nahy-flashcards', section: 'الْأَمْر وَالنَّهْي', title: 'Flashcards — Amr & Nahy', description: 'Review command and prohibition forms with flip cards.', type: 'flashcards', format: 'flashcards', paradigm: 'amr', unlockAfter: ['amr-fill'] },

  // اسم الفاعل
  { id: 'ism-fail-match-up', section: 'اسْمُ الْفَاعِل', title: 'Match Up — Ism Fāʿil', description: 'Match each ism fāʿil form to its bāb.', type: 'match-up', format: 'match-up', paradigm: 'madi_malum', matchType: 'ism-fail', unlockAfter: ['amr-fill'] },
  { id: 'ism-fail-flashcards', section: 'اسْمُ الْفَاعِل', title: 'Flashcards — Ism Fāʿil', description: 'Review ism fāʿil forms with flip cards.', type: 'flashcards', format: 'flashcards', paradigm: 'madi_malum', unlockAfter: ['ism-fail-match-up'] },

  // اسم المفعول
  { id: 'ism-maful-match-up', section: 'اسْمُ الْمَفْعُوْل', title: 'Match Up — Ism Mafʿūl', description: 'Match each ism mafʿūl form to its bāb.', type: 'match-up', format: 'match-up', paradigm: 'madi_malum', matchType: 'ism-maful', unlockAfter: ['ism-fail-match-up'] },
  { id: 'ism-maful-flashcards', section: 'اسْمُ الْمَفْعُوْل', title: 'Flashcards — Ism Mafʿūl', description: 'Review ism mafʿūl forms with flip cards.', type: 'flashcards', format: 'flashcards', paradigm: 'madi_malum', unlockAfter: ['ism-maful-match-up'] },
];

export const SECTION_ORDER = [
  'Introduction', 'الْمَاضِي', 'الْمُضَارِع', 'الْأَبْوَاب',
  'الْمَجْهُول', 'الْأَمْر وَالنَّهْي', 'اسْمُ الْفَاعِل', 'اسْمُ الْمَفْعُوْل',
];

export function getGameConfig(id: string): GameConfig | undefined {
  return UNIT1_GAMES.find((g) => g.id === id);
}

export function getGameSections() {
  return SECTION_ORDER.map((section) => ({
    section,
    games: UNIT1_GAMES.filter((g) => g.section === section),
  }));
}

// ── Utilities ─────────────────────────────────────────────────────────────────

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Question generators ────────────────────────────────────────────────────────

export function generateNameSighaQuestions(config: GameConfig, count = 8): NameSighaQuestion[] {
  const sighas = getSighas();
  const babs = getBabsByUnit(config.unit ?? 1);

  const sighaList = config.paradigm === 'amr' ? sighas.amr
    : config.paradigm === 'nahy' ? sighas.nahy
    : sighas.madi_mudari;

  const filteredSighas = config.sighaFilter
    ? sighaList.filter((s) => config.sighaFilter!.includes(s.id))
    : sighaList;

  if (filteredSighas.length < 4) return [];

  const candidates: NameSighaQuestion[] = [];

  for (const bab of babs) {
    const conj = getConjugationForBab(bab.id);
    if (!conj) continue;

    const paradigmData = conj[config.paradigm];
    if (!paradigmData) continue;

    for (const entry of paradigmData) {
      if (config.sighaFilter && !config.sighaFilter.includes(entry.sigha_id)) continue;

      const correctSigha = filteredSighas.find((s) => s.id === entry.sigha_id);
      if (!correctSigha) continue;

      const wrongPool = filteredSighas.filter((s) => s.id !== entry.sigha_id);
      const wrongOptions = shuffle(wrongPool).slice(0, 3);

      const options = shuffle([
        { sighaId: correctSigha.id, arabicName: correctSigha.arabic_name, pronoun: correctSigha.pronoun ?? '', english: correctSigha.english },
        ...wrongOptions.map((s) => ({ sighaId: s.id, arabicName: s.arabic_name, pronoun: s.pronoun ?? '', english: s.english })),
      ]);

      const rule = RULES[config.paradigm]?.[entry.sigha_id]
        ?? 'Identify the person, gender, and number from the suffix or prefix.';

      candidates.push({
        id: `${bab.id}-${entry.sigha_id}`,
        form: entry.form,
        babId: bab.id,
        babArabicName: bab.arabic_name,
        paradigm: config.paradigm,
        correctSighaId: entry.sigha_id,
        options,
        rule,
      });
    }
  }

  return shuffle(candidates).slice(0, count);
}

export function generateFillTableData(config: GameConfig): FillTableBab[] {
  const sighas = getSighas();
  const babs = getBabsByUnit(config.unit ?? 1);

  const sighaList = config.paradigm === 'amr' ? sighas.amr
    : config.paradigm === 'nahy' ? sighas.nahy
    : sighas.madi_mudari;

  const sighaMap = Object.fromEntries(sighaList.map((s) => [s.id, s]));
  const result: FillTableBab[] = [];

  for (const bab of babs) {
    const conj = getConjugationForBab(bab.id);
    if (!conj) continue;

    const paradigmData = conj[config.paradigm];
    if (!paradigmData) continue;

    result.push({
      babId: bab.id,
      babArabicName: bab.arabic_name,
      rows: paradigmData.map((entry) => {
        const sigha = sighaMap[entry.sigha_id];
        return {
          sighaId: entry.sigha_id,
          sighaArabicName: sigha?.arabic_name ?? entry.sigha_id,
          pronoun: sigha?.pronoun ?? '',
          english: sigha?.english ?? '',
          form: entry.form,
        };
      }),
    });
  }

  return result;
}

export function generateFlashcards(config: GameConfig): FlashCard[] {
  const babs = getBabsByUnit(config.unit ?? 1);
  const sighas = getSighas();
  const cards: FlashCard[] = [];

  if (config.id === 'abwab-flashcards' || config.id === 'u2-bab-flashcards') {
    for (const bab of babs) {
      const conj = getConjugationForBab(bab.id);
      const madiForm = conj?.madi_malum?.find((e) => e.sigha_id === 'ghaib')?.form ?? bab.madi;
      const mudariForm = conj?.mudari_malum?.find((e) => e.sigha_id === 'ghaib')?.form ?? bab.mudari;
      cards.push({
        id: `bab-${bab.id}`,
        frontForm: madiForm,
        backSigha: bab.arabic_name,
        backPronoun: mudariForm,
        backEnglish: `${bab.pattern_madi ?? ''} / ${bab.pattern_mudari ?? ''}`,
        backBabId: bab.id,
        backBabForm: bab.masdar,
      });
    }
    return shuffle(cards);
  }

  if (config.id === 'ism-fail-flashcards') {
    for (const bab of babs) {
      if (!bab.ism_fail) continue;
      cards.push({ id: `isf-${bab.id}`, frontForm: bab.ism_fail, backSigha: 'اِسْمُ الْفَاعِل', backPronoun: bab.madi, backEnglish: `From bāb ${bab.id} (p.${bab.page})`, backBabId: bab.id, backBabForm: bab.arabic_name });
    }
    return shuffle(cards);
  }

  if (config.id === 'ism-maful-flashcards') {
    for (const bab of babs) {
      if (!bab.ism_maful) continue;
      cards.push({ id: `ism-${bab.id}`, frontForm: bab.ism_maful, backSigha: 'اِسْمُ الْمَفْعُوْل', backPronoun: bab.madi, backEnglish: `From bāb ${bab.id} (p.${bab.page})`, backBabId: bab.id, backBabForm: bab.arabic_name });
    }
    return shuffle(cards);
  }

  // amr-nahy-flashcards
  const paradigmsToUse: Paradigm[] = config.paradigm === 'amr' ? ['amr', 'nahy'] : [config.paradigm];
  for (const bab of babs) {
    const conj = getConjugationForBab(bab.id);
    if (!conj) continue;
    for (const paradigm of paradigmsToUse) {
      const data = conj[paradigm];
      if (!data) continue;
      const list = paradigm === 'amr' ? sighas.amr : sighas.nahy;
      const sm = Object.fromEntries(list.map((s) => [s.id, s]));
      for (const entry of data) {
        const sigha = sm[entry.sigha_id];
        const pLabel = paradigm === 'amr' ? 'Amr' : 'Nahy';
        cards.push({ id: `${paradigm}-${bab.id}-${entry.sigha_id}`, frontForm: entry.form, backSigha: sigha?.arabic_name ?? entry.sigha_id, backPronoun: sigha?.pronoun ?? '', backEnglish: `${sigha?.english ?? ''} — ${pLabel}`, backBabId: bab.id, backBabForm: bab.arabic_name, sighaId: entry.sigha_id, cardParadigm: paradigm });
      }
    }
  }
  return shuffle(cards);
}

const BAB_ZAID_DESCRIPTIONS: Record<string, string> = {
  'faʿʿala':   'تَشْدِيد عَلَى الْعَيْن',
  'faaʿala':   'أَلِف بَعْدَ الْفَاء',
  'afʿala':    'هَمْزَة الْقَطْع فِي الْبِدَايَة',
  'tafaʿʿala': 'تَاء + تَشْدِيد عَلَى الْعَيْن',
  'tafaaʿala': 'تَاء + أَلِف بَعْدَ الْفَاء',
  'infaʿala':  'نُون بَعْدَ هَمْزَة الْوَصْل',
  'iftaʿala':  'تَاء بَعْدَ الْفَاء الأُوْلَى',
  'istafʿala': 'سِين + تَاء بَعْدَ هَمْزَة الْوَصْل',
  'faʿlala':   'رُبَاعِيٌّ مُجَرَّد',
  'tafaʿlala': 'تَاء عَلَى الرُّبَاعِيّ',
};

export function generateMatchUpItems(config: GameConfig): MatchItem[] {
  const babs = getBabsByUnit(config.unit ?? 1);

  if (config.matchType === 'bab-zaid') {
    return shuffle(babs.filter((b) => BAB_ZAID_DESCRIPTIONS[b.id]).map((b) => ({
      chipId: b.id, chipArabic: b.madi, zoneId: b.id, zoneLabel: BAB_ZAID_DESCRIPTIONS[b.id],
    })));
  }

  if (config.matchType === 'ism-fail') {
    return shuffle(babs.filter((b) => b.ism_fail).map((b) => ({
      chipId: b.id, chipArabic: b.ism_fail!, zoneId: b.id, zoneLabel: b.madi,
    })));
  }

  if (config.matchType === 'ism-maful') {
    return shuffle(babs.filter((b) => b.ism_maful).map((b) => ({
      chipId: b.id, chipArabic: b.ism_maful!, zoneId: b.id, zoneLabel: b.madi,
    })));
  }

  if (config.matchType === 'bab-mudari') {
    // Chips = muḍāriʿ ghaib form, zones = māḍī ghaib form
    return shuffle(babs.map((b) => {
      const conj = getConjugationForBab(b.id);
      const mudari = conj?.mudari_malum?.find((e) => e.sigha_id === 'ghaib')?.form ?? b.mudari;
      const madi = conj?.madi_malum?.find((e) => e.sigha_id === 'ghaib')?.form ?? b.madi;
      return { chipId: b.id, chipArabic: mudari, zoneId: b.id, zoneLabel: madi };
    }));
  }

  // bab-madi: chips = māḍī ghaib forms, zones = vowel pattern (pattern_madi)
  return shuffle(babs.map((b) => {
    const conj = getConjugationForBab(b.id);
    const madi = conj?.madi_malum?.find((e) => e.sigha_id === 'ghaib')?.form ?? b.madi;
    return { chipId: b.id, chipArabic: madi, zoneId: b.id, zoneLabel: b.pattern_madi ?? b.madi };
  }));
}
