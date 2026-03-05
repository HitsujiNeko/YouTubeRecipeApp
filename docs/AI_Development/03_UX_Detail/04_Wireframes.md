# 04 Wireframes (Text)

## Home
- Header: ロゴ + 保存済みへの導線
- Body:
  - YouTube URL入力
  - [生成する] CTA
  - エラー行（URL不正、API失敗）
  - 最近のレシピカード（最大5件）

## ImportReview
- 動画サムネ + タイトル + チャンネル
- 注意文言（推定・誤差）
- [この動画で生成] CTA
- [URLを修正] secondary

## RecipeDetail
- 上部: タイトル、動画リンク
- 栄養カード:
  - kcal / P / F / C / salt
  - confidenceラベル（高/中/低）
  - coverageパーセント
  - 未確定件数 + [直す]ボタン
- 材料リスト
- 手順リスト
- 下部固定CTA: [CookModeへ]

## NutritionFix
- 1件ずつカード表示
  - 材料名（元行）
  - 候補3つ（radio）
  - g入力（number）
  - [保存して次へ]
- 完了時: [再計算して戻る]

## CookMode
- Step表示（大きい本文）
- [戻る] [次へ]
- タイマー開始/停止
- 材料チェック（折りたたみ）
- ミニ動画埋め込み

## SharePage
- 元動画埋め込み（最上部）
- クレジット表示
- レシピカード
- 栄養サマリー + 注意文言
