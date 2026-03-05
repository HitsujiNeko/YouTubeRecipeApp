import { RecipeModel } from "../../types/models";
import IngredientTag from "./IngredientTag";
import RecipeTag from "./RecipeTag";
interface RecipeCardProps {
  recipe: RecipeModel;
  displayIngCat?: boolean; // 追加: 食材リストを表示するかどうか
  onClick: () => void; 
  selected?: boolean;
}
// カテゴリごとに色分けするスタイル関数
// 主菜：赤（ピンク）系、副菜：緑系、炭水化物：黄色系、デザート：水色系、スープ：オレンジ系、その他：灰色系
function getCategoryStyle(categoryName: string) {
  switch (categoryName) {
    case "主菜":
      return "bg-red-200 ";
    case "副菜":
      return "bg-green-200 ";
    case "炭水化物":
      return "bg-yellow-200 ";
    case "デザート":
      return "bg-blue-200 ";
    case "スープ":
      return "bg-orange-200 ";
    default:
      return "bg-gray-200 ";
  }
}

export default function RecipeCard({
  recipe,
  displayIngCat,
  onClick,
  selected,
}: RecipeCardProps) {
  const borderClass = selected ? "border-4 border-blue-500 hover:border-blue-700" : "";

  return (
    <div 
      className={`bg-orange-50 border-2 border-orange-300
      rounded-xl shadow-md  w-full max-w-xs mx-auto transition hover:shadow-lg hover:border-orange-400 overflow-hidden ${borderClass}`}
      onClick={onClick}
    >
      <div className=" items-center p-1">
        <span className="font-bold text-xs leading-none line-clamp-2 pl-1">
          {recipe.name}
        </span>
      </div>
      <div className="flex justify-between items-center mb-1">
        <div  className="relative w-full">
          <img src={recipe.thumbnail} alt={recipe.name} className="w-full h-auto " />
          <span 
            className={`absolute top-1 left-1 text-xs px-2 py-0.5 rounded 
              ${getCategoryStyle(recipe.category?.name)}`}>
            {recipe.category?.name}
          </span>
          <div className="absolute top-1 right-1 flex flex-col gap-1 z-10">
              {recipe.tags?.map(tag => ( 
                <RecipeTag key={tag.id} recipeTag={tag} />
              ))
                }
          </div>
          <img src={recipe.youtube_channel?.thumbnail} alt="チャンネルアイコン" className="absolute right-1 bottom-1 w-8 h-8 rounded-full border-2 border-white shadow" />
        </div>
      </div>
      {displayIngCat && (
        <div className="flex flex-wrap gap-1 justify-center mb-1">
          {(recipe.ingredients || []).map((ing) => (
            <IngredientTag key={ing.id} ingredient={ing} />
          ))}
        </div>
      )}
    </div>
  );
}
