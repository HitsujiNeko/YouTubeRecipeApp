---
name: architecture
description: "アーキテクチャ変更時に使用 / Use when designing architecture, module boundaries, data flow, API/DB contracts"
---

# Architecture Skill（設計）

## フォーカス
- App Router構成、Route Handler、ドメインモジュールの境界設計。
- DB SchemaとOpenAPIの整合性維持。
- 依存境界（`lib/youtube`, `lib/extractors`, `lib/nutrition`, `lib/llm`）。

## チェックリスト
1. `01_Product_and_PRD_Handbook_v3.md` の対象範囲を確認する。
2. 影響を受けるAPIとDBテーブルを特定する。
3. OpenAPIとSQLを同時に更新する。
4. マイグレーション影響とロールアウト手順を記録する。

