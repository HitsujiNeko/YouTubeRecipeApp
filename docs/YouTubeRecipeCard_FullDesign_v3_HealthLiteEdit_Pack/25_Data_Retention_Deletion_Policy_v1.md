# 25 データ保持・削除方針 v1

作成日: 2026-03-05

## 25.1 目的
- 保持データを最小化し、削除要求や法務リスクに対応する。

## 25.2 データ分類
- ユーザーデータ: recipes, ingredients, steps, nutrition cache
- 外部メタデータ: YouTube動画メタ（title, channel, thumbnail）
- 機密データ: edit token hash, API keys
- 運用ログ: request logs, error logs, audit logs

## 25.3 保持期間（TTL）
- `video_sources.title/channel/thumbnail`: 30日ごとに再取得
- description全文: 原則保存しない（保存する場合は7日以内に削除）
- `extraction_runs`: 90日
- APIアクセスログ: 30日
- セキュリティ/監査ログ: 180日
- 削除済みユーザーの個人識別子: 30日以内に完全削除

## 25.4 削除要求対応
1. 削除要求受付（ユーザーまたは問い合わせ窓口）。
2. 対象レコード特定（owner_user_id, recipe_id）。
3. `recipes` を起点にcascade削除。
4. 関連キャッシュ・ログ内識別子を削除/匿名化。
5. 実行記録を監査ログに保存。

## 25.5 匿名edit token方針
- 平文は返却時のみ表示、DB保存はhashのみ。
- 再表示不可（紛失時は再発行）。
- rotate時は旧tokenを無効化。

## 25.6 バックアップ方針
- DB自動バックアップ: 日次
- リストア訓練: 月1回
- バックアップ保存期間: 30日

## 25.7 実装上の禁止事項
- service role keyのクライアント保存
- YouTube動画/音声ファイルの保存
- 明示同意なしの機微情報蓄積
