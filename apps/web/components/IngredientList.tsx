type IngredientListProps = {
  items: string[];
};

export function IngredientList({ items }: IngredientListProps) {
  return (
    <section aria-labelledby="ingredient-list">
      <h2 id="ingredient-list" className="text-sm font-semibold text-slate-900">
        材料
      </h2>
      <ul className="mt-2 space-y-1 text-sm text-slate-800">
        {items.map((item) => (
          <li key={item} className="rounded-md border border-slate-200 bg-white px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
