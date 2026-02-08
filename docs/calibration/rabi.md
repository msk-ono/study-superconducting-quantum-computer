# ラビ振動 (Rabi Oscillation)

ラビ振動は、量子ビットに対して共鳴するマイクロ波パルスを照射した際に、基底状態 $|0\rangle$ と励起状態 $|1\rangle$ の間で確率振幅が周期的に振動する現象です。
これは量子ビットの制御 (パルス振幅の校正) において最も基本的かつ重要な実験です。

## 1. 理論的背景 (Theoretical Background)

### トランスモン量子ビットのハミルトニアン
トランスモン量子ビットは、非調和振動子 (Duffing Oscillator) としてモデル化されます。実験室系 (Lab Frame) でのハミルトニアンは以下のように記述されます。

$$
H_{\text{lab}} = \hbar \omega_q a^\dagger a + \frac{\hbar \alpha}{2} a^\dagger a^\dagger a a
$$

ここで、

- $\omega_q$: 量子ビット周波数 ($|0\rangle \to |1\rangle$ 遷移周波数)
- $\alpha$: 非調和性 (Anharmonicity, $\alpha = \omega_{12} - \omega_{01}$)。通常トランスモンでは負の値 ($\approx -300$ MHz) をとります。
- $a^\dagger, a$: 生成・消滅演算子

### 駆動ハミルトニアン
マイクロ波ドライブ $\mathcal{E}(t) = E_0 \cos(\omega_d t + \phi)$ が印加されたとき、駆動項は以下のようになります。

$$
H_{\text{drive}} = \hbar \Omega \cos(\omega_d t + \phi) (a + a^\dagger)
$$

ここで $\Omega$ はラビ周波数 (ドライブ強度に比例) です。

### 回転座標系とRWA
時間依存性を消去するため、駆動周波数 $\omega_d$ で回転する座標系 (Rotating Frame) に移行します。
ユニタリ変換 $U(t) = e^{i \omega_d t a^\dagger a}$ を適用し、高速振動項を無視する **回転波近似 (RWA: Rotating Wave Approximation)** を行うと、有効ハミルトニアンは以下のようになります。

$$
H_{\text{rot}} \approx \hbar \Delta a^\dagger a + \frac{\hbar \alpha}{2} a^\dagger a^\dagger a a + \frac{\hbar \Omega}{2} (a e^{-i\phi} + a^\dagger e^{i\phi})
$$

ここで $\Delta = \omega_q - \omega_d$ は離調 (Detuning) です。

### ラビ振動の式
共鳴条件 ($\Delta = 0$) かつ 2準位近似 (非調和性項を無視して $\{|0\rangle, |1\rangle\}$ 部分空間のみを考える) の下では、ハミルトニアンは以下のように簡単化されます。

$$
H_{\text{Rabi}} = \frac{\hbar \Omega}{2} \sigma_x
$$

(ここで $\phi=0$ としました)

このハミルトニアンによる時間発展を解くと、励起状態の占有確率は以下のように振動します。

$$
P_{|1\rangle}(t) = \sin^2\left(\frac{\Omega t}{2}\right)
$$

離調 $\Delta$ が存在する場合、振動周波数は $\tilde{\Omega} = \sqrt{\Omega^2 + \Delta^2}$ となり、振動の振幅 (コントラスト) は以下のように減少します。

$$
P_{|1\rangle}(t) = \frac{\Omega^2}{\Omega^2 + \Delta^2} \sin^2\left(\frac{\sqrt{\Omega^2 + \Delta^2} t}{2}\right)
$$

これが「シェブロンパターン (Chevron Pattern)」として観測される起源です。

## 2. 実験データの解析 (Fitting)

実際の実験データには、緩和 ($T_1$) やデコヒーレンス ($T_2$) の影響が含まれるため、減衰振動として観測されます。
Qubex の `qubex.analysis.fitting` モジュールでは、以下の **減衰コサイン関数 (Damped Cosine)** モデルを用いてフィッティングを行います。

$$
f(t) = A \cdot e^{-t/\tau} \cdot \cos(\omega t + \phi) + B
$$

- **$A$ (Amplitude)**: 振動の振幅。読み出し忠実度 (Readout Fidelity) が低いと小さくなります。
- **$\tau$ (Tau)**: 減衰時定数。ラビ駆動中のデコヒーレンス時間を反映します。
- **$\omega$ (Frequency)**: ラビ周波数。これが $\Omega$ に対応します。
- **$\phi$ (Phase)**: 位相オフセット。
- **$B$ (Offset)**: オフセット。

```python
# qubex/analysis/fitting.py
def func_damped_cos(x, amp, tau, freq, phase, offset):
    return amp * np.exp(-x / tau) * np.cos(2 * np.pi * freq * x + phase) + offset
```

このフィッティング結果から、$\pi$ パルス ($180^\circ$回転) に必要なパルス幅 $t_{\pi}$ または振幅 $A_{\pi}$ を決定します。

## 3. Qubex での実装詳細

Qubex のシミュレータ `qubex.simulator.quantum_system` では、上述のハミルトニアンが `QuantumSystem` クラス内で定義されています。

### 静的ハミルトニアン
`Transmon` クラスは以下のように定義されており、非調和性項を含んでいます。

```python
# qubex/simulator/quantum_system.py
@cache
def get_object_hamiltonian(self, label: str) -> qt.Qobj:
    # ...
    # H = ω a†a + 0.5 α a†a†aa
    return omega * (ad @ a) + 0.5 * alpha * (ad @ ad @ a @ a)
```

回転座標系でのハミルトニアン `get_rotating_object_hamiltonian` では、線形項 $\omega a^\dagger a$ が取り除かれています (フレームが $\omega_q$ で回転していると仮定)。

```python
@cache
def get_rotating_object_hamiltonian(self, label: str) -> qt.Qobj:
    # H_rot = 0.5 α a†a†aa
    return 0.5 * alpha * (ad @ ad @ a @ a)
```

実験プロトコル `CalibrationMixin` は、この物理モデルに基づいて `calibrate_pi_pulse` などのメソッドを提供し、実際の量子プロセッサまたはシミュレータ上でラビ振動実験を自動実行します。
