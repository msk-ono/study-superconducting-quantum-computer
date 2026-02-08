# 超伝導量子コンピュータ学習ノート

[![Deploy to GitHub Pages](https://github.com/msk-ono/study-superconducting-quantum-computer/actions/workflows/deploy.yml/badge.svg)](https://github.com/msk-ono/study-superconducting-quantum-computer/actions/workflows/deploy.yml)

超伝導量子コンピュータに関する物理原理やキャリブレーション手法をまとめた個人用勉強ノートです。

**🚀 公開サイト:** [https://msk-ono.github.io/study-superconducting-quantum-computer/](https://msk-ono.github.io/study-superconducting-quantum-computer/)

## 🛠 開発者向け情報

このプロジェクトは MkDocs で構成されたドキュメントサイトと、Rust で書かれた量子エラー訂正（QEC）シミュレーターの WASM モジュールで構成されています。

### 📋 必須ツール
- **Python 3.12+** & **uv**: ドキュメント管理
- **Rust** & **wasm-pack**: シミュレーター（WASM）のビルド

### 🚀 クイックスタート

```bash
# 依存関係のセットアップ
make setup

# 開発用サーバーの起動 (WASM も自動でビルドされます)
make serve
```

### 📂 プロジェクト構造
- `docs/`: Markdown ドキュメント
- `tools/qec_sim/`: Rust 製シミュレーター本体
- `Makefile`: ビルドと開発自動化用スクリプト

### 📜 Makefile の使い方
- `make setup`: `wasm-pack` 等のインストール
- `make build`: WASM とドキュメントのビルド
- `make serve`: ローカル開発サーバーの起動
- `make clean`: 中間成果物の削除

---
> [!NOTE]
> このリポジトリは LLM を使って作成した勉強ノートです。
