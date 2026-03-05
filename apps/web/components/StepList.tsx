type StepListProps = {
  steps: string[];
};

export function StepList({ steps }: StepListProps) {
  return (
    <section aria-labelledby="step-list">
      <h2 id="step-list" className="text-sm font-semibold text-slate-900">
        手順
      </h2>
      <ol className="mt-2 space-y-2 text-sm text-slate-800">
        {steps.map((step, index) => (
          <li
            key={`${index}-${step}`}
            className="rounded-md border border-slate-200 bg-white px-3 py-2"
          >
            <span className="mr-2 font-semibold text-slate-600">{index + 1}.</span>
            {step}
          </li>
        ))}
      </ol>
    </section>
  );
}
