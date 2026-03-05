# 02 Design System (YouTube Recipe Card)

## ブランド方針
- 方向性: 実用的・清潔・信頼できる
- トーン: 調理中に迷わない、健康判断しやすい
- 優先: モバイル片手操作、視認性、誤操作防止

## カラー
- Primary: `#E85D04`（行動喚起）
- Secondary: `#F6E7DA`（補助背景）
- Surface: `#FFFFFF`
- Background: `#F7F8FA`
- Text: `#1F2937`
- Success: `#1F9D55`
- Warning: `#C27803`
- Danger: `#C53030`

## タイポグラフィ
- 見出し: `Noto Sans JP` 700
- 本文: `Noto Sans JP` 400
- 数値強調: `Inter` 600
- 基本サイズ: 16px

## スペーシング
- 4 / 8 / 12 / 16 / 24 / 32 を基本グリッドにする。

## 角丸・影
- radius: 12px（カード）、10px（入力）
- shadow: `0 2px 12px rgba(0,0,0,0.06)`

## アクセシビリティ
- 本文コントラスト比 4.5:1 以上
- タップ領域 44px 以上
- loading/error を視覚とテキスト両方で表示

## コンポーネント原則
- 1画面1主CTA
- destructive操作は確認ダイアログ必須
- 推定値（nutrition）は常に注意文言とセット表示
