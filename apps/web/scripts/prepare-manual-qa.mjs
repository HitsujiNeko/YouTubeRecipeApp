import fs from "node:fs";
import path from "node:path";

const timestamp = new Date().toISOString();
const outputDir = path.join(process.cwd(), "test-results", "manual-qa");
const outputFile = path.join(outputDir, `manual-qa-${timestamp.replace(/[:.]/g, "-")}.md`);

fs.mkdirSync(outputDir, { recursive: true });

const content = [
  "# 手動QAチェックリスト",
  "",
  `- 生成日時: ${timestamp}`,
  "- 確認URL: http://localhost:3000",
  "",
  "## 事前条件",
  "- [ ] 最新のDBマイグレーションが適用済み（local/staging）",
  "- [ ] `.env.local` が設定済み",
  "- [ ] 開発サーバー起動済み（`npm run dev`）",
  "",
  "## 主要フロー",
  "- [ ] Home: 有効なYouTube URLでimport成功",
  "- [ ] Home: 無効なURLでバリデーションエラー表示",
  "- [ ] RecipeDetail: 材料/手順が正しく表示される",
  "- [ ] RecipeDetail: extraction status バナー表示が正しい",
  "- [ ] NutritionFix: 未確定食材の修正フローが動作する",
  "- [ ] Share: 共有URLの作成/再発行が動作する",
  "",
  "## 異常系フロー",
  "- [ ] Upstreamエラー時に再試行可能なメッセージが表示される",
  "- [ ] 認証エラー（401/403）で想定どおりのUIが表示される",
  "",
  "## 証跡（スクリーンショット）",
  "- [ ] Home",
  "- [ ] RecipeDetail",
  "- [ ] Extraction status バナー",
  "- [ ] エラーケース",
  "",
  "## メモ",
  "-",
  "",
].join("\n");

fs.writeFileSync(outputFile, content, "utf8");
console.log(`Manual QA template generated: ${outputFile}`);
