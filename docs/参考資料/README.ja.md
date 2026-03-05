これは Civilink フロントエンドのリポジトリです。

## 目次 <!-- omit in toc -->

- [リンク集](#リンク集)
- [開発サーバー起動](#開発サーバー起動)
- [環境構築](#環境構築)
  - [前提](#前提)
    - [Node.js](#nodejs)
    - [CiviLink バックエンド](#civilink-バックエンド)
  - [環境変数ファイルを配置する](#環境変数ファイルを配置する)
  - [依存関係のインストールする](#依存関係のインストールする)
  - [開発サーバーを起動する](#開発サーバーを起動する)
  - [バックエンドサーバーの接続先を変更する](#バックエンドサーバーの接続先を変更する)
- [コンポーネント](#コンポーネント)
  - [UIコンポーネント](#uiコンポーネント)
  - [アイコンコンポーネント](#アイコンコンポーネント)
- [デプロイ](#デプロイ)
  - [デプロイ環境](#デプロイ環境)
  - [デプロイ先URL](#デプロイ先url)

## リンク集

- 本番サーバー: https://civilink.malme.app
- ステージングサーバー: https://civilink.malme.app
- バックエンドリポジトリ: https://github.com/structuralengine/civilink-backend
- 要件定義ドキュメント: https://docs.google.com/spreadsheets/d/14yEx06SSStMnWJgh5elPMKNJeq_jSxm4/edit
- Google Drive: https://drive.google.com/drive/folders/1j8wj6abncymkPn4vUvMoWwTm1Nv8VIYf
- UIコンポーネント: [/components/ui/README.ja.md](/components/ui/README.ja.md)
- アイコンコンポーネント: [/components/ui/icons/README.ja.md](/components/ui/icons/README.ja.md)

## 開発サーバー起動

開発サーバーは以下のコマンドで起動できます。  
ただし初回は、 [環境構築](#環境構築) を行う必要があります。

```bash
npm run dev
```

## 環境構築

### 前提

#### editor設定(\*VSCodeの場合)

このプロジェクトでは GTS スタイルをベースに、Prettier による自動整形を行います。
整形は ESLint によってトリガーされるため、Prettier 拡張は無効化してください。

#### Node.js

Node.jsの実行環境 (+ npm) が必要です。  
必要なバージョンは [package.json](./package.json) に記載されています。

WindowsOS であれば `nvm-windows` を使用して、いつでもNode.jsのバージョンを変更できるようにしておくと便利です。  
[nvm-windows](https://github.com/coreybutler/nvm-windows)

#### CiviLink バックエンド

バックエンドの接続先は、ローカル、STG、PROD、検証用の4つのサーバーを切り替えて使用できます。

ローカルでバックエンドのAPIサーバーを立てて接続する場合は、  
[CiviLink Backend](https://github.com/structuralengine/civilink-backend) の環境を構築し、バックエンドの開発サーバーを立てておく必要があります。  
バックエンドの詳細は [CiviLink Backend](https://github.com/structuralengine/civilink-backend) をご参照ください。

### 環境変数ファイルを配置する

Google Drive の [ローカル開発用](https://drive.google.com/drive/folders/1tDVueEqDwHlbQOyKKV568wSH114B4vp5) から `.env` ファイルを2種類ダウンロードします。  
ダウンロードしたファイルを、このプロジェクトのルートに配置します。  
このとき、ファイル名先頭の `.` が消えてしまう場合があります。  
消えている場合は、ファイル名を変更したうえで配置してください。

※ アクセス権限がない場合は、 04\_開発 > 開発 > 照査システム(CiviLink) > 開発 > environment > ローカル開発用 へのアクセス権限を付与してもらってください。

### 依存関係のインストールする

```bash
npm install
```

### 開発サーバーを起動する

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

### バックエンドサーバーの接続先を変更する

[`.env.development`](./.env.development) ファイル内の `NEXT_PUBLIC_API_URL` 環境変数を切り替えることで、バックエンドとして使用するサーバーを変更することができます。  
データ保護のため、フロントエンドの開発時は基本的に、ローカルサーバーかSTGサーバーをご使用ください。

## コンポーネント

### UIコンポーネント

このプロジェクトでは、Shadcn/ui + Radix UIをベースにしたUIコンポーネントを使用しています。
詳細な使用方法については、[UIコンポーネントのドキュメント](/components/ui/README.ja.md)を参照してください。

### アイコンコンポーネント

Lucide Iconsをベースにしたアイコンコンポーネントを提供しています。
詳細な使用方法については、[アイコンコンポーネントのドキュメント](/components/ui/icons/README.ja.md)を参照してください。

## デプロイ

デプロイは GitHub Actions にて、それぞれ以下の条件で自動的に行われています。

### デプロイ環境

- STG（ステージング）: `release` ブランチへのプルリクエストがマージされた時
- PROD（本番）: `main` ブランチへのプルリクエストがマージされた時

### デプロイ先URL

- 本番環境: https://civilink.malme.app
- ステージング環境: https://civilink.malme.app
