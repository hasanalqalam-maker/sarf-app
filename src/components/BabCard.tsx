import Link from 'next/link';
import type { Bab } from '@/lib/data';

export default function BabCard({ bab }: { bab: Bab }) {
  return (
    <Link
      href={`/reference/${encodeURIComponent(bab.id)}`}
      className="card-parchment p-4 hover:border-gold/50 hover:shadow-md transition-all group block"
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {bab.roman_numeral && (
            <span className="text-[10px] font-sans font-semibold text-gold bg-gold/10 px-1.5 py-0.5 rounded">
              {bab.roman_numeral}
            </span>
          )}
          <span className="text-[11px] font-sans text-ink-muted">p.{bab.page}</span>
        </div>
        <span className="text-[11px] font-sans text-ink-muted">
          {bab.has_majhul ? '' : 'No majhūl'}
        </span>
      </div>

      {/* Arabic name */}
      <p
        dir="rtl"
        className="arabic text-2xl text-ink mb-2 text-right leading-relaxed"
      >
        {bab.arabic_name}
      </p>

      {/* Māḍī / Muḍāriʿ forms */}
      <div className="flex items-center gap-3 mt-2" dir="rtl">
        <span className="arabic text-lg text-teal leading-relaxed">{bab.madi}</span>
        <span className="text-gold/40 text-sm">·</span>
        <span className="arabic text-lg text-teal-light leading-relaxed">{bab.mudari}</span>
      </div>

      {/* English hover hint */}
      <p className="text-[11px] font-sans text-ink-muted mt-2 group-hover:text-teal transition-colors">
        View conjugation table →
      </p>
    </Link>
  );
}
