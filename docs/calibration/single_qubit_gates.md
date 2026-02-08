# 1量子ビットゲートの調整 (Single Qubit Gate Calibration)

超伝導量子ビットにおいて、高速かつ高精度なゲート操作を実現するためには、単純な矩形波やガウス波形のパルスでは不十分な場合があります。
特にパルス長を短くするとスペクトルが広がり、非調和性により近接している高次準位 ($|1\rangle \to |2\rangle$ 遷移など) への漏れ (Leakage) や位相誤差が生じます。

これを抑制するための標準的な技術が **DRAG (Derivative Removal by Adiabatic Gate)** です。

## 1. DRAG 理論 (DRAG Theory)

### ハミルトニアンエンジニアリング
回転座標系における駆動ハミルトニアンを考えます。ここで、制御パルス $\Omega(t)$ に複素成分を持たせるとします。

$$
H(t) = \frac{\hbar \Delta}{2} \sigma_z + \frac{\hbar \Omega_x(t)}{2} \sigma_x + \frac{\hbar \Omega_y(t)}{2} \sigma_y
$$

通常のガウスパルス ($\Omega_x(t) = \mathcal{E}(t), \Omega_y(t) = 0$) では、断熱条件が破れると状態がブロッホ球の軌道から外れてしまいます。
DRAG理論では、パルスの包絡線の時間微分に比例する成分を直交成分 ($\Omega_y$) に加えることで、この逸脱を補正します。

補正項は以下のように導出されます。

$$
\Omega_y(t) = -\frac{\dot{\Omega}_x(t)}{\alpha}
$$

ここで $\alpha$ は非調和性です。この補正により、有効ハミルトニアンにおける高次項や位相誤差項がキャンセルされます。

### DRAG パルスの定義
Qubex の `qubex.pulse.library.drag` では以下のように実装されています。

$$
\text{Pulse}(t) = \Omega(t) + i \cdot \beta \cdot \frac{d\Omega(t)}{dt}
$$

理論的には $\beta = -1/\alpha$ が理想ですが、実際にはAWGから量子ビットまでの伝送路での波形歪みなどが存在するため、$\beta$ は実験的な校正パラメータとして扱われます。

```python
# qubex/pulse/library/drag.py の実装イメージ
if beta is None:
    values = Omega
else:
    # dOmega はガウス関数の時間微分
    # d/dt exp(-t^2/2σ^2) = -(t/σ^2) * exp(...)
    dOmega = -(t - duration / 2) / (sigma**2) * Omega
    
    # 虚部 (Qチャネル) に微分項を追加
    values = Omega + beta * 1j * dOmega
```

## 2. キャリブレーション手順

DRAG パルスの調整 (`calibrate_drag_hpi_pulse` 等) は、通常以下のステップで行われます。

### Step 1: 振幅調整 (Rabi)
まずは $\beta=0$ (または前回の値) でラビ振動を行い、所望の回転角 (例: $\pi/2$) を与える振幅 $A$ を決定します。

### Step 2: $\beta$ スキャン (Motzoi Sequence)
振幅を固定したまま、DRAG係数 $\beta$ をスイープします。
評価には、位相誤差に敏感なパルスシーケンスを用います。例えば $X_{\pi/2}$ パルスと $X_{-\pi/2}$ パルスを組み合わせたシーケンスなどが用いられます。

$$
U = X_{\pi/2} \cdot X_{-\pi/2} \Rightarrow I \quad (\text{理想})
$$

位相誤差がある場合、状態が完全に $|0\rangle$ に戻らず、励起状態の占有率が増加します。この誤差を最小化する $\beta$ を探索します。
`qubex.experiment.mixin.CalibrationMixin.calibrate_drag_beta` では、多項式フィッティングを用いて最適な $\beta$ を算出します。

### Step 3: 反復 (Iteration)
$\beta$ を変えるとパルスの実効的なパワーが変わるため、再度振幅調整が必要になることがあります。Qubex では `n_iterations` パラメータでこのループ回数を指定できます。

## 3. パルスシェイピング (Pulse Shaping)

Qubex は DRAG 以外にも様々な窓関数 (Window Functions) をサポートしています。

### Raised Cosine
矩形波に近いフラットトップを持ちながら、立ち上がり/立ち下がりをコサイン関数で滑らかにした波形です。
周波数スペクトルがガウス波形よりも狭帯域であるため、周波数混雑が激しいマルチ量子ビット環境での Cross-Resonance ゲートや読み出しパルスによく用いられます。

```python
# qubex/pulse/library/raised_cosine.py
Omega = amplitude * (1.0 - np.cos(2 * np.pi * t / duration)) * 0.5
```

### Sintegral
特定の周波数成分 (例: 隣接量子ビットの周波数や $1/2$ 遷移周波数) をヌル点に配置するように設計されたパルス形状です。
