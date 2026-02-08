# scqubits

`scqubits` は、超伝導量子ビットのシミュレーションを行うためのオープンソース Python ライブラリです。
一般的な超伝導量子ビットのエネルギー準位、外部パラメータに対するエネルギー準位の変化、行列要素などを計算するための便利な機能を提供します。
また、QuTiP とのインターフェースも備えており、超伝導量子ビットと調和振動子モードからなる複合ヒルベルト空間を扱うことも可能です。

## 主な機能 (Features)

- **エネルギー準位の計算**: 各種超伝導量子ビットのエネルギー準位を簡単に計算できます。
- **外部パラメータ依存性のプロット**: 磁束などの外部パラメータに対するエネルギー準位の変化を可視化できます。
- **行列要素の計算**: 演算子の行列要素を計算できます。
- **QuTiP インターフェース**: 結合系などのシミュレーションに QuTiP を利用できます。

## 動作原理 (Operating Principles)

scqubits は、超伝導回路のハミルトニアンを特定の基底で構成し、数値的に対角化することでエネルギー準位と波動関数を求めます。

1.  **基底の選択**: 各量子ビットタイプ（Transmon, Fluxonium, Zero-Piなど）に適した基底（電荷基底、調和振動子基底など）が内部で選択されます。
2.  **ハミルトニアンの構成**: 選択された基底を用いて、ハミルトニアン行列を構築します。例えば Transmon の場合、電荷基底 $|n\rangle$ を用いて $4E_C(\hat{n}-n_g)^2$ （対角成分）と $-E_J/2 \sum (|n\rangle\langle n+1| + |n+1\rangle\langle n|)$ （非対角成分）を計算します。
3.  **対角化**: `scipy.linalg.eigh` (密行列) や `scipy.sparse.linalg.eigsh` (疎行列) を用いてハミルトニアンを対角化し、固有値（エネルギー）と固有ベクトルを求めます。

## 実装詳細 (Implementation Details)

scqubits のコアロジックは `scqubits.core` モジュールに集約されています。

### クラス階層

- **`QuantumSystem`**: 全ての量子系の基底クラス。パラメータ管理やウィジェット生成などの共通機能を提供します。
- **`QubitBaseClass`**: 量子ビットの基底クラス。スペクトル計算 (`eigenvals`, `eigensys`) やプロット機能 (`plot_wavefunction`) のインターフェースを定義します。
- **`Transmon`, `Fluxonium`, etc.**: 具体的な量子ビットクラス。それぞれのハミルトニアン定義と行列要素計算ロジックを持ちます。

### 重要なメソッド

- **`hamiltonian()`**: ハミルトニアン行列を返します。多くの量子ビットクラスでは、疎行列または密行列として実装されています。
- **`_evals_calc(evals_count)`**: 指定された数の固有値を計算します。
- **`_esys_calc(evals_count)`**: 指定された数の固有値と固有ベクトルを計算します。

### 数値計算バックエンド

- 密行列計算には `numpy` と `scipy.linalg` が使用されます。
- 疎行列計算には `scipy.sparse` が使用されます。
- `settings.Multiproc` を設定することで、パラメータスイープ時の並列計算（`pathos` ライブラリ利用）が可能です。

### Conda (推奨)

```bash
conda install -c conda-forge scqubits
```

### Pip

```bash
pip install scqubits
```

## ドキュメント

詳細なドキュメントは以下を参照してください。

- [scqubits Documentation](https://scqubits.readthedocs.io)

## 関連リポジトリ

- [scqubits-doc](https://github.com/scqubits/scqubits-doc): ドキュメントのソースコード
- [scqubits-examples](https://github.com/scqubits/scqubits-examples): サンプルノートブック

## 引用

研究で使用する場合は、以下の論文を引用してください。

> Peter Groszkowski and Jens Koch,
> *scqubits: a Python package for superconducting qubits*,
> Quantum 5, 583 (2021).
> https://quantum-journal.org/papers/q-2021-11-17-583/

> Sai Pavan Chitta, Tianpu Zhao, Ziwen Huang, Ian Mondragon-Shem, and Jens Koch,
> *Computer-aided quantization and numerical analysis of superconducting circuits*,
> New J. Phys. 24 103020 (2022).
> https://iopscience.iop.org/article/10.1088/1367-2630/ac94f2
