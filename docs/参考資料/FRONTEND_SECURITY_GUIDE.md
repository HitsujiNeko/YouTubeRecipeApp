# フロントエンドセキュリティガイド

このガイドでは、CiviLinkフロントエンドアプリケーションにおけるXSS対策と入力検証の実装方法について説明します。

## 概要

フロントエンドセキュリティシステムは以下の主要コンポーネントで構成されています：

1. **XSSサニタイゼーション** - DOMPurifyベースの無害化システム
2. **入力検証** - 統一された検証フレームワーク
3. **セキュアコンポーネント** - 安全性が組み込まれたUI要素
4. **CSP設定** - Content Security Policyによる保護
5. **セキュリティ監視** - 脅威検出とログ機能

## セキュリティライブラリ

### 1. XSSサニタイゼーション (`lib/security/xss-sanitizer.ts`)

```typescript
import { sanitizeHTML, sanitizeText, detectXSSPatterns } from '@/lib/security/xss-sanitizer';

// HTMLの無害化（許可されたタグのみ保持）
const safeHTML = sanitizeHTML('<b>Bold</b><script>alert(1)</script>');
// 結果: '<b>Bold</b>'

// テキストの無害化（全てのHTMLタグを除去）
const safeText = sanitizeText('<b>Bold</b><script>alert(1)</script>');
// 結果: 'Bold'

// XSS攻撃パターンの検出
const hasXSS = detectXSSPatterns('<script>alert(1)</script>');
// 結果: true
```

### 2. 入力検証 (`lib/security/input-validator.ts`)

```typescript
import { validateEmail, validateText, validateFilename } from '@/lib/security/input-validator';

// メールアドレスの検証
const emailResult = validateEmail('user@example.com');
if (emailResult.isValid) {
  console.log('安全なメール:', emailResult.sanitizedValue);
} else {
  console.log('エラー:', emailResult.errors);
}

// テキストの検証
const textResult = validateText('ユーザー入力', {
  maxLength: 100,
  fieldName: 'コメント'
});
```

## セキュアコンポーネント

### 1. SecureInput

```typescript
import { SecureInput } from '@/components/ui/secure/SecureInput';

<SecureInput
  value={value}
  onChange={(newValue, sanitizedValue) => {
    setValue(sanitizedValue); // 無害化された値を使用
  }}
  maxLength={100}
  fieldName="ユーザー名"
  showSecurityWarning={true}
/>
```

### 2. SecureTextarea

```typescript
import { SecureTextarea } from '@/components/ui/secure/SecureTextarea';

<SecureTextarea
  value={comment}
  onChange={(newValue, sanitizedValue) => {
    setComment(sanitizedValue);
  }}
  maxLength={500}
  fieldName="コメント"
/>
```

### 3. SecureForm

```typescript
import { SecureForm } from '@/components/ui/secure/SecureForm';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

<SecureForm
  initialValues={{ name: '', email: '' }}
  schema={schema}
  onSubmit={(safeValues) => {
    // safeValuesは検証・無害化済み
    console.log('安全な値:', safeValues);
  }}
>
  {/* フォームコンテンツ */}
</SecureForm>
```

## セキュリティフック

### 1. useSafeInput

```typescript
import { useSafeInput } from '@/hook/useSafeInput';

const MyComponent = () => {
  const {
    value,
    sanitizedValue,
    isValid,
    errors,
    hasXSSAttempt,
    setValue,
  } = useSafeInput('', {
    maxLength: 100,
    fieldName: 'コメント',
  });

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className={hasXSSAttempt ? 'border-red-500' : ''}
    />
  );
};
```

### 2. useXSSProtection

```typescript
import { useXSSProtection } from '@/hook/useXSSProtection';

const MyComponent = () => {
  const { protectInput, isInputSafe, getAttemptsCount } = useXSSProtection({
    logAttempts: true,
    blockMaliciousInput: true,
  });

  const handleInput = (input: string) => {
    if (isInputSafe(input)) {
      const safeInput = protectInput(input);
      // 安全な入力として処理
    }
  };
};
```

### 3. useSecureForm

```typescript
import { useSecureForm } from '@/hook/useSecureForm';

const MyForm = () => {
  const {
    formState,
    getFieldProps,
    validateForm,
    getSafeValues,
  } = useSecureForm(
    { name: '', email: '' },
    { schema: mySchema }
  );

  const handleSubmit = () => {
    if (validateForm()) {
      const safeData = getSafeValues();
      // 安全なデータで送信
    }
  };
};
```

## CSP (Content Security Policy)

### 設定 (`lib/security/csp-config.ts`)

```typescript
export const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};
```

### Next.js設定 (`next.config.mjs`)

```javascript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: Object.entries(securityHeaders).map(([key, value]) => ({
        key,
        value,
      })),
    },
  ];
}
```

## セキュリティ監視

### 1. セキュリティイベントの監視

```typescript
import { logSecurityEvent } from '@/lib/security/client-security-monitor';

// XSS攻撃の検出時
logSecurityEvent({
  type: 'xss_attempt',
  severity: 'high',
  details: {
    input: maliciousInput,
    component: 'SearchInput',
  },
});
```

### 2. セキュリティログ

```typescript
import { logSecurityWarn } from '@/lib/security/client-security-logger';

// セキュリティ警告のログ
logSecurityWarn('validation', 'Invalid input detected', {
  input: userInput,
  component: 'CommentForm',
});
```

## ベストプラクティス

### 1. 入力処理

- **常にサニタイゼーション**: ユーザー入力は必ず無害化する
- **検証の実装**: クライアントサイドとサーバーサイドの両方で検証
- **適切なエスケープ**: コンテキストに応じたエスケープを使用

```typescript
// ❌ 危険な例
const dangerousHTML = `<div>${userInput}</div>`;

// ✅ 安全な例
const safeHTML = `<div>${sanitizeText(userInput)}</div>`;
```

### 2. コンポーネント設計

- **セキュアコンポーネントの使用**: 標準のinput要素ではなくSecureInputを使用
- **プロップの検証**: 受け取るプロップも検証する
- **エラーハンドリング**: セキュリティエラーを適切に処理

```typescript
// ✅ 推奨
<SecureInput
  value={value}
  onChange={handleChange}
  maxLength={100}
  showSecurityWarning={true}
/>

// ❌ 非推奨
<input
  value={value}
  onChange={handleChange}
/>
```

### 3. ファイル処理

```typescript
import { sanitizeFilename, validateFilename } from '@/lib/security/xss-sanitizer';

const handleFileUpload = (file: File) => {
  const validation = validateFilename(file.name);
  if (!validation.isValid) {
    console.error('Invalid filename:', validation.errors);
    return;
  }
  
  const safeName = sanitizeFilename(file.name);
  // 安全なファイル名で処理続行
};
```

## テスト

### 1. セキュリティテストの実行

```bash
# XSS保護テスト
npm test __tests__/security/xss-protection.test.ts

# 入力検証テスト
npm test __tests__/security/input-validation.test.ts

# 統合テスト
npm test __tests__/security/integration.test.ts
```

### 2. 手動テスト

```typescript
// XSS攻撃のテスト例
const maliciousInputs = [
  '<script>alert("XSS")</script>',
  'javascript:alert(1)',
  '<img src=x onerror=alert(1)>',
  '<svg onload=alert(1)>',
];

maliciousInputs.forEach(input => {
  const result = sanitizeText(input);
  console.log(`Input: ${input} -> Output: ${result}`);
});
```

## トラブルシューティング

### 1. よくある問題

**Q: セキュリティ警告が表示される**
A: 入力に無効な文字が含まれています。`detectXSSPatterns`で詳細を確認してください。

**Q: CSPエラーが発生する**
A: `csp-config.ts`の設定を確認し、必要なドメインを許可リストに追加してください。

**Q: ファイルアップロードが失敗する**
A: ファイル名に無効な文字が含まれている可能性があります。`validateFilename`で確認してください。

### 2. デバッグ方法

```typescript
// セキュリティイベントの確認
import { getSecurityEvents } from '@/lib/security/client-security-monitor';

const events = getSecurityEvents({ severity: 'high' });
console.log('High severity events:', events);

// ログの確認
import { getSecurityLogs } from '@/lib/security/client-security-logger';

const logs = getSecurityLogs({ category: 'xss', limit: 10 });
console.log('Recent XSS logs:', logs);
```

## 更新履歴

- 2024-09-15: 初版作成
- XSS保護システムの実装
- 統一入力検証フレームワークの追加
- セキュアコンポーネントライブラリの作成
- CSP設定の実装
- セキュリティ監視システムの追加
