import Link from 'next/link';

export const metadata = { title: 'Exercises — Sarf App' };

export default function ExercisesPage() {
  return (
    <div className="px-6 py-10 max-w-xl">
      <h1 className="font-heading text-2xl text-ink mb-1">Exercises</h1>
      <p className="text-ink-muted font-sans text-sm mb-8">
        Work through the textbook exercises and practice games, unit by unit.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Unit 1 — primary top border */}
        <Link
          href="/exercises/unit-1"
          className="bg-white border border-parchment-darker border-t-[3px] border-t-gold rounded-xl p-5 hover:shadow-sm transition-shadow group block"
        >
          <p className="font-heading text-lg text-ink mb-1 group-hover:text-gold transition-colors">Unit 1</p>
          <p className="text-ink-muted text-sm font-sans">Thulāthī Mujarrad — 6 bābs · 51 exercises</p>
        </Link>

        {/* Unit 2 — secondary top border */}
        <div className="bg-white border border-parchment-darker border-t-[3px] border-t-teal rounded-xl p-5 opacity-40 cursor-not-allowed">
          <p className="font-heading text-lg text-ink mb-1">Unit 2</p>
          <p className="text-ink-muted text-sm font-sans">Thulāthī Mazīd — 10 bābs</p>
        </div>

        {/* Units 3–12 — neutral, spanning full row */}
        <div className="bg-white border border-parchment-darker rounded-xl p-5 opacity-40 cursor-not-allowed sm:col-span-2">
          <p className="font-heading text-lg text-ink mb-1">Units 3–12</p>
          <p className="text-ink-muted text-sm font-sans">Coming in a later stage.</p>
        </div>
      </div>
    </div>
  );
}
