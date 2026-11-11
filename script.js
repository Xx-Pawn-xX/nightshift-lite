
import * as THREE from 'three';

// ==========================================
// NIGHTSHIFT//LITE
// 3D RACING SYSTEM - VERSION 0.1
// ==========================================

const container = document.getElementById('game-container');

const TRACK = {
    rx: 78,
    rz: 48,
    width: 18,
    segments: 240
};

const MAX_SPEED = 65;

let speed = 0;
let yaw = Math.PI;
let lateralSpeed = 0;
let elapsed = 0;

const input = {
    gas: false,
    brake: false,
    left: false,
    right: false,
    drift: false
};

const clock = new THREE.Clock();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050813);
scene.fog = new THREE.FogExp2(0x070b19, 0.0027);

const camera = new THREE.PerspectiveCamera(
    68,
    window.innerWidth / window.innerHeight,
    0.1,
    800
);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance'
});

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 1.75)
);

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

container.appendChild(renderer.domElement);


// ==========================================
// LIGHTING
// ==========================================

const ambient = new THREE.HemisphereLight(
    0x9abaff,
    0x101321,
    1.6
);

scene.add(ambient);

const moon = new THREE.DirectionalLight(
    0x9bcaff,
    2.0
);

moon.position.set(-50, 100, -40);
moon.castShadow = true;
moon.shadow.mapSize.set(1024, 1024);

scene.add(moon);

const blueLight = new THREE.PointLight(
    0x0066ff,
    180,
    100
);

blueLight.position.set(65, 12, 0);
scene.add(blueLight);

const pinkLight = new THREE.PointLight(
    0xff176f,
    160,
    100
);

pinkLight.position.set(-65, 12, 0);
scene.add(pinkLight);


// ==========================================
// MATERIALS
// ==========================================

function material(color, options = {}) {
    return new THREE.MeshStandardMaterial({
        color,
        roughness: options.roughness ?? 0.55,
        metalness: options.metalness ?? 0.15,
        emissive: options.emissive ?? 0x000000,
        emissiveIntensity: options.emissiveIntensity ?? 0
    });
}

const roadMat = material(0x111725, {
    roughness: 0.32,
    metalness: 0.3
});

const groundMat = material(0x080d17);

const neonBlue = material(0x00aaff, {
    emissive: 0x0077ff,
    emissiveIntensity: 2
});

const neonPink = material(0xff176f, {
    emissive: 0xff0055,
    emissiveIntensity: 2
});

const barrierMat = material(0x202c40, {
    metalness: 0.7,
    roughness: 0.25
});


// ==========================================
// GROUND
// ==========================================

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500),
    groundMat
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.12;
ground.receiveShadow = true;

scene.add(ground);


// ==========================================
// TRACK GEOMETRY
// ==========================================

function trackPoint(t, offset = 0) {
    const x = TRACK.rx * Math.cos(t);
    const z = TRACK.rz * Math.sin(t);

    const tangent = new THREE.Vector3(
        -TRACK.rx * Math.sin(t),
        0,
        TRACK.rz * Math.cos(t)
    ).normalize();

    const normal = new THREE.Vector3(
        tangent.z,
        0,
        -tangent.x
    );

    return new THREE.Vector3(
        x + normal.x * offset,
        0,
        z + normal.z * offset
    );
}

function createRibbon(width, offset, mat, height = 0.02) {
    const positions = [];
    const indices = [];
    const uvs = [];

    for (let i = 0; i <= TRACK.segments; i++) {
        const t = i / TRACK.segments * Math.PI * 2;
        const point = trackPoint(t, offset);

        const tangent = new THREE.Vector3(
            -TRACK.rx * Math.sin(t),
            0,
            TRACK.rz * Math.cos(t)
        ).normalize();

        const normal = new THREE.Vector3(
            tangent.z, 0, -tangent.x
        );

        const half = width / 2;

        positions.push(
            point.x + normal.x * half,
            height,
            point.z + normal.z * half,

            point.x - normal.x * half,
            height,
            point.z - normal.z * half
        );

        uvs.push(i / TRACK.segments, 0);
        uvs.push(i / TRACK.segments, 1);

        if (i < TRACK.segments) {
            const a = i * 2;
            const b = a + 1;
            const c = a + 2;
            const d = a + 3;

            indices.push(a, b, c);
            indices.push(b, d, c);
        }
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
    );

    geometry.setAttribute(
        'uv',
        new THREE.Float32BufferAttribute(uvs, 2)
    );

    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, mat);
    mesh.receiveShadow = true;

    scene.add(mesh);

    return mesh;
}

createRibbon(24, 0, material(0x151b29), 0.0);
createRibbon(18, 0, roadMat, 0.035);


// ==========================================
// TRACK MARKINGS
// ==========================================

function createTrackMarkings() {
    const dashMat = material(0x9bdfff, {
        emissive: 0x185b9c,
        emissiveIntensity: 0.8
    });

    const dashCount = 80;

    for (let i = 0; i < dashCount; i++) {
        const t = i / dashCount * Math.PI * 2;
        const point = trackPoint(t, 0);

        const tangent = new THREE.Vector3(
            -TRACK.rx * Math.sin(t),
            0,
            TRACK.rz * Math.cos(t)
        );

        const dash = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.035, 2.2),
            dashMat
        );

        dash.position.set(point.x, 0.09, point.z);
        dash.rotation.y = Math.atan2(
            tangent.x,
            tangent.z
        );

        scene.add(dash);
    }
}

createTrackMarkings();


// ==========================================
// NEON TRACK EDGES
// ==========================================

function createNeonEdge(offset, color) {
    const points = [];

    for (let i = 0; i <= TRACK.segments; i++) {
        const t = i / TRACK.segments * Math.PI * 2;
        const p = trackPoint(t, offset);

        p.y = 0.65;
        points.push(p);
    }

    const curve = new THREE.CatmullRomCurve3(
        points,
        true
    );

    const geometry = new THREE.TubeGeometry(
        curve,
        TRACK.segments,
        0.13,
        6,
        true
    );

    const mesh = new THREE.Mesh(geometry, color);

    scene.add(mesh);
}

createNeonEdge(10, neonBlue);
createNeonEdge(-10, neonPink);


// ==========================================
// GUARDRAILS
// ==========================================

function createGuardrails() {
    for (let side of [-1, 1]) {
        for (let i = 0; i < TRACK.segments; i += 3) {
            const t = i / TRACK.segments * Math.PI * 2;

            const p = trackPoint(
                t,
                side * (TRACK.width / 2 + 1)
            );

            const tangent = new THREE.Vector3(
                -TRACK.rx * Math.sin(t),
                0,
                TRACK.rz * Math.cos(t)
            );

            const rail = new THREE.Mesh(
                new THREE.BoxGeometry(0.65, 1.1, 3.5),
                barrierMat
            );

            rail.position.set(p.x, 0.7, p.z);
            rail.rotation.y = Math.atan2(
                tangent.x,
                tangent.z
            );

            rail.castShadow = true;
            scene.add(rail);
        }
    }
}

createGuardrails();


// ==========================================
// CITY GENERATION
// ==========================================

function createCity() {
    const buildingMaterials = [
        material(0x111c32, {metalness: 0.55}),
        material(0x171b31, {metalness: 0.45}),
        material(0x0d2438, {metalness: 0.6}),
        material(0x24243a, {metalness: 0.35})
    ];

    const windowMaterials = [
        material(0x00aaff, {
            emissive: 0x0077ff,
            emissiveIntensity: 1.7
        }),
        material(0xff327b, {
            emissive: 0xff1555,
            emissiveIntensity: 1.5
        }),
        material(0x6d8fff, {
            emissive: 0x334cff,
            emissiveIntensity: 1
        })
    ];

    for (let i = 0; i < 105; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 85 + Math.random() * 90;

        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;

        const normalizedDistance = Math.sqrt(
            (x / TRACK.rx) ** 2 +
            (z / TRACK.rz) ** 2
        );

        if (normalizedDistance < 1.18) continue;

        const height = 9 + Math.random() * 48;
        const width = 7 + Math.random() * 12;
        const depth = 7 + Math.random() * 12;

        const building = new THREE.Group();

        const base = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            buildingMaterials[
                Math.floor(Math.random() * buildingMaterials.length)
            ]
        );

        base.position.y = height / 2;
        base.castShadow = true;
        base.receiveShadow = true;

        building.add(base);

        // Glowing vertical building accents
        const accentMat = windowMaterials[
            Math.floor(Math.random() * windowMaterials.length)
        ];

        const accent = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, height * 0.7, 0.2),
            accentMat
        );

        accent.position.set(
            width / 2 + 0.08,
            height * 0.55,
            0
        );

        building.add(accent);

        building.position.set(x, 0, z);

        scene.add(building);
    }
}

createCity();


// ==========================================
// CITY LIGHTS
// ==========================================

for (let i = 0; i < 18; i++) {
    const angle = i / 18 * Math.PI * 2;

    const lamp = new THREE.PointLight(
        i % 2 === 0 ? 0x007bff : 0xff176f,
        100,
        45
    );

    lamp.position.set(
        TRACK.rx * 1.35 * Math.cos(angle),
        7,
        TRACK.rz * 1.35 * Math.sin(angle)
    );

    scene.add(lamp);
}


// ==========================================
// PLAYER CAR
// ==========================================

const car = new THREE.Group();
scene.add(car);

const paint = material(0x073e70, {
    metalness: 0.9,
    roughness: 0.19
});

const glass = material(0x07101e, {
    metalness: 0.8,
    roughness: 0.12
});

const rubber = material(0x090b10, {
    roughness: 0.9
});

const headlightMat = material(0x8deaff, {
    emissive: 0x00aaff,
    emissiveIntensity: 4
});

const rearLightMat = material(0xff164c, {
    emissive: 0xff0033,
    emissiveIntensity: 3
});

function carBox(size, pos, mat) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(...size),
        mat
    );

    mesh.position.set(...pos);
    mesh.castShadow = true;

    car.add(mesh);

    return mesh;
}

// Main body
carBox(
    [2.05, 0.65, 4.3],
    [0, 0.85, 0],
    paint
);

// Hood
carBox(
    [1.9, 0.25, 1.25],
    [0, 1.15, -1.35],
    paint
);

// Roof
carBox(
    [1.55, 0.65, 1.95],
    [0, 1.42, 0.05],
    glass
);

// Rear wing
carBox(
    [2.1, 0.12, 0.35],
    [0, 1.48, 1.75],
    paint
);

// Headlights
carBox(
    [0.48, 0.12, 0.08],
    [-0.65, 0.96, -2.17],
    headlightMat
);

carBox(
    [0.48, 0.12, 0.08],
    [0.65, 0.96, -2.17],
    headlightMat
);

// Tail lights
carBox(
    [0.5, 0.13, 0.08],
    [-0.65, 1.0, 2.17],
    rearLightMat
);

carBox(
    [0.5, 0.13, 0.08],
    [0.65, 1.0, 2.17],
    rearLightMat
);

// Wheels
const wheels = [];

for (const x of [-1.05, 1.05]) {
    for (const z of [-1.35, 1.35]) {
        const wheelPivot = new THREE.Group();

        wheelPivot.position.set(x, 0.52, z);

        car.add(wheelPivot);

        const wheel = new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.47,
                0.47,
                0.32,
                20
            ),
            rubber
        );

        wheel.rotation.z = Math.PI / 2;
        wheel.castShadow = true;

        wheelPivot.add(wheel);

        wheels.push({
            pivot: wheelPivot,
            mesh: wheel,
            front: z < 0
        });
    }
}

// Underglow
const underglow = new THREE.PointLight(
    0x008cff,
    25,
    9
);

underglow.position.y = 0.2;
car.add(underglow);

// Headlight beams
const headlights = [];

for (const x of [-0.65, 0.65]) {
    const light = new THREE.SpotLight(
        0x9cecff,
        70,
        55,
        Math.PI / 5,
        0.5,
        1.5
    );

    light.position.set(x, 1, -2.1);

    const target = new THREE.Object3D();
    target.position.set(x, 0.2, -24);

    car.add(light);
    car.add(target);

    light.target = target;

    headlights.push(light);
}

// Car position
car.position.set(TRACK.rx, 0, 0);
car.rotation.y = yaw;


// ==========================================
// CAMERA
// ==========================================

camera.position.set(0, 6, 12);

const cameraTarget = new THREE.Vector3();

function updateCamera(delta) {
    const offset = new THREE.Vector3(
        0,
        5.2 + Math.abs(speed) * 0.012,
        10 + Math.abs(speed) * 0.055
    );

    offset.applyQuaternion(car.quaternion);

    const desiredPosition = car.position.clone().add(offset);

    camera.position.lerp(
        desiredPosition,
        1 - Math.exp(-4.5 * delta)
    );

    cameraTarget.copy(car.position);
    cameraTarget.y += 1.1;

    camera.lookAt(cameraTarget);

    camera.fov = THREE.MathUtils.lerp(
        camera.fov,
        68 + Math.abs(speed) * 0.12,
        delta * 2
    );

    camera.updateProjectionMatrix();
}


// ==========================================
// INPUT SYSTEM
// ==========================================

function bindButton(selector, key) {
    const button = document.querySelector(selector);

    if (!button) return;

    const down = (event) => {
        event.preventDefault();
        input[key] = true;

        if (button.setPointerCapture) {
            try {
                button.setPointerCapture(event.pointerId);
            } catch (_) {}
        }
    };

    const up = (event) => {
        event.preventDefault();
        input[key] = false;
    };

    button.addEventListener('pointerdown', down);
    button.addEventListener('pointerup', up);
    button.addEventListener('pointercancel', up);
    button.addEventListener('lostpointercapture', up);
    button.addEventListener('contextmenu', e => e.preventDefault());
}

bindButton('[data-control="gas"]', 'gas');
bindButton('[data-control="brake"]', 'brake');
bindButton('[data-control="left"]', 'left');
bindButton('[data-control="right"]', 'right');
bindButton('[data-control="drift"]', 'drift');

const keyMap = {
    ArrowUp: 'gas',
    KeyW: 'gas',
    ArrowDown: 'brake',
    KeyS: 'brake',
    ArrowLeft: 'left',
    KeyA: 'left',
    ArrowRight: 'right',
    KeyD: 'right',
    Space: 'drift'
};

window.addEventListener('keydown', event => {
    const key = keyMap[event.code];

    if (key) {
        event.preventDefault();
        input[key] = true;
    }
});

window.addEventListener('keyup', event => {
    const key = keyMap[event.code];

    if (key) {
        event.preventDefault();
        input[key] = false;
    }
});

window.addEventListener('blur', () => {
    for (const key in input) {
        input[key] = false;
    }
});


// ==========================================
// VEHICLE PHYSICS
// ==========================================

function updatePhysics(delta) {
    const steer =
        Number(input.right) - Number(input.left);

    const drifting = input.drift;

    // Acceleration
    if (input.gas) {
        speed += 27 * delta;
    }

    // Braking and reverse
    if (input.brake) {
        if (speed > 0) {
            speed -= 43 * delta;
        } else {
            speed -= 14 * delta;
        }
    }

    // Natural drag
    if (!input.gas && !input.brake) {
        speed = THREE.MathUtils.damp(
            speed,
            0,
            1.3,
            delta
        );
    }

    speed = THREE.MathUtils.clamp(
        speed,
        -14,
        MAX_SPEED
    );

    // Steering
    const speedFactor = THREE.MathUtils.clamp(
        Math.abs(speed) / 12,
        0.12,
        1
    );

    yaw -= (
        steer *
        1.75 *
        speedFactor *
        Math.sign(speed || 1) *
        delta
    );

    // Lateral movement / drift
    lateralSpeed += (
        steer *
        Math.abs(speed) *
        (drifting ? 0.48 : 0.16) *
        delta
    );

    lateralSpeed *= Math.exp(
        -(drifting ? 1.2 : 6.5) * delta
    );

    // World direction
    const forward = new THREE.Vector3(
        0, 0, -1
    ).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        yaw
    );

    const right = new THREE.Vector3(
        1, 0, 0
    ).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        yaw
    );

    car.position.addScaledVector(
        forward,
        speed * delta
    );

    car.position.addScaledVector(
        right,
        lateralSpeed * delta
    );

    // Off-road detection
    const normalized = Math.sqrt(
        (car.position.x / TRACK.rx) ** 2 +
        (car.position.z / TRACK.rz) ** 2
    );

    const radialDistance = Math.abs(
        normalized - 1
    ) * ((TRACK.rx + TRACK.rz) / 2);

    if (radialDistance > TRACK.width * 0.55) {
        speed *= Math.exp(-0.8 * delta);
    }

    // Vehicle orientation
    car.rotation.y = yaw;

    // Wheel steering
    for (const wheel of wheels) {
        wheel.pivot.rotation.y =
            wheel.front ? -steer * 0.28 : 0;

        wheel.mesh.rotation.x -=
            speed * delta / 0.47;
    }

    // Slight body lean
    car.rotation.z = THREE.MathUtils.damp(
        car.rotation.z,
        -steer * Math.min(Math.abs(speed) / 65, 1) * 0.08,
        4,
        delta
    );
}


// ==========================================
// HUD
// ==========================================

const speedElement = document.getElementById('speed');
const speedFill = document.getElementById('speed-fill');
const gearElement = document.getElementById('gear');
const timerElement = document.getElementById('timer');

function updateHUD(delta) {
    const kmh = Math.round(Math.abs(speed) * 3.6);

    speedElement.textContent = String(kmh).padStart(3, '0');

    speedFill.style.width =
        Math.min(kmh / 234 * 100, 100) + '%';

    const gear = speed <= 0.5
        ? 'R'
        : Math.min(6, Math.max(1, Math.ceil(speed / 10)));

    gearElement.textContent = gear;

    elapsed += delta;

    const minutes = Math.floor(elapsed / 60);
    const seconds = Math.floor(elapsed % 60);
    const centiseconds = Math.floor((elapsed % 1) * 100);

    timerElement.textContent =
        String(minutes).padStart(2, '0') + ':' +
        String(seconds).padStart(2, '0') + '.' +
        String(centiseconds).padStart(2, '0');
}


// ==========================================
// ANIMATION LOOP
// ==========================================

function animate() {
    const delta = Math.min(clock.getDelta(), 0.04);

    updatePhysics(delta);
    updateCamera(delta);
    updateHUD(delta);

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);


// ==========================================
// RESIZE
// ==========================================

window.addEventListener('resize', () => {
    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 1.75)
    );
});


// ==========================================
// STARTUP
// ==========================================

window.addEventListener('load', () => {
    setTimeout(() => {
        const loading = document.getElementById('loading');

        loading.style.opacity = '0';

        setTimeout(() => {
            loading.remove();
        }, 750);
    }, 1000);
});

console.log('NIGHTSHIFT//LITE INITIALIZED');
console.log('3D RENDERER: ONLINE');
console.log('VEHICLE SYSTEM: ONLINE');
console.log('TRACK SYSTEM: ONLINE');
