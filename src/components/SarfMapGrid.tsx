'use client';

import { useState, useMemo } from 'react';
import { getBabsByUnit, getSighas } from '@/lib/data';
import { useProgress } from '@/lib/progressContext';
import type { SighaProgressEntry } from '@/lib/progressContext';

type UnitKey = 1 | 2;
type TabKey = 'madi_malum' | 'mudari_malum' | 'amr' | 'madi_majhul';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'madi_malum', label: 'الْمَاضِي' },
  { key: 'mudari_malum', label: 'الْمُضَارِع' },
  { key: 'amr', label: 'الْأَمْر' },
  { key: 'madi_majhul', label: 'الْمَجْهُول' },
];

const UNITS: { key: UnitKey; label: string }[] = [
  { key: 1, label: 'Unit 1' },
  { key: 2, label: 'Unit 2' },
];

interface TooltipData {
  babName: string;
  sighaName: string;
  pronoun: string;
  entry: SighaProgressEntry | null;
  isNA: boolean;
}

export default function SarfMapGrid() {
  const { sighaProgress } = useProgress();
  const [activeUnit, setActiveUnit] = useState<UnitKey>(1);
  const [activeTab, setActiveTab] = useState<TabKey>('madi_malum');
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const babs = useMemo(() => getBabsByUnit(activeUnit), [activeUnit]);
  const sighas = useMemo(() => getSighas(), []);

  const sighaList = useMemo(() => {
    if (activeTab === 'amr') return sighas.amr;
    return sighas.madi_mudari;
  }, [activeTab, sighas]);

  function getEntry(babId: string, sighaId: string): SighaProgressEntry | null {
    return sighaProgress[`${babId}|${sighaId}|${activeTab}`] ?? null;
  }

  function cellClass(babId: string, sighaId: string, isNA: boolean): string {
    if (isNA) return 'border-gold/10 cursor-default opacity-30';
    const entry = getEntry(babId, sighaId);
    if (!entry || entry.seen === 0) return 'bg-parchment-darker border-gold/15 cursor-pointer hover:border-gold/40';
    if (entry.mastered) return 'bg-teal/20 border-teal/40 cursor-pointer hover:border-teal/60';
    return 'bg-gold/15 border-gold/40 cursor-pointer hover:border-gold/60';
  }

  function handleCellClick(babId: string, babName: string, sighaId: string, sighaName: string, pronoun: string, isNA: boolean) {
    if (isNA) return;
    const entry = getEntry(babId, sighaId);
    setTooltip((prev) => {
      const key = `${babId}|${sighaId}`;
      const prevKey = prev ? `${prev.babName}|${prev.sighaName}` : null;
      if (prevKey === key) return null;
      return { babName, sighaName, pronoun, entry, isNA };
    });
  }

  return (
    <div className="w-full">
      {/* Unit selector */}
      <div className="flex gap-1 mb-3">
        {UNITS.map((u) => (
          <button
            key={u.key}
            onClick={() => { setActiveUnit(u.key); setActiveTab('madi_malum'); setTooltip(null); }}
            className={`text-sm font-sans font-medium px-4 py-1.5 rounded-lg transition-colors ${
              activeUnit === u.key
                ? 'bg-ink text-parchment'
                : 'bg-parchment-dark text-ink-muted hover:text-ink'
            }`}
          >
            {u.label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div dir="rtl" className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setTooltip(null); }}
            className={`arabic text-base shrink-0 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-teal text-parchment'
                : 'bg-parchment-dark text-ink-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 text-xs font-sans text-ink-muted">
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-teal/20 border border-teal/40" />Mastered</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-gold/15 border border-gold/40" />Seen</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-parchment-darker border border-gold/15" />Not started</span>
      </div>

      {/* Scrollable grid */}
      <div className="overflow-x-auto rounded-xl border border-gold/20">
        <table className="w-full border-collapse text-xs" style={{ minWidth: sighaList.length * 40 + 100 }}>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-parchment-dark px-3 py-2 text-left font-sans text-ink-muted font-medium border-b border-gold/20 border-r border-gold/15 min-w-[90px]">Bāb</th>
              {sighaList.map((s) => (
                <th key={s.id} className="px-1 py-2 text-center border-b border-gold/20 min-w-[36px]">
                  <span dir="rtl" className="arabic text-[11px] text-ink-muted leading-none block">{s.pronoun ?? ''}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {babs.map((bab, ri) => (
              <tr key={bab.id} className={ri % 2 === 0 ? 'bg-parchment' : 'bg-parchment-dark/40'}>
                <td className="sticky left-0 z-10 px-3 py-1.5 border-r border-gold/15 font-sans text-ink-muted text-[11px] leading-tight"
                  style={{ background: ri % 2 === 0 ? 'var(--color-parchment, #F7F2EA)' : 'rgba(237,232,220,0.4)' }}>
                  <span dir="rtl" className="arabic text-xs text-ink block">{bab.madi}</span>
                </td>
                {sighaList.map((s) => {
                  const isNA = activeTab === 'madi_majhul' && !bab.has_majhul;
                  return (
                    <td
                      key={s.id}
                      onClick={() => handleCellClick(bab.id, bab.arabic_name, s.id, s.arabic_name, s.pronoun ?? '', isNA)}
                      className={`border border-transparent p-1 text-center transition-colors ${cellClass(bab.id, s.id, isNA)}`}
                    >
                      <span className={`block w-6 h-6 mx-auto rounded-sm ${isNA ? 'bg-ink-muted/10' : ''}`} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tooltip panel */}
      {tooltip && (
        <div className="mt-4 card-parchment p-4 rounded-xl border border-gold/30">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div dir="rtl" className="flex items-baseline gap-2 mb-1">
                <span className="arabic text-lg text-ink">{tooltip.sighaName}</span>
                {tooltip.pronoun && <span className="arabic text-sm text-teal">{tooltip.pronoun}</span>}
              </div>
              <p dir="rtl" className="arabic text-sm text-ink-muted mb-2">{tooltip.babName}</p>
              {tooltip.entry && tooltip.entry.seen > 0 ? (
                <div className="flex gap-4 text-xs font-sans text-ink-muted">
                  <span>Seen: <strong className="text-ink">{tooltip.entry.seen}</strong></span>
                  <span>Streak: <strong className="text-ink">{tooltip.entry.correctStreak}</strong></span>
                  {tooltip.entry.mastered && <span className="text-teal font-semibold">✓ Mastered</span>}
                </div>
              ) : (
                <p className="text-xs font-sans text-ink-muted">Not started yet</p>
              )}
            </div>
            <button onClick={() => setTooltip(null)} className="text-ink-muted hover:text-ink text-lg leading-none mt-0.5">×</button>
          </div>
        </div>
      )}
    </div>
  );
}
