/**
 * Interactive Bloch Sphere Visualization
 */

// State
let currentState = {
    theta: 0, // 0 to PI
    phi: 0,   // 0 to 2*PI
};

// Complex Number Helpers
class Complex {
    constructor(re, im) {
        this.re = re;
        this.im = im;
    }

    add(c) { return new Complex(this.re + c.re, this.im + c.im); }
    sub(c) { return new Complex(this.re - c.re, this.im - c.im); }
    mul(c) { return new Complex(this.re * c.re - this.im * c.im, this.re * c.im + this.im * c.re); }
    mag() { return Math.sqrt(this.re * this.re + this.im * this.im); }
    arg() { return Math.atan2(this.im, this.re); }
}

const C_ZERO = new Complex(0, 0);
const C_ONE = new Complex(1, 0);
const C_I = new Complex(0, 1);
const C_NI = new Complex(0, -1); // -i

// Gates
const GATES = {
    X: [
        [C_ZERO, C_ONE],
        [C_ONE, C_ZERO]
    ],
    Y: [
        [C_ZERO, C_NI],
        [C_I, C_ZERO]
    ],
    Z: [
        [C_ONE, C_ZERO],
        [C_ZERO, new Complex(-1, 0)]
    ],
    H: [
        [new Complex(1 / Math.sqrt(2), 0), new Complex(1 / Math.sqrt(2), 0)],
        [new Complex(1 / Math.sqrt(2), 0), new Complex(-1 / Math.sqrt(2), 0)]
    ]
};

// Visualization Global Objects
let sphereArrow;
let renderer, scene, camera;

document$.subscribe(() => {
    const container = document.getElementById("bloch-sphere-container");
    if (!container) return;

    initThreeJS(container);

    // Initialize UI events
    setupEvents();

    // Initial Display
    updateDisplay();
});

function initThreeJS(container) {
    // Cleanup if already exists
    if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
    }

    container.innerHTML = "";
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0); // Match container

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(2, 1.5, 2);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Sphere
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshBasicMaterial({
        color: 0xe0e0e0,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Axes
    const axesHelper = new THREE.AxesHelper(1.2);
    scene.add(axesHelper);

    // Labels (X, Y, Z) - simplified as small floating internal text or just assume standard

    // State Arrow
    const dir = new THREE.Vector3(0, 1, 0);
    const origin = new THREE.Vector3(0, 0, 0);
    sphereArrow = new THREE.ArrowHelper(dir, origin, 1.0, 0xff0000, 0.2, 0.1);
    scene.add(sphereArrow);

    // Animation
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();

    // Resize
    window.addEventListener("resize", () => {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

function setupEvents() {
    const thetaSlider = document.getElementById("theta-slider");
    const phiSlider = document.getElementById("phi-slider");

    if (thetaSlider) {
        thetaSlider.addEventListener("input", (e) => {
            currentState.theta = parseFloat(e.target.value) * Math.PI;
            updateFromAngles();
        });
    }

    if (phiSlider) {
        phiSlider.addEventListener("input", (e) => {
            currentState.phi = parseFloat(e.target.value) * Math.PI; // Range 0-2 -> 0-2PI
            updateFromAngles();
        });
    }
}

// Logic: Angles -> Vector
function updateFromAngles() {
    // Update arrow
    // x = sin(theta) * cos(phi)
    // y = sin(theta) * sin(phi)
    // z = cos(theta)
    // Note: Three.js Y is up. Bloch sphere usually has Z up.
    // We will map Bloch Z -> Three Y, Bloch X -> Three Z, Bloch Y -> Three X (or similar)
    // Standard Physics: Z is up. X is forward. Y is right.
    // Three.js: Y is up (Green). X is right (Red). Z is backward (Blue).

    // Mapping:
    // Bloch Z (up) -> Three Y
    // Bloch X (front) -> Three Z (positive)
    // Bloch Y (right) -> Three X (positive)

    const th = currentState.theta;
    const ph = currentState.phi;

    const bx = Math.sin(th) * Math.cos(ph);
    const by = Math.sin(th) * Math.sin(ph);
    const bz = Math.cos(th);

    // Map to Three.js coordinates
    // Three Y = Bloch Z = bz
    // Three X = Bloch Y = by
    // Three Z = Bloch X = bx
    const dir = new THREE.Vector3(by, bz, bx).normalize();

    if (sphereArrow) {
        sphereArrow.setDirection(dir);
    }

    updateUI();
}

function updateUI() {
    // Update Text
    document.getElementById("theta-val").innerText = (currentState.theta / Math.PI).toFixed(2);
    document.getElementById("phi-val").innerText = (currentState.phi / Math.PI).toFixed(2);

    // Sync sliders
    document.getElementById("theta-slider").value = currentState.theta / Math.PI;
    document.getElementById("phi-slider").value = currentState.phi / Math.PI;

    // State Vector Display
    // psi = cos(theta/2)|0> + e^(i phi)sin(theta/2)|1>
    const alpha = Math.cos(currentState.theta / 2);
    const betaMag = Math.sin(currentState.theta / 2);

    // Format complex number for display
    const alphaStr = alpha.toFixed(3);
    const betaRe = (betaMag * Math.cos(currentState.phi)).toFixed(3);
    const betaIm = (betaMag * Math.sin(currentState.phi)).toFixed(3);

    const sign = parseFloat(betaIm) >= 0 ? "+" : "";
    const vecStr = `|ψ⟩ = ${alphaStr}|0⟩ + (${betaRe}${sign}${betaIm}i)|1⟩`;

    const svDisplay = document.getElementById("state-vector-display");
    if (svDisplay) svDisplay.innerHTML = `$$ ${vecStr} $$`;

    // Re-render math if MathJax is present
    if (window.MathJax && window.MathJax.typesetPromise) {
        // Wrap in startup promise if available
        const runTypeset = () => {
            window.MathJax.typesetPromise([svDisplay, document.getElementById("matrix-display")])
                .catch(e => console.warn("MathJax update failed", e));
        };

        if (window.MathJax.startup && window.MathJax.startup.promise) {
            window.MathJax.startup.promise.then(runTypeset);
        } else {
            runTypeset();
        }
    }
}

// Global functions for buttons
window.resetBloch = function () {
    currentState.theta = 0;
    currentState.phi = 0;
    updateFromAngles();
    document.getElementById("matrix-display").innerText = "-";
};

window.applyGate = function (gateName) {
    const gate = GATES[gateName];
    if (!gate) return;

    // Convert current state to vector [alpha, beta]
    // We ignore global phase, so we assume alpha is real = cos(theta/2)
    let alpha = new Complex(Math.cos(currentState.theta / 2), 0);
    let beta = new Complex(
        Math.sin(currentState.theta / 2) * Math.cos(currentState.phi),
        Math.sin(currentState.theta / 2) * Math.sin(currentState.phi)
    );

    // Matrix Multiplication
    // [a' ] = [ U00 U01 ] [ a ]
    // [b' ]   [ U10 U11 ] [ b ]

    let newAlpha = gate[0][0].mul(alpha).add(gate[0][1].mul(beta));
    let newBeta = gate[1][0].mul(alpha).add(gate[1][1].mul(beta));

    // Normalize (just in case)
    const mag = Math.sqrt(newAlpha.mag() ** 2 + newBeta.mag() ** 2);
    newAlpha = new Complex(newAlpha.re / mag, newAlpha.im / mag);
    newBeta = new Complex(newBeta.re / mag, newBeta.im / mag);

    // Extract Angles
    // Remove global phase so alpha becomes real and positive
    // Multiply both by exp(-i * arg(alpha))
    const alphaArg = newAlpha.arg();
    const phaseCorrection = new Complex(Math.cos(-alphaArg), Math.sin(-alphaArg));

    newAlpha = newAlpha.mul(phaseCorrection);
    newBeta = newBeta.mul(phaseCorrection);

    // Now alpha should be roughly real positive ~ cos(theta/2)
    // theta = 2 * acos(alpha.re) (clamp for safety)
    let val = Math.max(-1, Math.min(1, newAlpha.re));
    currentState.theta = 2 * Math.acos(val);

    // beta = exp(i phi) * sin(theta/2)
    // phi = arg(beta)
    currentState.phi = newBeta.arg();
    if (currentState.phi < 0) currentState.phi += 2 * Math.PI; // keep 0-2pi

    updateFromAngles();

    // Display Matrix
    displayMatrix(gateName, gate);
};

function displayMatrix(name, m) {
    const fmt = (c) => {
        if (Math.abs(c.im) < 0.001) return c.re.toFixed(2);
        if (Math.abs(c.re) < 0.001) return `${c.im.toFixed(2)}i`;
        return `${c.re.toFixed(2)}${c.im >= 0 ? '+' : ''}${c.im.toFixed(2)}i`;
    };

    const latex = `
    ${name} = \\begin{pmatrix} 
    ${fmt(m[0][0])} & ${fmt(m[0][1])} \\\\
    ${fmt(m[1][0])} & ${fmt(m[1][1])}
    \\end{pmatrix}
  `;
    document.getElementById("matrix-display").innerText = `$$ ${latex} $$`;

    if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([document.getElementById("matrix-display")]);
    }
}
