# 01 Quality Gates

## 必須
- lint: pass
- typecheck: pass
- format:check: pass


## PR前目視確認ゲート（必須）
- 実装変更を含むPRでは、`apps/web` で `npm run verify:prepr` を実行すること。
- `verify:prepr` 実行後に生成される `test-results/manual-qa/manual-qa-*.md` を使って目視確認を実施すること。
- PR本文には、目視確認の結果（正常系/異常系）とスクリーンショットを記載すること。
- 目視確認を未実施でPRを作成する場合は、理由とフォローアップ日程を明記すること。

## docs-only変更
- `docs/` 配下のみ変更時は lint/typecheck/test を任意とする。
- ただし Queue/Delivery/Sync Matrix の整合確認は必須。
- docs参照整合チェック（リンク先実在確認）は必須。

## docs整合チェック（必須）
- Markdown内の `docs/AI_Development/01_Execution_Hub.md` のような参照先が実在すること。
- 削除済み文書への参照が残っていないこと。

## 条件付き
- API変更: integration test必須
- UX変更: E2E 1本以上更新

## 非機能
- 新規外部API導入時: timeout/retry定義必須
- 新規保存データ追加時: retention方針定義必須
