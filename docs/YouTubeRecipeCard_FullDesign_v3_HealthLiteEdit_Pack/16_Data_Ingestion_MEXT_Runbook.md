# 16 食品成分データ取り込みランブック（MVP）

## 目的
- 日本語の材料名から栄養（PFC/kcal/salt）を推定するため、食品マスタをDBに取り込む。

## 方針
- データソースは「日本食品標準成分表」の食品成分データを想定。
- アプリ内に出典表記を入れる（公開前に一次情報を確認）。

## 手順（推奨）
1) 成分表データ（CSV等）を入手し、手元に保存する
2) 取り込みスクリプトを用意して、
   - food_items（食品名、カテゴリ、コード）
   - food_nutrients_per_100g（kcal/PFC/salt等）
   をINSERT/UPSERTする

## 取り込みスクリプト（擬似コード）
- /scripts/ingest_mext.ts を作る（Node推奨）
- 入力: mext_foods.csv, mext_nutrients.csv
- 出力: DBへUPSERT

Pseudo:
1) parse CSV rows
2) for each food:
     upsert food_items(source='mext', source_food_code=..., name_ja=..., category=...)
3) for each nutrient row:
     upsert food_nutrients_per_100g(food_id=..., kcal=..., protein_g=..., fat_g=..., carbs_g=..., salt_g=...)

## 同義語辞書（MVPで必須）
- /data/food_synonyms_seed.csv を作り、よくある表記揺れを登録
  - 例: 鶏むね, 鶏胸肉 → 鶏むね肉
  - 例: じゃがいも, ジャガイモ → ばれいしょ

## 取り込み後の検証
- foods/search?q=鶏むね で候補が出る
- 代表レシピで nutrition confidence が上がる
