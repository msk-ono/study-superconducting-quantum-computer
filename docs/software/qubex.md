# Qubex (Qubit Experiment Framework)

Qubex は、超伝導量子ビットのパルスレベル制御と実験を行うための Python フレームワークです。
実験の記述、シミュレーション、実機へのデプロイを統一的に扱うことができます。

## 主な機能

- **Experiment & Simulator**:
    - 実機実験 (`Experiment`) と物理シミュレーション (`QuantumSimulator`) を同じインターフェースで記述可能 (一部)
    - Lindblad マスター方程式による時間発展シミュレーション (`mesolve`)

- **Pulse Control**:
    - 任意の波形定義 (Rect, Gaussian, DRAG, etc.)
    - ミキサー補正や歪み補正の実装

- **Analysis**:
    - 測定データのフィッティング (Rabi, Ramsey, T1, T2 等)
    - プロット機能 (Matplotlib ベース)

## クラス構造

- `qubex.experiment.Experiment`: 実験全体を管理するクラス (接続、測定、解析)
- `qubex.simulator.QuantumSimulator`: シミュレータクラス
- `qubex.pulse`: パルス波形を定義するモジュール
- `qubex.analysis`: データ解析ルーチン

## ディレクトリ構造 (externals/qubex)

- `src/qubex/`: ソースコード
    - `experiment/`: 実験ロジック
    - `simulator/`: シミュレーションロジック
- `docs/examples/`: Jupyter Notebook による使用例 (Referenceとして非常に有用)

## Pulse Library (`qubex.pulse`)

Qubex は多様なパルス形状をサポートしています。

- **`Rect`**: 矩形パルス。
- **`Gaussian`**: ガウス波形。
- **`Drag`**: DRAG 補正付きガウス波形。
- **`RaisedCosine`**: Raised Cosine 波形。
- **`Sintegral`**: Sintegral 波形。

各パルスは `qubex.pulse.Pulse` クラスを継承し、`func` メソッドで波形生成ロジックを実装しています。

## Analysis (`qubex.analysis`)

実験データの解析には `qubex.analysis.fitting` モジュールが使われます。
`scipy.optimize` の `curve_fit` をラッパーしており、主要な物理モデルに対応しています。

- **`fit_cosine`**: ラビ振動などの解析に使用。初期値をフーリエ変換 (FFT) から推定するため、ロバストなフィッティングが可能です。
- **`fit_damped_cos`**: T2 Ramsey や ラビ振動の減衰解析に使用。
- **`fit_exp_decay`**: T1 緩和の解析に使用。
- **`fit_resonator_reflection`**: 共振器の反射特性 ($S_{11}$) の解析に使用 (Circle Fit)。
