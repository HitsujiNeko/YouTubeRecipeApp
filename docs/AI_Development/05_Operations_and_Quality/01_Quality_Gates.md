# 01 Quality Gates

## 必須
- lint: pass
- typecheck: pass
- format:check: pass

## 条件付き
- API変更: integration test必須
- UX変更: E2E 1本以上更新

## 非機能
- 新規外部API導入時: timeout/retry定義必須
- 新規保存データ追加時: retention方針定義必須
