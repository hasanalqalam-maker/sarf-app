'use client';

import { useState } from 'react';
import type { BabConjugation, SighasData, ConjugationEntry } from '@/lib/data';

type TabKey = 'madi_malum' | 'mudari_malum' | 'madi_majhul' | 'mudari_majhul' | 'amr' | 'nahy';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'madi_malum',    label: 'الْمَاضِي الْمَعْلُوم' },
  { key: 'mudari_malum',  label: 'الْمُضَارِع الْمَعْلُوم' },
  { key: 'madi_majhul',   label: 'الْمَاضِي الْمَجْهُول' },
  { key: 'mudari_majhul', label: 'الْمُضَارِع الْمَجْهُول' },
  { key: 'amr',           label: 'الْأَمْر' },
  { key: 'nahy',          label: 'النَّهْي' },
];

interface Props {
  conjugation: BabConjugation;
  sighas: SighasData;
  hasMajhul: boolean;
  note?: string;
}

export default function ConjugationTableTabs({ conjugation, sighas, hasMajhul, note }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('madi_malum');

  const sighaMap: Record<string, { arabic_name: string; pronoun?: string; english: string }> = {};
  for (const s of [...sighas.madi_mudari, ...sighas.amr, ...sighas.nahy]) {
    sighaMap[s.id] = s;
  }

  const isMajhulTab = activeTab === 'madi_majhul' || activeTab === 'mudari_majhul';
  const rows: ConjugationEntry[] | null = conjugation[activeTab];

  return (
    <div>
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6" dir="rtl">
        {TABS.map((tab) => {
          const isMajhul = tab.key === 'madi_majhul' || tab.key === 'mudari_majhul';
          const disabled = isMajhul && !hasMajhul;
          return (
            <button
              key={tab.key}
              onClick={() => !disabled && setActiveTab(tab.key)}
              disabled={disabled}
              className={`
                arabic px-3 py-1.5 rounded-md text-sm transition-colors duration-150
                ${activeTab === tab.key
                  ? 'bg-gold text-white'
                  : disabled
                    ? 'text-ink-muted/40 cursor-not-allowed'
                    : 'bg-parchment-dark text-ink hover:bg-[var(--color-primary-light)] hover:text-gold'
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Note banner */}
      {note && (
        <div className="mb-4 px-4 py-2.5 bg-[var(--color-primary-light)] border border-gold/30 rounded-lg text-sm font-sans text-ink-muted">
          {note}
        </div>
      )}

      {/* Not applicable state */}
      {isMajhulTab && !hasMajhul ? (
        <div className="py-10 text-center text-ink-muted font-sans text-sm">
          <span dir="rtl" className="arabic">الْمَجْهُول</span>
          {' '}is not applicable for this bāb.
        </div>
      ) : !rows || rows.length === 0 ? (
        <div className="py-10 text-center text-ink-muted font-sans text-sm">
          No data available.
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-parchment-darker">
              <th className="pb-2 text-left text-[11px] font-sans font-semibold text-ink-muted uppercase tracking-wide w-1/3">
                Sīgha
              </th>
              <th className="pb-2 text-left text-[11px] font-sans font-semibold text-ink-muted uppercase tracking-wide w-1/6">
                Pronoun
              </th>
              <th className="pb-2 text-right text-[11px] font-sans font-semibold text-ink-muted uppercase tracking-wide">
                Form
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry, i) => {
              const sigha = sighaMap[entry.sigha_id];
              return (
                <tr key={entry.sigha_id + i} className="conjugation-row border-b border-parchment-darker/60 last:border-0">
                  <td className="py-3 pr-4">
                    {sigha ? (
                      <span dir="rtl" className="arabic text-base text-ink leading-relaxed">
                        {sigha.arabic_name}
                      </span>
                    ) : (
                      <span className="text-ink-muted text-sm font-sans">{entry.sigha_id}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {sigha && (
                      <span dir="rtl" className="arabic text-sm text-ink-muted leading-relaxed">
                        {sigha.pronoun}
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <span dir="rtl" className="arabic text-arabic-lg text-ink leading-relaxed">
                      {entry.form}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
