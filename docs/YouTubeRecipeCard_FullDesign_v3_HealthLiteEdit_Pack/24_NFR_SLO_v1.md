# 24 NFR / SLO v1

作成日: 2026-03-05

## 24.1 目的
- MVP運用に必要な非機能要件を数値化し、品質の合否判断を可能にする。

## 24.2 SLO（MVP）
- API可用性: 月間 99.5%以上
- p95応答時間:
  - `GET /api/recipes/{id}`: 800ms以内
  - `POST /api/recipes/{id}/nutrition`: 2500ms以内（キャッシュヒット時 800ms以内）
  - `POST /api/recipes/import`: 7000ms以内（外部依存含む）
- 5xx率: 日次 1.0%未満
- 429率: 日次 3.0%未満

## 24.3 タイムアウト設計
- YouTube API: 5秒
- OpenAI API: 12秒
- DBクエリ: 3秒（重い検索は5秒上限）
- API全体: 15秒で打ち切り

## 24.4 リトライ設計
- 対象: 429, 503, network timeout
- 上限: 最大3回
- バックオフ: `500ms -> 1000ms -> 2000ms` + jitter
- 非対象: 400/401/403/404

## 24.5 レート制限（初期案）
- 匿名: 30 req / 10分 / IP
- 認証済み: 120 req / 10分 / user
- import API: 10 req / 10分 / actor
- nutrition再計算: 20 req / 10分 / actor

## 24.6 キャパシティ前提（MVP）
- 同時アクティブユーザー: 100
- 日次import試行: 2,000
- 日次nutrition再計算: 5,000

## 24.7 監視指標
- `api_latency_ms`（route別 p50/p95/p99）
- `api_error_total`（code別）
- `external_api_failure_total`（provider別）
- `rate_limited_total`

## 24.8 SLO違反時アクション
1. 429急増時: 一時的にレート制限を強化し、UIに再試行導線を表示。
2. 503急増時: 外部APIサーキットブレーカーを有効化。
3. p95悪化時: キャッシュを優先し重い処理を遅延実行へ切替。
