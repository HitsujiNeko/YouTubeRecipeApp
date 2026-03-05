# BulkCart デザインシステム

**Version**: 1.0  
**Last Updated**: 2026年2月21日

> 筋トレ民向け献立・買い物自動化アプリのためのデザインガイドライン

---

## 🎯 ブランド定義

### ターゲットユーザー
- **メインターゲット**: 筋トレ民（増量/減量中の20-40代）
- **ペルソナ**:
  - 増量中の学生（コスパ重視、時短重視）
  - 減量中の社会人（栄養管理重視、継続性重視）
  - 中級者トレーニー（効率化重視、科学的根拠重視）

### ブランドトーン
- **力強い**: 筋肉、エネルギー、行動力を感じさせる
- **シンプル**: 無駄を削ぎ落とした実用的なデザイン
- **実用的**: 効率化・自動化による価値提供
- **信頼できる**: 科学的根拠に基づいた栄養管理

### ブランドキーワード
- 効率化（自動献立生成、週次バッチ調理）
- 自動化（買い物リスト、作り置き段取り）
- 科学的根拠（PFC計算、増量/減量最適化）
- コストゼロ（無料プラン）

---

## 🎨 カラーパレット

### Primary Color（メインカラー）
**オレンジ** - 力強さ、エネルギー、行動力を象徴

```css
/* Light Mode */
--primary: hsl(25, 95%, 53%); /* #FF7A1A 鮮やかなオレンジ */
--primary-foreground: hsl(0, 0%, 100%); /* 白文字 */

/* Dark Mode */
--primary: hsl(25, 90%, 58%); /* 目に優しい明るめオレンジ */
--primary-foreground: hsl(20, 10%, 10%); /* ダーク背景 */
```

**使用例**:
- メインCTAボタン（「献立生成」「次へ」「完了」）
- ロゴアクセント
- 重要な数値表示（たんぱく質量など）
- アクティブ状態のナビゲーション

### Accent Color（強調色）
**赤** - 情熱、エネルギー、緊急性を象徴

```css
/* Light Mode */
--accent: hsl(0, 84%, 60%); /* #E63946 鮮やかな赤 */
--accent-foreground: hsl(0, 0%, 100%); /* 白文字 */

/* Dark Mode */
--accent: hsl(0, 70%, 55%); /* 落ち着いた赤 */
--accent-foreground: hsl(0, 0%, 100%); /* 白文字 */
```

**使用例**:
- 増量目標の表示（バルクアップ）
- 重要な通知バッジ
- プログレスバー（目標達成時）
- 削除ボタン（Destructive Action）

### Secondary Color（サブカラー）
**薄いオレンジ** - 背景、カード、補助要素

```css
/* Light Mode */
--secondary: hsl(25, 100%, 95%); /* 淡いオレンジ */
--secondary-foreground: hsl(25, 70%, 30%); /* 濃いオレンジ文字 */

/* Dark Mode */
--secondary: hsl(25, 20%, 20%); /* ダークトーンのオレンジ */
--secondary-foreground: hsl(25, 80%, 70%); /* 明るいオレンジ文字 */
```

**使用例**:
- セカンダリボタン（「スキップ」「戻る」）
- カード背景（ハイライト用）
- タグ背景（「増量向け」「減量向け」）

### Neutral Colors（グレースケール）
**読みやすさ重視の暖色寄りグレー**

```css
/* Background */
--background: hsl(0, 0%, 100%); /* 純白 */
--foreground: hsl(20, 14%, 20%); /* ダークブラウン（読みやすい） */

/* Muted */
--muted: hsl(20, 10%, 95%); /* 暖色寄りグレー */
--muted-foreground: hsl(20, 5%, 50%); /* ミディアムグレー */

/* Border */
--border: hsl(20, 10%, 88%); /* 薄いグレーボーダー */
```

**使用例**:
- テキスト（foreground）
- 非アクティブ要素（muted）
- ボーダー、区切り線（border）

---

## 🔤 タイポグラフィ

### フォントファミリー

```css
/* 見出し: 太め・読みやすい */
font-family: 'Inter', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif;

/* 本文: 視認性重視 */
font-family: 'Inter', 'Noto Sans JP', system-ui, sans-serif;
```

**推奨CDN**:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+JP:wght@400;700&display=swap" rel="stylesheet">
```

### フォントウェイト

| 用途 | Weight | 使用例 |
|------|--------|--------|
| 見出し（H1-H2） | 700 (Bold) | `font-bold` |
| 見出し（H3-H6） | 600 (Semi-Bold) | `font-semibold` |
| 本文 | 400 (Regular) | `font-normal` |
| 強調 | 600 (Semi-Bold) | `font-semibold` |

### フォントサイズ（Tailwind）

| 要素 | Class | サイズ | 行間 |
|------|-------|--------|------|
| H1 | `text-4xl` | 2.25rem (36px) | 2.5rem |
| H2 | `text-3xl` | 1.875rem (30px) | 2.25rem |
| H3 | `text-2xl` | 1.5rem (24px) | 2rem |
| H4 | `text-xl` | 1.25rem (20px) | 1.75rem |
| 本文 | `text-base` | 1rem (16px) | 1.5rem |
| 小 | `text-sm` | 0.875rem (14px) | 1.25rem |
| キャプション | `text-xs` | 0.75rem (12px) | 1rem |

### 行間

```css
/* 本文 */
line-height: 1.5; /* leading-normal */

/* 見出し */
line-height: 1.25; /* leading-tight */
```

---

## 🧱 コンポーネントスタイル

### ボタン

#### Primary Button（メインCTA）
```tsx
<Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg px-8 py-3 h-auto">
  献立生成
</Button>
```

**特徴**:
- はっきりとした色（オレンジ）
- 大きめサイズ（タップしやすい）
- 太めフォント（`font-semibold`）
- hover 時に少し暗く（`hover:bg-primary/90`）

#### Secondary Button（サブアクション）
```tsx
<Button variant="secondary" className="font-medium">
  スキップ
</Button>
```

#### Outline Button（非推奨アクション）
```tsx
<Button variant="outline" className="border-2">
  戻る
</Button>
```

### カード

#### 標準カード
```tsx
<Card className="shadow-md hover:shadow-lg transition-shadow">
  <CardHeader>
    <CardTitle className="text-2xl font-bold text-foreground">週次献立</CardTitle>
    <CardDescription className="text-muted-foreground">7日×2食を自動生成</CardDescription>
  </CardHeader>
  <CardContent>
    {/* コンテンツ */}
  </CardContent>
</Card>
```

**特徴**:
- 適度な影（`shadow-md`）
- hover 時に影が強くなる（`hover:shadow-lg`）
- 角丸は統一（`--radius: 0.5rem`）

#### アクセントカード（重要情報）
```tsx
<Card className="border-2 border-primary bg-secondary/30">
  <CardContent className="pt-6">
    <p className="text-center text-primary font-bold text-xl">目標達成まであと3日！</p>
  </CardContent>
</Card>
```

### フォーム

#### Input（入力欄）
```tsx
<Input 
  className="h-12 text-base border-2 focus:border-primary focus:ring-primary" 
  placeholder="体重 (kg)"
/>
```

**特徴**:
- 大きめ高さ（`h-12` = 48px）
- フォーカス時にオレンジ（`focus:border-primary`）

#### Label（ラベル）
```tsx
<Label className="text-base font-semibold text-foreground mb-2">
  体重
</Label>
```

### アイコン

**推奨アイコンライブラリ**:
- **lucide-react**（既に使用可能）
- サイズ: `size={24}` or `size={20}` （タップしやすい）

```tsx
import { Dumbbell, ShoppingCart, Calendar } from 'lucide-react';

<Dumbbell size={24} className="text-primary" />
```

---

## 📱 レスポンシブデザイン

### Breakpoints（Tailwind デフォルト）

| Breakpoint | 幅 | 用途 |
|------------|-----|------|
| `sm:` | 640px+ | 小型タブレット |
| `md:` | 768px+ | タブレット |
| `lg:` | 1024px+ | デスクトップ |
| `xl:` | 1280px+ | 大型デスクトップ |

### モバイルファースト原則

```tsx
// ❌ 悪い例
<div className="w-1/2 sm:w-full">

// ✅ 良い例（モバイルから設計）
<div className="w-full md:w-1/2 lg:w-1/3">
```

### タップターゲットサイズ（最小44x44px）

```tsx
// ボタン
<Button className="h-12 px-6"> // 48px高さ（タップしやすい）

// ナビゲーションアイコン
<button className="p-3"> // 24px icon + 12px padding = 48x48px
```

---

## 🎭 アニメーション

### トランジション（Tailwind）

```tsx
// hover時の色変化（200ms）
<Button className="transition-colors duration-200 hover:bg-primary/90">

// shadow変化（300ms）
<Card className="transition-shadow duration-300 hover:shadow-lg">

// transform（scale）
<div className="transition-transform hover:scale-105">
```

### ローディング状態

```tsx
// Spinner（lucide-react）
import { Loader2 } from 'lucide-react';

<Button disabled>
  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
  生成中...
</Button>
```

---

## ✅ 使用例

### オンボーディング画面のボタン
```tsx
// メインCTA
<Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg py-3 h-auto">
  次へ
</Button>

// セカンダリ
<Button variant="outline" className="w-full border-2">
  戻る
</Button>
```

### 献立カード
```tsx
<Card className="shadow-md hover:shadow-lg transition-shadow">
  <CardHeader className="bg-secondary/30">
    <CardTitle className="flex items-center gap-2">
      <Dumbbell size={20} className="text-primary" />
      <span className="font-bold text-xl">鶏むね肉のグリル</span>
    </CardTitle>
  </CardHeader>
  <CardContent className="pt-4">
    <div className="flex gap-4 text-sm text-muted-foreground">
      <span>P: <strong className="text-primary">40g</strong></span>
      <span>F: <strong>10g</strong></span>
      <span>C: <strong>5g</strong></span>
    </div>
  </CardContent>
</Card>
```

### 目標表示バッジ
```tsx
<div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full">
  <span className="text-secondary-foreground font-semibold">増量</span>
  <span className="text-accent font-bold">+500kcal</span>
</div>
```

---

## 🚫 避けるべきパターン

### ❌ 悪い例

```tsx
// 1. 小さすぎるボタン（タップしづらい）
<Button className="h-8 px-2 text-xs">OK</Button>

// 2. コントラスト不足
<p className="text-gray-400">重要な情報</p> // 読みづらい

// 3. カラーの乱用
<div className="bg-yellow-300 text-purple-600 border-green-500">
  // 統一感がない
</div>

// 4. 不必要なアニメーション
<div className="animate-bounce animate-spin animate-pulse">
  // 目が疲れる
</div>
```

### ✅ 良い例

```tsx
// 1. 適切なサイズ
<Button className="h-12 px-6 text-base">完了</Button>

// 2. 高コントラスト
<p className="text-foreground font-semibold">重要な情報</p>

// 3. 統一された配色
<div className="bg-secondary text-secondary-foreground border-border">
  // デザインシステムに準拠
</div>

// 4. 控えめなアニメーション
<Card className="transition-shadow hover:shadow-lg">
  // 自然で心地よい
</Card>
```

---

## 📚 参考リンク

- [shadcn/ui コンポーネント](https://ui.shadcn.com/)
- [Tailwind CSS ドキュメント](https://tailwindcss.com/docs)
- [lucide-react アイコン](https://lucide.dev/)
- [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 🔄 更新履歴

| 日付 | バージョン | 変更内容 |
|------|------------|----------|
| 2026-02-21 | 1.0 | 初版作成（オレンジ×赤配色、筋トレ民向けデザイン定義） |

---

**Let's build a powerful and simple UI! 💪🧡**
