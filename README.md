# DirNet

**DirNet** は、ディレクトリ構造を「集約（composition）」や「継承（super）」の関係を通して視覚的に整理・編集できる、Electronベースのデスクトップアプリケーションです。  
**DirNet** is a desktop application built with Electron for visualizing and managing directory structures using "composition" and "super" relationships.

---

## 🔧 主な機能 | Features

- 📁 **ディレクトリ構造の可視化**  
  合成・継承の構造を階層図として描画します。  
  *Visualizes the composition/super hierarchy as an interactive graph.*

- ➕ **ディレクトリの追加・管理開始**  
  任意のディレクトリを新規作成または管理対象に設定できます。  
  *Create new directories or convert existing ones into managed units.*

- ✏️ **構成情報の編集**  
  `.config`ファイルを通して、合成・継承の関係を編集可能です。  
  *Edit composition/super relationships directly from the UI.*

- ❌ **管理解除（非破壊）**  
  `.config`ファイルを削除し、管理対象から外すことが可能です（ディレクトリ自体は削除されません）。  
  *Unmanage a directory by removing its `.config` file, without deleting the folder.*

---

## 📦 インストール方法 | Installation

### ✅ 推奨：実行ファイルからのインストール（簡単）  
Windows / macOS の `x64` および `arm64` 環境向けに、インストーラー付きの実行ファイルを用意しています。  
*We provide ready-to-use installers for both `x64` and `arm64` systems on Windows and macOS.*

本リポジトリ内の dirnet-darwin-arm64-1.0.0.zip (for macOS) または dirnet-win32-x64-1.0.0.zip (for Windows) をダウンロードして実行してください．
*Please download and run dirnet-darwin-arm64-1.0.0.zip (for macOS) or dirnet-win32-x64-1.0.0.zip (for Windows) from this repository.*

インストーラーを実行するだけで、すぐにDirNetを起動できます。  
*Simply launch the installer and DirNet will be ready to use.*

---

### 🛠 開発者向け：ソースから起動する場合  ※まずはじめにnode.jsをインストールしてください．
*For developers who want to run from source:*

1. このリポジトリをクローン  
   *Clone this repository:*
   ```bash
   git clone https://github.com/your-username/dirnet.git
   ```

2. application ディレクトリに移動  
*Move into the application directory:*
cd dirnet/application

2. 依存関係をインストール  
*Install dependencies:*
```bash
npm install electron --save-dev
```

4. Electron アプリケーションを起動  
*Start the Electron app in development mode:*
```bash
npm run start
```
