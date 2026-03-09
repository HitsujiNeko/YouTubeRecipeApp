# 04 Extraction Logic Design

更新日: 2026-03-08
対象: `POST /api/recipes/import` の材料/手順抽出パイプライン

## 1. 目的と前提

### 1.1 目的
- YouTube動画から RecipeDetail 表示に必要な `recipe_ingredients` / `recipe_steps` を安定抽出する。
- 栄養推定の前段として「表示可能品質」を満たす抽出品質を担保する。
- **目標カバレッジ: レシピ動画の約8割で材料・手順を構造化できること。**

### 1.2 根本的前提の修正

**YouTube descriptionに材料・手順が記述されているとは限らない。**

実際のdescription分布:

| パターン | 典型例 |
|---|---|
| 材料＋手順を全記載 | リュウジ系・料理専門チャンネル |
| 材料のみ | 分量だけ箇条書き |
| チャプター（タイムスタンプ）のみ | `0:00 イントロ / 1:30 下ごしらえ` |
| SNS告知・アフィリエイトリンクのみ | 実質レシピ情報なし |
| 空 | 何も書かれていない |

**descriptionのみを入力とする設計は8割カバレッジを達成できない。字幕テキストを第2ソースとして利用する。**

### 1.3 非目的
- 栄養値の精度最適化（栄養推定はこのドキュメントのスコープ外）
- 音声バイナリのダウンロード・ASR（ToS違反リスクのため採用しない）
- YouTube公式 Captions API（OAuthが必要で他人の動画に使えないため採用しない）

### 1.4 設計思想: 完全自動化を目指さない

本アプリの本質は「YouTube動画を完全自動でレシピ化するAI」ではなく、
**「YouTube動画を、最小の操作で"使えるレシピカード"に変えるUI」** である。

```
完全自動化モデル（採用しない）:
  URLを入れる → AIが全部抽出する → 失敗率が高く、失敗時に手詰まり

段階的精度向上モデル（採用する）:
  URLを入れる → AIが初期カードを作る（70点）→ ユーザーが最小操作で補完（→ 90点）
```

この設計思想に基づく原則:
- 抽出が不完全な場合も **import 自体は成功** とし、`extraction_status` で状態を区別する
- 「未確定」「不完全」を隠蔽せず、UIに明示してユーザーの補完を促す
- LLMは精度を上げるための手段であり、LLM失敗でアプリ全体を止めない

> **P1 拡張: 動画アシスト抽出モード**
> ユーザーが動画を再生しながら「+ 材料として追加」「+ 手順として追加」ボタンで
> カードを育てる UX は P1 スコープとしてバックログ（Q-018）に登録済み。

関連仕様:
- `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/06_Extraction_and_Nutrition_Pipeline_v3.md`
- `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/05_OpenAPI_v3.yaml`
- `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/04_DB_Schema_v3.sql`
- `.github/copilot-instructions.md`（セキュリティルール）

---

## 2. データソースとパイプライン概要

### 2.1 データソース（優先順）

```
[Source 1] YouTube Data API v3
  → title, description, channelTitle, thumbnailUrl
  → 取得コスト: 低、ToS: 完全準拠

[Source 2] YouTube timedtext（字幕テキスト）
  → 自動生成字幕または手動字幕のテキスト
  → 取得コスト: 中、ToS: グレー（テキストのみ取得のため許容範囲と判断）
  → ライブラリ: `youtube-transcript`（npm）等を使用
  → 動画/音声バイナリは一切取得しない
```

### 2.2 パイプライン全体像

```
①  Source取得
    metadata（title + description）  ←  常に試みる
    transcript（字幕テキスト）       ←  常に並行取得を試みる
         ↓
②  Source評価
    descriptionにレシピ情報があるか判定
    transcriptが取得できたか確認
         ↓
③  ルールベース補助解析（description対象）
    ※ descriptionにレシピ情報がある場合のみ実行
    ※ 結果はLLMのプロンプト補助情報として使う
         ↓
④  LLM構造化
    入力: title + 有効なソーステキスト（description / transcript / 両方）
    出力: 構造化された材料・手順JSON（Zod検証）
         ↓
⑤  extraction_status / confidence 計算
         ↓
⑥  永続化
```

---

## 3. extraction_status（状態区別）

descriptionのみを前提とした設計では「空配列を返してimport成功」としか区別できなかった。
以下の状態をDBおよびAPIレスポンスで区別する。

| status | 意味 | UIへの表示指針 |
|---|---|---|
| `success` | 材料・手順ともに抽出できた | 通常表示 |
| `partial` | 材料か手順のどちらかのみ抽出できた | あるものを表示し「情報が不完全です」と注記 |
| `no_recipe_found` | ソースにレシピ情報が検出されなかった | 「説明欄にレシピ情報がありません」と表示 |
| `no_source` | descriptionが空かつ字幕も取得できなかった | 「動画情報を取得できませんでした」と表示 |

**DBスキーマ変更:** `recipes` テーブルに `extraction_status text not null default 'no_source'` を追加する。

---

## 4. Source取得ロジック

### 4.1 description評価

「レシピ情報あり」と判定する条件（いずれか）:
- 材料見出しパターンに一致する行がある（`材料`, `ingredients` 等）
- 分量語（`g|ml|大さじ|小さじ|適量|少々` 等）を含む行が2行以上ある
- 手順見出しパターンに一致する行がある（`作り方`, `steps` 等）
- 番号付きステップ（`1.`, `1）` 等）が2行以上ある

判定結果: `description_has_recipe: boolean`

### 4.2 字幕取得

- ライブラリ: `youtube-transcript`（npm）
- 優先言語: リクエストの `language` パラメータ（デフォルト `ja`）、次点 `en`
- 取得できない場合（字幕なし・プライベート動画等）は `null` として継続
- タイムスタンプ付きセグメントを結合してプレーンテキスト化
- 最大文字数: 15,000文字（超過時は先頭から切り捨て）
- **取得したテキストは `source_text` カラムに永続化する（再処理コスト削減）**

**DBスキーマ変更:** `recipes` テーブルに `source_text text` を追加する。

### 4.3 ソース選択ロジック

```
if description_has_recipe AND transcript取得成功:
  → ソース = description + transcript（両方をLLMに渡す）
  → mode = "description+transcript"

if description_has_recipe AND transcript取得失敗:
  → ソース = description のみ
  → mode = "description"

if NOT description_has_recipe AND transcript取得成功:
  → ソース = transcript のみ
  → mode = "transcript"

if NOT description_has_recipe AND transcript取得失敗:
  → 抽出スキップ。extraction_status = "no_source"
  → mode = "none"
```

---

## 5. ルールベース補助解析（description対象）

descriptionにレシピ情報がある場合、LLMに渡す前にルールベースで構造を補助解析し、
プロンプトの質を向上させる候補情報として使う。

### 5.1 前処理

入力: `description`

処理:
- 改行正規化（CRLF → LF）
- NFKC正規化（全角→半角）
- 空行圧縮（連続空行は1行に）
- URL行除去（`^https?://` で始まる行 / URLが行の過半を占める行）
- ノイズ行フラグ: `提供`, `案件`, `スポンサー`, `Twitter`, `Instagram`, `TikTok`, `チャンネル登録`, `高評価` 等
- 道具候補フラグ: `フライパン`, `鍋`, `まな板`, `ボウル`, `包丁` 等

出力: `NormalizedLine[]`（raw, normalized, isUrl, isNoise, isToolCandidate）

### 5.2 セクション検出

材料見出し:
- 日本語: `材料`, `材料（`, `材料:`
- 英語: `ingredients`, `ingredient`

手順見出し:
- 日本語: `作り方`, `手順`, `工程`
- 英語: `steps`, `instructions`, `method`

### 5.3 用途

ルールベース補助解析の結果は、LLMプロンプトに「候補リスト」として含める補助情報として利用する。
ルールベースのみで最終出力とはしない（LLMが最終的な構造化を行う）。

---

## 6. LLM構造化

### 6.1 入力構成

```
title: <動画タイトル>

[descriptionのレシピ部分（あれば）]
<前処理済みdescriptionテキスト>

[字幕テキスト（あれば）]
<transcriptテキスト（最大15,000文字）>
```

### 6.2 プロンプト方針

- 役割: レシピ情報の**抽出・整形**のみ。創作・補完・推測は禁止。
- 指示: 上記ソーステキストに明示的に記載されている情報のみを使うこと。
- 数値は整数秒。不明値は `null`。
- 分量は原文のまま `quantity_text` に格納。

### 6.3 出力スキーマ（Zod検証）

```ts
const LlmIngredientSchema = z.object({
  name: z.string().min(1).max(100),
  quantity_text: z.string().max(50).nullable(),
  group_label: z.string().max(50).nullable(),
  is_optional: z.boolean(),
});

const LlmStepSchema = z.object({
  text: z.string().min(1).max(500),
  timestamp_sec: z.number().int().nonnegative().nullable(),
  timer_sec: z.number().int().nonnegative().nullable(),
});

const LlmResponseSchema = z.object({
  ingredients: z.array(LlmIngredientSchema).max(30),
  steps: z.array(LlmStepSchema).max(50),
});
```

### 6.4 Zod検証失敗時

- LLM呼び出し結果がZod検証失敗 → `extraction_status = "no_recipe_found"` として空配列で継続。
- LLM API障害 → `extraction_status = "no_source"` として継続（import自体は成功）。

---

## 7. extraction_status 決定ロジック

```
if ingredients.length >= 2 AND steps.length >= 2:
  extraction_status = "success"

else if ingredients.length >= 1 OR steps.length >= 1:
  extraction_status = "partial"

else if mode == "none":
  extraction_status = "no_source"

else:
  extraction_status = "no_recipe_found"
```

---

## 8. extraction_confidence 計算

```
ingredientScore = 平均(ingredient.confidence)  // LLM由来は固定0.75、ルール補助由来は行スコア
stepScore       = 平均(step.confidence)
coverageScore   = min(1, (ingredientsCount>=3 ? 0.5 : ingredientsCount/6)
                       + (stepsCount>=3 ? 0.5 : stepsCount/6))
sourceBonus     = transcript使用時 +0.05（ソース多様性ボーナス）

extraction_confidence = min(1,
  0.4*ingredientScore + 0.4*stepScore + 0.2*coverageScore + sourceBonus
)
```

---

## 9. 永続化方針

### 9.1 recipesテーブル（変更あり）

| カラム | 型 | 変更 | 内容 |
|---|---|---|---|
| `extraction_confidence` | float | 既存 | 集計スコア |
| `extraction_notes` | text | 既存 | `mode=...; ingredients=n; steps=n` |
| `extraction_status` | text | **新規追加** | `success/partial/no_recipe_found/no_source` |
| `source_text` | text | **新規追加** | 永続化した字幕テキスト（nullable） |

### 9.2 recipe_ingredientsテーブル（変更なし）

`position, name, quantity_text, group_label, is_optional` を保存。

### 9.3 recipe_stepsテーブル（変更なし）

`position, text, timestamp_sec, timer_sec, is_ai_inferred` を保存。

---

## 10. 失敗・エラーポリシー

| ケース | 動作 |
|---|---|
| descriptionが空 かつ 字幕なし | `extraction_status=no_source` でimport成功、材料/手順は空 |
| descriptionはあるがレシピ情報なし かつ 字幕なし | `extraction_status=no_recipe_found` でimport成功 |
| LLM API障害 | `extraction_status=no_source` でimport成功 |
| Zod検証失敗 | `extraction_status=no_recipe_found` でimport成功 |
| DB障害 | 既存の `upstream_unavailable` を返却 |

---

## 11. テスト設計

### 11.1 Unit
- description評価関数: レシピあり/なし/境界値
- 前処理: NFKC・ノイズ除去・URL除去
- タイムスタンプ・タイマー抽出
- extraction_status 決定ロジック
- extraction_confidence 計算式

### 11.2 Integration（import route）
- [description有 + transcript有] → `success`
- [description無 + transcript有] → `success` or `partial`
- [description有 + transcript無] → `success` or `partial`
- [description無 + transcript無] → `no_source`
- LLM Zod検証失敗 → `no_recipe_found`
- transcript取得失敗（ライブラリエラー）→ descriptionのみで継続

### 11.3 E2E
- URL投入 → RecipeDetail で材料・手順が表示される
- descriptionなし動画 → `no_source` 状態がUIに表示される

---

## 12. 実装順序

1. `recipes` テーブルに `extraction_status`, `source_text` カラム追加（マイグレーション）
2. 字幕取得クライアント実装（`lib/youtube/fetchYouTubeTranscript.ts`）
3. source評価関数実装（`lib/extraction/evaluateSource.ts`）
4. LLM構造化プロンプト・Zodスキーマ実装（`lib/extraction/llmStructure.ts`）
5. extraction_status 決定・confidence計算実装
6. import route を新パイプラインに置換
7. ユニットテスト追加
8. integration テスト追加

---

## 13. 既知リスクと対策

| リスク | 対策 |
|---|---|
| timedtext取得がレート制限・ブロックされる | エラー時は字幕なしとして継続、extraction_statusで区別 |
| 字幕が料理と無関係なテキスト（雑談動画等） | LLMプロンプトで「レシピ情報のみ抽出」を明示、空配列を正常として扱う |
| LLMによる創作（存在しない材料の追加） | プロンプトで創作禁止を明示 + Zodで形式検証 + confidence低下 |
| transcript文字数が多くトークン超過 | 15,000文字でカット、超過時は先頭優先 |
| timedtext利用のToSリスク | テキストのみ取得・音声バイナリ非取得を徹底、セキュリティルールに明記 |
