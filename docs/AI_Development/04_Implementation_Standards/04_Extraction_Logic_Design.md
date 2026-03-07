# 04 Extraction Logic Design

更新日: 2026-03-07
対象: `POST /api/recipes/import` の材料/手順抽出ロジック

## 1. 目的と前提
- 目的: YouTube description から RecipeDetail 表示に必要な `recipe_ingredients` / `recipe_steps` を安定抽出する。
- 目的: 栄養推定前段として「表示可能品質」を満たす抽出品質を担保する。
- 非目的: 本ドキュメントは栄養値の精度最適化ではなく、抽出品質の安定化を主眼とする。

関連仕様:
- `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/09_Extraction_and_Nutrition_Pipeline_v3.md`
- `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/08_OpenAPI_v3.yaml`
- `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/07_DB_Schema_v3.sql`

## 2. データ契約

### 2.1 抽出出力の内部モデル
```ts
export type ExtractedIngredient = {
  position: number;
  name: string;
  quantity_text: string | null;
  group_label: string | null;
  is_optional: boolean;
  confidence: number; // 0.00-1.00
  source_line: string;
};

export type ExtractedStep = {
  position: number;
  text: string;
  timestamp_sec: number | null;
  timer_sec: number | null;
  is_ai_inferred: boolean;
  confidence: number; // 0.00-1.00
  source_line: string;
};
```

### 2.2 永続化方針
- `recipe_ingredients`:
  - `position,name,quantity_text,group_label,is_optional` を保存。
- `recipe_steps`:
  - `position,text,timestamp_sec,timer_sec,is_ai_inferred` を保存。
- `recipes.extraction_confidence`:
  - 後述の aggregate score で更新。
- `recipes.extraction_notes`:
  - どの抽出経路を通ったか（rule/llm/hybrid）を保存。

## 3. 抽出アーキテクチャ

### 3.1 フェーズ構成
1. Preprocess
2. Section Detection
3. Rule-based Extraction
4. LLM Fallback Extraction
5. Merge & Conflict Resolution
6. Validation & Persistence

### 3.2 Preprocess
入力: `title`, `description`

処理:
- 改行正規化（CRLF -> LF）
- 全角/半角正規化（NFKC）
- 空行圧縮（連続空行は1行に）
- URL行除去
  - `^https?://` で始まる行
  - `(?:https?://|www\.)\S+` を過半に含む行
- PR/販促ノイズ除去
  - キーワード例: `提供`, `案件`, `スポンサー`, `promotion`, `PR`, `Amazon`, `楽天` など
- SNS/告知ノイズ除去
  - キーワード例: `Twitter`, `Instagram`, `TikTok`, `チャンネル登録`, `高評価`
- 道具候補マーク
  - 例: `フライパン`, `鍋`, `まな板`, `ボウル`, `包丁`, `ヘラ`
  - ここでは除外せず `isToolCandidate=true` として後段判定

出力:
- `NormalizedLine[]`（raw, normalized, flags）

## 4. 材料抽出ロジック

### 4.1 セクション検出
見出し候補（優先順）:
- 日本語: `材料`, `材料（`, `材料:`
- 英語: `ingredients`, `ingredient`

終了条件:
- 手順セクション見出しに到達
- 連続3行以上が材料パターン非一致

### 4.2 行の材料判定
材料候補の最低条件:
- 長さ 1-60 文字
- URL/販促/SNS 行でない
- 手順番号形式に一致しない（`^\d+[\.\)．、]`）
- 道具語のみの行でない

強い材料シグナル:
- 分量語を含む: `g|kg|ml|cc|大さじ|小さじ|適量|少々|ひとつまみ|個|本|枚|片`
- `食材 + 分量` の2要素構造

### 4.3 名前・分量分離
戦略:
- 右側から分量トークンを優先マッチ。
- 例:
  - `鶏むね肉 300g` -> name: `鶏むね肉`, quantity: `300g`
  - `しょうゆ 大さじ1` -> name: `しょうゆ`, quantity: `大さじ1`
  - `塩 少々` -> name: `塩`, quantity: `少々`

quantity 正規化（表示は原文維持）:
- 内部だけで `value/unit/modifier` に分解して保持可能にする。

### 4.4 オプション判定
`is_optional=true` 条件:
- `お好みで`, `あれば`, `省略可`, `optional` を含む。

### 4.5 材料抽出 confidence
行単位スコア:
- 分量分離成功: +0.45
- 既知食材語（辞書一致）: +0.25
- セクション内抽出: +0.20
- ノイズ/道具疑い: -0.40
- 下限/上限: 0.00-1.00

## 5. 手順抽出ロジック

### 5.1 セクション検出
見出し候補:
- 日本語: `作り方`, `手順`, `工程`
- 英語: `steps`, `instructions`, `method`

補助条件:
- タイムスタンプ行（`mm:ss`/`hh:mm:ss`）が2件以上連続する場合は手順セクション開始とみなす。

### 5.2 行の手順判定
手順候補条件（いずれか）:
- `^\d+[\.\)．、]` 形式
- 先頭タイムスタンプ
- 動詞終止を含む短文（`混ぜる`, `焼く`, `煮る`, `cut`, `mix` など）

除外:
- URL/販促/SNS
- 材料候補との重複行

### 5.3 タイムスタンプ・タイマー抽出
- `timestamp_sec`:
  - `mm:ss` -> `m*60+s`
  - `hh:mm:ss` -> `h*3600+m*60+s`
- `timer_sec`:
  - 文中の時間表現（`3分`, `10秒`, `5 min`）を抽出
  - `最大1件` を採用

### 5.4 手順抽出 confidence
行単位スコア:
- 番号付き/時刻付き: +0.45
- 動詞終止文: +0.30
- セクション内抽出: +0.20
- 宣伝/自己紹介文: -0.50
- 下限/上限: 0.00-1.00

## 6. LLMフォールバック

### 6.1 起動条件
以下のいずれかで rule-only を失敗扱い:
- ingredients < 2
- steps < 2
- ingredient平均confidence < 0.45
- step平均confidence < 0.45

### 6.2 LLM入出力
入力:
- `title`, 前処理済みdescription、抽出済み候補（rule結果）

出力（JSON固定）:
```json
{
  "ingredients": [
    {"name": "", "quantity_text": null, "group_label": null, "is_optional": false}
  ],
  "steps": [
    {"text": "", "timestamp_sec": null, "timer_sec": null, "is_ai_inferred": true}
  ]
}
```

制約:
- 文字列整形のみ。創作禁止（descriptionにない材料を追加しない）。
- 数値は整数秒。
- 不明値は `null`。

検証:
- Zodで厳密検証。失敗時は rule-only にフォールバック。

## 7. Merge & Conflict Resolution
- 優先順位: rule-high-confidence > llm > rule-low-confidence
- 重複除去:
  - ingredient: `normalize(name)+normalize(quantity_text)`
  - step: `normalize(text)`
- 上限:
  - ingredients: 30
  - steps: 50

## 8. 集計スコアと保存

### 8.1 extraction_confidence
`recipe.extraction_confidence` 計算:
- `ingredientScore = 平均(ingredient.confidence)`
- `stepScore = 平均(step.confidence)`
- `coverageScore = min(1, (ingredientsCount>=3 ? 0.5 : ingredientsCount/6) + (stepsCount>=3 ? 0.5 : stepsCount/6))`
- `extraction_confidence = 0.4*ingredientScore + 0.4*stepScore + 0.2*coverageScore`

### 8.2 extraction_notes
形式:
- `mode=rule|hybrid|llm; ingredients=n; steps=n; dropped_noise=n`

## 9. 失敗時ポリシー
- description空/極小:
  - 材料0/手順0を許容しつつ import 自体は成功。
  - `extraction_confidence` を低く設定。
- 例外:
  - DB障害は既存の `upstream_unavailable` を返却。

## 10. テスト設計（再実装時の必須）

### 10.1 Unit（抽出関数）
- 日本語典型（材料/作り方見出し）
- 英語典型（ingredients/steps）
- 見出しなし + タイムスタンプ列
- PR/URL/SNS混在
- 道具語混在（誤抽出抑制）
- quantity分離（g/ml/大さじ/少々）

### 10.2 Integration（import route）
- import後に `recipe_ingredients/recipe_steps` が保存される
- LLMフォールバック発火条件
- Zod検証失敗時のrule-only fallback

### 10.3 E2E
- URL投入 -> RecipeDetail で材料・手順が空でないこと
- 低品質descriptionで graceful degrade

## 11. 実装分割（再実装の順序）
1. 抽出コアを `apps/web/lib/extraction/*` に分離
2. Unit test を先に作成
3. import route をコア利用へ置換
4. integration test 追加
5. 段階的に LLM fallback を有効化

## 12. 既知リスクと対策
- リスク: description記法の多様性でruleが過学習
  - 対策: 失敗時に必ずLLM fallback
- リスク: tool語辞書漏れ
  - 対策: 誤抽出ログから辞書定期更新
- リスク: 生成系の創作
  - 対策: プロンプトで創作禁止 + Zod + diff guard
