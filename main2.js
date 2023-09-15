// import {OrbitControls} from './orbitcontrols.js';

// const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

// const renderer = new THREE.WebGLRenderer();

// renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// renderer.setSize( window.innerWidth, window.innerHeight );
// document.body.appendChild( renderer.domElement );

// const controls = new OrbitControls( camera,renderer.domElement );
// controls.enableZoom = true; 
// controls.minDistance = 1; 
// controls.maxDistance = 100; 
// controls.zoomSpeed = 1; 
// controls.enablePan = true; 
// controls.enableDamping = false; 
// controls.DampingFactor= 0;

// scene.background = new THREE.CubeTextureLoader()
// 	.setPath( 'assets/' )
// 	.load( [
//         '1.png',
//         '2.png',
//         '3.png',
//         '4.png',
//         '5.png',
//         '6.png'
// 	]);

// let t = 0;
// let ballMovement = "y";
// let timeOfImpact;
// let heightOfImpact;

// let axis = "y";
// let ballYo = 10;

// let ball = new ShapeGenerator("Sphere", [1, 16, 32], "Basic", {color: 0xFFFFFF});
// ball.position.y = ballYo;
// scene.add(ball);

// let floor = new ShapeGenerator("Box", [10, 1, 10]);
// scene.add(floor);

// camera.position.z = 40;

// function animate() {
// 	requestAnimationFrame( animate );

//     t+= 0.01;

    

//     if(ballMovement[0] != "-"){
//         if(!roundCollition(ball, floor, axis)){
//             ball.position[axis] = freeFall(t, ballYo);
//         }else{
//             ballMovement = "-y";
//             timeOfImpact = t;
//             heightOfImpact = ball.position[axis];
//         }   
//     }else{
//         ball.position[axis] = verticalLaunch(velocityAtTime(timeOfImpact)*0.8, heightOfImpact,  Math.abs(t - timeOfImpact));
//     }

//     console.log(ball.position.y);

//     renderer.render( scene, camera );
//     controls.update();
// }
// animate();

// function freeFall(t, Yo = 0){
//     return Yo - 9.8*Math.pow(t,2)/2
// }

// function roundCollition(shape1, shape2, movementAxis){
//     let property;

//     switch (movementAxis) {
//         case "x":
//             property = "width";
//         break;

//         case "y":
//             property = "height";
//         break;

//         case "z":
//             property = "depth";
//         break;

//         default:
//             break;
//     }

//     let colliding = shape1.position[movementAxis] - shape1.geometry.parameters.radius/2 >= shape2.position[movementAxis] + shape2.geometry.parameters[property];

//     // console.log(!colliding);

//     return !colliding;
// }

// function velocityAtTime(t){
//     return 9.8*t;
// }

// function verticalLaunch(Vo, y, t){
//     return y + Vo*t - freeFall(t);
// }