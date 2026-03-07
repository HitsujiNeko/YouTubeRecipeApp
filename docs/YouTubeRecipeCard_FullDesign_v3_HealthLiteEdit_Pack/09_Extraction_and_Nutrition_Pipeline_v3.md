# 09 抽出 + 栄養推定パイプライン v3（ちょい編集B）

## 9.1 パイプライン全体
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

## 9.2 ノイズ除去（重要）
- descriptionから以下を除外:
  - URL行（http/https）
  - PR/スポンサー文言（例: 提供、案件、Amazonリンク等）
  - 道具・機材の紹介（包丁/フライパン/まな板 等）
- 例: 「フライパン」→材料に入れない（誤抽出の典型）

## 9.3 栄養推定の信頼設計（UIと直結）
- coverage: g換算できた材料数 / 材料数
- mapping_confidence: match_score平均
- confidence: 0.6*mapping_confidence + 0.4*coverage（初期案）
- 未確定（unresolved）:
  - マッチ候補が僅差
  - quantity_textが曖昧（適量/少々/1個など）
  - 油（吸油率で誤差が極大）

## 9.4 “ちょい編集”の最小導線
- unresolved材料だけを列挙
- 各材料について:
  - food候補上位3を提示
  - 量（g）を入力
- 入力が難しい材料（例: 1個/1枚）は「推定テンプレ」を用意（P1）

## 9.5 抽出ロジック詳細設計（AI開発運用）
- 実装に先立つ詳細仕様は `docs/AI_Development/04_Implementation_Standards/04_Extraction_Logic_Design.md` を正とする。
- 方針:
  - rule-based抽出を第一経路にする
  - 低品質ケースのみLLMフォールバック
  - 出力は必ずZodで検証してから永続化する
