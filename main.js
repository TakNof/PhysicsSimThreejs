import * as THREE from "three";

import {OrbitControls} from "three/addons/controls/OrbitControls.js";

import ShapeGenerator from "./ShapeGenerator.js";
import ScenePhysics from "./ScenePhysics.js";

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

let scenePhysics = new ScenePhysics(scene, {viewMovementHelper: true, energyLoss: 0.1});

let colours = [0x03cffc, 0x09ff00, 0xff8800, 0xff00e1];

let playAnimation = false;

let timeDivision = 1000;

let ballYo = 8;

let balls = new Array(10);
for(let i = 0; i < balls.length; i++){
    balls[i] = new ShapeGenerator("Sphere", [0.5, 32, 32], "Standard", {color: colours[rand(0, colours.length - 1)], roughness: 0});
    balls[i].position.y = ballYo + rand(0, 6);
    balls[i].position.x = rand(0, 4);
    balls[i].position.z = rand(-4, 0);

    balls[i].castShadow = true;

    balls[i].createPhysics(scene, {velocityVector: [-1/timeDivision*100, 0, 1/timeDivision*100]});

    scene.add(balls[i]);
}

let floor = new ShapeGenerator("Box", [10, 1, 10], "Standard", {color: 0xFF00000, transparent: true, opacity: 0.5});
floor.receiveShadow = true;
floor.position.y = -0.5;
scene.add(floor);

let walls = new Array(4);

for(let i = 0; i < walls.length; i++){
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

    walls[i] = new ShapeGenerator("Box", dimensions, "Standard", {color: colours[i], transparent: true, opacity: 0.5, side: THREE.DoubleSide});
    walls[i].receiveShadow = true;
    walls[i].position.y = 5;
    walls[i].position[axis] = 5.5*side;
    scene.add(walls[i]);
    
}

let stairs = new Array(4);
let startPoint = 7;

for(let i = 0; i < stairs.length; i++){
    let side = 1;
    let side2 = -1;
    let dimensions = [5, 2, 5];

    if(i % 2 == 0){
        side = -1;
    }

    if(i % 3 == 0){
        side2 = 1;
    }else{
        side2 = -1;
    }

    stairs[i] = new ShapeGenerator("Box", dimensions, "Standard", {color: colours[rand(0, colours.length - 1)], transparent: true, opacity:0.5});
    stairs[i].receiveShadow = true;
    stairs[i].position.y = startPoint - i*dimensions[1];
    stairs[i].position.x = 2.5*side2;
    stairs[i].position.z = 2.5*side2*side;
    scene.add(stairs[i]);
}

let scenary = [floor, ...walls, ...stairs];

scenePhysics.add(...scenary, ...balls);

let light = createLight(0xffffff, 1, {x: -10, y: 10, z: 0});
scene.add(light);

let light2 = createLight(0xffffff, 1, {x: 10, y: 10, z: 0});
scene.add(light2);

let light3 = createLight(0xffffff, 1, {x: 0, y: 0, z: 10});
scene.add(light3);

camera.position.y = 20;

function animate(time, delta) {
	requestAnimationFrame(animate);

    if(playAnimation){
        scenePhysics.checkWorldCollisions();
        for(let ball of balls){
            ball.physics.move(1/timeDivision);
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
            for(let ball of balls){
                ball.position.y = ballYo + rand(0, 6);
                ball.position.x = rand(0, 4);
                ball.position.z = rand(-4, 0);

                ball.physics.config.velocityVector.fromArray([-1/timeDivision*100,0,1/timeDivision*100]);
            }            
        break;
    
        default:
            break;
    }
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