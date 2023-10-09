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

let playAnimation = false;

let timeDivision = 1000;

let ballYo = 5;

let balls = new Array(10);
for(let i = 0; i < balls.length; i++){
    balls[i] = new ShapeGenerator("Sphere", [0.5, 32, 32], "Standard", {color: colours[rand(0, colours.length - 1)], roughness: 0});
    // balls[i].position.y = ballYo + rand(0, 6);

    balls[i].position.y = ballYo;

    balls[i].position.x = rand(-4, 4);
    balls[i].position.z = rand(-4, 4);

    
    balls[i].castShadow = true;

    if(i < 1){
        balls[i].createPhysics(scene, {velocityVector: [2/timeDivision*100,0,2/timeDivision*100]}, true);
        // balls[i].position.x = -3;
        // balls[i].position.z = -0.5;
    }else{
        balls[i].createPhysics(scene, {}, true);
    }
    

    
    balls[i].physics.config.collitionType = balls[i].physics.collitionTypes.Sphere;

    scene.add(balls[i]);
}

let floor = new ShapeGenerator("Box", [10, 1, 10], "Standard", {color: 0xFF00000, transparent: true, opacity: 0.5});
floor.receiveShadow = true;
floor.position.y = -0.5;
scene.add(floor);

const helper = new VertexNormalsHelper( floor, 1, 0xff0000 );
scene.add( helper );

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
    // walls[i].position[axis] = 4*side;
    scene.add(walls[i]);
    
}

// let stairs = new Array(4);
// let startPoint = 7;

// for(let i = 0; i < stairs.length; i++){
//     let side = 1;
//     let side2 = -1;
//     let dimensions = [5, 2, 5];

//     if(i % 2 == 0){
//         side = -1;
//     }

//     if(i % 3 == 0){
//         side2 = 1;
//     }else{
//         side2 = -1;
//     }

//     stairs[i] = new ShapeGenerator("Box", dimensions, "Standard", {color: colours[rand(0, colours.length - 1)], transparent: true, opacity:0.5});
//     stairs[i].receiveShadow = true;
//     stairs[i].position.y = startPoint - i*dimensions[1];
//     stairs[i].position.x = 2.5*side2;
//     stairs[i].position.z = 2.5*side2*side;
//     scene.add(stairs[i]);
// }

// let scenary = [floor, ...walls, ...stairs];

let scenary = [floor, ...walls];

// let scenary = [wall5];
// let scenary = [floor];

// let scenary = [wall5, wall6];

for(let i = 0; i < balls.length; i++){
    if(balls.length == 1){
        balls[i].physics.loadColliderItems(...scenary);
    }else{
        for(let j = 0; j < balls.length; j++){
            if(i == j){
                let copy = [...balls];
                copy.splice(j, 1);
                balls[i].physics.loadColliderItems(...[...copy, ...scenary]);
                // balls[i].physics.loadColliderItems(...[balls[j]]);
                // balls[i].physics.loadColliderItems(...[...[balls[j]], ...scenary]);
                break;
            }
        }
        // console.log(balls[i].physics.items);
    }
}

let light = createLight(0xffffff, 1, {x: -10, y: 10, z: 0});
scene.add(light);

let light2 = createLight(0xffffff, 1, {x: 10, y: 10, z: 0});
scene.add(light2);

let light3 = createLight(0xffffff, 1, {x: 0, y: 0, z: 10});
scene.add(light3);

camera.position.y = 20;

let t = 0;
function animate(time, delta) {
	requestAnimationFrame(animate);

    if(playAnimation){
        for(let [i, ball] of balls.entries()){
            ball.physics.move(1/timeDivision);
            // if(i == 1){
            //     console.log(ball.physics.config.velocityVector);
            // }
        }
    }


    // camera.rotation.x += Math.sin(15 + t*1000);
    // camera.rotation.z += Math.cos(15 + t*1000);

    // balls.forEach(ball => {
    //     console.log(ball.position);
    // });

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
                // ball.position.y = ballYo + rand(0, 6);
                ball.position.y = ballYo;
                ball.position.x = rand(-4, 4);
                ball.position.z = rand(-4, 4);
                ball.physics.config.velocityVector.fromArray([-1/timeDivision*100,0,-1/timeDivision*100]);
            }            
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