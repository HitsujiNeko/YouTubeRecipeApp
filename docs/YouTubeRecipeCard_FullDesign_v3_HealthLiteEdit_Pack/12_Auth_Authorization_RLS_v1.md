# 12 Auth / Authorization / RLS Spec v1

作成日: 2026-03-05

## 12.1 目的
- 更新系APIの認可を明確化し、`owner_user_id null`（匿名作成）でも安全に運用する。
- Supabase RLSとAPI責務を分離し、実装の曖昧さをなくす。

## 12.2 認可モデル（MVP）
- Read:
  - 非共有レシピ: ownerのみ（JWTまたは匿名edit token）
  - 共有レシピ: public_slug経由で公開閲覧可
- Write:
  - JWTログイン時: `owner_user_id == auth.uid()` のみ更新可
  - 匿名時: `X-Recipe-Edit-Token` のハッシュ照合に通過した場合のみ更新可

## 12.3 データモデル
- `recipes.owner_user_id`: ログイン所有者
- `recipes.anon_edit_token_hash`: 匿名所有者編集用トークンハッシュ
- `recipes.public_slug`: 共有時のみ設定（nullable）
- `recipes.share_enabled_at`, `recipes.share_slug_rotated_at`: 監査・運用用

## 12.4 API責務
- Route Handlerで次を判定する:
  1) JWT owner
  2) 匿名 edit token owner
  3) 公開閲覧
- 判定後にDBアクセス。
- service roleキー利用時も、認可判定は必須。

## 12.5 RLS方針
- 直接クライアント書き込みは owner row のみ許可。
- 公開共有（`public_slug is not null`）のみ anon select 可。
- 匿名 edit token はDBポリシーではなくAPIレイヤーで検証。

## 12.6 運用ルール
- edit token は平文保存しない（hashのみ保存）。
- rotate時は旧slugを即無効化。
- 監査ログ: recipe_id, actor_type(user|anonymous), action, request_id。


