document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById("bloch-sphere-container");
    if (!container) return;

    // Clear placeholder content
    container.innerHTML = "";

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    const camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.z = 2.5;
    camera.position.y = 1;
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Sphere
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshBasicMaterial({
        color: 0xcccccc,
        wireframe: true,
        transparent: true,
        opacity: 0.3,
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Axes
    const axesHelper = new THREE.AxesHelper(1.2);
    scene.add(axesHelper);

    // Labels (using HTML overlay would be better, but for now simple checks)
    // Bloch Vector (initially |0> state, pointing up Z)
    const dir = new THREE.Vector3(0, 1, 0);
    dir.normalize();
    const origin = new THREE.Vector3(0, 0, 0);
    const length = 1;
    const hex = 0xff0000;
    const arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
    scene.add(arrowHelper);

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);

        // Slowly rotate for effect
        sphere.rotation.y += 0.005;
        axesHelper.rotation.y += 0.005;
        arrowHelper.rotation.y += 0.005;

        renderer.render(scene, camera);
    }

    animate();

    // Handle Resize
    window.addEventListener("resize", function () {
        if (container) {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }
    });
});
