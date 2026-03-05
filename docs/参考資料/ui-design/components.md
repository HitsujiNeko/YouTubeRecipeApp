# BulkCart UIコンポーネント一覧

**作成日**: 2026年2月18日  
**バージョン**: 1.0  
**UIフレームワーク**: Tailwind CSS + shadcn/ui（オプション）

---

## 目次

1. [コンポーネント分類](#コンポーネント分類)
2. [基礎コンポーネント](#基礎コンポーネント)
3. [フォームコンポーネント](#フォームコンポーネント)
4. [ナビゲーションコンポーネント](#ナビゲーションコンポーネント)
5. [データ表示コンポーネント](#データ表示コンポーネント)
6. [フィードバックコンポーネント](#フィードバックコンポーネント)
7. [レイアウトコンポーネント](#レイアウトコンポーネント)
8. [ドメイン固有コンポーネント](#ドメイン固有コンポーネント)
9. [shadcn/ui推奨コンポーネント](#shadcnui推奨コンポーネント)

---

## コンポーネント分類

### 優先度定義

- **P0**: MVP必須（v1.0）
- **P1**: MVP後すぐ（v1.1-1.2）
- **P2**: 将来的に追加（v2.0以降）

### ファイル構成

```
components/
├── ui/                    # 基礎コンポーネント（shadcn/ui）
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── checkbox.tsx
│   ├── select.tsx
│   ├── badge.tsx
│   ├── modal.tsx
│   └── ...
├── layout/                # レイアウトコンポーネント
│   ├── header.tsx
│   ├── bottom-nav.tsx
│   ├── side-nav.tsx
│   └── container.tsx
├── form/                  # フォームコンポーネント
│   ├── profile-form.tsx
│   ├── onboarding-form.tsx
│   └── ...
├── meal/                  # 献立関連コンポーネント
│   ├── meal-card.tsx
│   ├── meal-calendar.tsx
│   ├── recipe-card.tsx
│   └── ...
├── grocery/               # 買い物関連コンポーネント
│   ├── grocery-list.tsx
│   ├── grocery-item.tsx
│   └── ...
└── prep/                  # 段取り関連コンポーネント
    ├── prep-timeline.tsx
    └── prep-task.tsx
```

---

## 基礎コンポーネント

### Button

**説明**: 汎用ボタン（shadcn/ui使用）  
**優先度**: P0  
**Props**:

```typescript
interface ButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  children: React.ReactNode
}
```

**使用例**:
```tsx
<Button variant="default" size="md" onClick={handleGenerate}>
  献立を生成する
</Button>
```

**使用箇所**: すべての画面

---

### Card

**説明**: コンテンツのグループ化（shadcn/ui使用）  
**優先度**: P0  
**Props**:

```typescript
interface CardProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}
```

**使用例**:
```tsx
<Card title="今週の目標" description="増量 / たんぱく140g">
  <MealCalendar />
</Card>
```

**使用箇所**: 献立表示、レシピ詳細、設定

---

### Badge

**説明**: ステータス・タグ表示（shadcn/ui使用）  
**優先度**: P0  
**Props**:

```typescript
interface BadgeProps {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive'
  children: React.ReactNode
}
```

**使用例**:
```tsx
<Badge variant="success">Pro</Badge>
<Badge variant="secondary">高たんぱく</Badge>
```

**使用箇所**: Header（課金状態）、レシピ（タグ）

---

### Icon

**説明**: アイコン表示（lucide-react使用）  
**優先度**: P0  
**Props**:

```typescript
import { LucideIcon } from 'lucide-react'

interface IconProps {
  icon: LucideIcon
  size?: number
  className?: string
}
```

**使用例**:
```tsx
<Icon icon={ChefHat} size={24} />
```

**使用箇所**: ナビゲーション、ボタン、リスト

---

## フォームコンポーネント

### Input

**説明**: テキスト入力（shadcn/ui使用）  
**優先度**: P0  
**Props**:

```typescript
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number'
  placeholder?: string
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}
```

**使用例**:
```tsx
<Input 
  type="number" 
  placeholder="体重（kg）" 
  value={weight} 
  onChange={setWeight}
  error={errors.weight}
/>
```

**使用箇所**: オンボーディング、設定

---

### Checkbox

**説明**: チェックボックス（shadcn/ui使用）  
**優先度**: P0  
**Props**:

```typescript
interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}
```

**使用例**:
```tsx
<Checkbox 
  checked={allergies.includes('卵')} 
  onChange={(checked) => toggleAllergy('卵', checked)}
  label="卵"
/>
```

**使用箇所**: オンボーディング（アレルギー）、買い物リスト

---

### Select

**説明**: ドロップダウン選択（shadcn/ui使用）  
**優先度**: P0  
**Props**:

```typescript
interface SelectProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
}
```

**使用例**:
```tsx
<Select 
  options={[
    { value: '2-3', label: '2〜3万円' },
    { value: '3-4', label: '3〜4万円' }
  ]}
  value={budget}
  onChange={setBudget}
  placeholder="予算を選択"
/>
```

**使用箇所**: オンボーディング、設定

---

### RadioGroup

**説明**: ラジオボタングループ（shadcn/ui使用）  
**優先度**: P0  
**Props**:

```typescript
interface RadioGroupProps {
  options: { value: string; label: string; description?: string }[]
  value: string
  onChange: (value: string) => void
}
```

**使用例**:
```tsx
<RadioGroup 
  options={[
    { value: 'bulk', label: '💪 増量', description: '筋肉をつけたい' },
    { value: 'cut', label: '🔥 減量', description: '体脂肪を減らしたい' }
  ]}
  value={goal}
  onChange={setGoal}
/>
```

**使用箇所**: オンボーディング（目的選択）

---

### ProgressBar

**説明**: オンボーディング進捗表示  
**優先度**: P0  
**Props**:

```typescript
interface ProgressBarProps {
  currentStep: number
  totalStep: number
  className?: string
}
```

**使用例**:
```tsx
<ProgressBar currentStep={2} totalStep={3} />
```

**使用箇所**: オンボーディング

---

## ナビゲーションコンポーネント

### Header

**説明**: 全画面共通ヘッダー  
**優先度**: P0  
**Props**:

```typescript
interface HeaderProps {
  user: User | null
  subscriptionStatus: 'free' | 'pro'
}
```

**レイアウト**:
```
┌─────────────────────────────────────┐
│ BulkCart        [Pro]  👤          │
└─────────────────────────────────────┘
```

**使用箇所**: すべての画面

---

### BottomNav

**説明**: モバイル用ボトムナビゲーション  
**優先度**: P0  
**Props**:

```typescript
interface BottomNavProps {
  currentPath: string
}
```

**レイアウト**:
```
┌─────────────────────────────────────┐
│  🍱      🛒      📋      ⚙️       │
│ 献立    買い物   段取り   設定      │
└─────────────────────────────────────┘
```

**使用箇所**: 認証後のすべての画面（モバイルのみ）

---

### SideNav

**説明**: デスクトップ用サイドナビゲーション  
**優先度**: P1  
**Props**:

```typescript
interface SideNavProps {
  currentPath: string
  user: User | null
}
```

**使用箇所**: デスクトップ版（md以上）

---

### Breadcrumb

**説明**: パンくずリスト  
**優先度**: P1  
**Props**:

```typescript
interface BreadcrumbProps {
  items: { label: string; href: string }[]
}
```

**使用例**:
```tsx
<Breadcrumb items={[
  { label: 'BulkCart', href: '/' },
  { label: '献立', href: '/plan' },
  { label: '2月第3週', href: '/plan/2024-02-12' }
]} />
```

**使用箇所**: デスクトップ版（md以上）

---

## データ表示コンポーネント

### MealCard

**説明**: 献立カード（1食分）  
**優先度**: P0  
**Props**:

```typescript
interface MealCardProps {
  meal: {
    id: string
    slot: 'lunch' | 'dinner' | 'snack'
    recipe: Recipe
    pfc: { protein: number; fat: number; carb: number }
  }
  onClick?: () => void
}
```

**レイアウト**:
```
┌───────────────────────────────┐
│ 昼: 鶏むね塩麹 + 米  →       │
│ P:38g F:5g C:60g            │
└───────────────────────────────┘
```

**使用箇所**: 週次献立画面

---

### MealCalendar

**説明**: 週次献立カレンダー（デスクトップ）  
**優先度**: P1  
**Props**:

```typescript
interface MealCalendarProps {
  plan: Plan
  onMealClick: (mealId: string) => void
}
```

**使用箇所**: 週次献立画面（デスクトップ版）

---

### RecipeCard

**説明**: レシピカード（リスト表示用）  
**優先度**: P2  
**Props**:

```typescript
interface RecipeCardProps {
  recipe: Recipe
  onClick?: () => void
  showFavorite?: boolean
}
```

**使用箇所**: レシピ一覧（v2.0）

---

### GroceryList

**説明**: 買い物リスト（カテゴリ別）  
**優先度**: P0  
**Props**:

```typescript
interface GroceryListProps {
  items: GroceryItem[]
  checkedItems: Set<string>
  onToggleCheck: (itemId: string) => void
}
```

**使用箇所**: 買い物リスト画面

---

### GroceryItem

**説明**: 買い物リストのアイテム  
**優先度**: P0  
**Props**:

```typescript
interface GroceryItemProps {
  item: {
    id: string
    name: string
    amount: number
    unit: string
  }
  checked: boolean
  onToggle: () => void
}
```

**レイアウト**:
```
☐ 鶏むね 1200g
```

**使用箇所**: GroceryList内

---

### PrepTimeline

**説明**: 作り置き段取りタイムライン  
**優先度**: P0  
**Props**:

```typescript
interface PrepTimelineProps {
  tasks: PrepTask[]
  completedTasks: Set<string>
  onToggleComplete: (taskId: string) => void
}
```

**使用箇所**: 作り置き段取り画面

---

### PrepTask

**説明**: タイムラインの各タスク  
**優先度**: P0  
**Props**:

```typescript
interface PrepTaskProps {
  task: {
    id: string
    time: string // '00:05'
    title: string
    description?: string
  }
  completed: boolean
  onToggle: () => void
}
```

**レイアウト**:
```
┌───────────────────────────────┐
│ ☐ 00:05  鶏むね下処理        │
└───────────────────────────────┘
  一口大に切って、塩麹と酒で
  揉み込む→冷蔵庫へ。
```

**使用箇所**: PrepTimeline内

---

### NutritionBadge

**説明**: 栄養情報バッジ（PFC）  
**優先度**: P0  
**Props**:

```typescript
interface NutritionBadgeProps {
  protein: number
  fat: number
  carb: number
  calories?: number
  size?: 'sm' | 'md' | 'lg'
}
```

**レイアウト**:
```
P:38g F:5g C:60g
```

**使用箇所**: MealCard、RecipeCard、レシピ詳細

---

## フィードバックコンポーネント

### Loading

**説明**: ローディングスピナー  
**優先度**: P0  
**Props**:

```typescript
interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}
```

**使用例**:
```tsx
<Loading size="md" text="献立を生成中..." />
```

**使用箇所**: 献立生成、API通信中

---

### Toast

**説明**: 通知トースト（shadcn/ui使用）  
**優先度**: P0  
**Props**:

```typescript
interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}
```

**使用例**:
```tsx
<Toast type="success" message="献立を生成しました" />
```

**使用箇所**: すべての画面（成功・エラー通知）

---

### Modal

**説明**: モーダルダイアログ（shadcn/ui使用）  
**優先度**: P0  
**Props**:

```typescript
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
}
```

**使用箇所**: 課金促進、確認ダイアログ

---

### ErrorBoundary

**説明**: エラーキャッチ境界  
**優先度**: P0  
**Props**:

```typescript
interface ErrorBoundaryProps {
  fallback: React.ReactNode
  children: React.ReactNode
}
```

**使用箇所**: アプリ全体（root layout）

---

### Alert

**説明**: アラート表示（shadcn/ui使用）  
**優先度**: P0  
**Props**:

```typescript
interface AlertProps {
  type: 'info' | 'warning' | 'error' | 'success'
  title?: string
  message: string
  onClose?: () => void
}
```

**使用箇所**: エラーメッセージ、重要な通知

---

## レイアウトコンポーネント

### Container

**説明**: コンテンツの最大幅制御  
**優先度**: P0  
**Props**:

```typescript
interface ContainerProps {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  children: React.ReactNode
  className?: string
}
```

**使用箇所**: すべてのページ

---

### Grid

**説明**: グリッドレイアウト  
**優先度**: P1  
**Props**:

```typescript
interface GridProps {
  cols?: number // 1-12
  gap?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}
```

**使用例**:
```tsx
<Grid cols={2} gap="md">
  <RecipeCard />
  <RecipeCard />
</Grid>
```

**使用箇所**: レシピ一覧（v2.0）

---

### Stack

**説明**: 縦方向スタックレイアウト  
**優先度**: P0  
**Props**:

```typescript
interface StackProps {
  spacing?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
}
```

**使用例**:
```tsx
<Stack spacing="md">
  <MealCard />
  <MealCard />
</Stack>
```

**使用箇所**: すべての画面

---

### Divider

**説明**: 区切り線  
**優先度**: P0  
**Props**:

```typescript
interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  className?: string
}
```

**使用箇所**: リスト区切り、セクション区切り

---

## ドメイン固有コンポーネント

### OnboardingForm

**説明**: オンボーディングフォーム（3ステップ）  
**優先度**: P0  
**Props**:

```typescript
interface OnboardingFormProps {
  onComplete: (profile: UserProfile) => void
}
```

**使用箇所**: オンボーディング画面

---

### PlanGenerator

**説明**: 献立生成UI  
**優先度**: P0  
**Props**:

```typescript
interface PlanGeneratorProps {
  userProfile: UserProfile
  onGenerate: () => void
  isLoading: boolean
}
```

**使用箇所**: 週次献立画面

---

### GroceryActions

**説明**: 買い物リストのアクションボタン群  
**優先度**: P0  
**Props**:

```typescript
interface GroceryActionsProps {
  items: GroceryItem[]
  onCopy: () => void
  onShareLine: () => void
  onPrint: () => void
}
```

**レイアウト**:
```
┌───────────────────────────────┐
│ 📋 コピー  │ 📱 LINE  │ 🖨️ 印刷 │
└───────────────────────────────┘
```

**使用箇所**: 買い物リスト画面

---

### UpgradePrompt

**説明**: Pro課金促進モーダル  
**優先度**: P0  
**Props**:

```typescript
interface UpgradePromptProps {
  isOpen: boolean
  onClose: () => void
  onUpgrade: () => void
  reason?: string // '無料枠を使い切りました'
}
```

**使用箇所**: Free制限到達時

---

### RecipeDetail

**説明**: レシピ詳細表示  
**優先度**: P0  
**Props**:

```typescript
interface RecipeDetailProps {
  recipe: Recipe
  ingredients: Ingredient[]
  steps: string[]
  nutrition: { protein: number; fat: number; carb: number; calories: number }
}
```

**使用箇所**: レシピ詳細画面

---

## shadcn/ui推奨コンポーネント

以下のshadcn/uiコンポーネントを推奨します：

### 必須（P0）

| コンポーネント | 説明 | 使用箇所 |
|---|---|---|
| `button` | ボタン | すべて |
| `card` | カード | 献立、レシピ、設定 |
| `input` | テキスト入力 | オンボーディング、設定 |
| `checkbox` | チェックボックス | 買い物リスト、アレルギー |
| `select` | ドロップダウン | オンボーディング |
| `badge` | バッジ | 課金状態、レシピタグ |
| `dialog` (modal) | モーダル | 課金促進、確認 |
| `toast` | トースト | 通知 |
| `alert` | アラート | エラー表示 |

### 推奨（P1）

| コンポーネント | 説明 | 使用箇所 |
|---|---|---|
| `tabs` | タブ | 設定画面（v1.1） |
| `accordion` | アコーディオン | FAQ（LP） |
| `dropdown-menu` | ドロップダウン | ユーザーメニュー |
| `progress` | プログレスバー | オンボーディング |
| `skeleton` | スケルトン | ローディング |

### オプション（P2）

| コンポーネント | 説明 | 使用箇所 |
|---|---|---|
| `calendar` | カレンダー | 献立カレンダー（v2.0） |
| `slider` | スライダー | 予算設定（v2.0） |
| `switch` | トグルスイッチ | ダークモード |
| `tooltip` | ツールチップ | ヘルプ表示 |

---

## インストールと使用方法

### shadcn/ui初期化

```bash
npx shadcn-ui@latest init
```

### コンポーネント追加

```bash
# 必須コンポーネントを一括追加
npx shadcn-ui@latest add button card input checkbox select badge dialog toast alert
```

### 使用例

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export function MealPlanCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>今週の献立</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleGenerate}>献立を生成</Button>
      </CardContent>
    </Card>
  )
}
```

---

## パフォーマンス最適化

### Dynamic Import（遅延読み込み）

重いコンポーネントは動的インポート：

```tsx
import dynamic from 'next/dynamic'

const MealCalendar = dynamic(() => import('@/components/meal/meal-calendar'), {
  loading: () => <Loading />,
  ssr: false
})
```

### Memo化

再レンダリング最適化：

```tsx
import { memo } from 'react'

export const MealCard = memo(({ meal, onClick }: MealCardProps) => {
  // ...
})
```

---

## アクセシビリティ対応

### ARIA属性

- すべてのインタラクティブ要素に `aria-label`
- フォームエラーには `aria-describedby`
- モーダルには `role="dialog"` + `aria-modal="true"`

### キーボード対応

- `Tab`: フォーカス移動
- `Enter`: ボタン/リンク実行
- `Escape`: モーダル閉じる

---

## 次のステップ

- [画面フロー設計書](./screen-flow.md)
- [ワイヤーフレーム詳細](./wireframes.md)
- [データベース設計](../database-design.md)

---

**終わり**
