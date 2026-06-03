import Link from 'next/link';

export const metadata = { title: 'Games — Sarf App' };

export default function GamesPage() {
  return (
    <div className="px-6 py-10 max-w-xl">
      <h1 className="font-heading text-3xl text-ink mb-1">Games</h1>
      <p className="text-ink-muted font-sans text-sm mb-8">
        Practice conjugation with interactive games. Complete each unit to unlock the next.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/games/unit-1" className="card-parchment p-5 hover:border-gold/40 transition-colors group block">
          <p className="font-heading text-lg text-ink mb-1 group-hover:text-teal transition-colors">Unit 1</p>
          <p className="text-ink-muted text-sm font-sans">Thulāthī Mujarrad — 6 bābs</p>
        </Link>
        <Link href="/games/unit-2" className="card-parchment p-5 hover:border-gold/40 transition-colors group block">
          <p className="font-heading text-lg text-ink mb-1 group-hover:text-teal transition-colors">Unit 2</p>
          <p className="text-ink-muted text-sm font-sans">Thulāthī Mazīd — 10 bābs</p>
        </Link>
        <div className="card-parchment p-5 opacity-40 cursor-not-allowed sm:col-span-2">
          <p className="font-heading text-lg text-ink mb-1">Units 3–12</p>
          <p className="text-ink-muted text-sm font-sans">Coming in a later stage.</p>
        </div>
      </div>
    </div>
  );
}
