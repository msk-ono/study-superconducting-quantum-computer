# 読み出しの調整 (Readout Calibration)

超伝導量子ビットの読み出しには、分散読み出し (Dispersive Readout) と呼ばれる手法が用いられます。
これは、量子ビットと結合した共振器 (Readout Resonator) の周波数が、量子ビットの状態に依存してシフトする現象を利用したものです。

## 1. 分散読み出しの理論 (Theory)

### Jaynes-Cummings モデル
量子ビットと共振器の結合系は Jaynes-Cummings ハミルトニアンで記述されます。
両者の周波数差 (離調) $\Delta = |\omega_q - \omega_r|$ が結合強度 $g$ よりも十分に大きい **分散領域** ($g \ll \Delta$) において、有効ハミルトニアンは以下のように近似されます。

$$
H_{\text{disp}} \approx \hbar (\omega_r + \chi \sigma_z) a^\dagger a + \frac{\hbar \omega_q}{2} \sigma_z
$$

ここで $\chi \approx g^2 / \Delta$ は **分散シフト (Dispersive Shift)** と呼ばれます。

- **量子ビットが $|0\rangle$ ($\sigma_z = +1$) のとき**: 共振器の周波数は $\omega_r + \chi$
- **量子ビットが $|1\rangle$ ($\sigma_z = -1$) のとき**: 共振器の周波数は $\omega_r - \chi$

つまり、量子ビットの状態によって共振器の共鳴周波数が $2\chi$ だけ変化します。
この周波数シフトを、マイクロ波の透過特性 (S21) や反射特性 (S11) の位相・振幅変化として検出することで、状態を読み出します。

## 2. 状態識別 (State Discrimination)

読み出し信号は、IQミキサによって同相成分 (I) と直交成分 (Q) に復調されます。
複素平面 (IQ平面) 上でプロットすると、各状態に対応する信号は「ブロッブ (Blob)」と呼ばれる分布を持ちます。

- **重心間距離 (Signal)**: $|0\rangle$ と $|1\rangle$ のブロッブ中心間の距離。大きいほど識別しやすい。
- **広がり (Noise)**: システムノイズや量子ゆらぎによる分布の分散。

正確な状態判定を行うためには、これら2つの分布を最適に分離する境界線を見つける必要があります。

### Gaussian Mixture Model (GMM)
Qubex では、単純な線形判別ではなく、**混合ガウスモデル (GMM: Gaussian Mixture Model)** を用いた分類器 `StateClassifierGMM` を採用しています。
GMM はデータの分布を複数のガウス分布の重ね合わせとしてモデル化します。

$$
p(\mathbf{x}) = \sum_{k \in \{0, 1\}} \pi_k \mathcal{N}(\mathbf{x} | \boldsymbol{\mu}_k, \boldsymbol{\Sigma}_k)
$$

- $\boldsymbol{\mu}_k$: 状態 $k$ の平均ベクトル (ブロッブの中心)
- $\boldsymbol{\Sigma}_k$: 共分散行列 (ブロッブの形状・広がり)
- $\pi_k$: 混合係数

このモデルは **EMアルゴリズム (Expectation-Maximization)** を用いて学習されます。
これにより、ブロッブが歪んでいる場合や、サイズが異なる場合でも、最適な事後確率 $P(k|\mathbf{x})$ を計算し、最も確からしい状態に分類することができます。

### Qubex での実装 (`StateClassifierGMM`)

`qubex.measurement.state_classifier_gmm.py` に実装されています。

```python
# データのフィッティング (学習)
classifier = StateClassifierGMM.fit(
    data={0: data_ground, 1: data_excited},
    n_init=10  # EMアルゴリズムの初期化回数
)

# 未知データの予測
# predict() は最も確率の高いラベル (0 or 1) を返す
predicted_labels = classifier.predict(new_iq_data)

# 確率の取得
# predict_proba() は各状態の確率 [p0, p1] を返す
probabilities = classifier.predict_proba(new_iq_data)
```

この分類器を用いることで、シングルショット読み出し (Single-Shot Readout) のフィデリティを最大化できます。
