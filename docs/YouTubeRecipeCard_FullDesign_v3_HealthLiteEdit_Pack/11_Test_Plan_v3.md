# 11 テスト計画 v3（栄養推定の回帰を守る）

## 11.1 ユニットテスト（必須）
- parseYouTubeVideoId(url): 形式別対応
- cleanDescription(description): URL/PR/道具除去
- extractChapters(description): timestamp行の抽出
- nutrition.normalizeIngredient(name): 正規化
- nutrition.matchFoodItem(q): trgm検索で上位候補が返る
- nutrition.parseQuantity(quantity_text): g換算（g/kg/ml, 大さじ小さじ）
- nutrition.computeNutrition(): 合算・confidence/coverage

## 11.2 統合テスト
- import APIが recipes/ingredients/steps を保存
- nutrition APIが cache を更新し unresolved を返す
- match override で confidence が上がる（回帰）

## 11.3 E2E（Playwright）
- URL入力→生成→RecipeDetail→CookMode
- 未確定→NutritionFix→再計算→栄養カード更新
- 共有リンク→SharePage表示

## 11.4 ゴールデンデータ（回帰セット）
- 代表動画URL 10本（チャンネル3つ）を固定し、
  - ingredients数の下限
  - 栄養confidenceの下限
  を守る。
