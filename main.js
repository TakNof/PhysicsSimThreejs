import * as THREE from "three";

import {OrbitControls} from "three/addons/controls/OrbitControls.js";

import ShapeGenerator from "./ShapeGenerator.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild( renderer.domElement );


const controls = new OrbitControls( camera,renderer.domElement );
controls.enableZoom = true; 
controls.minDistance = 1; 
controls.maxDistance = 100; 
controls.zoomSpeed = 1; 
controls.enablePan = true; 
controls.enableDamping = false; 
controls.DampingFactor= 0;

scene.background = new THREE.CubeTextureLoader()
	.setPath( 'assets/' )
	.load( [
        '1.png',
        '2.png',
        '3.png',
        '4.png',
        '5.png',
        '6.png'
	]);


let axis = "y";
let ballYo = 10;

let ball = new ShapeGenerator("Sphere", [1, 32, 32], "Standard", {color: 0xFFFFFF});
ball.position.y = ballYo;
ball.position.x = -0;
ball.castShadow = true;
ball.createPhysics();
ball.physics.config.collitionType = ball.physics.collitionTypes.Sphere;
ball.physics.config.accelerationVector[0] = -0.1;
scene.add(ball);

let floor = new ShapeGenerator("Box", [10, 1, 10], "Standard", {color: 0xFF00000});
floor.receiveShadow = true;
floor.position.y = -0.5;
scene.add(floor);

// console.log(floor);

let wall1 = new ShapeGenerator("Box", [1, 10, 10], "Standard");
wall1.receiveShadow = true;
wall1.position.y = 5.5;
wall1.position.x = 5.5;
scene.add(wall1);

ball.physics.loadColliderItems(floor);

let light = createLight(0xffffff, 1, {x: -10, y: 10, z: 0});
scene.add(light);

camera.position.z = 20;

let playAnimation = false;

let timeDivision = 100000;

let t = 0;
function animate(time, delta) {
	requestAnimationFrame(animate);

    if(playAnimation){
        t += 1/timeDivision;

        ball.physics.move(t);
    }

    // console.log(ball.position);

    renderer.render(scene, camera);
    controls.update();
}
animate();

window.addEventListener("keydown", function(event){
    switch (event.code) {
        case "Space":
            playAnimation = !playAnimation;
        break;

        case "ArrowLeft":
            timeDivision *= 10;
            // console.log(timeDivision);
        break;

        case "ArrowRight":
            timeDivision /= 10;
            // console.log(timeDivision);
        break;

        case "KeyR":
            ball.position.y = ballYo
            ball.physics.config.velocityVector[1] = 0;
        break;
    
        default:
            break;
    }

    // console.log(event.code);
;})

function createLight(color, intensity, position = {x: 0, y: 0, z: 0}){
    let light = new THREE.PointLight(color, intensity);
    light.position.set(position.x, position.y, position.z);
    light.castShadow = true;
    light.shadow.mapSize.width = 1024; // default
    light.shadow.mapSize.height = 1024; // default
    light.shadow.camera.near = 0.5; // default
    light.shadow.camera.far = 500; // default
    light.shadow.focus = 1; // default
    return light;
}