---
hide:
  - navigation
search:
  exclude: true
---

# 超伝導量子コンピュータ学習ノート

<div class="hero" markdown>
<p align="center">
  <img src="https://github.com/msk-ono/study-superconducting-quantum-computer/actions/workflows/deploy.yml/badge.svg" alt="Deploy to GitHub Pages">
</p>

<p align="center" style="font-size: 1.2rem; font-weight: 500; margin-bottom: 2rem;">
超伝導回路を用いた量子コンピュータの仕組み、理論、そして実機でのキャリブレーション手法について<br>
学んだ内容を体系的にまとめたテクニカルノート。
</p>

<p align="center" markdown>
  [:material-book-open-page-variant: 基礎理論から始める](basic/index.md){ .md-button .md-button--primary }
  [:material-chip: 実機制御を学ぶ](superconducting/index.md){ .md-button }
</p>
</div>

---

<div class="grid cards" markdown>

-   :material-book-open-variant:{ .lg .middle } **量子理論の基礎**

    ---

    量子ビットの状態表示やブロッホ球、量子ゲートの数学的基礎について解説します。

    [:material-book-open-page-variant: 理論概要](basic/index.md)  
    [:material-atom: ブロッホ球](basic/bloch.md)

-   :material-shield-sync:{ .lg .middle } **量子エラー訂正 (QEC)**

    ---

    スタビライザー形式や表面符号など、誤り訂正の基礎とシミュレーション。

    [:material-shield-check: QEC概要](qec/index.md)  
    [:material-play-circle: スタビライザー・デモ](qec/stabilizer_demo.md)

-   :material-chip:{ .lg .middle } **超伝導量子技術**

    ---

    Transmonなどの超伝導量子ビットの実現方法や物理的な動作原理を深掘りします。

    [:material-chip: 技術概要](superconducting/index.md)  
    [:material-format-list-numbered: 動作原理](superconducting/principle.md)

-   :material-tune-vertical:{ .lg .middle } **キャリブレーション**

    ---

    量子ビットを制御・最適化するための測定や調整手法を詳述します。

    [:octicons-arrow-right-24: 手法概要](calibration/index.md)  
    [:material-sine-wave: ラビ振動](calibration/rabi.md)  
    [:material-alpha-q-box-outline: 1量子ビットゲート](calibration/single_qubit_gates.md)  
    [:material-radar: 読み出し調整](calibration/readout.md)  
    [:material-vector-combine: 2量子ビットゲート](calibration/two_qubit_gates.md)

-   :material-tools:{ .lg .middle } **ソフトウェア**

    ---

    キャリブレーション自動化ツールやシミュレーションソフトウェアの解説と使い方。

    [:material-monitor-dashboard: QDash](software/qdash.md)  
    [:material-server: Qubex](software/qubex.md)  
    [:material-python: scqubits](software/scqubits.md)  
    [:material-vector-polyline: SQCircuit](software/sqcircuit.md)

</div>

## 🎯 本サイトについて

このプロジェクトは、量子コンピュータの物理的な実現方法として有力な「超伝導回路」に焦点を当てています。
単純な理論解説にとどまらず、**実機を動かすための実践的な知識**（パルス制御、キャリブレーションフロー、システムアーキテクチャ）の蓄積を目的としています。

<div class="grid" markdown>
<div markdown>
### :material-school: 学べること
- 量子力学と回路量子電磁力学 (cQED) の基礎
- マイクロ波制御とパルスシェイピング
- 忠実度向上のための較正テクニック
</div>
<div markdown>
### :material-flask: 実践的な内容
- Python (scqubits, QTiP) によるシミュレーション
- MkDocs + WASM によるインタラクティブなデモ
</div>
</div>
