# 06 抽出 + 栄養推定パイプライン v3（ちょい編集B）

## 6.1 パイプライン全体
(1) URL解析 → video_id
(2) YouTube Data APIでメタ取得（title/description等）
(3) description前処理（URL/PR/道具リンク除去、材料/作り方セクション切り出し、章抽出）
(4) LLMでレシピJSON生成（材料/手順）※必ずJSON
(5) 栄養推定（best-effort）
    - 材料行の正規化
    - 食品成分DBへマッピング（候補+スコア）
    - 分量→g換算（可能な範囲）
    - 合算→confidence/coverage算出
    - unresolved返却（ちょい編集へ）
(6) ユーザーが未確定だけ修正→再計算→精度UP

## 6.2 ノイズ除去（重要）
- descriptionから以下を除外:
  - URL行（http/https）
  - PR/スポンサー文言（例: 提供、案件、Amazonリンク等）
  - 道具・機材の紹介（包丁/フライパン/まな板 等）
- 例: 「フライパン」→材料に入れない（誤抽出の典型）

## 6.3 栄養推定の信頼設計（UIと直結）
- coverage: g換算できた材料数 / 材料数
- mapping_confidence: match_score平均
- confidence: 0.6*mapping_confidence + 0.4*coverage（初期案）
- 未確定（unresolved）:
  - マッチ候補が僅差
  - quantity_textが曖昧（適量/少々/1個など）
  - 油（吸油率で誤差が極大）

## 6.4 “ちょい編集”の最小導線
- unresolved材料だけを列挙
- 各材料について:
  - food候補上位3を提示
  - 量（g）を入力
- 入力が難しい材料（例: 1個/1枚）は「推定テンプレ」を用意（P1）

## 6.5 抽出ロジック詳細設計（AI開発運用）
- 実装に先立つ詳細仕様は `docs/AI_Development/04_Implementation_Standards/04_Extraction_Logic_Design.md` を正とする。
- 方針:
  - rule-based抽出を第一経路にする
  - 低品質ケースのみLLMフォールバック
  - 出力は必ずZodで検証してから永続化する

## Appendix A: Prompt Library

### 共通ルール
- 出力は必ずJSON（Markdown禁止）
- 道具リンク/URL/スポンサー文言は材料に含めない
- 手順は1文=1アクション、5〜15ステップに圧縮
- 不明点を断定しない（推測は `is_ai_inferred=true`）

### Prompt A: description -> レシピJSON
- 目的: `video_title/channel_title/cleaned_description/chapters` から ingredients/steps を生成
- 制約: JSONのみ出力、道具紹介・URL・スポンサー文言を除外

### Prompt B: 材料名の正規化
- 目的: 食品DB検索に適した正規化キーを返す
- 出力: `normalized_name`, `hints[]`

### Prompt C: quantity_text -> grams 推定
- 目的: ルールで解決できない曖昧量の補助推定
- 出力: `grams|null`, `confidence`, `reason`
- 制約: 不確実なら `grams=null`

## Appendix B: Test Plan

### ユニットテスト
- `parseYouTubeVideoId(url)`
- `cleanDescription(description)`
- `extractChapters(description)`
- `nutrition.normalizeIngredient(name)`
- `nutrition.matchFoodItem(q)`
- `nutrition.parseQuantity(quantity_text)`
- `nutrition.computeNutrition()`

### 統合テスト
- import APIが recipes/ingredients/steps を保存
- nutrition APIが cache を更新し unresolved を返す
- match overrideでconfidenceが上がる

### E2E（Playwright）
- URL入力 -> 生成 -> RecipeDetail -> CookMode
- 未確定 -> NutritionFix -> 再計算 -> 栄養カード更新
- 共有リンク -> SharePage表示

### ゴールデンデータ
- 代表動画URL 10本（チャンネル3つ）を固定し、材料抽出数とconfidence下限を回帰監視

## 6.6 付録統合の運用
- 抽出/栄養運用の一次参照は本書（`06_Extraction_and_Nutrition_Pipeline_v3.md`）とする。


