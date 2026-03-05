---
name: state-management
description: "状態管理設計時に使用 / Use when defining client-server state boundaries, caching, optimistic updates"
---

# State Management Skill（状態管理）

## フォーカス
- DB/APIを唯一の正として扱い、クライアント状態の二重管理を避ける。
- 一時UI状態と永続レシピデータを分離する。
- 栄養再計算と未確定修正の状態遷移を予測可能にする。

## チェックリスト
1. 各フィールドのsource of truthを定義する。
2. loading/error/empty状態を明確化する。
3. 材料マッチ更新後に栄養再計算を行う。
4. 連打や再送時の冪等性を担保する。
