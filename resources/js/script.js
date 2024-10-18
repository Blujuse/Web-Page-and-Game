import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

const geometry2 = new THREE.SphereGeometry( 1, 32, 16 ); 
const material2 = new THREE.MeshBasicMaterial( { color: 0xffff00 } ); 
const sphere = new THREE.Mesh( geometry2, material2 ); scene.add( sphere );

sphere.position.x = 5;
sphere.position.y = 2.5;

const geo = new THREE.CapsuleGeometry(1, 1, 4, 8);
const mat = new THREE.MeshBasicMaterial({color: 0xff9547, wireframe: true});
const funky = new THREE.Mesh(geo, mat);
scene.add(funky);

camera.position.z = 10;

function animate() {

	cube.rotation.x += 0.05;
	cube.rotation.y += 0.05;

    sphere.rotation.x += 0.05;
    sphere.rotation.y += 0.05;

	renderer.render( scene, camera );

}

function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);