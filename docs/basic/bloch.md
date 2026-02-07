# Bloch 球の可視化

ここでの Bloch 球は、純粋状態 $|\psi\rangle = \cos(\frac{\theta}{2})|0\rangle + e^{i\phi}\sin(\frac{\theta}{2})|1\rangle$ を表します。

<div id="bloch-sphere-container" style="width: 100%; height: 500px; background-color: #f0f0f0; border-radius: 8px; margin-bottom: 20px;"></div>

## コントロール

<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #ddd;">
  <div class="arithmatex" style="margin-bottom: 15px;">
    <strong>Angles:</strong>
    <label class="arithmatex">$\theta$: <span id="theta-val">0.00</span> $\pi$</label>
    <input type="range" id="theta-slider" min="0" max="1" step="0.01" value="0" style="width: 100%;">
    
    <label class="arithmatex">$\phi$: <span id="phi-val">0.00</span> $\pi$</label>
    <input type="range" id="phi-slider" min="0" max="2" step="0.01" value="0" style="width: 100%;">
  </div>

  <div style="margin-bottom: 15px;">
    <strong>Gates:</strong>
    <button class="md-button" onclick="window.applyGate('X')">X</button>
    <button class="md-button" onclick="window.applyGate('Y')">Y</button>
    <button class="md-button" onclick="window.applyGate('Z')">Z</button>
    <button class="md-button" onclick="window.applyGate('H')">H</button>
    <button class="md-button arithmatex" onclick="window.resetBloch()">Reset $|0\rangle$</button>
  </div>

  <div style="display: flex; gap: 20px; flex-wrap: wrap;">
    <div style="flex: 1; min-width: 200px;">
        <strong>Current State Vector:</strong>
        <div id="state-vector-display" class="arithmatex" style="font-family: monospace; background: white; padding: 10px; border: 1px solid #eee; min-height: 40px;">
            $|0\rangle$
        </div>
    </div>
    <div style="flex: 1; min-width: 200px;">
        <strong>Last Operation:</strong>
        <div id="matrix-display" class="arithmatex" style="font-family: monospace; background: white; padding: 10px; border: 1px solid #eee; min-height: 40px;">
            -
        </div>
    </div>
  </div>
</div>

!!! info
    JavaScript (Three.js) を使用してブラウザ上で描画しています。

