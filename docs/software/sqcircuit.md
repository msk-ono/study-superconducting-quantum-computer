# SQCircuit

`SQCircuit` は、任意の超伝導量子回路の解析と最適化を行うためのオープンソース Python パッケージです。
スタンフォード大学の研究者によって開発され、物理的な記述からハミルトニアンを構築・対角化することで、量子回路のモデル化、解析、最適化を行う包括的なフレームワークを提供します。
PyTorch を用いた自動微分機能も統合されており、回路特性の勾配計算やカスタム損失関数の最適化にも対応しています。

## 主な機能 (Features)

- **任意の回路解析**: 物理的な記述からハミルトニアンを構築し、対角化します。
- **回路特性の計算**: エネルギースペクトル、コヒーレンス時間、遷移行列要素、結合演算子などを計算できます。
- **自動微分 (Auto-differentiation)**: PyTorch を統合し、勾配計算を用いた回路最適化が可能です。

## 動作原理 (Operating Principles)

SQCircuit は、回路図（ネットリスト）から直接ハミルトニアンを導出し、解析を行います。

1.  **回路グラフ解析**: 回路をグラフとして表現し、ループ解析を行います。これにより、インダクタンス行列とキャパシタンス行列を構築します。
2.  **基底の選択と変換**:
    - **変数変換**: 座標変換を行い、周期的変数（閉じたループに関連）と非周期的変数（アイランドに関連）を分離します。
    - **基底生成**: 各モードに対して適切な基底（調和振動子基底または電荷基底）を選択し、全体のヒルベルト空間を構成します。
3.  **ハミルトニアンの構築と対角化**: 生成された基底上でハミルトニアン行列を計算し、対角化してエネルギースペクトルを得ます。

## 実装詳細 (Implementation Details)

SQCircuit は、物理的な記述の柔軟性と計算効率を両立させるために設計されています。

### 主なクラス

- **`Circuit`**: 回路全体を表すクラス。`elements` 辞書（エッジごとの素子リスト）を受け取り、解析を実行します。ハミルトニアンの構築 (`hamiltonian` メソッド) や対角化 (`diag` メソッド) を管理します。
- **`CircuitEdge`**: 回路グラフのエッジを表し、そのエッジ上の素子（キャパシタ、インダクタ、ジョセフソン接合）の情報を保持します。
- **`Inductor`, `Capacitor`, `Junction`**: 各回路素子を表すクラス。

### 自動微分と最適化

SQCircuit の大きな特徴は、PyTorch バックエンドによる自動微分のサポートです。

- **`Circuit` クラスのパラメータ**: 回路素子の値（$E_J, E_C, E_L$ など）を PyTorch の Tensor として保持することで、計算グラフを構築します。
- **勾配計算**: エネルギースペクトルや行列要素を入力パラメータで微分することが可能です。これにより、所望の量子ビット特性（例：アンハーモニシティの最大化、緩和時間の最大化）を実現する回路パラメータを勾配法で探索できます。

### Conda

```bash
conda install -c conda-forge sqcircuit
```

### Pip

```bash
pip install SQcircuit
```

> ⚠️ **Note**: SQCircuit は QuTiP バージョン 5.0 以上と互換性があります。

## ドキュメント

公式ドキュメントは以下で公開されています。

- [sqcircuit.org](https://sqcircuit.org)

## サンプル (Examples)

様々な回路の解析例が提供されています。

- [examples.sqcircuit.org](https://docs.sqcircuit.org/examples.html)
- [Jupyter Notebook Examples (GitHub)](https://github.com/stanfordLINQS/SQcircuit-examples)

## 引用

研究で使用する場合は、以下の論文を引用してください。

> Taha Rajabzadeh, Zhaoyou Wang, Nathan Lee, Takuma Makihara, Yudan Guo, Amir H. Safavi-Naeini,
> *Analysis of arbitrary superconducting quantum circuits accompanied by a Python package: SQcircuit*,
> Quantum 7, 1118,
> https://quantum-journal.org/papers/q-2023-09-25-1118/

> Taha Rajabzadeh, Alex Boulton-McKeehan, Sam Bonkowsky, David I. Schuster, Amir H. Safavi-Naeini,
> *A General Framework for Gradient-Based Optimization of Superconducting Quantum Circuits using Qubit Discovery as a Case Study*,
> arXiv:2408.12704 (2024),
> https://arxiv.org/abs/2408.12704
