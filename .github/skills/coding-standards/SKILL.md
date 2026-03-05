---
name: coding-standards
description: "コーディング規約適用時に使用 / Use when generating or refactoring for strict TypeScript, readability, security"
---

# Coding Standards Skill（実装規約）

## ルール
- TypeScript strict modeを前提とし、`any` を避ける。
- ファイルの責務を小さく保つ。
- 抽出/栄養の中核ロジックは純関数を優先する。
- コメントは非自明な箇所に限定する。

## セキュリティ基準
- ユーザー入力を信頼せず、検証・サニタイズを行う。
- secretやservice role keyを漏えいさせない。
- URLは安全に扱い、危険なHTML描画を避ける。
