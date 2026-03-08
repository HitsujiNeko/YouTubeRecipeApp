# 03 技術アーキテクチャ v3（抽出 + 栄養推定）

## 6.1 全体構成
- Next.js App Router（UI）
- Next.js Route Handlers（API）
- Supabase Postgres（永続）
- YouTube Data API（動画メタ取得）
- LLM API（JSON抽出、材料正規化補助、g換算補助）

## 6.2 重要：YouTubeデータの保持方針
- video_id は保存
- title/thumbnail/channelは last_refreshed_at を持ち、30日以内に再取得して更新する運用（遅延更新可）
- description全文は原則保存しない（保存する場合はTTLで削除）
- 生成したレシピカードは保存（当社生成データ）

## 6.3 栄養推定エンジン（MVP）
### データ
- food_items / food_nutrients_per_100g（食品成分DB）
- recipe_ingredient_matches（材料→食品ID + g換算）
- recipe_nutrition_cache（合算結果）

### 推奨アルゴリズム
1) ingredient.name を正規化（辞書 + 文字列処理）
2) 同義語辞書でヒット→候補
3) pg_trgm類似検索で候補→スコア
4) quantity_text を簡易パーサでg換算（可能な範囲）
5) 合算（確定分のみ）
6) confidence/coverageを算出
7) unresolvedを返す（UIでちょい編集）

## 6.4 モジュール構成（提案）
- /lib/youtube : URL解析、YouTube APIクライアント
- /lib/extractors : description cleaner + channel-specific parser
- /lib/nutrition :
  - normalizeIngredient.ts
  - matchFoodItem.ts (trgm)
  - parseQuantity.ts (g換算)
  - computeNutrition.ts
- /lib/llm : JSON schema検証、リトライ

## 6.5 主要API
- POST /api/recipes/import
- GET/PATCH /api/recipes/{id}
- POST /api/recipes/{id}/nutrition （再計算）
- PATCH /api/ingredients/{ingredient_id}/match（候補選択/g保存）
- GET /api/foods/search?q=...（手動マッチング候補）


