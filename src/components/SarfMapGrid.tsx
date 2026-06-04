'use client';

import { useState, useMemo, useCallback } from 'react';
import { getBabsByUnit, getConjugationForBab, getSighas } from '@/lib/data';
import { useProgress } from '@/lib/progressContext';
import type { SighaEntry, Bab } from '@/lib/data';
import type { SighaProgressEntry } from '@/lib/progressContext';

// ── Types ─────────────────────────────────────────────────────────────────────

type TabKey = 'madi_malum' | 'mudari_malum' | 'madi_majhul' | 'amr';
type UnitKey = 1 | 2;
type CellState = 'mastered' | 'in-progress' | 'not-started' | 'na';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'madi_malum',   label: 'الْمَاضِي' },
  { key: 'mudari_malum', label: 'الْمُضَارِع' },
  { key: 'madi_majhul',  label: 'الْمَجْهُول' },
  { key: 'amr',          label: 'الْأَمْر' },
];

interface DrillRow {
  bab: Bab;
  form: string | null;
  entry: SighaProgressEntry | null;
  state: CellState;
}
interface Drill { sigha: SighaEntry; rows: DrillRow[] }

// ── Cell icon ─────────────────────────────────────────────────────────────────

function GridCell({ state }: { state: CellState }) {
  if (state === 'na') {
    return <div className="w-8 h-8 mx-auto rounded-md bg-ink/4" />;
  }
  if (state === 'mastered') {
    return (
      <div className="w-8 h-8 mx-auto rounded-md bg-teal shadow-sm flex items-center justify-center">
        <svg className="w-[13px] h-[13px] text-white" fill="none" viewBox="0 0 24 24"
          stroke="currentColor" strokeWidth={3.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (state === 'in-progress') {
    return (
      <div className="w-8 h-8 mx-auto rounded-md bg-gold/15 border border-gold/50 flex items-center justify-center gap-[3px]">
        {[0, 1, 2].map((i) => (
          <span key={i} className="block w-[4px] h-[4px] rounded-full bg-gold" />
        ))}
      </div>
    );
  }
  return <div className="w-8 h-8 mx-auto rounded-md border-2 border-dashed border-gold/25 bg-parchment-darker/60" />;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SarfMapGrid() {
  const { sighaProgress } = useProgress();
  const [activeTab, setActiveTab]   = useState<TabKey>('madi_malum');
  const [activeUnit, setActiveUnit] = useState<UnitKey>(1);
  const [drill, setDrill]           = useState<Drill | null>(null);

  const babs      = useMemo(() => getBabsByUnit(activeUnit), [activeUnit]);
  const sighas    = useMemo(() => getSighas(), []);
  const sighaList = useMemo(
    () => (activeTab === 'amr' ? sighas.amr : sighas.madi_mudari),
    [activeTab, sighas],
  );

  const isNA = useCallback((bab: Bab): boolean => {
    if (activeTab !== 'madi_majhul') return false;
    if (!bab.has_majhul) return true;
    return getConjugationForBab(bab.id)?.madi_majhul === null;
  }, [activeTab]);

  const cellState = useCallback((babId: string, sighaId: string, na: boolean): CellState => {
    if (na) return 'na';
    const e = sighaProgress[`${babId}|${sighaId}|${activeTab}`];
    if (!e || e.seen === 0) return 'not-started';
    return e.mastered ? 'mastered' : 'in-progress';
  }, [sighaProgress, activeTab]);

  function openDrill(sigha: SighaEntry) {
    if (drill?.sigha.id === sigha.id) { setDrill(null); return; }
    const rows: DrillRow[] = babs.map((bab) => {
      const na   = isNA(bab);
      const conj = getConjugationForBab(bab.id);
      const pd   = na ? null : (conj?.[activeTab] ?? null);
      const form = pd?.find((e) => e.sigha_id === sigha.id)?.form ?? null;
      const entry = na ? null : (sighaProgress[`${bab.id}|${sigha.id}|${activeTab}`] ?? null);
      return { bab, form, entry, state: cellState(bab.id, sigha.id, na) };
    });
    setDrill({ sigha, rows });
  }

  function changeTab(tab: TabKey)   { setActiveTab(tab);   setDrill(null); }
  function changeUnit(unit: UnitKey){ setActiveUnit(unit); setDrill(null); }

  // ── Row background helpers ─────────────────────────────────────────────────
  const evenBg   = '#F7F2EA';
  const oddBg    = 'rgba(237,232,220,0.55)';
  const activeBg = 'rgba(27,107,90,0.055)';

  return (
    <div className="w-full">

      {/* Unit selector */}
      <div className="flex gap-1.5 mb-3">
        {([1, 2] as UnitKey[]).map((u) => (
          <button key={u} onClick={() => changeUnit(u)}
            className={`text-xs font-sans font-semibold px-3 py-1 rounded-full transition-colors ${
              activeUnit === u
                ? 'bg-crimson text-parchment'
                : 'bg-parchment-dark text-ink-muted hover:text-ink'
            }`}>
            Unit {u}
          </button>
        ))}
      </div>

      {/* Paradigm tabs */}
      <div dir="rtl" className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => changeTab(tab.key)}
            className={`arabic text-sm shrink-0 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-crimson text-parchment'
                : 'bg-parchment-dark text-ink-muted hover:text-ink'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
        {([
          ['Mastered',    'bg-teal'],
          ['In Progress', 'bg-gold/15 border border-gold/50'],
          ['Not Started', 'border-2 border-dashed border-gold/25 bg-parchment-darker/60'],
        ] as [string, string][]).map(([label, cls]) => (
          <span key={label} className="flex items-center gap-1 text-[10px] font-sans text-ink-muted">
            <span className={`inline-block w-3 h-3 rounded-sm ${cls}`} />
            {label}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div className={`rounded-xl border border-gold/20 ${
        activeUnit === 2 ? 'overflow-x-auto' : 'overflow-hidden'
      }`}>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gold/20 bg-parchment-dark">
              {/* Form header */}
              <th className="sticky left-0 z-20 bg-parchment-dark pl-3 pr-5 py-2.5 text-left border-r border-gold/15 min-w-[96px]">
                <span className="text-[9px] font-sans font-semibold text-ink-muted/70 uppercase tracking-widest">
                  Form
                </span>
              </th>
              {/* Bāb column headers */}
              {babs.map((bab) => (
                <th key={bab.id}
                  className="w-9 min-w-[36px] px-0.5 py-2 text-center border-l border-gold/10 align-bottom">
                  <div dir="rtl" className="arabic text-ink leading-tight"
                    style={{ fontSize: '10px' }}>
                    {bab.madi}
                  </div>
                  {bab.roman_numeral && (
                    <div className="font-sans text-ink-muted/55 leading-snug"
                      style={{ fontSize: '8px' }}>
                      {bab.roman_numeral}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sighaList.map((sigha, ri) => {
              const open  = drill?.sigha.id === sigha.id;
              const rowBg = open ? activeBg : ri % 2 === 0 ? evenBg : oddBg;

              return (
                <tr key={sigha.id} className="border-b border-gold/10">
                  {/* Row label — tap target */}
                  <td
                    className="sticky left-0 z-10 pl-3 pr-5 py-2.5 border-r border-gold/10 cursor-pointer relative select-none"
                    style={{ background: rowBg }}
                    onClick={() => openDrill(sigha)}
                  >
                    <div dir="rtl" className="arabic text-[11px] text-ink leading-snug">
                      {sigha.arabic_name}
                    </div>
                    <div className="text-[8.5px] font-sans text-ink-muted/65 leading-tight mt-0.5 truncate">
                      {sigha.english}
                    </div>
                    {/* chevron indicator */}
                    <svg
                      className={`absolute right-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-ink-muted/25 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </td>

                  {/* Cells */}
                  {babs.map((bab) => (
                    <td key={bab.id}
                      className="p-[3px] border-l border-gold/10 text-center"
                      style={{ background: rowBg }}>
                      <GridCell state={cellState(bab.id, sigha.id, isNA(bab))} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Helper tip */}
      <p className="text-[9px] font-sans text-ink-muted/50 mt-2 text-center tracking-wide">
        Tap a row label to see details per bāb
      </p>

      {/* ── Drill-down bottom drawer ────────────────────────────────────────── */}
      {drill && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-ink/25 backdrop-blur-[2px]"
            onClick={() => setDrill(null)}
          />

          {/* Drawer */}
          <div className="fixed bottom-0 inset-x-0 z-[60] max-h-[70vh] flex flex-col
            bg-parchment rounded-t-2xl shadow-2xl border-t border-gold/30">

            {/* Pull handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-8 h-[3px] rounded-full bg-ink/15" />
            </div>

            {/* Drawer header */}
            <div className="px-4 pb-3 border-b border-gold/20 shrink-0 relative">
              <button
                onClick={() => setDrill(null)}
                className="absolute right-4 top-0 w-8 h-8 flex items-center justify-center text-xl text-ink-muted hover:text-ink leading-none">
                ×
              </button>
              <div dir="rtl" className="flex flex-wrap items-baseline gap-2 pr-8">
                <span className="arabic text-2xl text-ink leading-relaxed">
                  {drill.sigha.arabic_name}
                </span>
                {drill.sigha.pronoun && (
                  <span className="arabic text-base text-teal leading-relaxed">
                    {drill.sigha.pronoun}
                  </span>
                )}
              </div>
              <p className="text-xs font-sans text-ink-muted mt-0.5">{drill.sigha.english}</p>
            </div>

            {/* Scrollable bāb rows */}
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2 pb-8">
              {drill.rows.map(({ bab, form, entry, state }) => (
                <div key={bab.id}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 border ${
                    state === 'mastered'
                      ? 'border-teal/30 bg-teal/10'
                      : state === 'in-progress'
                      ? 'border-gold/30 bg-gold/10'
                      : state === 'na'
                      ? 'border-transparent bg-parchment-dark/60 opacity-50'
                      : 'border-gold/15 bg-parchment-darker'
                  }`}>

                  {/* Bāb label */}
                  <div dir="rtl" className="w-[70px] shrink-0 flex items-baseline gap-1">
                    <span className="arabic text-sm text-ink">{bab.madi}</span>
                    {bab.roman_numeral && (
                      <span className="font-sans text-[9px] text-ink-muted">
                        ({bab.roman_numeral})
                      </span>
                    )}
                  </div>

                  {/* Conjugated form */}
                  <div className="flex-1 text-center min-w-0">
                    {state !== 'na' && form ? (
                      <span dir="rtl" className="arabic text-base text-ink">{form}</span>
                    ) : (
                      <span className="text-[10px] font-sans text-ink-muted/50 italic">—</span>
                    )}
                  </div>

                  {/* State badge */}
                  <div className="shrink-0 text-right">
                    {state === 'mastered' && (
                      <span className="text-[10px] font-sans font-semibold text-teal">
                        ✓ Mastered
                      </span>
                    )}
                    {state === 'in-progress' && (
                      <div className="text-[10px] font-sans text-gold leading-tight">
                        <div>{entry?.seen ?? 0} seen</div>
                        <div>{entry?.correctStreak ?? 0} streak</div>
                      </div>
                    )}
                    {state === 'not-started' && (
                      <span className="text-[10px] font-sans text-ink-muted">Not started</span>
                    )}
                    {state === 'na' && (
                      <span className="text-[10px] font-sans text-ink-muted/50 italic">N/A</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
