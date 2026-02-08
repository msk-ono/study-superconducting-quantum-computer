# 動作原理

## ジョセフソン接合と非調和性

超伝導量子ビットの核心は **ジョセフソン接合 (Josephson Junction)** にあります。
通常のLC共振回路 (調和振動子) では、エネルギー準位が等間隔 ($E_n = \hbar \omega (n+1/2)$) に並ぶため、特定の遷移 ($|0\rangle \leftrightarrow |1\rangle$) だけを選択的に操作することができません。

ジョセフソン接合は**非線形インダクタンス**として機能し、ポテンシャルを非調和にします。これによりエネルギー準位が不等間隔になり、マイクロ波パルスの周波数を $|0\rangle \to |1\rangle$ の遷移周波数 ($\omega_{01}$) に合わせることで、2準位系として扱うことが可能になります。

## Transmon Qubit のハミルトニアン

Transmon Qubit は、クーパー対箱 (Cooper Pair Box) に対して $E_J \gg E_C$ の領域 (Transmon regime) で動作するように設計されています。
ここで、$E_J$ はジョセフソンエネルギー、$E_C$ は帯電エネルギーです。

### 重要なパラメータ

超伝導量子ビットの振る舞いを記述する上で、以下のパラメータが重要になります (Qubex シミュレータのパラメータにも対応しています)。

- **周波数 (Frequency, $\omega_{01}/2\pi$)**:
  基底状態 $|0\rangle$ と第一励起状態 $|1\rangle$ の間のエネルギー差に対応する周波数。通常 4-8 GHz 程度です。

- **非調和性 (Anharmonicity, $\alpha/2\pi$)**:
  $\omega_{12} - \omega_{01}$ で定義されます。Transmon の場合、$\alpha \approx -E_C$ となり、通常 -200 MHz ～ -300 MHz 程度の負の値をとります。
  この非調和性が大きいほど、上位準位への漏れ (leakage) を防ぎつつ高速なゲート操作が可能になります。

- **緩和時間 ($T_1$, Relaxation Time)**:
  励起状態 $|1\rangle$ から基底状態 $|0\rangle$ へエネルギーを失って崩壊するまでの特性時間。

- **位相緩和時間 ($T_2$, Dephasing Time)**:
  量子重ね合わせ状態の位相関係が崩れるまでの特性時間。

### 参照

- `qubex.simulator.Transmon`: シミュレーションにおける量子ビットモデルの定義
  ```python
  qubit = Transmon(
      label="Q01",
      frequency=7.648,      # GHz
      anharmonicity=-0.333, # GHz
      relaxation_rate=1/T1,
      dephasing_rate=1/T2,
  )
  ```
