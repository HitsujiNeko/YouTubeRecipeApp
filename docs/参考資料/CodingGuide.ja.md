
# Civilink Frontend Coding Guide for AI Agents ✨

## このドキュメントは、Civilinkの**フロントエンド開発**に関するAIエージェント向けのコーディングガイドです。人間の開発者にも有用ですが、主にAIが自動生成・修正を安全かつ一貫性を持って行うことを目的としています。

## 📋 Quick Reference

- Framework: Next.js 14.2.25 (App Router)
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS 3.4 + Shadcn/ui (Radix UI based)
- State: Zustand with devtools & persist
- Auth: NextAuth.js 5.0 (JWT sessions)
- Canvas: Konva.js + React-Konva
- Validation: Zod + React Hook Form
- Testing: Playwright (E2E) + Storybook
- Linting: GTS (Google TypeScript Style) + ESLint
- Node: >=22.0.0

---

## ⚡️ 共通ルール（Frontend）

### ✅ ベースルール

- 【必須】ベースブランチは `release`
- 【必須】重複処理がある場合は**共通関数/共通UIコンポーネントとして集約すること**
- 【必須】`any`**型は原則禁止**。避けられない場合は理由をコメントで明記
- 【必須】`unknown`型は型ガードや型アサーションなしで使用禁止。必ず検証して型を絞り込んでから使用すること
- 【推奨】関数名・変数名は用途が直感的に分かるように命名
- 【禁止】型なしのコード、エラー握りつぶし、責務混在

---

## 🧩 フロントエンド構成ルール（Next.js + TypeScript）

### 🧪 サンプル構成

```text
app/
├── (Admin)/              # 管理者専用ルートグループ
│   ├── admin/
│   │   └── accounts/
│   │       └── page.tsx # 管理画面ページ
│   └── layout.tsx       # 管理画面レイアウトラッパー
├── (Authed)/            # 認証済みルートグループ
│   ├── _components/     # 認証ルート用共通コンポーネント
│   ├── projects/
│   │   └── [uuid]/      # 動的プロジェクトルート
│   │       ├── [[...folder]]/ # フォルダ用オプショナルキャッチオール
│   │       └── page.tsx
│   ├── organizations/
│   │   └── [organizationId]/
│   │       └── page.tsx
│   └── layout.tsx       # 認証レイアウトラッパー
├── (static)/            # 静的ページルートグループ
│   ├── terms/
│   ├── privacy/
│   └── layout.tsx
├── api/                 # APIルート
│   ├── projects/
│   │   └── [uuid]/
│   │       ├── route.ts # GET, PATCH, DELETEハンドラー
│   │       └── files/
│   │           └── route.ts
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts # NextAuth APIルート
│   └── organizations/
│       └── [uuid]/
│           └── route.ts
├── login/
│   └── page.tsx         # パブリックログインページ
├── layout.tsx           # ルートレイアウト
├── page.tsx             # ホームページ
└── globals.css          # グローバルスタイル

services/                # APIサービス層（app/の外）
├── fetchWrapperService.ts  # API接続ラッパー
├── projectService.ts  # 各機能固有サービス
└── userService.ts  # 各機能固有サービス
└── foldername  # 対象機能のサービスをまとめるフォルダ


components/             # UIコンポーネント（app/の外）
├── ui/
│   ├── base/          # Shadcn/uiコンポーネント
│   └── custom/        # プロジェクト固有コンポーネント
├── pages/             # ページ固有コンポーネント
└── commons/           # 共有ユーティリティコンポーネント
```

---

## 🚏 APIルート（app/api/*/route.ts）

### 🔸 サンプル（基本）

```ts
import {NextRequest, NextResponse} from 'next/server';
import {apiGet} from '@/utils/api';
import {handleApiError} from '@/lib/apiErrorResponse';

export async function GET(_: NextRequest, {params}: {params: {uuid: string}}) {
  try {
    const result = await apiGet(`/project/${params.uuid}`);
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
```

### 🔸 サンプル（認証付き）

```ts
import {auth} from '@/auth';
import {authOptions} from '@/lib/auth';
import {NextRequest, NextResponse} from 'next/server';
import {apiGet} from '@/utils/api';
import {handleApiError} from '@/lib/apiErrorResponse';

export async function GET(_: NextRequest, {params}: {params: {uuid: string}}) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }
    
    const result = await apiGet(`/project/${params.uuid}`);
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
```

### ✅ ルール

- `NextRequest` / `NextResponse` を使用
- パラメータ型定義は必須（型安全）
- エラー処理は `handleApiError()` に委譲
- HTTP操作は `@/utils/api.ts` に定義された共通関数を使う（`apiGet`, `apiPost` 等）
- 認証が必要な場合は `await auth()` でSessionの有無をチェック

---

## 🧰 サービス層（services/）

### 🔸 サンプル

```ts
import * as z from 'zod';
import {apiMethods, validationError} from '@/services/fetchWrapperService';

const uuidSchema = z.object({uuid: z.string().uuid()});

export const userService = {
  async getUser(uuid: string) {
    const valid = uuidSchema.safeParse({uuid});
    if (!valid.success) return validationError('Invalid UUID');
    return apiMethods.get(`/user/${uuid}`);
  },
};
```

### ✅ ルール

- Zodでリクエスト前にバリデーションを行う際は`safeParse`を使用（`parse`は例外をthrowするため使用しない）
- バリデーションエラーは `validationError()` を返す（例外スローしない）
- APIエラーはサービス内で catch せずにそのまま返す。（握りつぶさない）
- コンポーネント側で必要に応じてステータスコードを見てエラーメッセージを表示する

---

## 🧱 UIコンポーネント層（components/ui）

### 🔸 サンプル（ToggleButton: CustomUI）

```tsx
import React from 'react';
import clsx from 'clsx';

export interface ToggleOption<T extends string = string> {
  value: T;
  label: string;
}

interface ToggleButtonProps<T extends string = string> {
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function ToggleButton<T extends string = string>({
  options,
  value,
  onChange,
  className,
}: ToggleButtonProps<T>) {
  return (
    <div className={clsx('flex bg-gray-100 rounded-lg p-1', className)}>
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={clsx(
            'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
            value === option.value
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
```

### ✅ ルール

- 再利用できる形で作成（`variant`, `className` などで柔軟に）
- 汎用UI → `base/`, 特化UI → `custom/` に配置
- `Icon` コンポーネントは Lucide/カスタムSVG を一元化して扱う

---

## ✅ ESLint / 型ルール

### eslint 設定例

```json
{
  "rules": {
    "@typescript-eslint/no-unused-vars": ["warn", {"argsIgnorePattern": "^_"}],
    "@typescript-eslint/no-explicit-any": "warn", // 現在は段階的移行のため"warn"、リファクタリング後に"error"へ変更予定
    "unused-imports/no-unused-imports": "warn",
    "max-lines": ["warn", 500]
  }
}
```

### ✅ ルール一覧

- `any` 使用は警告対象、使う場合は `// any: XXXのため例外的に使用` を添えること
- `Lucide` アイコンは `Icon` 経由でのみ使用（直import禁止）
- `svg` タグ直書きは禁止。必ずアイコンコンポーネント化
- ファイル行数上限は 500行目安（可読性担保）

---

## 🎨 Canvas/Drawing Operations (Konva.js)

### 🔸 基本的なCanvas操作

```tsx
'use client';
import {Stage, Layer, Rect, Line} from 'react-konva';
import {useRef, useState} from 'react';
import type {KonvaEventObject} from 'konva/lib/Node';

export function DrawingCanvas() {
  const stageRef = useRef<Konva.Stage>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    setIsDrawing(true);
    const pos = e.target.getStage()?.getPointerPosition();
    // 描画開始処理
  };
  
  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing) return;
    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    // 描画中の処理
  };
  
  const handleMouseUp = () => {
    setIsDrawing(false);
    // 描画終了処理・サーバー同期
  };
  
  return (
    <Stage
      ref={stageRef}
      width={typeof window !== 'undefined' ? window.innerWidth : 0}
      height={typeof window !== 'undefined' ? window.innerHeight : 0}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <Layer>
        {/* 描画要素 */}
      </Layer>
    </Stage>
  );
}
```

### ✅ Canvas操作のルール
- Stageの参照は `useRef<Konva.Stage>` で保持
- イベント型は `KonvaEventObject<MouseEvent>` を使用
- 座標取得は `getStage()?.getPointerPosition()` を使用
- サーバー同期は描画操作の終了時に行う

---

## 📦 Zustand Store パターン

### 🔸 Store定義

```ts
import {create} from 'zustand';
import {devtools, persist} from 'zustand/middleware';

interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setProjects: (projects: Project[]) => void;
  selectProject: (project: Project) => void;
  updateProject: (uuid: string, updates: Partial<Project>) => void;
  reset: () => void;
}

const initialState = {
  projects: [],
  selectedProject: null,
  isLoading: false,
  error: null,
};

export const useProjectStore = create<ProjectState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        
        setProjects: (projects) => set({projects}),
        
        selectProject: (project) => set({selectedProject: project}),
        
        updateProject: (uuid, updates) => 
          set((state) => ({
            projects: state.projects.map(p => 
              p.uuid === uuid ? {...p, ...updates} : p
            ),
          })),
          
        reset: () => set(initialState),
      }),
      {
        name: 'project-storage',
        partialize: (state) => ({projects: state.projects}), // 永続化する項目を選択
      }
    )
  )
);
```

### ✅ Storeのルール
- 型定義は interface で明確に
- 初期状態は `initialState` として分離
- デバッグ用に devtools ミドルウェアを適用
- persist ミドルウェアはセッション間でデータを保持する必要がある場合のみ適用（例：ユーザー設定、カート内容）
- reset 関数を必ず用意
- persist使用時は `partialize` で永続化する項目を選択し、不要なデータの保存を避ける

---

## 🧪 Form処理パターン (React Hook Form + Zod)

### 🔸 Form実装例

```tsx
'use client';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {Button} from '@/components/ui/base';
import {Input} from '@/components/ui/base';
import {toast} from '@/components/ui/use-toast';
import {userService} from '@/services/userService';

const formSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(100, '100文字以内で入力してください'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  age: z.number().min(0).max(150).optional(),
});

type FormData = z.infer<typeof formSchema>;

export function UserForm() {
  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });
  
  const onSubmit = async (data: FormData) => {
    try {
      const response = await userService.createUser(data);
      if (response.error) {
        toast({
          title: 'エラー',
          description: response.error,
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: '成功',
        description: 'ユーザーを作成しました',
      });
      reset();
    } catch (error) {
      toast({
        title: 'エラー',
        description: 'ユーザーの作成に失敗しました',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register('name')}
        placeholder="名前"
        disabled={isSubmitting}
      />
      {errors.name && <span className="text-red-500">{errors.name.message}</span>}
      
      <Input
        {...register('email')}
        type="email"
        placeholder="メールアドレス"
        disabled={isSubmitting}
      />
      {errors.email && <span className="text-red-500">{errors.email.message}</span>}
      
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '送信中...' : '送信'}
      </Button>
    </form>
  );
}
```

### ✅ Formルール
- Zodスキーマで validation を定義
- `zodResolver` で React Hook Form と統合
- エラー表示は各フィールドの下に配置
- 送信中は `isSubmitting` でボタンを無効化
- 成功/エラーは toast で通知

---

## 🎯 よくあるパターンと解決策

### 🔸 ファイルアップロード（チャンク分割）

```ts
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

async function uploadFileInChunks(file: File, projectUuid: string) {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId = crypto.randomUUID();
  
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', i.toString());
    formData.append('totalChunks', totalChunks.toString());
    
    await apiPost(`/projects/${projectUuid}/files/chunk`, formData);
  }
  
  // チャンクアップロード完了を通知
  return apiPost(`/projects/${projectUuid}/files/complete`, {uploadId});
}
```

### 🔸 ポーリング処理（ジョブ監視）

```ts
async function pollJobStatus(jobId: string, maxAttempts = 60) {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const status = await apiGet(`/jobs/${jobId}/status`);
    
    if (status.state === 'completed') {
      return status.result;
    }
    
    if (status.state === 'failed') {
      throw new Error(status.error || 'Job failed');
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
    attempts++;
  }
  
  throw new Error('Job timeout');
}
```

### 🔸 デバウンス検索

```tsx
'use client';
import {useState, useCallback} from 'react';
import {Input} from '@/components/ui/base/input';
import {useDebounce} from '@/hook/debounce';

export function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const debounce = useDebounce(300);
  
  const performSearch = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([]);
      return;
    }
    
    const data = await searchService.search(term);
    setResults(data);
  }, []);
  
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debounce(() => performSearch(value));
  }, [debounce, performSearch]);
  
  return (
    <Input
      value={searchTerm}
      onChange={handleSearch}
      placeholder="検索..."
    />
  );
}
```

---

## 🚀 パフォーマンス最適化

### 🔸 メモ化とコード分割

```tsx
import {memo, useMemo, useCallback, lazy, Suspense} from 'react';

// 重い計算のメモ化
const ExpensiveComponent = memo(<T>(({data}: {data: T[]}) => {
  const processedData = useMemo(() => {
    return data.map(item => complexProcessing(item));
  }, [data]);
  
  const handleClick = useCallback((id: string) => {
    // クリック処理
  }, []);
  
  return <div>{/* UI */}</div>;
}));

// 動的インポート
const HeavyComponent = lazy(() => import('./HeavyComponent'));

export function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### 🔸 画像最適化

```tsx
import Image from 'next/image';

export function OptimizedImage() {
  return (
    <Image
      src="/image.jpg"
      alt="Description"
      width={800}
      height={600}
      loading="lazy"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..." 
    />
  );
}
```

---

## ⚠️ よくあるミスと対策

### ❌ 避けるべきパターン

```ts
// ❌ any型の使用
const data: any = await fetch('/api/data');

// ✅ 正しい型定義
interface ApiResponse {
  data: Project[];
  total: number;
}
const response: ApiResponse = await fetch('/api/data').then(r => r.json());

// ❌ エラーの握りつぶし
try {
  await apiCall();
} catch (e) {
  // 何もしない
}

// ✅ 適切なエラー処理
try {
  await apiCall();
} catch (error) {
  console.error('API call failed:', error);
  toast({
    title: 'エラー',
    description: getErrorMessage(error),
    variant: 'destructive',
  });
}

// ❌ useEffect内での非同期処理
useEffect(async () => {
  const data = await fetchData();
}, []);

// ✅ 正しい非同期処理
useEffect(() => {
  const load = async () => {
    const data = await fetchData();
  };
  load();
}, []);
```

---

## 🤖 AIエージェント向け補足

### 優先順位
1. **型安全性**: any型は絶対に避ける
2. **エラー処理**: 全てのエラーを適切に処理
3. **再利用性**: 共通処理は必ず関数化
4. **パフォーマンス**: メモ化と遅延読み込みを活用
5. **保守性**: 責務分離とクリーンなコード構造

### 作業手順
1. 既存コードのパターンを確認
2. 同じディレクトリの他ファイルを参照
3. 型定義を明確にする
4. エラー処理を実装
5. テストを考慮した実装

### チェックリスト
- [ ] TypeScript の型は正しく定義されているか
- [ ] エラー処理は適切か
- [ ] 共通処理は関数化されているか
- [ ] Zodバリデーションは適用されているか
- [ ] UIコンポーネントは再利用可能か
- [ ] Zustand storeの更新は適切か
- [ ] 非同期処理は正しく実装されているか

---

このガイドに準拠することで、AIエージェントは安全かつ保守性の高いフロントエンドコードを安定的に生成できます。

