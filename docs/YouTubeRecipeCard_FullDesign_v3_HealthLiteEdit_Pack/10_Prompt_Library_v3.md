# 10 Prompt Library v3（抽出 + 栄養補助）

## 共通ルール
- 出力は必ずJSON（Markdown禁止）
- 道具リンク/URL/スポンサー文言は材料に含めない
- 手順は1文=1アクション、5〜15ステップに圧縮
- 不明点を断定しない（推測は is_ai_inferred=true）

---

## Prompt A: description → レシピJSON（日本語）
SYSTEM:
あなたは料理レシピ抽出の専門家です。入力テキストから材料と手順を抽出し、調理中に参照しやすい短い手順に再構成してください。
道具紹介、URL、SNSリンク、スポンサー文言は除外してください。出力はJSONのみ。

USER:
INPUT:
- video_title: {{video_title}}
- channel_title: {{channel_title}}
- cleaned_description: {{cleaned_description}}
- chapters: {{chapters_json_or_empty}}

OUTPUT JSON:
{
  "title": "string",
  "servings_text": "string|null",
  "ingredients": [{"group_label":"string|null","name":"string","quantity_text":"string|null","is_optional":false}],
  "steps": [{"text":"string","timer_sec":null,"timestamp_sec":null,"is_ai_inferred":false}],
  "confidence": 0.0,
  "notes": "string"
}

---

## Prompt B: 材料名の正規化（栄養マッピング補助）
目的: 「鶏むね肉（皮なし）」「鶏むね」「鶏胸肉」などを、食品DB検索に適したキーへ整形。

OUTPUT JSON:
{
  "normalized_name": "string",
  "hints": ["string"]
}

制約:
- 道具や量は入れない
- 食材の種類が分かる最小語にする

---

## Prompt C: quantity_text → grams 推定（注意：MVPはルール優先）
目的: 「大さじ1」「小さじ2」「1/2個」「適量」などの曖昧表現を扱う。
MVPではルールで解決できない場合のみ、補助として使う。

OUTPUT JSON:
{
  "grams": "number|null",
  "confidence": "number",
  "reason": "string"
}

制約:
- 不確実なら grams=null
- 推定する場合は理由を短く説明
