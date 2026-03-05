import type { NutritionConfidence, NutritionTotals } from "@/types/models";

type NutritionSummaryCardProps = {
  totals: NutritionTotals;
  confidence: NutritionConfidence;
  coverage: number;
  unresolvedCount: number;
};

const CONFIDENCE_LABEL: Record<NutritionSummaryCardProps["confidence"], string> = {
  low: "低",
  medium: "中",
  high: "高",
};

function formatCoverage(coverage: number): string {
  const clamped = Math.max(0, Math.min(100, coverage));
  return `${clamped}%`;
}

export function NutritionSummaryCard({
  totals,
  confidence,
  coverage,
  unresolvedCount,
}: NutritionSummaryCardProps) {
  return (
    <section
      className="rounded-xl border border-orange-200 bg-orange-50 p-4"
      aria-labelledby="nutrition-summary"
    >
      <h2 id="nutrition-summary" className="text-sm font-semibold text-slate-900">
        栄養サマリー
      </h2>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-md bg-white p-2 text-center">
          <p className="text-slate-500">kcal</p>
          <p className="font-semibold text-slate-900">{totals.kcal}</p>
        </div>
        <div className="rounded-md bg-white p-2 text-center">
          <p className="text-slate-500">P</p>
          <p className="font-semibold text-slate-900">{totals.proteinG}g</p>
        </div>
        <div className="rounded-md bg-white p-2 text-center">
          <p className="text-slate-500">F</p>
          <p className="font-semibold text-slate-900">{totals.fatG}g</p>
        </div>
        <div className="rounded-md bg-white p-2 text-center">
          <p className="text-slate-500">C</p>
          <p className="font-semibold text-slate-900">{totals.carbsG}g</p>
        </div>
        <div className="rounded-md bg-white p-2 text-center">
          <p className="text-slate-500">salt</p>
          <p className="font-semibold text-slate-900">{totals.saltG}g</p>
        </div>
        <div className="rounded-md bg-white p-2 text-center">
          <p className="text-slate-500">unresolved</p>
          <p className="font-semibold text-slate-900">{unresolvedCount}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-700">
        confidence: {CONFIDENCE_LABEL[confidence]} / coverage: {formatCoverage(coverage)}
      </p>
    </section>
  );
}
