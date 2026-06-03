import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBabById, getConjugationForBab, getSighas } from '@/lib/data';
import ConjugationTableTabs from '@/components/ConjugationTableTabs';

interface Props {
  params: Promise<{ 'bab-id': string }>;
}

export async function generateMetadata({ params }: Props) {
  const { 'bab-id': babId } = await params;
  const bab = getBabById(decodeURIComponent(babId));
  return { title: bab ? `${bab.id} — Sarf App` : 'Not Found' };
}

export default async function BabDetailPage({ params }: Props) {
  const { 'bab-id': babId } = await params;
  const bab = getBabById(decodeURIComponent(babId));

  if (!bab) notFound();

  const conjugation = getConjugationForBab(bab.id);
  const sighas = getSighas();

  return (
    <div className="px-6 py-10 max-w-3xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm font-sans text-ink-muted mb-8">
        <Link href="/reference" className="hover:text-teal transition-colors">
          Reference
        </Link>
        <span className="text-gold/40">›</span>
        <span className="text-ink">{bab.id}</span>
      </nav>

      {/* Header */}
      <div className="card-parchment p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p dir="rtl" className="arabic text-arabic-2xl text-ink leading-relaxed mb-1">
              {bab.arabic_name}
            </p>
            <div className="flex items-center gap-3" dir="rtl">
              <span className="arabic text-arabic-lg text-teal leading-relaxed">{bab.madi}</span>
              <span className="text-gold/50">·</span>
              <span className="arabic text-arabic-lg text-teal-light leading-relaxed">{bab.mudari}</span>
              <span className="text-gold/50">·</span>
              <span className="arabic text-arabic-lg text-ink-muted leading-relaxed">{bab.masdar}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            {bab.roman_numeral && (
              <span className="text-xs font-sans font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded">
                Bāb {bab.roman_numeral}
              </span>
            )}
            <span className="text-[11px] font-sans text-ink-muted">Page {bab.page}</span>
            {!bab.has_majhul && (
              <span className="text-[11px] font-sans text-ink-muted/60 italic">No majhūl form</span>
            )}
          </div>
        </div>

        {/* Ism fāʿil / Ism mafʿūl */}
        {(bab.ism_fail || bab.ism_maful) && (
          <div className="mt-4 pt-4 border-t border-gold/15 flex flex-wrap gap-x-6 gap-y-1" dir="rtl">
            {bab.ism_fail && (
              <div className="flex items-center gap-2">
                <span dir="rtl" className="arabic text-[11px] text-ink-muted">اسم فاعل</span>
                <span dir="rtl" className="arabic text-base text-ink leading-relaxed">{bab.ism_fail}</span>
              </div>
            )}
            {bab.ism_maful && (
              <div className="flex items-center gap-2">
                <span dir="rtl" className="arabic text-[11px] text-ink-muted">اسم مفعول</span>
                <span dir="rtl" className="arabic text-base text-ink leading-relaxed">{bab.ism_maful}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Conjugation table */}
      {conjugation ? (
        <div className="card-parchment p-6">
          <ConjugationTableTabs
            conjugation={conjugation}
            sighas={sighas}
            hasMajhul={bab.has_majhul}
            note={conjugation._note ?? bab._note}
          />
        </div>
      ) : (
        <div className="card-parchment p-6 text-center text-ink-muted font-sans text-sm">
          Conjugation data not yet available for this bāb.
        </div>
      )}
    </div>
  );
}
