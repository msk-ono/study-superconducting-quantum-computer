/**
 * QEC Stabilizer Visualizer
 * Interactive visualization for quantum error correction codes
 */

window.simulator = null;
window.currentCode = "repetition_3";

// Initialize when WASM module is ready
async function initQECVisualizer() {
    try {
        // Import the WASM module
        // When using --target web, the default export is the init function
        const module = await import('./qec_sim.js');
        await module.default();

        // Make module available globally for debugging
        window.qecModule = module;

        // Initialize simulator with default code
        window.simulator = new module.QECSimulator(window.currentCode);

        console.log("QEC Visualizer initialized successfully");

        // Small delay to ensure container dimensions are ready
        setTimeout(() => {
            updateDisplay();
        }, 100);

    } catch (error) {
        console.error("Failed to initialize QEC visualizer:", error);
        document.getElementById("qec-error").textContent =
            `Error loading WASM module: ${error.message}`;
        document.getElementById("qec-error").style.display = "block";
    }
}

// Update all display elements
function updateDisplay() {
    if (!window.simulator) return;

    updateStabilizers();
    updateSyndrome();
    updateTannerGraph();
    updateCodeInfo();
    updateErrorControls();
}

// Update Tanner graph visualization using SVG
function updateTannerGraph() {
    const svg = document.getElementById("tanner-graph-svg");
    if (!svg) {
        console.error("SVG element not found!");
        return;
    }

    // Clear SVG
    svg.innerHTML = "";

    const stabilizers = JSON.parse(window.simulator.getStabilizers());
    const triggered = window.simulator.getTriggeredStabilizers();
    const nQubits = window.simulator.n_qubits;
    const nStabs = stabilizers.length;

    console.log("=== Tanner Graph Rendering ===");
    console.log("Raw stabilizers from Rust:", stabilizers);
    console.log(`nQubits: ${nQubits}, nStabs: ${nStabs}`);

    // Set explicit dimensions
    const containerWidth = svg.parentElement ? svg.parentElement.clientWidth : 800;
    const width = Math.max(containerWidth - 40, 400);
    const height = 400;

    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    console.log(`SVG dimensions: ${width}x${height}`);

    const qubitY = 60;
    const stabY = 340;
    const margin = 50;
    const qubitXStep = nQubits > 1 ? (width - 2 * margin) / (nQubits - 1) : 0;
    const stabXStep = nStabs > 1 ? (width - 2 * margin) / (nStabs - 1) : 0;

    // 1. Draw Edges - with extremely robust parsing
    let edgeCount = 0;

    stabilizers.forEach((stab, sIdx) => {
        // Extract ONLY the Pauli operators (I, X, Y, Z)
        // Remove ALL leading characters that aren't I/X/Y/Z
        let pauliString = stab;

        // Method 1: Remove known prefixes
        pauliString = pauliString.replace(/^[+\-i| ]*/, '');

        // Method 2: Find first occurrence of valid Pauli and take from there
        const firstPauliIndex = pauliString.search(/[IXYZ]/);
        if (firstPauliIndex !== -1) {
            pauliString = pauliString.substring(firstPauliIndex);
        }

        // Method 3: Filter to only keep IXYZ characters
        const cleanPauliString = pauliString.split('').filter(c => 'IXYZ'.includes(c)).join('');

        console.log(`S${sIdx}: "${stab}" → filtered: "${cleanPauliString}"`);

        // Draw edges for non-identity Paulis
        for (let qIdx = 0; qIdx < Math.min(cleanPauliString.length, nQubits); qIdx++) {
            const pauli = cleanPauliString[qIdx];

            if (pauli && pauli !== 'I') {
                const x1 = margin + (nQubits > 1 ? qIdx * qubitXStep : width / 2);
                const y1 = qubitY;
                const x2 = margin + (nStabs > 1 ? sIdx * stabXStep : width / 2);
                const y2 = stabY;

                // Create line with EXPLICIT styling
                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", x1);
                line.setAttribute("y1", y1);
                line.setAttribute("x2", x2);
                line.setAttribute("y2", y2);

                // Set BOTH class and direct attributes for maximum compatibility
                const isTriggered = triggered.includes(sIdx);
                line.setAttribute("class", `tanner-edge edge-${pauli.toLowerCase()}${isTriggered ? ' edge-triggered' : ''}`);

                // Direct style attributes - PRESERVE Pauli color even when triggered
                let strokeColor = "#666";  // Default gray
                if (pauli === 'X') strokeColor = "#ef5350";
                else if (pauli === 'Y') strokeColor = "#66bb6a";
                else if (pauli === 'Z') strokeColor = "#42a5f5";

                // For triggered edges: keep color but add visual emphasis
                line.setAttribute("stroke", strokeColor);
                line.setAttribute("stroke-width", isTriggered ? "5" : "2.5");
                line.setAttribute("stroke-opacity", isTriggered ? "1" : "0.6");

                // Add glow effect for triggered edges
                if (isTriggered) {
                    line.setAttribute("filter", "url(#glow)");
                    line.style.animation = "pulse-edge 1.5s ease-in-out infinite";
                }

                svg.appendChild(line);

                console.log(`  ✓ Edge ${edgeCount}: Q${qIdx}(${pauli})--S${sIdx} | (${x1.toFixed(1)},${y1})→(${x2.toFixed(1)},${y2}) | ${strokeColor}${isTriggered ? ' [TRIGGERED]' : ''}`);
                edgeCount++;
            }
        }
    });

    console.log(`📊 Total edges created: ${edgeCount}`);

    // Add SVG filter for glow effect on triggered edges
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    filter.setAttribute("id", "glow");
    filter.setAttribute("x", "-50%");
    filter.setAttribute("y", "-50%");
    filter.setAttribute("width", "200%");
    filter.setAttribute("height", "200%");

    const feGaussianBlur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
    feGaussianBlur.setAttribute("stdDeviation", "2.5");
    feGaussianBlur.setAttribute("result", "coloredBlur");
    filter.appendChild(feGaussianBlur);

    const feMerge = document.createElementNS("http://www.w3.org/2000/svg", "feMerge");
    const feMergeNode1 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
    feMergeNode1.setAttribute("in", "coloredBlur");
    const feMergeNode2 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
    feMergeNode2.setAttribute("in", "SourceGraphic");
    feMerge.appendChild(feMergeNode1);
    feMerge.appendChild(feMergeNode2);
    filter.appendChild(feMerge);

    defs.appendChild(filter);
    svg.insertBefore(defs, svg.firstChild);

    // 2. Draw Qubit Nodes
    for (let i = 0; i < nQubits; i++) {
        const x = margin + (nQubits > 1 ? i * qubitXStep : (width / 2 - margin));
        const y = qubitY;

        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", "15");
        circle.setAttribute("class", "tanner-node qubit-node");

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", x);
        text.setAttribute("y", y - 25);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("class", "node-label");
        text.textContent = `q${i}`;

        g.appendChild(circle);
        g.appendChild(text);
        svg.appendChild(g);
    }

    // 3. Draw Stabilizer Nodes
    stabilizers.forEach((_, i) => {
        const x = margin + (nStabs > 1 ? i * stabXStep : (width / 2 - margin));
        const y = stabY;
        const isTriggered = triggered.includes(i);

        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x - 15);
        rect.setAttribute("y", y - 15);
        rect.setAttribute("width", "30");
        rect.setAttribute("height", "30");
        rect.setAttribute("rx", "4");
        rect.setAttribute("class", `tanner-node stab-node ${isTriggered ? 'stab-triggered' : ''}`);

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", x);
        text.setAttribute("y", y + 35);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("class", "node-label");
        text.textContent = `S${i}`;

        g.appendChild(rect);
        g.appendChild(text);
        svg.appendChild(g);
    });
}

// Ensure resize handling
window.addEventListener('resize', () => {
    if (window.simulator) updateTannerGraph();
});

// Update error injection controls based on qubit count
function updateErrorControls() {
    const container = document.getElementById("error-injection-controls");
    if (!container) return;

    const nQubits = window.simulator.n_qubits;
    const appliedErrors = JSON.parse(window.simulator.getAppliedErrors());

    console.log("=== Error Controls Update ===");
    console.log("Applied errors:", appliedErrors);

    // Create a radio-button style grid
    let html = '<div class="error-controls-grid-radio">';

    for (let i = 0; i < nQubits; i++) {
        const qubitError = appliedErrors.find(e => e.qubit === i);
        const currentErrorType = qubitError ? qubitError.error_type : 'None';

        console.log(`Qubit ${i}: error=${currentErrorType}`);

        html += `<div class="qubit-error-control-radio">`;

        // Qubit label
        html += `<div class="qubit-label-radio">
            <span class="qubit-number-radio">q<sub>${i}</sub></span>
        </div>`;

        // Four radio-style buttons: X, Y, Z, なし
        html += `<div class="error-button-group-radio">`;

        html += `<button class="error-radio-btn btn-x-radio ${currentErrorType === 'X' ? 'selected' : ''}" 
                         onclick="handleErrorSelection(${i}, 'X')" 
                         title="Xエラー (ビット反転)">X</button>`;

        html += `<button class="error-radio-btn btn-y-radio ${currentErrorType === 'Y' ? 'selected' : ''}" 
                         onclick="handleErrorSelection(${i}, 'Y')" 
                         title="Yエラー (X+Z)">Y</button>`;

        html += `<button class="error-radio-btn btn-z-radio ${currentErrorType === 'Z' ? 'selected' : ''}" 
                         onclick="handleErrorSelection(${i}, 'Z')" 
                         title="Zエラー (位相反転)">Z</button>`;

        html += `<button class="error-radio-btn btn-none-radio ${currentErrorType === 'None' ? 'selected' : ''}" 
                         onclick="handleErrorSelection(${i}, 'None')" 
                         title="エラーなし">なし</button>`;

        html += `</div>`;
        html += `</div>`;
    }

    html += '</div>';

    container.innerHTML = html;
}

// Handle error selection with radio-button logic
window.handleErrorSelection = function (qubit, errorType) {
    if (!window.simulator) return;

    const appliedErrors = JSON.parse(window.simulator.getAppliedErrors());
    const currentError = appliedErrors.find(e => e.qubit === qubit);
    const currentErrorType = currentError ? currentError.error_type : 'None';

    console.log(`handleErrorSelection: qubit=${qubit}, errorType=${errorType}, current=${currentErrorType}`);

    // Toggle logic: if clicking the same button, deselect (clear error)
    if (currentErrorType === errorType) {
        // Deselect - clear the error
        if (errorType !== 'None') {
            try {
                window.simulator.clearQubitError(qubit);
                updateDisplay();
                showToast(`🔄 q${qubit} のエラーをクリア`, 'info');
            } catch (error) {
                console.error("Error clearing:", error);
            }
        }
    } else {
        // Select different option
        if (errorType === 'None') {
            // Clear error
            try {
                window.simulator.clearQubitError(qubit);
                updateDisplay();
                showToast(`🔄 q${qubit} のエラーをクリア`, 'info');
            } catch (error) {
                console.error("Error clearing:", error);
            }
        } else {
            // Apply new error (this will replace any existing error)
            injectError(qubit, errorType);
        }
    }
};

// Clear error from a specific qubit
window.clearQubitError = function (qubit) {
    if (!window.simulator) return;

    try {
        // Reset the specific qubit (Rust side should handle this)
        window.simulator.clearQubitError(qubit);
        updateDisplay();
        showToast(`🔄 量子ビット ${qubit} のエラーをクリアしました`, 'info');
    } catch (error) {
        console.error("Error clearing qubit error:", error);
        // Fallback: just update display
        updateDisplay();
    }
};

window.toggleErrorMenu = function (i) {
    const menus = document.querySelectorAll('.error-menu');
    const targetMenu = document.getElementById(`error-menu-${i}`);
    const isOpen = targetMenu.classList.contains('show');

    menus.forEach(m => m.classList.remove('show'));
    if (!isOpen) {
        targetMenu.classList.add('show');
    }

    // Close menu when clicking elsewhere
    const closeMenu = (e) => {
        if (!e.target.closest('.qubit-container')) {
            targetMenu.classList.remove('show');
            document.removeEventListener('click', closeMenu);
        }
    };
    document.addEventListener('click', closeMenu);
};

// Update stabilizer tableau display
function updateStabilizers() {
    const container = document.getElementById("stabilizer-tableau");
    if (!container) return;
    const stabilizers = JSON.parse(window.simulator.getStabilizers());
    const triggered = window.simulator.getTriggeredStabilizers();
    const nQubits = window.simulator.n_qubits;

    console.log("=== Stabilizer Tableau ===");
    console.log("Stabilizers:", stabilizers);
    console.log("Triggered:", triggered);

    let html = '<div class="tableau-container-enhanced">';
    html += '<table class="tableau-table-enhanced">';

    // Header row with larger, clearer labels
    html += '<thead><tr>';
    html += '<th class="tableau-header-enhanced row-num">#</th>';
    html += '<th class="tableau-header-enhanced sign-col">符号</th>';

    for (let i = 0; i < nQubits; i++) {
        html += `<th class="tableau-header-enhanced qubit-col">q<sub>${i}</sub></th>`;
    }
    html += '</tr></thead>';

    html += '<tbody>';
    stabilizers.forEach((stab, idx) => {
        const isTriggered = triggered.includes(idx);
        const rowClass = isTriggered ? 'row-triggered-enhanced' : '';

        html += `<tr class="tableau-row-enhanced ${rowClass}">`;

        // Row number
        html += `<td class="tableau-cell-enhanced row-num"><strong>S${idx}</strong></td>`;

        // Extract sign and Pauli string using same robust method as Tanner graph
        let pauliString = stab;
        let sign = '+';

        if (stab.startsWith('-')) {
            sign = '-';
        }

        // Remove all non-IXYZ characters
        pauliString = pauliString.split('').filter(c => 'IXYZ'.includes(c)).join('');

        // Sign cell with large, colored symbol
        html += `<td class="tableau-cell-enhanced sign-cell-enhanced ${sign === '-' ? 'sign-minus-enhanced' : 'sign-plus-enhanced'}">`;
        html += `<span class="sign-symbol">${sign}</span>`;
        html += `</td>`;

        // Pauli operators - make them MUCH larger and more visible
        for (let i = 0; i < Math.min(pauliString.length, nQubits); i++) {
            const pauli = pauliString[i];
            const pauliClass = `pauli-${pauli.toLowerCase()}-enhanced`;

            // Add special visual treatment for non-identity
            const isNonIdentity = pauli !== 'I';
            const cellClass = isNonIdentity ? 'pauli-active' : 'pauli-inactive';

            html += `<td class="tableau-cell-enhanced ${pauliClass} ${cellClass}">`;
            html += `<span class="pauli-operator">${pauli}</span>`;
            html += `</td>`;
        }

        html += '</tr>';
    });
    html += '</tbody></table></div>';

    container.innerHTML = html;
}

// Update syndrome display
function updateSyndrome() {
    const container = document.getElementById("syndrome-display");
    if (!container) return;

    const syndrome = JSON.parse(window.simulator.getSyndrome());
    const triggered = window.simulator.getTriggeredStabilizers();

    let html = '<div class="syndrome-grid">';

    syndrome.forEach((value, idx) => {
        const isTriggered = triggered.includes(idx);
        const statusClass = isTriggered ? 'triggered' : 'normal';
        const statusText = value === 1 ? '+1' : '-1';

        html += `<div class="syndrome-item ${statusClass}">`;
        html += `<span class="syndrome-label">S${idx}:</span>`;
        html += `<span class="syndrome-value">${statusText}</span>`;
        html += '</div>';
    });

    html += '</div>';

    // Error status
    const hasError = window.simulator.hasError();
    html += `<div class="error-status ${hasError ? 'has-error' : 'no-error'}">`;
    if (hasError) {
        html += `⚠️ Error detected! Triggered stabilizers: ${triggered.join(', ')}`;
    } else {
        html += '✓ No errors detected';
    }
    html += '</div>';

    container.innerHTML = html;
}

// Update code information display
function updateCodeInfo() {
    const container = document.getElementById("code-info");
    if (!container) return;

    const infoJson = window.qecModule.getCodeInfo(window.currentCode);
    if (!infoJson) return;

    const info = JSON.parse(infoJson);

    let html = `
        <div class="code-info-grid">
            <div class="info-item"><strong>Name:</strong> ${info.name}</div>
            <div class="info-item"><strong>Qubits:</strong> ${info.n_qubits}</div>
            <div class="info-item"><strong>Logical:</strong> ${info.n_logical}</div>
            <div class="info-item"><strong>Distance:</strong> ${info.distance}</div>
        </div>
        <div class="info-description">${info.description}</div>
    `;

    container.innerHTML = html;
}

// Event handlers
window.selectCode = function (codeName) {
    window.currentCode = codeName;
    if (window.simulator) {
        try {
            window.simulator.reset(codeName);
            updateDisplay();
        } catch (error) {
            console.error("Failed to select code:", error);
        }
    }
};

window.injectError = function (qubit, errorType) {
    if (!window.simulator) return;

    try {
        window.simulator.applyError(qubit, errorType);
        updateDisplay();

        // Visual feedback
        const btn = event.target;
        btn.style.animation = 'pulse 0.3s ease';
        setTimeout(() => {
            btn.style.animation = '';
        }, 300);

    } catch (error) {
        console.error("Failed to inject error:", error);
        alert(`Error: ${error.message}`);
    }
};

window.resetSimulator = function () {
    if (!window.simulator) return;

    try {
        window.simulator.reset(window.currentCode);
        updateDisplay();
    } catch (error) {
        console.error("Failed to reset:", error);
    }
};

window.randomError = function () {
    if (!window.simulator) return;

    const nQubits = window.simulator.n_qubits;
    const qubit = Math.floor(Math.random() * nQubits);
    const errorTypes = ['X', 'Y', 'Z'];
    const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];

    injectError(qubit, errorType);
};

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("qec-visualizer-container")) {
        initQECVisualizer();
    }
});

// Pulse animation CSS (will be added to qec.css)
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
`;
document.head.appendChild(style);
