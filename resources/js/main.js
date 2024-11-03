//
// REFERENCES : 
// 
// * https://www.youtube.com/watch?v=PPwR7h5SnOE&t=9s - Build the basic world

// Importing THREE js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

// Importing Controls to orbit the camera around the scene
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';


class BasicWorldDemo {
  constructor() {
    // Starts the Initialize Function
    this._Initialize();
  }

  //
  // INITIALISE FUNCTION
  //

  _Initialize() {
    // Creating a WebGLRenderer which will display everything on the screen
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    
    // Below are some parameters which enhance the WebGLRenderer like adding soft shadows
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // This tells three js about the screen size
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);

    // This tells THREE js where to display
    document.body.appendChild(this._threejs.domElement);

    // Uses an EventListener to check whether the browser window has been resized, then uses the OnWindowResize function
    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);

    // Setting up camera parameters
    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;

    // Creating camera with set parameters then setting its position
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(75, 20, 0);

    // Create a scene for things to be added to
    this._scene = new THREE.Scene();

    // Creating a single directional light for the scene
    let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);

    // Telling the light where to be at
    light.position.set(20, 100, 10);
    light.target.position.set(0, 0, 0);

    // Saying it should also cast shadows including the below parameters
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.left = 100;
    light.shadow.camera.right = -100;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;
    this._scene.add(light); // Finally add it to the scene

    // On top of the directional light, abmbient lighting is also added
    light = new THREE.AmbientLight(0x101010);
    this._scene.add(light);

    // Creating orbiting camera controls so the camera can be moved around
    const controls = new OrbitControls(
      this._camera, this._threejs.domElement);
    controls.target.set(0, 20, 0);
    controls.update();

    // Creating a plane in the scene which can recieve shadows but not cast any
    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100, 10, 10),
        new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
          }));
    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;
    this._scene.add(plane); // Adding plane to the scene

    this._RAF(); // Calls the requestAnimationFrame function
  }

  //
  // WINDOW RESIZE FUNCTION
  //

  _OnWindowResize() {
    // Sets the camera aspect to the windows width and height
    this._camera.aspect = window.innerWidth / window.innerHeight;

    // Needed to correctly update the camera
    this._camera.updateProjectionMatrix();

    // Sets THREE js to fill the browser window
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  //
  // REQUEST ANIMATION FRAME FUNCTION
  //

  _RAF() {
    // Renders each frame smoothly
    requestAnimationFrame(() => {
      this._threejs.render(this._scene, this._camera);
      this._RAF();
    });
  }
}


let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new BasicWorldDemo();
});