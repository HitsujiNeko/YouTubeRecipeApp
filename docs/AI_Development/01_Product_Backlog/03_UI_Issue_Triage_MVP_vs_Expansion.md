# 03 UI Issue Triage (MVP vs Expansion)

出典: `docs/ImproveDoc/Issue_UI_Preview_MVP.md`
作成日: 2026-03-05

## 判定基準
- MVP: 主要フロー完走性、理解性、法務/期待値管理に直結
- Expansion: 体験向上だが主要フロー成立に必須ではない

## 仕分け結果

### MVPに含める
1. RecipeDetail -> CookMode 遷移導線を明確化（最優先）
2. CookMode でYouTube埋め込みを表示（優先度高）
3. RecipeDetailにサムネイル表示を追加（理解性向上）
4. confidence/coverage の視覚表現（ラベル + バー）
5. confidence/coverage が低い理由の表示（why低いか）
6. 材料量の曖昧表現への対応（"1枚"は補助でg目安表示）
7. レシピカードコンポーネントの基盤実装（一覧/詳細で再利用）

### Expansionに回す
1. Homeで「おすすめレシピ」導入
2. 最近のレシピ高度化（レコメンドロジック）
3. レシピ一覧の高機能化（食材/カテゴリ/タグ/チャンネル検索）
4. 高度なフィルタ・並び替え

## 補足
- レシピ一覧画面自体はMVPで最小版（保存済み一覧）を検討可。
- 高度フィルタはExpansion扱い。

## 次アクション（Queue反映）
- Q-004/005/007/009 にMVP課題を受け入れ基準として追記する。
- Expansion項目は別キュー（P1/P2）へ移動する。
