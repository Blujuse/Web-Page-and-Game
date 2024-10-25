import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.157.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from "https://unpkg.com/three@0.169.0/examples/jsm/loaders/GLTFLoader.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );

const geometry2 = new THREE.SphereGeometry( 1, 32, 16 ); 
const material2 = new THREE.MeshBasicMaterial( { color: 0xffff00 } ); 
const sphere = new THREE.Mesh( geometry2, material2 );

sphere.position.x = 2.5;
sphere.position.y = 1.5;

const geo = new THREE.CapsuleGeometry(1, 1, 4, 8);
const mat = new THREE.MeshBasicMaterial({color: 0xff9547, wireframe: true});
const funky = new THREE.Mesh(geo, mat);

camera.position.set(0, 0, 15);

let group = new THREE.Group()
group.add(cube);
group.add(sphere);

let group2 = new THREE.Group();
group2.add(funky);
group2.add(group);

scene.add(group2);

// Add a Plane
const AddPlane = (x, y, w, h, materialAspect) =>
{
    const geometry3 = new THREE.PlaneGeometry( w, h, 2 );
    const material3 = new THREE.MeshBasicMaterial( materialAspect );

    const plane = new THREE.Mesh( geometry3, material3 );

    plane.position.x = x;
    plane.position.y = y;
    plane.rotation.x = -Math.PI/2;
    scene.add( plane );
}

const planeTexture = new THREE.TextureLoader().load("resources/images/goldpattern.png"); 
// immediately use the texture for material creation 

const planeMat = { map: planeTexture, side: THREE.DoubleSide, transparent: true }

AddPlane(0, -3.6, 15, 15, planeMat)

//Add Player
const player = new THREE.Mesh(geometry, material2);
scene.add(player);

function animate() {

	group.rotation.x += 0.05;
	group.rotation.y += 0.1;

    group2.rotation.x += 0.2;
    group2.rotation.y += 0.2;

    // Add key control logic
    if (upstate)
    {
        player.position.y += 0.02;
    }
    else if (downstate)
    {
        player.position.y -= 0.02;
    }
    else if (leftstate)
    {
        player.position.x -= 0.02;
    }
    else if (rightstate)
    {
        player.position.x += 0.02;
    }

	renderer.render( scene, camera );

}

// a function that will be called every time the window gets resized.
// It can get called a lot, so don't put any heavy computation in here!
const onWindowResize = () => {
 
    // set the aspect ratio to match the new browser window aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
 
    // update the camera's frustum
    camera.updateProjectionMatrix();
 
    // update the size of the renderer AND the canvas
    renderer.setSize(window.innerWidth, window.innerHeight);
 
}
 
window.addEventListener('resize', onWindowResize);

//Skybox function
const createskybox = ()=>{
    let bgMesh;
   
    const loader = new THREE.TextureLoader();
    loader.load("resources/images/galaxy.jpg", function(texture){
        const sphereGeometry = new THREE.SphereGeometry( 100, 60, 40 );
        const sphereMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide
        })
 
        bgMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
        scene.add(bgMesh);
 
    })
   
}
 
createskybox();

let controls;

let upstate = false;
let downstate = false;
let leftstate = false;
let rightstate = false;
let changed = false;
/**
 * Function
 * Create orbit control
 */
 
const createControls =()=>
{
    controls  =new OrbitControls(camera, renderer.domElement);
    controls.update();
}
 
//update the control function
createControls();

// Button control logic
const movestop = () =>
{
    upstate = false;
    downstate = false;
    leftstate = false;
    rightstate = false;
}

const moveup = ()=>
{
    upstate = true;
    downstate = false;
    leftstate = false;
    rightstate = false;
}

const movedown = () =>
{
    upstate = false;
    downstate = true;
    leftstate = false;
    rightstate = false;
}

const moveleft = () =>
{
    upstate = false;
    downstate = false;
    leftstate = true;
    rightstate = false;
}

const moveRight = () =>
    {
        upstate = false;
        downstate = false;
        leftstate = false;
        rightstate = true;
    }

document.getElementById("stopbutton").addEventListener("click", movestop);
document.getElementById("upbutton").addEventListener("click", moveup);
document.getElementById("downbutton").addEventListener("click", movedown);
document.getElementById("leftbutton").addEventListener("click", moveleft);
document.getElementById("rightbutton").addEventListener("click", moveRight);

///////GLTF loader
//GLTF
const loader  = new GLTFLoader().setPath("resources/models/");
// Load a glTF resource
let mesh;
loader.load(
    'low_poly_helicopter.glb',  // called when the resource is loaded
 
    (gltf) => {
        mesh = gltf.scene;
        mesh.scale.set(0.3, 0.3, 0.3);
        scene.add(mesh); //add GLTF to the scene
 
    },
    // called when loading is in progresses
 
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
 
    },
    // called when loading has errors
 
    (error) => {
        console.log('An error happened' + error);
    }
);

// Light
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
scene.add(directionalLight);