import { view } from './hotspot.js'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import JEASINGS from 'jeasings'

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x002f30)
// scene.background = new THREE.Color(0xcccccc)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
})

document.body.appendChild(renderer.domElement);

// Camera controls
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 0.6, 1);
controls.update();

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Load the search icon as a texture
const textureloader = new THREE.TextureLoader();
const searchIconTexture = textureloader.load('textures/search.png');

const carModel = "car.glb"

const loader = new GLTFLoader();
let model;

try {
    const gltf = await loader.loadAsync(`./models/${carModel}`);
    model = gltf.scene;
    model.scale.set(20, 20, 20);
    scene.add(model);
} catch (error) {
    console.error("Error loading model:", error);
}


const gui = new GUI()
const activeColor = 'rgba(100, 200, 255, 0.6)'; // Light blue for active button
const defaultColor = 'rgba(0, 0, 0, 0.3)'; // Default color for inactive buttons

let activeButton = null; // Store the currently active button

function highlightButton(controller) {
    if (activeButton) {
        activeButton.domElement.style.backgroundColor = defaultColor;
    }
    if (controller) {
        activeButton = controller;
        activeButton.domElement.style.backgroundColor = activeColor;
    }
}


let activeSide = null;  // This will store the currently active view (side)

let hotspots = {
    frontView: [],
    backView: [],
    rightView: [],
    leftView: []
};

// Lock or unlock camera controls based on active view
function lockControls() {
    controls.enableRotate = false; // Disable rotation
    controls.enableZoom = false;   // Disable zoom
    controls.enablePan = false;    // Disable panning
}

function unlockControls() {
    controls.enableRotate = true;  // Enable rotation
    controls.enableZoom = true;    // Enable zoom
    controls.enablePan = true;     // Enable panning
}

function createHotspot() {
    const material = new THREE.SpriteMaterial({ map: searchIconTexture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.15, 0.15, 1);
    return sprite;
}

// Function to enable hotspots for a particular view
function enableHotspots(viewName) {
    model.traverse((child) => {
        const side = view[viewName][0]
        if (child.name==side.name) {
            const points = side.points;
            console.log(points)
            points.forEach((point) => {
                const hotspot = createHotspot();
                const positionArray = point.split(',').map(Number);
                hotspot.position.set(...positionArray);
                child.add(hotspot);
                hotspots[viewName].push(hotspot);
            });
        }
    });
}

// Function to disable hotspots for a particular view
function disableHotspots(viewName) {
    hotspots[viewName].forEach((hotspot) => {
        // Traverse through the model and remove the specific hotspot
        model.traverse((child) => {
            if (child === hotspot.parent) {
                child.remove(hotspot);
            }
        });
    });
    hotspots[viewName] = [];
}

const setCameraView = {
    frontView() {
        model.rotation.set(0, 0, 0);
        camera.position.set(0, 0.4, 0.8);
        highlightButton(frontBtn);
        if (activeSide !== 'frontView') {
            if (activeSide) {
                disableHotspots(activeSide);  // Disable hotspots of the previous active side
            }
            enableHotspots('frontView');  // Enable hotspots for the new active side
            activeSide = 'frontView';
        }
        lockControls();
    },
    backView() {
        model.rotation.set(-0.2, Math.PI, 0);
        camera.position.set(0, 0.4, 0.8);
        highlightButton(backBtn);
        if (activeSide !== 'backView') {
            if (activeSide) {
                disableHotspots(activeSide);
            }
            enableHotspots('backView');
            activeSide = 'backView';
        }
        lockControls();
    },
    rightView() {
        model.rotation.set(0, Math.PI / 2, 0);
        camera.position.set(0, 0.4, 0.8);
        highlightButton(rightBtn);
        if (activeSide !== 'rightView') {
            if (activeSide) {
                disableHotspots(activeSide);
            }
            enableHotspots('rightView');
            activeSide = 'rightView';
        }
        lockControls();
    },
    leftView() {
        model.rotation.set(0, -Math.PI / 2, 0);
        camera.position.set(0, 0.4, 0.8);
        highlightButton(leftBtn);
        if (activeSide !== 'leftView') {
            if (activeSide) {
                disableHotspots(activeSide);
            }
            enableHotspots('leftView');
            activeSide = 'leftView';
        }
        lockControls();
    },
    reset() {
        if (activeSide) {
            disableHotspots(activeSide);
        }
        activeSide = null
        unlockControls();
        highlightButton()
        model.rotation.set(0, 0, 0);
        camera.position.set(0, 0.6, 1);
        controls.update();
    }
};

const cameraView = gui.addFolder('CameraView');
const frontBtn = cameraView.add(setCameraView, 'frontView').name('Front View');
const backBtn = cameraView.add(setCameraView, 'backView').name('Back View');
const rightBtn = cameraView.add(setCameraView, 'rightView').name('Right View');
const leftBtn = cameraView.add(setCameraView, 'leftView').name('Left View');

gui.add(setCameraView, 'reset').name('Reset');

cameraView.open();

// Set default styles
[frontBtn, backBtn, rightBtn, leftBtn].forEach(btn => {
    btn.domElement.style.backgroundColor = defaultColor;
});

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

renderer.domElement.addEventListener('click', (e) => {
    mouse.set((e.clientX / renderer.domElement.clientWidth) * 2 - 1, -(e.clientY / renderer.domElement.clientHeight) * 2 + 1)

    raycaster.setFromCamera(mouse, camera)

    if (activeSide) {
        const intersects = raycaster.intersectObjects(hotspots[activeSide]);

        if (intersects.length > 0) {
            const hotspot = intersects[0].object;
            console.log(hotspot)
            zoomToHotspot(hotspot)
        }
    }

})

function zoomToHotspot(hotspot) {
    const worldPosition = new THREE.Vector3();
    hotspot.getWorldPosition(worldPosition);

    new JEASINGS.JEasing(camera.position)
        .to(
            {
                x: worldPosition.x,
                y: worldPosition.y + 0.1,
                z: worldPosition.z + 0.15
            },
            500
        )
        .delay(150)
        .onUpdate(() => controls.update())
        .start();
}

renderer.domElement.addEventListener('mousemove', (e) => {
    mouse.set(
        (e.clientX / renderer.domElement.clientWidth) * 2 - 1,
        -(e.clientY / renderer.domElement.clientHeight) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);

    if (activeSide) {
        const intersects = raycaster.intersectObjects(hotspots[activeSide]);

        if (intersects.length > 0) {
            const hotspot = intersects[0].object;
            hotspot.scale.set(0.2, 0.2, 1);
        }
        else {
            hotspots[activeSide].forEach((hotspot) => {
                hotspot.scale.set(0.15, 0.15, 1);
            });
        }
    }
});

function animate() {
    requestAnimationFrame(animate);
    if (camera.position.y < 0.1) {
        camera.position.y = 0.1; // Set a minimum Y position
    }
    JEASINGS.update()
    controls.update()
    renderer.render(scene, camera);
}
animate();