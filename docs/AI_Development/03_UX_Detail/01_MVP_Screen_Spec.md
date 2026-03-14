# 01 MVP Screen Spec

## Home
### 目的
- URL入力からimport開始する。
### UI要素
- URL入力欄
- 生成ボタン
- 最近のレシピ一覧
### 状態
- `idle`: 初期表示
- `validating`: URL形式チェック中
- `importing`: import API呼び出し中
- `success`: import成功で遷移直前
- `error`: 入力/通信/APIエラー
### バリデーション
- YouTube URL形式のみ許可

### 状態遷移
`idle -> validating -> importing -> success -> RecipeDetail`
`idle -> validating -> error`
`importing -> error`

### API連携
- `POST /api/recipes/import`
	- request: `{ url, language, options }`
	- success: `recipe_id` を受け取り `"/recipes/[id]"` へ遷移
	- error: `ErrorResponse` を表示

### エラーUI
- `bad_request`: 「YouTube URL形式を確認してください」
- `too_many_requests`: 「混み合っています。少し待って再試行してください」
- `upstream_unavailable`: 「外部サービス応答待ちです。再試行してください」
- `internal_error`: 「予期しないエラーが発生しました」

### 受け入れ基準
- 不正URL時はAPI送信前にエラー表示される
- import成功時にRecipeDetailへ遷移する
- retryable=true の場合のみ再試行ボタンを表示する

## RecipeDetail
### 目的
- 材料/手順/栄養を確認し、修正導線へ進む。
### UI要素
- タイトル、元動画リンク
- 栄養カード（kcal/PFC/salt/confidence/coverage）
- 未確定材料ボタン
- 材料リスト、手順リスト
### 状態
- `loading`: レシピ取得中
- `ready`: レシピ/栄養表示可能
- `nutrition_recomputing`: 栄養再計算中
- `error`: 取得失敗
- `forbidden_or_private`: 認可不足

### 状態遷移
`loading -> ready`
`loading -> forbidden_or_private`
`loading -> error`
`ready -> nutrition_recomputing -> ready`

### API連携
- `GET /api/recipes/{id}`: 初期データ取得
- `POST /api/recipes/{id}/nutrition`: 手動再計算
- `POST /api/recipes/{id}/share`: 共有slug作成/rotate

### エラーUI
- `401`: 「このレシピは編集トークンまたはログインが必要です」
- `403`: 「このレシピへのアクセス権限がありません」
- `404`: 「レシピが見つかりません」
- `409` (share): 「共有URL作成に競合が発生しました。再試行してください」
- `503`: 栄養カード内に best-effort 表示 + 再計算ボタン

### extraction_status 表示仕様
抽出パイプラインの結果を `extraction_status` フィールドで受け取り、以下のとおり表示する。

| status | 表示UI |
|---|---|
| `success` | 通常表示（バナーなし） |
| `partial` | インフォバナー「レシピ情報が不完全です。材料または手順を手動で補完してください」 |
| `no_recipe_found` | インフォバナー「説明欄にレシピ情報が見つかりませんでした。手動で追加できます」 |
| `no_source` | 警告バナー「動画の情報を取得できませんでした。手動でレシピを入力してください」 |

- `partial` / `no_recipe_found` / `no_source` のいずれかの場合は NutritionFix 導線を非表示とする（確定データがないため栄養推定は意味をなさない）。
- 将来的に「動画を見ながら手動追加」モード（P1: Q-018）に誘導するバナーへ発展させる。

### 受け入れ基準
- confidence/coverage/unresolved数が常時表示される
- unresolvedありの場合 `NutritionFix` 導線が表示される
- share失敗時にエラー理由と再試行導線を表示する
- `extraction_status` に応じたバナーが表示される
- `partial`/`no_recipe_found`/`no_source` 時は NutritionFix 導線を非表示にする

## NutritionFix
### 目的
- 未確定材料のみ最小入力で修正。
### UI要素
- 材料名
- 候補3件
- g入力
- 保存して次へ
### 状態
- `loading_candidates`: 候補取得中
- `editing`: 候補選択/数量入力
- `saving`: 1件保存中
- `next`: 次材料へ遷移
- `done`: 全材料完了
- `error`: 候補取得/保存失敗

### 状態遷移
`loading_candidates -> editing -> saving -> next -> editing`
`saving -> done`
`loading_candidates|saving -> error -> editing`

### API連携
- `GET /api/foods/search?q=`: 候補取得
- `PATCH /api/ingredients/{ingredient_id}/match`: 候補とg保存
- 完了時 `POST /api/recipes/{id}/nutrition` を呼び再計算

### エラーUI
- 候補取得失敗: 「候補取得に失敗しました。検索して手動選択してください」
- 保存失敗: 「保存に失敗しました。入力を確認して再試行してください」
- 再計算失敗: 「更新は保存されましたが再計算に失敗しました」

### 入力制約
- gramsは `> 0` の数値
- 上限は `5000g`（異常入力防止）
- 未入力時は保存不可

### 受け入れ基準
- 1件ずつ保存して前進できる
- 全件完了後にRecipeDetailへ戻り、栄養値が更新される
- 保存済みデータはページ再読み込み後も保持される

## CookMode
### 目的
- 調理中操作を最短化する。
### UI要素
- 1ステップ表示
- 次/戻る
- タイマー
- 材料チェック

### 状態
- `loading`: データ取得中
- `ready`: 調理可能
- `timer_running`: タイマー動作中
- `paused`: 中断状態
- `completed`: 最終ステップ完了

### 状態遷移
`loading -> ready`
`ready -> timer_running -> paused -> timer_running`
`ready|timer_running -> completed`

### API連携
- `GET /api/recipes/{id}`: 初期表示データ取得
- MVPは進捗保存APIなし（ローカル保存）
	- `localStorage` keys:
		- `cook_step_index:{recipeId}`
		- `cook_checked_ingredients:{recipeId}`

### エラーUI
- レシピ取得失敗: 「クックモードを開始できません。再読み込みしてください」
- 動画埋め込み失敗: 「動画を読み込めません。YouTubeで開く」導線を表示

### 中断復帰
- 再訪時に前回 step index と材料チェック状態を復元する
- 復帰通知: 「前回の続きから再開しました」

### 受け入れ基準
- 片手操作で次/戻るが可能
- タイマーがステップに紐づく
- 再訪時に進捗が復元される

## SharePage
### 目的
- 元動画導線付きでカードを共有。
### UI要素
- 元動画埋め込み
- クレジット
- レシピカード
- 栄養サマリー

### 受け入れ基準
- 元動画への導線とクレジットが表示される
- 栄養推定免責が表示される

## Terms
### 目的
- 利用規約と免責事項を明示し、ユーザーが参照できる状態にする。

### UI要素
- 見出し（利用規約）
- YouTube利用に関する注意
- 栄養推定・医療非該当の免責
- Homeへ戻る導線

### 受け入れ基準
- `/terms` が直接アクセス可能
- YouTube利用方針と栄養推定免責が明示される

## Privacy
### 目的
- 取得情報と利用目的を明示し、プライバシーポリシーを参照できる状態にする。

### UI要素
- 見出し（プライバシーポリシー）
- 取得する情報
- 利用目的
- 第三者提供方針
- Homeへ戻る導線

### 受け入れ基準
- `/privacy` が直接アクセス可能
- 取得情報・利用目的・第三者提供方針が明示される

## 共通フッター（全画面）
### 目的
- Terms/Privacy導線と最低限の免責文言を全画面で一貫表示する。

### UI要素
- `利用規約` / `プライバシーポリシー` リンク
- YouTube利用に関する注意文
- 栄養推定・医療非該当の注意文

### 受け入れ基準
- Home / RecipeDetail / SharePage を含む全画面で表示される
- Terms/Privacyリンクが動作する
