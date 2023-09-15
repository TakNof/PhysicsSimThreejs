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
ball.maxHeight = ballYo;
ball.castShadow = true;
scene.add(ball);

let floor = new ShapeGenerator("Box", [10, 1, 10], "Standard");
floor.receiveShadow = true;
scene.add(floor);

let light = createLight(0xffffff, 1, {x: -10, y: 10, z: 0});
scene.add(light);

camera.position.z = 40;

let gravity = -9.8/1000;

let a = [0, gravity, 0];
let v = [0, 0, 0];
let p = [0, 0, 0];

function animate() {
	requestAnimationFrame( animate );

    if(!minimalDistance(0, ball, floor, axis)){
        v = v.map((item, index)=>{
            return item + a[index];
        });

        ball.position.x += v[0];
        ball.position.y += v[1];
        ball.position.z += v[2];

        if(roundCollition(ball, floor)){
            v[1]*=-1;
        }
    }    

    console.log(v[1]);

    renderer.render( scene, camera );
    controls.update();
}
animate();

function checkProperty(axis){
    switch (axis) {
        case "x":
            return "width";
        
        case "y":
            return "height";
        
        case "z":
            return "depth";
        
        default:
            return undefined;
    }
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

function roundCollition(shape1, shape2){
    let property;
    let colliding;
    let axles = ["x", "y", "z"];
    for(let axis of axles){
        property = checkProperty(axis);
        colliding = shape1.position[axis] - shape1.geometry.parameters.radius*1.1 >= shape2.position[axis] + shape2.geometry.parameters[property]/2;
        if(colliding){
            break;
        }
    }
    return !colliding;
}

function minimalDistance(range, shape1, shape2, axis){
    let property = checkProperty(axis);
    return shape1.position[axis] - shape1.geometry.parameters.radius - (shape2.position[axis] + shape2.geometry.parameters[property]/2) <= range;
}