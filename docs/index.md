# 超伝導量子コンピュータ学習ノート

<p align="left">
  <img src="https://github.com/msk-ono/study-superconducting-quantum-computer/actions/workflows/deploy.yml/badge.svg" alt="Deploy to GitHub Pages">
</p>

超伝導回路を用いた量子コンピュータの仕組み、理論、そして実機でのキャリブレーション手法について学んだ内容をまとめています。

## 🎯 本サイトの目的

量子コンピュータの物理的な実現方法として有力な「超伝導回路」に焦点を当て、以下の内容を整理・記録することを目的としています。

*   **量子力学の基礎**: 量子状態やゲート操作の数学的・直観的理解
*   **ハードウェアの原理**: 超伝導ビット（Transmon等）の物理と動作メカニズム
*   **実機制御**: キャリブレーションプログラムやパルス制御の基礎

---

## 🚀 コンテンツ

<div class="grid cards" markdown>

-   :material-book-open-variant:{ .lg .middle } __量子理論の基礎__

    ---

    量子ビットの状態表示やブロッホ球、量子ゲートの数学的基礎について。

    [:octicons-arrow-right-24: 基礎理論を読む](basic/index.md)  
    [:octicons-arrow-right-24: ブロッホ球を見る](basic/bloch.md)

-   :material-chip:{ .lg .middle } __超伝導量子技術__

    ---

    超伝導回路による量子ビットの実現方法や動作原理について。

    [:octicons-arrow-right-24: 技術概要を読む](superconducting/index.md)  
    [:octicons-arrow-right-24: 動作原理を学ぶ](superconducting/principle.md)

-   :material-tune-vertical:{ .lg .middle } __キャリブレーション__

    ---

    量子ビットを制御・最適化するための測定や調整手法について。

    [:octicons-arrow-right-24: 手法概要](calibration/index.md)  
    [:octicons-arrow-right-24: ラビ振動](calibration/rabi.md)  
    [:octicons-arrow-right-24: 1量子ビットゲート (DRAG)](calibration/single_qubit_gates.md)  
    [:octicons-arrow-right-24: 読み出し調整](calibration/readout.md)  
    [:octicons-arrow-right-24: 2量子ビットゲート (CR)](calibration/two_qubit_gates.md)

-   :material-tools:{ .lg .middle } __ツール__

    ---

    キャリブレーションを自動化・管理するためのソフトウェア。

    [:octicons-arrow-right-24: QDash](software/qdash.md)  
    [:octicons-arrow-right-24: Qubex](software/qubex.md)

</div>

---

## 🛠️ 将来的な拡張

実機（IBM Quantum等）から取得したデータの解析結果や、より高度な制御パルスデザイン（DRAG、Optimal Control等）についても順次まとめていく予定です。
