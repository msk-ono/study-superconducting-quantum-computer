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
    updateTannerGraph("tanner-graph-svg-x", "X");
    updateTannerGraph("tanner-graph-svg-z", "Z");
    updateCodeInfo();
    updateErrorControls();
}

// Update Tanner graph visualization using SVG
function updateTannerGraph(targetSvgId, typeFilter) {
    const svg = document.getElementById(targetSvgId);
    if (!svg) {
        console.warn(`SVG element ${targetSvgId} not found!`);
        return;
    }

    // Clear SVG
    svg.innerHTML = "";

    const stabilizersRaw = JSON.parse(window.simulator.getStabilizers());
    const triggered = window.simulator.getTriggeredStabilizers();
    const nQubits = window.simulator.n_qubits;

    // Filter stabilizers based on type
    // X-graph: stabilizers containing X or Y (detects Z/Phase errors)
    // Z-graph: stabilizers containing Z or Y (detects X/Bit errors)
    const relevantStabs = [];
    stabilizersRaw.forEach((stab, idx) => {
        let pauliString = stab.replace(/^[+\-i| ]*/, '');
        const firstPauliIndex = pauliString.search(/[IXYZ]/);
        if (firstPauliIndex !== -1) pauliString = pauliString.substring(firstPauliIndex);
        const cleanPauliString = pauliString.split('').filter(c => 'IXYZ'.includes(c)).join('');

        const hasX = cleanPauliString.includes('X') || cleanPauliString.includes('Y');
        const hasZ = cleanPauliString.includes('Z') || cleanPauliString.includes('Y');

        if ((typeFilter === 'X' && hasX) || (typeFilter === 'Z' && hasZ)) {
            relevantStabs.push({
                originalIdx: idx,
                cleanPauli: cleanPauliString,
                isTriggered: triggered.includes(idx)
            });
        }
    });

    const nStabs = relevantStabs.length;

    // Set explicit dimensions
    const containerWidth = svg.parentElement ? svg.parentElement.clientWidth : 400;
    const width = Math.max(containerWidth - 20, 300);
    const height = 300;

    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const qubitY = 50;
    const stabY = 250;
    const margin = 40;
    const qubitXStep = nQubits > 1 ? (width - 2 * margin) / (nQubits - 1) : 0;
    const stabXStep = nStabs > 1 ? (width - 2 * margin) / (nStabs - 1) : 0;

    // 1. Get applied errors
    const appliedErrors = JSON.parse(window.simulator.getAppliedErrors());
    const erroredQubitIndices = appliedErrors.map(e => e.qubit);

    // 2. Draw Edges
    relevantStabs.forEach((stabInfo, sLocalIdx) => {
        const cleanPauliString = stabInfo.cleanPauli;

        for (let qIdx = 0; qIdx < Math.min(cleanPauliString.length, nQubits); qIdx++) {
            const pauli = cleanPauliString[qIdx];

            // Only draw edges relevant to the current graph type
            const isRelevantEdge = (typeFilter === 'X' && (pauli === 'X' || pauli === 'Y')) ||
                (typeFilter === 'Z' && (pauli === 'Z' || pauli === 'Y'));

            if (pauli && pauli !== 'I' && isRelevantEdge) {
                const x1 = margin + (nQubits > 1 ? qIdx * qubitXStep : width / 2);
                const y1 = qubitY;
                const x2 = margin + (nStabs > 1 ? sLocalIdx * stabXStep : width / 2);
                const y2 = stabY;

                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", x1);
                line.setAttribute("y1", y1);
                line.setAttribute("x2", x2);
                line.setAttribute("y2", y2);

                const qubitError = appliedErrors.find(e => e.qubit === qIdx);
                const errorType = qubitError ? qubitError.error_type : null;

                // Highlight logic: 
                // X-checks detect Z/Y errors. Z-checks detect X/Y errors.
                let shouldHighlight = false;
                if (errorType) {
                    if (typeFilter === 'X' && (errorType === 'Z' || errorType === 'Y')) shouldHighlight = true;
                    if (typeFilter === 'Z' && (errorType === 'X' || errorType === 'Y')) shouldHighlight = true;
                }

                // Add classes for styling
                let classes = `tanner-edge edge-${pauli.toLowerCase()}`;
                if (shouldHighlight) classes += ' edge-error';
                line.setAttribute("class", classes);

                // Direct style attributes
                let strokeColor = "#ccc";
                if (pauli === 'X') strokeColor = "#ef5350";
                else if (pauli === 'Y') strokeColor = "#66bb6a";
                else if (pauli === 'Z') strokeColor = "#42a5f5";

                line.setAttribute("stroke", strokeColor);

                if (shouldHighlight) {
                    line.setAttribute("stroke-width", "4");
                    line.setAttribute("stroke-opacity", "1");
                    line.style.animation = "pulse-error-edge 2s ease-in-out infinite";
                } else {
                    line.setAttribute("stroke-width", "1.5");
                    line.setAttribute("stroke-opacity", "0.4");
                }

                svg.appendChild(line);
            }
        }
    });

    // 3. Draw Qubit Nodes
    for (let i = 0; i < nQubits; i++) {
        const x = margin + (nQubits > 1 ? i * qubitXStep : width / 2);
        const y = qubitY;

        const qubitError = appliedErrors.find(e => e.qubit === i);
        const errorType = qubitError ? qubitError.error_type : null;

        // Highlight logic for qubit nodes same as edges
        let shouldHighlight = false;
        if (errorType) {
            if (typeFilter === 'X' && (errorType === 'Z' || errorType === 'Y')) shouldHighlight = true;
            if (typeFilter === 'Z' && (errorType === 'X' || errorType === 'Y')) shouldHighlight = true;
        }

        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", "14");

        let classes = 'tanner-node qubit-node';
        if (shouldHighlight) {
            classes += ` qubit-error qubit-error-${errorType.toLowerCase()}`;
        }
        circle.setAttribute("class", classes);

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", x);
        text.setAttribute("y", y - 22);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("class", "node-label");
        text.textContent = `q${i}`;

        g.appendChild(circle);
        g.appendChild(text);
        svg.appendChild(g);
    }

    // 4. Draw Stabilizer Nodes
    relevantStabs.forEach((stabInfo, i) => {
        const x = margin + (nStabs > 1 ? i * stabXStep : width / 2);
        const y = stabY;
        const isTriggered = stabInfo.isTriggered;

        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x - 12);
        rect.setAttribute("y", y - 12);
        rect.setAttribute("width", "24");
        rect.setAttribute("height", "24");
        rect.setAttribute("rx", "3");
        rect.setAttribute("class", `tanner-node stab-node ${isTriggered ? 'stab-triggered' : ''}`);

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", x);
        text.setAttribute("y", y + 30);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("class", "node-label");
        text.textContent = `S${stabInfo.originalIdx}`;

        g.appendChild(rect);
        g.appendChild(text);
        svg.appendChild(g);
    });

    // Add filter if it doesn't exist
    if (!document.getElementById("glow-filter")) {
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
        filter.setAttribute("id", "glow-filter");
        filter.setAttribute("x", "-50%"); filter.setAttribute("y", "-50%");
        filter.setAttribute("width", "200%"); filter.setAttribute("height", "200%");
        const feGaussianBlur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
        feGaussianBlur.setAttribute("stdDeviation", "2.5");
        feGaussianBlur.setAttribute("result", "coloredBlur");
        filter.appendChild(feGaussianBlur);
        const feMerge = document.createElementNS("http://www.w3.org/2000/svg", "feMerge");
        const feMergeNode1 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
        feMergeNode1.setAttribute("in", "coloredBlur");
        const feMergeNode2 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
        feMergeNode2.setAttribute("in", "SourceGraphic");
        feMerge.appendChild(feMergeNode1); feMerge.appendChild(feMergeNode2);
        filter.appendChild(feMerge);
        defs.appendChild(filter);
        svg.insertBefore(defs, svg.firstChild);
    }
}

// Ensure resize handling
window.addEventListener('resize', () => {
    if (window.simulator) {
        updateTannerGraph("tanner-graph-svg-x", "X");
        updateTannerGraph("tanner-graph-svg-z", "Z");
    }
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
