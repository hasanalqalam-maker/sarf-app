import { getBabsByUnit } from '@/lib/data';
import BabCard from '@/components/BabCard';

export const metadata = { title: 'Reference Library — Sarf App' };

export default function ReferencePage() {
  const unit1Babs = getBabsByUnit(1);
  const unit2Babs = getBabsByUnit(2);

  return (
    <div className="px-6 py-10 max-w-5xl">
      <h1 className="font-heading text-3xl text-ink mb-1">Reference Library</h1>
      <p className="text-ink-muted font-sans text-sm mb-10">
        Select a bāb to view its full conjugation table.
      </p>

      {/* Unit 1 */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-5">
          <h2 className="font-heading text-xl text-ink">Unit 1</h2>
          <span className="text-ink-muted font-sans text-sm">Thulāthī Mujarrad</span>
          <div className="flex-1 border-t border-parchment-darker" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {unit1Babs.map((bab) => (
            <BabCard key={bab.id} bab={bab} />
          ))}
        </div>
      </section>

      {/* Unit 2 */}
      {unit2Babs.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="font-heading text-xl text-ink">Unit 2</h2>
            <span className="text-ink-muted font-sans text-sm">Thulāthī Mazīd Fīh</span>
            <div className="flex-1 border-t border-parchment-darker" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {unit2Babs.map((bab) => (
              <BabCard key={bab.id} bab={bab} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
