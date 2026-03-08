# 01 Quality Gates

## 必須
- lint: pass
- typecheck: pass
- format:check: pass

## docs-only変更
- `docs/**` のみ変更時は lint/typecheck/test を任意とする。
- ただし Queue/Delivery/Sync Matrix の整合確認は必須。
- docs参照整合チェック（リンク先実在確認）は必須。

## docs整合チェック（必須）
- Markdown内の `docs/...` 参照先が実在すること。
- 削除済み文書への参照が残っていないこと。

## 条件付き
- API変更: integration test必須
- UX変更: E2E 1本以上更新

## 非機能
- 新規外部API導入時: timeout/retry定義必須
- 新規保存データ追加時: retention方針定義必須
