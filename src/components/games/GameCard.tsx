import Link from 'next/link';
import type { GameConfig } from '@/lib/gameData';
import type { GameSessionEntry } from '@/lib/progressContext';

interface Props {
  config: GameConfig;
  progress?: GameSessionEntry;
  locked: boolean;
  basePath?: string;
}

const FORMAT_LABELS: Record<string, string> = {
  quiz: 'Multiple Choice',
  'fill-table': 'Fill the Table',
  flashcards: 'Flashcards',
  'match-up': 'Match Up',
};

export default function GameCard({ config, progress, locked, basePath = '/games/unit-1' }: Props) {
  const completed = progress?.completed ?? false;
  const score = progress?.score ?? 0;

  const pill = completed
    ? { label: `${score}%`, cls: 'bg-teal/15 text-teal' }
    : locked
    ? { label: 'Locked', cls: 'bg-ink-muted/10 text-ink-muted' }
    : progress?.attempts
    ? { label: 'In Progress', cls: 'bg-gold/15 text-gold' }
    : { label: 'Start', cls: 'bg-parchment-darker text-ink-muted' };

  const card = (
    <div className={`card-parchment p-4 flex flex-col gap-2 transition-all ${locked ? 'opacity-50' : 'hover:border-gold/40 hover:shadow-md'}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-heading text-sm text-ink font-semibold leading-snug">{config.title}</p>
        <span className={`shrink-0 text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full ${pill.cls}`}>
          {pill.label}
        </span>
      </div>
      <p className="text-[12px] font-sans text-ink-muted leading-relaxed">{config.description}</p>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] font-sans text-gold/70 uppercase tracking-wide">
          {FORMAT_LABELS[config.format] ?? config.format}
        </span>
        {locked && (
          <svg className="w-3.5 h-3.5 text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        )}
      </div>
    </div>
  );

  if (locked) return card;

  return (
    <Link href={`${basePath}/session/${config.id}`} className="block">
      {card}
    </Link>
  );
}
