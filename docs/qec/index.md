# 量子誤り訂正 (QEC)

量子誤り訂正 (Quantum Error Correction, QEC) は、量子コンピュータにおけるエラーを検出・訂正するための技術です。

## 概要

量子ビットは環境とのデコヒーレンスやゲート操作の誤りにより、容易にエラーが発生します。量子誤り訂正は、冗長性を持たせた符号化によりこれらのエラーを検出・訂正し、信頼性の高い量子計算を可能にします。

## スタビライザー形式

スタビライザー形式 (Stabilizer Formalism) は、量子誤り訂正符号を効率的に記述・シミュレートする数学的枠組みです。

### パウリ演算子

基本的な単一量子ビットのパウリ演算子:

$$
I = \begin{pmatrix} 1 & 0 \\ 0 & 1 \end{pmatrix}, \quad
X = \begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix}, \quad
Y = \begin{pmatrix} 0 & -i \\ i & 0 \end{pmatrix}, \quad
Z = \begin{pmatrix} 1 & 0 \\ 0 & -1 \end{pmatrix}
$$

多量子ビット系では、これらのテンソル積 (例: $X_0 \otimes Z_1 \otimes I_2$) でパウリ文字列を構成します。

### スタビライザー群

量子誤り訂正符号は、スタビライザー群 $\mathcal{S}$ により定義されます:

- スタビライザー群: すべての符号語を固有値 +1 で安定化するパウリ演算子の集合
- 符号空間: $|\psi\rangle$ が符号語 $\Leftrightarrow$ すべての $S \in \mathcal{S}$ に対して $S|\psi\rangle = |\psi\rangle$

$n$ 量子ビット系で $k$ 論理量子ビットを符号化する場合、独立なスタビライザー生成元は $n-k$ 個必要です。

### シンドローム測定

エラー検出は、各スタビライザーを測定することで行います:

- 測定結果が +1: そのスタビライザーが満たされている (正常)
- 測定結果が -1: エラーにより反交換している (異常)

測定結果のパターン (シンドローム) から、発生したエラーを特定できます。

## 代表的な QEC 符号

### 繰り返し符号 (Repetition Code)

最も単純な符号。ビット反転エラーのみを検出・訂正します。

- **3量子ビット繰り返し符号**
  - 符号化: $|0\rangle \to |000\rangle$, $|1\rangle \to |111\rangle$
  - スタビライザー: $Z_0Z_1, Z_1Z_2$
  - 距離: 3 (1個のX誤りを訂正可能)

### 5量子ビット完全符号 (5-qubit Perfect Code)

任意の単一量子ビットエラーを訂正できる最小の符号。

- 物理量子ビット: 5
- 論理量子ビット: 1
- 符号距離: 3
- スタビライザー生成元: 4個

### Steane 符号

CSS (Calderbank-Shor-Steane) 符号の一種。

- 物理量子ビット: 7
- 論理量子ビット: 1
- 符号距離: 3
- 特徴: トランスバーサルな Clifford ゲートセットが実装可能

### 表面符号 (Surface Code)

最も実用的とされる符号。2次元格子上に配置され、局所的な測定のみで実装可能。

- 高い閾値誤り率 (~1%)
- 局所的なスタビライザー測定
- スケーラブルな実装

## 参考資料

- Nielsen & Chuang, "Quantum Computation and Quantum Information"
- Gottesman, "Stabilizer Codes and Quantum Error Correction"
- Fowler et al., "Surface codes: Towards practical large-scale quantum computation"

## インタラクティブデモ

[スタビライザーシミュレータ](stabilizer_demo.md) で実際にエラー注入とシンドローム検出を体験できます。
