# 05 Component Spec

## UI Primitive
- `Button`: primary / secondary / ghost / destructive
- `Card`: section container
- `Input`: URL, grams
- `Badge`: confidence, status
- `Toast`: success/error notice
- `Dialog`: destructive confirm

## Domain Components
- `YouTubeUrlForm`
  - props: `onSubmit(url)`
  - validation: YouTube URL only
- `NutritionSummaryCard`
  - props: `totals`, `confidence`, `coverage`, `unresolvedCount`
- `UnresolvedIngredientItem`
  - props: `ingredient`, `candidates`, `onSave`
- `CookStepViewer`
  - props: `step`, `index`, `total`, `onNext`, `onPrev`
- `MiniYouTubeEmbed`
  - props: `videoId`, `startAtSec?`

## Error Components
- `ApiErrorPanel`
  - props: `code`, `message`, `retryable`, `onRetry`
- `EmptyState`
  - props: `title`, `description`, `action`

## 画面別必須コンポーネント
- Home: `YouTubeUrlForm`, `RecipeRecentList`, `ApiErrorPanel`
- RecipeDetail: `NutritionSummaryCard`, `IngredientList`, `StepList`
- NutritionFix: `UnresolvedIngredientItem`, `ProgressHeader`
- CookMode: `CookStepViewer`, `TimerControl`, `IngredientChecklist`
- SharePage: `MiniYouTubeEmbed`, `NutritionSummaryCard`, `CreditBlock`
