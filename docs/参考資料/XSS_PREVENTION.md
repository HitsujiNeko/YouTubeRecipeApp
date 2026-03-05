# XSS防止ガイド

## XSS (Cross-Site Scripting) とは

XSSは、Webアプリケーションに悪意のあるスクリプトを注入する攻撃手法です。ユーザーの入力が適切に検証・無害化されていない場合に発生します。

## XSSの種類

### 1. Reflected XSS (反射型XSS)
- ユーザーの入力がそのままページに表示される
- URLパラメータや検索クエリで発生しやすい

### 2. Stored XSS (格納型XSS)
- 悪意のあるスクリプトがデータベースに保存される
- コメントや投稿機能で発生しやすい

### 3. DOM-based XSS
- JavaScriptによるDOM操作で発生
- クライアントサイドでのみ発生

## CiviLinkでの対策

### 1. 入力時の対策

```typescript
import { useSafeInput } from '@/hook/useSafeInput';

// 安全な入力処理
const { value, sanitizedValue, hasXSSAttempt } = useSafeInput('', {
  maxLength: 100,
  sanitizeOnChange: true,
});

// XSS攻撃の検出
if (hasXSSAttempt) {
  console.warn('XSS attack detected');
}
```

### 2. 出力時の対策

```typescript
import { sanitizeHTML, sanitizeText } from '@/lib/security/xss-sanitizer';

// HTMLタグを許可する場合
const safeHTML = sanitizeHTML(userInput, {
  allowedTags: ['b', 'i', 'em', 'strong'],
  allowedAttributes: ['class'],
});

// HTMLタグを完全に除去する場合
const safeText = sanitizeText(userInput);
```

### 3. 属性値の対策

```typescript
import { sanitizeAttribute } from '@/lib/security/xss-sanitizer';

// 属性値の安全な設定
const safeTitle = sanitizeAttribute(userInput);
<div title={safeTitle}>Content</div>
```

## 具体的な実装例

### 1. 検索機能

```typescript
// SearchInput.tsx での実装
const SearchInput = ({ onSearchSubmit }) => {
  const { protectInput } = useXSSProtection();
  
  const handleSearch = (input: string) => {
    const safeInput = protectInput(input);
    onSearchSubmit(safeInput);
  };
};
```

### 2. コメント機能

```typescript
// ThreadInput.tsx での実装
const ThreadInput = ({ onSend }) => {
  const handleSubmit = () => {
    const sanitizedText = sanitizeComment(comment.text);
    onSend({ ...comment, text: sanitizedText });
  };
};
```

### 3. ファイルアップロード

```typescript
// FileInput.tsx での実装
const FileInput = ({ onFileChange }) => {
  const handleFile = (file: File) => {
    const validation = validateFilename(file.name);
    if (validation.isValid) {
      const safeName = sanitizeFilename(file.name);
      onFileChange(new File([file], safeName, { type: file.type }));
    }
  };
};
```

## 危険なパターンと対策

### 1. 危険: 直接的なHTML挿入

```typescript
// ❌ 危険
const dangerousHTML = `<div>${userInput}</div>`;
element.innerHTML = dangerousHTML;
```

```typescript
// ✅ 安全
const safeHTML = `<div>${sanitizeText(userInput)}</div>`;
element.innerHTML = safeHTML;
```

### 2. 危険: 動的スクリプト実行

```typescript
// ❌ 危険
eval(userInput);
new Function(userInput)();
```

```typescript
// ✅ 安全
// ユーザー入力を直接実行しない
// 必要な場合は厳密な検証を実装
```

### 3. 危険: URLの直接使用

```typescript
// ❌ 危険
<a href={userInput}>Link</a>
```

```typescript
// ✅ 安全
const safeURL = sanitizeURL(userInput);
<a href={safeURL}>Link</a>
```

## CSP (Content Security Policy) 設定

### 1. 基本設定

```typescript
// csp-config.ts
export const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
  ].join('; '),
};
```

### 2. 開発環境での設定

```typescript
if (isDevelopment) {
  directives['script-src']?.push("'unsafe-eval'");
  directives['connect-src']?.push('ws://localhost:*');
}
```

## 脅威検出システム

### 1. パターンベース検出

```typescript
import { detectXSSThreats } from '@/lib/security/xss-threat-detection';

const analysis = detectXSSThreats(userInput);
if (analysis.isThreatenening) {
  console.warn('Threat detected:', analysis.detectedThreats);
}
```

### 2. リアルタイム監視

```typescript
import { logSecurityEvent } from '@/lib/security/client-security-monitor';

// XSS攻撃の検出時
logSecurityEvent({
  type: 'xss_attempt',
  severity: 'high',
  details: { input: maliciousInput },
});
```

## テスト方法

### 1. 自動テスト

```typescript
describe('XSS Protection', () => {
  it('should block script injection', () => {
    const maliciousInput = '<script>alert("XSS")</script>';
    const result = sanitizeText(maliciousInput);
    expect(result).not.toContain('<script>');
  });
});
```

### 2. 手動テスト

以下の入力でテストを実行：

```
<script>alert('XSS')</script>
javascript:alert(1)
<img src=x onerror=alert(1)>
<svg onload=alert(1)>
<iframe src="javascript:alert(1)"></iframe>
<object data="javascript:alert(1)"></object>
<embed src="javascript:alert(1)">
<link rel="stylesheet" href="javascript:alert(1)">
<style>@import 'javascript:alert(1)';</style>
<meta http-equiv="refresh" content="0;url=javascript:alert(1)">
```

## 緊急時の対応

### 1. XSS攻撃の検出時

1. **即座にブロック**: 悪意のある入力を無害化
2. **ログ記録**: 攻撃の詳細を記録
3. **アラート送信**: セキュリティチームに通知
4. **影響範囲の調査**: 他のユーザーへの影響を確認

### 2. 対応手順

```typescript
// 緊急時の処理例
const handleSecurityIncident = (maliciousInput: string) => {
  // 1. 入力をブロック
  const safeInput = sanitizeText(maliciousInput);
  
  // 2. インシデントをログ
  logSecurityCritical('xss', 'XSS attack blocked', {
    originalInput: maliciousInput,
    sanitizedInput: safeInput,
    timestamp: new Date().toISOString(),
  });
  
  // 3. ユーザーに警告表示
  showSecurityWarning('無効な入力が検出されました');
  
  // 4. 管理者に通知（実装に応じて）
  notifySecurityTeam({
    type: 'xss_attempt',
    severity: 'critical',
    details: { input: maliciousInput },
  });
};
```

## 参考資料

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)

## 更新履歴

- 2024-09-15: 初版作成
- XSS攻撃パターンの分析と対策方法の文書化
- CiviLink固有の実装例の追加
- 緊急時対応手順の策定
