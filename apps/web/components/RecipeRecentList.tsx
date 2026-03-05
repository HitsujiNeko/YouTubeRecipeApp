import Link from "next/link";

type RecentRecipe = {
  id: string;
  title: string;
  href: string;
};

const RECENT_RECIPES: RecentRecipe[] = [
  {
    id: "sample-1",
    title: "高たんぱく鶏むねソテー",
    href: "/recipes/sample-1",
  },
  {
    id: "sample-2",
    title: "豆腐チキンナゲット",
    href: "/recipes/sample-2",
  },
];

export function RecipeRecentList() {
  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      aria-labelledby="recent-recipes"
    >
      <h2 id="recent-recipes" className="text-sm font-semibold text-slate-900">
        最近のレシピ
      </h2>
      <ul className="mt-3 space-y-2">
        {RECENT_RECIPES.map((recipe) => (
          <li key={recipe.id}>
            <Link
              href={recipe.href}
              className="block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 hover:bg-slate-100"
            >
              {recipe.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
