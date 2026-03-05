# YouTubeRecipeApp

YouTube URL からレシピカードと推定栄養を生成するアプリの開発リポジトリです。

## Repository structure

- `apps/web`: Next.js (TypeScript, App Router) アプリ本体
- `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack`: 仕様・設計ドキュメント
- `.github/copilot-instructions.md`: AI実装ルール
- `.github/skills`: Agent Skills

## Quick start

```bash
cd apps/web
npm install
cp .env.example .env.local
npm run dev
```

## Core documents

- PRD: `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/04_PRD_MVP_v3.md`
- Architecture: `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/06_Tech_Architecture_v3.md`
- OpenAPI: `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/08_OpenAPI_v3.yaml`
- Auth/RLS supplement: `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/19_Auth_Authorization_RLS_v1.md`
- Error contract supplement: `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/20_API_Error_Contract_v1.md`
