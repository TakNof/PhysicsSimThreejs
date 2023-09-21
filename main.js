import * as THREE from "three";

import {OrbitControls} from "three/addons/controls/OrbitControls.js";

import { VertexNormalsHelper } from 'three/addons/helpers/VertexNormalsHelper.js';

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
let ballYo = 3;

let ball = new ShapeGenerator("Sphere", [1, 32, 32], "Standard", {color: 0xFFFFFF});
ball.position.y = ballYo;
ball.position.x = -4;
ball.castShadow = true;
// ball.createPhysics({gravity: 0, velocityVector: [rand(-10, 10)/100, 0, rand(-10, 10)/100], energyLoss: 0.2});
// ball.createPhysics({velocityVector: [rand(-10, 10)/100, 0, rand(-10, 10)/100]});
ball.createPhysics({gravity: 0, velocityVector: [rand(-10, 10)/100, 0, rand(-10, 10)/100]});
// ball.createPhysics({ velocityVector: [rand(-10, 10)/100, 0, rand(-10, 10)/100]});
ball.physics.config.collitionType = ball.physics.collitionTypes.Sphere;

scene.add(ball.physics.arrowHelper);
scene.add(ball);

let ball2 = new ShapeGenerator("Sphere", [1, 32, 32], "Standard", {color: 0xFFF000});
ball2.position.y = ballYo;
ball2.position.x = 1;
ball2.castShadow = true;
// ball2.createPhysics({gravity: 0, velocityVector: [rand(-10, 10)/100, 0, rand(-10, 10)/100], energyLoss: 0.2});
ball2.createPhysics({gravity: 0, velocityVector: [rand(-10, 10)/100, 0, rand(-10, 10)/100]});
// ball2.createPhysics({gravity: 0, velocityVector: [-0.01, 0, 0.01]});
ball2.physics.config.collitionType = ball2.physics.collitionTypes.Sphere;

scene.add(ball2.physics.arrowHelper);
scene.add(ball2);

let floor = new ShapeGenerator("Box", [10, 1, 10], "Standard", {color: 0xFF00000});
floor.receiveShadow = true;
floor.position.y = -0.5;
scene.add(floor);

const helper = new VertexNormalsHelper( floor, 1, 0xff0000 );
scene.add( helper );

let wallsColours = [0x03cffc, 0x09ff00, 0xff8800, 0xff00e1];

let walls = new Array(4);

for(let i = 0; i < wallsColours.length; i++){
    let side = 1;
    let dimensions = [10, 10, 10];
    let axis = "x";

    if(i % 2 == 0){
        side = -1;
    }

    if(i < 2){
        dimensions[0] = 1;
        
    }else{
        dimensions[2] = 1;
        axis = "z";
    }

    walls[i] = new ShapeGenerator("Box", dimensions, "Standard", {color: wallsColours[i], transparent: true, opacity: 0.5, side: THREE.DoubleSide});
    walls[i].receiveShadow = true;
    walls[i].position.y = 5.5;
    walls[i].position[axis] = 5.5*side;
    scene.add(walls[i]);
    
}

// let wall5 = new ShapeGenerator("Box", [0.5, 10, 1], "Standard", {transparent: true, opacity: 0.2});
// wall5.receiveShadow = true;
// wall5.position.y = 5;
// wall5.position.z = 3;
// scene.add(wall5);

// ball.physics.loadColliderItems(floor, ball2, wall1, wall2, wall3, wall4, wall5);
// ball2.physics.loadColliderItems(floor, ball, wall1, wall2, wall3, wall4, wall5);

// let scenary = [floor, ...walls, wall5];

let scenary = [floor, ...walls];

ball.physics.loadColliderItems(...[ball2, ...scenary]);
ball2.physics.loadColliderItems(...[ball, ...scenary]);

let light = createLight(0xffffff, 1, {x: -10, y: 10, z: 0});
scene.add(light);

let light2 = createLight(0xffffff, 1, {x: 10, y: 10, z: 0});
scene.add(light2);

camera.position.y = 20;

let playAnimation = false;

let timeDivision = 10000;

// let v1 = new THREE.Vector3(-1, 0, 0);
// let v2 = new THREE.Vector3(0, 1, 0);

// let magCrossProduct = v1.clone().cross(v2).lengthSq();
// let magV1 = v1.lengthSq();
// let magV2 = v2.lengthSq();

// let angle = Math.asin(magCrossProduct/(magV1*magV2));

// console.log(angle*180/Math.PI);

let t = 0;
function animate(time, delta) {
	requestAnimationFrame(animate);

    if(playAnimation){
        t += 1/timeDivision;

        ball.physics.move(t);
        ball2.physics.move(t);
    }

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
})

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

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