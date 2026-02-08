# スタビライザーシミュレータ

量子誤り訂正符号のインタラクティブシミュレータです。エラーを注入してシンドロームパターンを観察できます。

<div id="qec-error" style="display: none;"></div>

<div style="display: flex; gap: 24px; flex-wrap: wrap;">
    <!-- Left column: Simulator -->
    <div style="flex: 2; min-width: 400px;">
        <div id="qec-visualizer-container">
            <div class="code-selector">
                <button onclick="selectCode('repetition_3')">3量子ビット繰り返し符号</button>
                <button onclick="selectCode('five_qubit')">5量子ビット完全符号</button>
                <button onclick="selectCode('steane')">Steane符号</button>
                <button onclick="selectCode('surface_d3')">表面符号 (d=3)</button>
            </div>

            <div id="code-info"></div>

            <h3>スタビライザータブロー</h3>
            <div class="legend-box">
                <strong>📊 読み方:</strong>
                <span class="legend-item"><strong>#列:</strong> スタビライザー番号 (S0, S1, ...)</span>
                <span class="legend-item"><strong>符号列:</strong> <span style="color: #2e7d32; font-weight: bold;">+</span> = 固有値 +1 / <span style="color: #c62828; font-weight: bold;">-</span> = 固有値 -1</span>
                <span class="legend-item"><strong>演算子:</strong>
                    <span style="background: #ffcdd2; color: #b71c1c; padding: 2px 6px; border-radius: 3px; font-weight: bold;">X</span> ビット反転検出 /
                    <span style="background: #c8e6c9; color: #1b5e20; padding: 2px 6px; border-radius: 3px; font-weight: bold;">Y</span> X+Z検出 /
                    <span style="background: #bbdefb; color: #0d47a1; padding: 2px 6px; border-radius: 3px; font-weight: bold;">Z</span> 位相反転検出 /
                    <span style="color: #9e9e9e;">I</span> 恒等演算子
                </span>
                <span class="legend-item" style="background: #fff8e1; padding: 4px 8px; border-left: 3px solid #ff9800;">🔥 黄色ハイライト = エラー検出中</span>
            </div>
            <div id="stabilizer-tableau"></div>

            <h3>Tanner グラフ (パリティチェック)</h3>
            <div class="legend-box">
                <strong>🔗 凡例:</strong>
                <span class="legend-item">⚪ 量子ビット (物理) / ⬜ スタビライザー (チェック)</span>
                <span class="legend-item">
                    <span style="color: #ef5350; font-weight: bold;">━━</span> X /
                    <span style="color: #66bb6a; font-weight: bold;">━━</span> Y /
                    <span style="color: #42a5f5; font-weight: bold;">━━</span> Z 相互作用
                </span>
                <hr style="margin: 8px 0; border: none; border-top: 1px solid #eee;">
                <span class="legend-item">🔴 <strong>エラー注入:</strong> 量子ビットが赤く光り、そこから影響を受けるチェックへの線が点滅します。</span>
            </div>

            <div class="tanner-graphs-wrapper" style="display: flex; gap: 16px; flex-wrap: wrap; margin: 16px 0;">
                <div style="flex: 1; min-width: 350px;">
                    <h4 style="text-align: center; margin-bottom: 8px; color: #ef5350;">X-checks (位相反転 Z エラー等を検出)</h4>
                    <div id="tanner-graph-container-x" class="tanner-graph-container">
                        <svg id="tanner-graph-svg-x" width="100%" height="300" style="overflow: visible;"></svg>
                    </div>
                </div>
                <div style="flex: 1; min-width: 350px;">
                    <h4 style="text-align: center; margin-bottom: 8px; color: #42a5f5;">Z-checks (ビット反転 X エラー等を検出)</h4>
                    <div id="tanner-graph-container-z" class="tanner-graph-container">
                        <svg id="tanner-graph-svg-z" width="100%" height="300" style="overflow: visible;"></svg>
                    </div>
                </div>
            </div>

            <h3>シンドローム</h3>
            <div id="syndrome-display"></div>

            <div class="control-panel">
                <div class="control-section">
                    <h4>エラー注入</h4>
                    <p>量子ビットを選択してエラーを注入:</p>
                    <div id="error-injection-controls"></div>
                </div>

                <div class="action-buttons">
                    <button class="btn-random" onclick="randomError()">ランダムエラー</button>
                    <button class="btn-reset" onclick="resetSimulator()">リセット</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Right column: Usage & Tips -->
    <div style="flex: 1; min-width: 300px;">
        <div class="admonition note">
            <p class="admonition-title">使い方</p>
            <ol>
                <li><strong>符号を選択</strong>: 上部のボタンで符号を選択します</li>
                <li><strong>スタビライザー確認</strong>: 格子表示で生成元を確認します<br>
                    <span class="pauli-i">I</span>: 恒等, <span class="pauli-x">X</span>: Bit, <span class="pauli-y">Y</span>: Bit+Phase, <span class="pauli-z">Z</span>: Phase</li>
                <li><strong>エラー注入</strong>: 量子ビットにエラーを注入します</li>
                <li><strong>シンドローム観察</strong>: <span style="color: #ff9800; font-weight: bold;">-1 (点滅)</span> がエラー検出です</li>
            </ol>
        </div>

        <div class="admonition info">
            <p class="admonition-title">Tips</p>
            <ul>
                <li><strong>繰り返し符号</strong>: Xエラー検出用 (S0=Z0Z1)</li>
                <li><strong>5量子ビット符号</strong>: 任意の単一エラーを検出可能</li>
                <li><strong>表面符号</strong>: 2次元格子の局所的測定</li>
            </ul>
        </div>

        <div class="admonition info">
            <p class="admonition-title">実装について</p>
            Rust + WebAssembly によるスタビライザー形式シミュレーション。
        </div>

        <div class="admonition note">
            <p class="admonition-title">注意</p>
            Clifford ゲートとパウリ演算子のみ対応。
        </div>

    </div>
</div>
