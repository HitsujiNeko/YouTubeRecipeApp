# 01 Product and PRD Handbook v3

作成日: 2026-03-08
目的: Product戦略からMVP要件までを1冊に統合し、AI実装時の参照往復を減らす。

## 1. Product Overview
- 入力: YouTube URL
- 出力: レシピカード + 推定栄養

## 2. Core Decisions
- ちょい編集（B）を採用
- 栄養可視化を差別化軸にする
- 規約制約（ダウンロード禁止、字幕前提禁止）を順守

## 3. Market and Positioning
- URL->カードは競合が増加
- 栄養 + 日本語抽出精度 + SNS共有で差別化

## 4. Persona and JTBD
- 最重要ペルソナ: 健康志向ライト層
- JTBD: 健康面も見ながら迷わず作りたい

## 5. Problem-Solution Priority
- C1-C4の痛みを S1-S4 で解決
- P0/P1/P2 の優先順を定義

## 6. PRD (MVP)
- Goal / Non-goal
- F1-F6 機能要件
- DoD

## 7. Reference Contracts
- UX: `05_UX_Spec_v3.md`
- DB: `07_DB_Schema_v3.sql`
- API: `08_OpenAPI_v3.yaml`

## 8. Migration Notes
統合元:
- `00_Project_Overview_v3.md`
- `01_Market_Research_v3.md`
- `02_Personas_JTBD_v3.md`
- `03_Problem_Solution_Priority_v3.md`
- `04_PRD_MVP_v3.md`

上記文書は移行案内のみを1リリース保持し、次リリースで削除する。
