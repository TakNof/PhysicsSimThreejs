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

let colours = [0x03cffc, 0x09ff00, 0xff8800, 0xff00e1];

let ballYo = 8;

let balls = new Array(1);
let invert;
for(let i = 0; i < balls.length; i++){
    balls[i] = new ShapeGenerator("Sphere", [1, 32, 32], "Standard", {color: colours[i]});
    balls[i].position.y = ballYo;
    // balls[i].position.x = rand(-4, 4);
    // balls[i].position.z = rand(-4, 4);
    if(i % 2 == 0){
        invert = -1;
    }else{
        invert = 1;
    }

    // balls[i].position.z = 0;
    // balls[i].position.x = invert*2;
    
    balls[i].castShadow = true;

    // balls[i].createPhysics({gravity: 0, velocityVector: [rand(-10, 10)/100, 0, rand(-10, 10)/100], energyLoss: 0.2});
    // balls[i].createPhysics({gravity: 0, velocityVector: [rand(-10, 10)/100, 0, rand(-10, 10)/100]});
    // balls[i].createPhysics(scene, {velocityVector: [invert*rand(6, 10)/100, 0, rand(6, 10)/100], energyLoss: 0.2});
    // balls[i].createPhysics({ velocityVector: [rand(6, 10)/100, 0, rand(6, 10)/100], energyLoss: 0.2});   

    // balls[i].createPhysics(scene, {gravity: 0 , velocityVector: [invert*0.1*i*-1, 0, 0]});
    // balls[i].createPhysics({velocityVector: [-0.1, 0, -0.1]});

    balls[i].createPhysics(scene);

    balls[i].physics.config.collitionType = balls[i].physics.collitionTypes.Sphere;

    scene.add(balls[i].physics.arrowHelper);
    scene.add(balls[i]);
}

let floor = new ShapeGenerator("Box", [10, 1, 10], "Standard", {color: 0xFF00000, wireframe: true});
floor.receiveShadow = true;
floor.position.y = -0.5;
scene.add(floor);

const helper = new VertexNormalsHelper( floor, 1, 0xff0000 );
scene.add( helper );

let walls = new Array(4);
let alter = 0;

for(let i = 0; i < walls.length; i++){
    let z = i + alter;
    let side = 1;
    let dimensions = [10, 10, 10];
    let axis = "x";

    if(z % 2 == 0){
        side = -1;
    }

    if(z < 2){
        dimensions[0] = 1;
        
    }else{
        dimensions[2] = 1;
        axis = "z";
    }

    walls[i] = new ShapeGenerator("Box", dimensions, "Standard", {color: colours[i], transparent: true, opacity: 0.5, side: THREE.DoubleSide});
    walls[i].receiveShadow = true;
    walls[i].position.y = 5;
    walls[i].position[axis] = 5.5*side;
    scene.add(walls[i]);
    
}

let wall5 = new ShapeGenerator("Box", [10, 2, 10], "Standard", {color: colours[rand(0, colours.length - 1)], transparent: true, opacity: 0.5, wireframe: true});
// let wall5 = new ShapeGenerator("Box", [1, 10, 10], "Standard", {color: colours[rand(0, colours.length - 1)], transparent: true, opacity: 0.5});
wall5.position.y = 0.5;
wall5.position.z = 0;
wall5.position.x = 0;

wall5.receiveShadow = true;
scene.add(wall5);

// let wall6 = new ShapeGenerator("Box", [1, 10, 10], "Standard", {color: colours[rand(0, colours.length - 1)], transparent: true, opacity: 0.5});
// wall6.position.y = 5;
// // wall6.position.z = 5.5*direcition;
// wall6.position.x = -5.5;

// wall6.receiveShadow = true;
// scene.add(wall6);



// ball.physics.loadColliderItems(floor, ball2, wall1, wall2, wall3, wall4, wall5);
// ball2.physics.loadColliderItems(floor, ball, wall1, wall2, wall3, wall4, wall5);

// let scenary = [floor, ...walls, wall5];

// let scenary = [floor, ...walls];

let scenary = [wall5];
// let scenary = [floor];

// let scenary = [wall5, wall6];

for(let i = 0; i < balls.length; i++){
    if(balls.length == 1){
        balls[i].physics.loadColliderItems(...scenary);
    }else{
        for(let j = 0; j < balls.length; j++){
            if(i != j){
                balls[i].physics.loadColliderItems(...[balls[j], ...scenary]);
                // balls[i].physics.loadColliderItems(...[balls[j]]);
            }
        }
    }
}

// console.log(balls[0].physics.items, balls[1].physics.items)

let light = createLight(0xffffff, 1, {x: -10, y: 10, z: 0});
scene.add(light);

let light2 = createLight(0xffffff, 1, {x: 10, y: 10, z: 0});
scene.add(light2);

camera.position.y = 20;

let playAnimation = false;

let timeDivision = 100000;

let t = 0;
function animate(time, delta) {
	requestAnimationFrame(animate);

    if(playAnimation){
        t += 1/timeDivision;

        for(let ball of balls){
            ball.physics.move(t);
        }
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