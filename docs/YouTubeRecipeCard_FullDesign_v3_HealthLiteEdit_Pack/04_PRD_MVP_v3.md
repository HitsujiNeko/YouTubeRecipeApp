# 04 PRD v3（MVP要件：ちょい編集B）

## 4.1 ゴール
- URL→カード生成に成功し、CookModeで迷わず作れる
- 推定栄養により「作る前に選べる」
- 未確定材料が少数であれば“ちょい編集”で精度が上がる

## 4.2 非ゴール（MVP）
- 任意動画の字幕/音声を自動取得して完全手順復元（規約/コスト/品質が重い）
- 医療目的の栄養管理（高リスク）
- 完全自動の正確栄養（油吸収や個体差含め厳密化）

## 4.3 機能要件（P0）

### F1 URLインポート
- 入力: YouTube URL（watch/shorts/youtu.be等）
- 出力: video meta（title, channel, thumbnail, duration）

### F2 レシピカード生成
- 出力:
  - title, servings_text(optional)
  - ingredients[]: name, quantity_text(optional), group_label(optional)
  - steps[]: text, timer_sec(optional), timestamp_sec(optional), is_ai_inferred
  - extraction_confidence（0〜1）+ notes

### F3 クックモード
- 材料チェック
- 手順は 1ステップ表示（次/戻る）＋一覧切替
- タイマー（手順に紐付く）
- 埋め込み動画（YouTube）

### F4 栄養推定（MVP範囲）
- 主要項目:
  - kcal / P / F / C / 食塩相当量（salt）
- 出力:
  - レシピ合計
  - 1人前（servings設定がある場合）
  - confidence（0〜1）と coverage（0〜1）
  - unresolved材料リスト

### F5 ちょい編集（栄養精度UP）
- 未確定材料に対し、以下を提供:
  - 食品候補の提示（上位3）→選択
  - g入力（もしくは大さじ/小さじ→g換算）
- 変更後は栄養を再計算

### F6 保存/検索/共有
- 保存（レシピカードをDBへ）
- 検索（タイトル部分一致）
- 共有リンク（public_slug）:
  - 共有ページは必ず元動画リンク + クレジット + 埋め込み表示

## 4.4 受け入れ基準（DoD）
- URL→カード生成が通る（代表動画で成功率>=70%）
- 栄養推定が表示できる（confidence>=0.55の割合>=50%）
- 未確定材料がある場合、UIで修正でき、再計算できる
- CookModeがモバイルで使いやすい（片手操作）
