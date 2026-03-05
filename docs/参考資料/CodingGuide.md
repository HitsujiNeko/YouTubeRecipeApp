# Civilink Frontend Coding Guide for AI Agents ✨

## This document is a coding guide for AI agents regarding **frontend development** for Civilink. While useful for human developers, it primarily aims to enable AI to perform auto-generation and modifications safely and consistently.

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

## ⚡️ Common Rules (Frontend)

### ✅ Base Rules

- 【Required】Base branch is `release`
- 【Required】When duplicate processing exists, **consolidate as common functions/common UI components**
- 【Required】`any` type is **generally prohibited**. If unavoidable, provide reason in comments
- 【Required】`unknown` type must not be used without proper type guards or type assertions. Always validate and narrow down `unknown` types before usage
- 【Recommended】Function and variable names should be intuitively descriptive
- 【Prohibited】Untyped code, error suppression, mixed responsibilities

---

## 🧩 Frontend Structure Rules (Next.js + TypeScript)

### 🧪 Sample Structure

```text
app/
├── (Admin)/              # Admin-only route group
│   ├── admin/
│   │   └── accounts/
│   │       └── page.tsx # Admin pages
│   └── layout.tsx       # Admin layout wrapper
├── (Authed)/            # Authenticated route group
│   ├── _components/     # Shared components for auth routes
│   ├── projects/
│   │   └── [uuid]/      # Dynamic project routes
│   │       ├── [[...folder]]/ # Optional catch-all for folders
│   │       └── page.tsx
│   ├── organizations/
│   │   └── [organizationId]/
│   │       └── page.tsx
│   └── layout.tsx       # Auth layout wrapper
├── (static)/            # Static pages route group
│   ├── terms/
│   ├── privacy/
│   └── layout.tsx
├── api/                 # API routes
│   ├── projects/
│   │   └── [uuid]/
│   │       ├── route.ts # GET, PATCH, DELETE handlers
│   │       └── files/
│   │           └── route.ts
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts # NextAuth API route
│   └── organizations/
│       └── [uuid]/
│           └── route.ts
├── login/
│   └── page.tsx         # Public login page
├── layout.tsx           # Root layout
├── page.tsx             # Home page
└── globals.css          # Global styles

services/                # API service layer (outside app/)
├── fetchWrapperService.ts  # API connection wrapper
├── projectService.ts  # Feature-specific service
├── userService.ts  # Feature-specific service
└── foldername/  # Folder to group services for target feature

components/             # UI components (outside app/)
├── ui/
│   ├── base/          # Shadcn/ui components
│   └── custom/        # Project-specific components
├── pages/             # Page-specific components
└── commons/           # Shared utility components
```

---

## 🚏 API Routes (app/api/*/route.ts)

### 🔸 Sample (Basic)

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

### 🔸 Sample (With Authentication)

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

### ✅ Rules

- Use `NextRequest` / `NextResponse`
- Parameter type definitions are mandatory (type safety)
- Delegate error handling to `handleApiError()`
- Use common functions defined in `@/utils/api.ts` for HTTP operations (`apiGet`, `apiPost`, etc.)
- Check authentication with `await auth()` and session info when required

---

## 🧰 Service Layer (services/)

### 🔸 Sample

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

### ✅ Rules

- Validate with Zod before requests using `safeParse` (not `parse`) to avoid throwing exceptions
- Return `validationError()` for validation errors (don't throw exceptions)
- Return API errors as-is without catching in services (don't suppress)
- Handle errors in components by checking status codes and displaying appropriate error messages

---

## 🧱 UI Component Layer (components/ui)

### 🔸 Sample (ToggleButton: CustomUI)

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

### ✅ Rules

- Create in reusable form (flexible with `variant`, `className`, etc.)
- Place generic UI in `base/`, specialized UI in `custom/`
- `Icon` component centralizes handling of Lucide/custom SVGs

---

## ✅ ESLint / Type Rules

### ESLint Configuration Example

```json
{
  "rules": {
    "@typescript-eslint/no-unused-vars": ["warn", {"argsIgnorePattern": "^_"}],
    "@typescript-eslint/no-explicit-any": "warn", // Currently "warn" for gradual migration, will be changed to "error" after refactoring
    "unused-imports/no-unused-imports": "warn",
    "max-lines": ["warn", 500]
  }
}
```

### ✅ Rule List

- `any` usage triggers warnings, if used add `// any: Exception for XXX reason`
- Use `Lucide` icons only through `Icon` (direct import prohibited)
- Direct `svg` tag writing prohibited. Always componentize icons
- File line limit target is 500 lines (maintain readability)

---

## 🎨 Canvas/Drawing Operations (Konva.js)

### 🔸 Basic Canvas Operations

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
    // Drawing start logic
  };
  
  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing) return;
    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    // Drawing in progress logic
  };
  
  const handleMouseUp = () => {
    setIsDrawing(false);
    // Drawing end logic & server sync
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
        {/* Drawing elements */}
      </Layer>
    </Stage>
  );
}
```

### ✅ Canvas Operation Rules
- Hold Stage reference with `useRef<Konva.Stage>`
- Use `KonvaEventObject<MouseEvent>` for event types
- Get coordinates with `getStage()?.getPointerPosition()`
- Sync with server at drawing operation completion

---

## 📦 Zustand Store Pattern

### 🔸 Store Definition

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
        partialize: (state) => ({projects: state.projects}), // Select items to persist
      }
    )
  )
);
```

### ✅ Store Rules
- Clear type definitions with interface
- Separate initial state as `initialState`
- Apply devtools middleware for debugging
- Apply persist middleware ONLY when data needs to persist across sessions (e.g., user preferences, cart items)
- Always provide reset function
- When using persist, select items to persist with `partialize` to avoid storing unnecessary data

---

## 🧪 Form Processing Pattern (React Hook Form + Zod)

### 🔸 Form Implementation Example

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
  name: z.string().min(1, 'Name is required').max(100, 'Must be 100 characters or less'),
  email: z.string().email('Please enter a valid email address'),
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
          title: 'Error',
          description: response.error,
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'Success',
        description: 'User created successfully',
      });
      reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create user',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register('name')}
        placeholder="Name"
        disabled={isSubmitting}
      />
      {errors.name && <span className="text-red-500">{errors.name.message}</span>}
      
      <Input
        {...register('email')}
        type="email"
        placeholder="Email address"
        disabled={isSubmitting}
      />
      {errors.email && <span className="text-red-500">{errors.email.message}</span>}
      
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </Button>
    </form>
  );
}
```

### ✅ Form Rules
- Define validation with Zod schema
- Integrate with React Hook Form using `zodResolver`
- Display errors below each field
- Disable button during submission with `isSubmitting`
- Notify success/error with toast

---

## 🎯 Common Patterns and Solutions

### 🔸 Toast Notifications

Toast通知は`sonner`ライブラリを使用し、ユーザーへのフィードバックを提供します。

```tsx
import {toast} from 'sonner';
import {truncateForToast} from '@/utils/toastUtils';

// 成功通知
toast.success('プロジェクトを作成しました');

// エラー通知
toast.error('保存に失敗しました');

// 情報通知
toast.info('処理を開始しました');

// 動的なコンテンツを含む場合は truncateForToast() を使用
const fileName = 'とても長いファイル名で表示が崩れる可能性があるファイル.pdf';
toast.success(`${truncateForToast(fileName)}をアップロードしました`);

// 固定部分が長い場合はカスタム幅で小さい値を指定
toast.success(`${truncateForToast(userName, 20)}さんと${truncateForToast(userName, 20)}さんを招待しました`);
```

#### ✅ Toast Notification Rules

- **Import**: `toast` from `sonner` library
- **Message length**: Keep concise and user-friendly
- **Dynamic content**: Use `truncateForToast()` from `/utils/toastUtils` for file names, user names, etc.
  - Calculates width considering full-width (2) and half-width (1) characters
  - Default max width: 45 characters
  - Customize: `truncateForToast(text, 30)`
- **Message types**:
  - `toast.success()`: Successful operations
  - `toast.error()`: Failed operations or validation errors
  - `toast.info()`: Informational messages
- **Best practices**:
  - Use Japanese messages consistent with UI language
  - Avoid technical jargon in user-facing messages
  - Include action performed (e.g., "作成しました", "削除しました", "更新しました")
  - Always truncate dynamic user-generated content to prevent UI breakage

### 🔸 File Upload (Chunked)

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
  
  // Notify chunk upload completion
  return apiPost(`/projects/${projectUuid}/files/complete`, {uploadId});
}
```

### 🔸 Polling Process (Job Monitoring)

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
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    attempts++;
  }
  
  throw new Error('Job timeout');
}
```

### 🔸 Debounced Search

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
      placeholder="Search..."
    />
  );
}
```

---

## 🚀 Performance Optimization

### 🔸 Memoization and Code Splitting

```tsx
import {memo, useMemo, useCallback, lazy, Suspense} from 'react';

// Memoize expensive calculations
const ExpensiveComponent = memo(<T>(({data}: {data: T[]}) => {
  const processedData = useMemo(() => {
    return data.map(item => complexProcessing(item));
  }, [data]);
  
  const handleClick = useCallback((id: string) => {
    // Click handling
  }, []);
  
  return <div>{/* UI */}</div>;
}));

// Dynamic import
const HeavyComponent = lazy(() => import('./HeavyComponent'));

export function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### 🔸 Image Optimization

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

## ⚠️ Common Mistakes and Solutions

### ❌ Patterns to Avoid

```ts
// ❌ Using any type
const data: any = await fetch('/api/data');

// ✅ Correct type definition
interface ApiResponse {
  data: Project[];
  total: number;
}
const response: ApiResponse = await fetch('/api/data').then(r => r.json());

// ❌ Error suppression
try {
  await apiCall();
} catch (e) {
  // Do nothing
}

// ✅ Proper error handling
try {
  await apiCall();
} catch (error) {
  console.error('API call failed:', error);
  toast({
    title: 'Error',
    description: getErrorMessage(error),
    variant: 'destructive',
  });
}

// ❌ Async in useEffect
useEffect(async () => {
  const data = await fetchData();
}, []);

// ✅ Correct async handling
useEffect(() => {
  const load = async () => {
    const data = await fetchData();
  };
  load();
}, []);
```

---

## 🤖 AI Agent Supplement

### Priority Order
1. **Type Safety**: Absolutely avoid any type
2. **Error Handling**: Handle all errors appropriately
3. **Reusability**: Always functionalize common processes
4. **Performance**: Utilize memoization and lazy loading
5. **Maintainability**: Separation of concerns and clean code structure

### Work Procedure
1. Check existing code patterns
2. Reference other files in the same directory
3. Clarify type definitions
4. Implement error handling
5. Implementation with testing in mind

### Checklist
- [ ] Are TypeScript types correctly defined?
- [ ] Is error handling appropriate?
- [ ] Are common processes functionalized?
- [ ] Is Zod validation applied?
- [ ] Are UI components reusable?
- [ ] Are Zustand store updates appropriate?
- [ ] Are async processes correctly implemented?

---

By adhering to this guide, AI agents can consistently generate safe and maintainable frontend code.