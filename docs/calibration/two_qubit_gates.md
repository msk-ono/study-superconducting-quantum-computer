# 2量子ビットゲートの調整 (Two Qubit Gate Calibration)

固定周波数型のトランスモン量子ビットにおいて、マイクロ波のみで制御可能なエンタングルゲートとして **Cross-Resonance (CR)** ゲートが標準的に用いられています。
IBM Quantum のプロセッサなどで採用されている方式です。

## 1. Cross-Resonance (CR) ゲートの物理

### 有効ハミルトニアン
コントロール量子ビット (Qc) を、ターゲット量子ビット (Qt) の共鳴周波数 $\omega_t$ で駆動します。
量子ビット間に静的な結合 $J$ が存在するとき、Schrieffer-Wolff 変換を用いて系を対角化すると、以下のような有効相互作用ハミルトニアンが導かれます。

$$
H_{\text{eff}} \approx \frac{\hbar \Omega_{ZX}}{2} \sigma_z^{(c)} \sigma_x^{(t)} + \frac{\hbar \Omega_{IX}}{2} I^{(c)} \sigma_x^{(t)} + \frac{\hbar \Omega_{ZZ}}{2} \sigma_z^{(c)} \sigma_z^{(t)} + \dots
$$

- **$ZX$ 項 ($\sigma_z \otimes \sigma_x$)**: ゲート動作の主役となる項。コントロールの状態 ($|0\rangle, |1\rangle$) に応じて、ターゲットのX回転の向き (符号) が反転します。
- **$IX$ 項 ($I \otimes \sigma_x$)**: コントロールの状態によらないターゲットの回転。単なるクロストーク成分であり、除去する必要があります。
- **$ZZ$ 項 ($\sigma_z \otimes \sigma_z$)**: 条件付き位相回転。これはゲート操作中に位相誤差として蓄積します。

### Echo-CR シーケンス
単純な CR パルスでは、$IX$ や $ZZ$ といった不要な項の影響を受けます。これらを打ち消すために、コントロール量子ビットを反転させる **Echo-CR** シーケンスが用いられます。

1. **CR(+)**: 正の CR パルスを印加 ($ZX + IX + ZZ$)
2. **$X_\pi^{(c)}$**: コントロールを反転
3. **CR(-)**: 負の CR パルスを印加 ($ZX' + IX' + ZZ'$)
4. **$X_\pi^{(c)}$**: コントロールを元に戻す

このシーケンスにより、コントロールの状態に依存しない項 ($IX$) や、符号が変わらない項 ($ZZ$) などのノイズが相殺され、純粋な $ZX$ 相互作用のみを抽出できます。

## 2. キャリブレーションの実装 (Qubex)

Qubex では、`qubex.experiment.mixin.calibration_mixin.py` に CR ゲートの調整ルーチンが実装されています。

### ハミルトニアン・トモグラフィー (`measure_cr_dynamics`)
有効ハミルトニアンの各係数 ($\Omega_{ZX}, \Omega_{IX}$) を実験的に求めます。
コントロール量子ビットを $|0\rangle$ および $|1\rangle$ に準備し、ターゲット量子ビットに CR パルスを照射した際のラビ振動を測定します。

- コントロール $|0\rangle$ のとき: $\Omega_{|0\rangle} = \Omega_{IX} + \Omega_{ZX}$
- コントロール $|1\rangle$ のとき: $\Omega_{|1\rangle} = \Omega_{IX} - \Omega_{ZX}$

これらを測定することで、以下のように成分を分離できます。

$$
\Omega_{ZX} = \frac{\Omega_{|0\rangle} - \Omega_{|1\rangle}}{2}, \quad \Omega_{IX} = \frac{\Omega_{|0\rangle} + \Omega_{|1\rangle}}{2}
$$

### Active Cancellation (`update_cr_params`)
Echo-CR だけではキャンセルしきれない $IX$ 成分 (クロストーク) を、ターゲット量子ビットに逆位相の補正パルス (Cancellation Tone) を印加することで動的に除去します。

$$
\Omega_{\text{cancel}} \approx -\frac{\Omega_{IX}}{|\Omega_{\text{drive}}|} \cdot \Omega_{\text{drive}}
$$

Qubex の `update_cr_params` は、トモグラフィーの結果に基づいてこの補正パルスの振幅と位相を自動更新します。

### ゲート調整 (`calibrate_zx90`)
最終的に $ZX$ 相互作用による回転角が $\pi/2$ ($90^\circ$) になるように、CR パルスの幅または振幅を調整します。これが $ZX_{90}$ ゲートとなります。
この $ZX_{90}$ ゲートと、1量子ビットゲート ($Z_{-90}, X_{90}$) を組み合わせることで、標準的な **CNOT ゲート** が構成されます。

```python
# CNOT decomposition example
# CNOT = (I ⊗ X_{-90}) · ZX_{90} · (Z_{90} ⊗ X_{90})
```

## 3. Clifford 群の生成 (RB用)

Randomized Benchmarking (RB) を行うには、Clifford 群のランダムサンプリングが必要です。
2量子ビットの Clifford 群は 11,520 個の要素を持ちます。Qubex の `CliffordGenerator` は、これらを効率的に生成します。

生成ロジックは「基本ゲートセット」に基づいています。
- **1Q Gates**: $\{I, X_{\pm \pi/2}, Y_{\pm \pi/2}, X_\pi, Y_\pi\}$ から生成される 24個の 1Q Clifford 群。
- **2Q Interaction**: $ZX_{90}$ (または CNOT)。

2Q Clifford 群は以下の4つのクラスに分類されます。

1. **Single-Qubit class**: ゲート相互作用なし ($C_1 \otimes C_2$)
2. **CNOT-like class**: 奇数回のエンタングルゲートを含む
3. **SWAP-like class**: SWAP ゲートを含む
4. **Double-CNOT class**: 偶数回のエンタングルゲートを含む

Qubex はこれらのクラス構造を利用して、任意の Clifford ゲートを基本パルスの列に分解・合成します。
