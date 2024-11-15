import * as THREE from 'three'; // Importing three.js from downloaded files in the ammo folder
import Stats from 'https://unpkg.com/three@0.169.0/examples/jsm/libs/stats.module.js'; // Importing stats for fps counter
import { GLTFLoader } from "https://unpkg.com/three@0.169.0/examples/jsm/loaders/GLTFLoader.js";

// DECLARE VARIABLES

//
// Ammo Variables
//
let physicsWorld;
let rigidBody_List = new Array(); // Array to store all rigidbodies
let tmpTransformation = undefined; // Temp storage of transformation to be applied

//
// THREE.js Variables
//
let clock, scene, camera, renderer;
scene = new THREE.Scene(); // Setting scene up here to fix gltf loading
let raycaster = new THREE.Raycaster();
let tmpPos = new THREE.Vector3(); // raycaster vector, where the projectile starts from
let mouseCoords = new THREE.Vector2(); // x, y, position of mouse for the raycaster

//
// STATS VARIABLES
//
let stats;
stats = new Stats();
document.body.appendChild( stats.dom );

//
// Ammo.js Initialization
//
Ammo().then(start)

//
// Model Variables
//
const gltfLoader  = new GLTFLoader().setPath("resources/models/");
let heliMesh;

//
// Ball Variables
//
let ball;
let currentBallCount;
let maxBalls = 5;

//
// Animation Variables
//
let heliMixer;

// After Ammo is initialised do this
function start()
{
    // Making new btTransform class called tmpTransformation
    // This class supports rigid transforms with only translation and rotation
    // no scaling
    // Used to store transforms applied to an object
    tmpTransformation = new Ammo.btTransform();

    currentBallCount = maxBalls;

    // ALL THE BELOW FUNCTIONS ARE MY OWN, JUST CALLING THEM FROM HERE
    initPhysicsWorld();
    initGraphicsWorld();

    // Creating Floor
    createGround();

    // Building Sandcastles
    createSandcastle(new THREE.Vector3(10, 0, 15));
    createSandcastle(new THREE.Vector3(-10, 0, 20));
    createSandcastle(new THREE.Vector3(0, 0, 25));
    createSandcastle(new THREE.Vector3(8, 0, 40));
    createSandcastle(new THREE.Vector3(-9, 0, 50));
    createSandcastle(new THREE.Vector3(-20, 0, 38));
    
    addEventHandlers();

    // Loops the moveCamForward function which will just make the camera move continuously
    //renderer.setAnimationLoop(moveCamForward);

    render();
}

//
// BUILDING THE WORLD WITH PHYSICS FUNCTION
//

function initPhysicsWorld()
{
    // Default config for bullet physics system, basically collision detection
    let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();

    // Iterates over each of the objects
    // Calls the collision algorithm for each shape and settings
    // Algorithms return time of impact, closest points on each object and penetration depth/distance
    let dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);

    // Takes the number of bouding boxes in the world, this would be each object with collisions
    // Then makes a list of potentially colliding objects
    let overlappingPairCache = new Ammo.btDbvtBroadphase();

    // Makes objects interact properly
    let solver = new Ammo.btSequentialImpulseConstraintSolver();

    // Creating the physics world using the previously set parameters
    physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0)); // Setting the gravity on y axis
}

//
// BUILDING THE RENDERER AND IMAGE DISPLAYING STUFF
//

function initGraphicsWorld()
{
    // Used for time calculations
    clock = new THREE.Clock();

    // Creating the scene
    scene.background = new THREE.Color( 0xabfeff ); // Setting background to blue

    // Creating Camera
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth/ window.innerHeight, 1, 1000 );
    camera.position.set( 0, 10, -8 ); // Setting the cameras position
    camera.lookAt(new THREE.Vector3( 0, 10, 0 )); // Telling the camera where to look towards

    let light = new THREE.DirectionalLight(0xFFFFFF, 3);

    // Telling the light where to be at
    light.position.set(0, 100, 10);
    light.target.position.set(0, 20, 15);

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

    // Adding light to scene
    scene.add(light);

    // Creating Lighting for the scene
    let ambientLight = new THREE.AmbientLight( 0xcccccc, 2 ); // Setting colour and intensity
    ambientLight.position.set( 0, 10, 15 ); // Setting light position
    scene.add( ambientLight ); // Adding it into the scene

    // Creating the renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } ); // Turning on antialiasing to smooth out jagged edges
    renderer.setPixelRatio( window.devicePixelRatio ); // Prevents blurry image output
    renderer.setSize( window.innerWidth, window.innerHeight ); // Sets the size which the scene should be rendered at
    document.body.appendChild( renderer.domElement ); // Canvas where the renderer will draw the output

    // Below are some parameters which enhance the WebGLRenderer like adding soft shadows
    renderer.shadowMap.enabled = true;
    renderer.type = THREE.PCFSoftShadowMap;
    renderer.antialias = true; // Antialiasing for nicer shadows

    // Using different colour display method to get better looking colours
    render.outputEncoding = THREE.sRGBEncoding;
}

//
// FUNCTION TO CREATE CUBES, USED BY OTHER FUNCTIONS
//

function createCube(scale, position, mass, color, quaternion)
{

    // Creates a cube using the function parameters & sets its position
    let newCube = new THREE.Mesh(
        new THREE.BoxGeometry(scale.x, scale.y, scale.z),
        new THREE.MeshPhongMaterial({ color: color })
    );
    newCube.position.set(position.x, position.y, position.z);

    // Cubes should be able to recieve and cast their own shadows
    newCube.castShadow = true;
    newCube.receiveShadow = true;

    scene.add(newCube); // Add cube to scene

    // Creates transform variable using the btTransform from Ammo
    // It stores the translation and rotation of an object
    let transform = new Ammo.btTransform();
    transform.setIdentity(); // Resets any existing transforms

    // Set starting position and rotation
    transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z)); // Position
    transform.setRotation(new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w)); // Rotation
    let defaultMotionState = new Ammo.btDefaultMotionState( transform ); // Automatically syncs with world transform

    // Setting Collision Geometry
    let structColShape = new Ammo.btBoxShape( new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5));
    structColShape.setMargin(0.05); // Collision margins of shape

    // Sets the initial object inertia
    let localInertia = new Ammo.btVector3( 0, 0, 0, );
    structColShape.calculateLocalInertia(mass, localInertia); // Calculates the intertial by taking the mass and current inertia

    // Building rigidbody, using function paramaters
    let rbInfo = new Ammo.btRigidBodyConstructionInfo(
        mass,
        defaultMotionState,
        structColShape,
        localInertia
    );
    let rBody = new Ammo.btRigidBody( rbInfo ); // Creates a rigid body for the cube using the info just made

    // Adding rigidbody to the world
    physicsWorld.addRigidBody( rBody );

    // THREE js cube has the rigid body assigned to it
    newCube.userData.physicsBody = rBody;
    rigidBody_List.push(newCube); // Add the created cube to the array of rigid bodies
}

//
// FUNCTION TO CREATE FLOOR
//

function createGround()
{
    // Building a cube using the function I made
    createCube(
        new THREE.Vector3(50, 2, 100), // Cube scale, x, y, z
        new THREE.Vector3(0, 0, 30), // Cube position, x, y, z
        0, // Object Mass
        0xC2B280, // Colour of object
        {x:0, y:0, z:0, w:1} // Rotation
    );
}

//
// FUNCTION TO CREATE SAND CASTLES FROM CUBES
//

function createSandcastle(startPosition) 
{
    // First layer
    for (var j = 0; j < 5; j++) { // 5 rows
        for (var i = 0; i < 5; i++) { // 5 columns
            createCube(
                new THREE.Vector3(1, 1, 1), // Size of each cube
                new THREE.Vector3(i + startPosition.x, startPosition.y + 2, j + startPosition.z), // Spawning each layer slightly above the last
                0.3,
                0xCBBD93,
                { x: 0, y: 0, z: 0, w: 1 }
            );
        }
    }

    // Second Layer
    for (var j = 0; j < 4; j++) { // 4 rows
        for (var i = 0; i < 4; i++) { // 4 columns
            createCube(
                new THREE.Vector3(1, 1, 1), // Size of each cube
                new THREE.Vector3(i + startPosition.x + 0.5, startPosition.y + 3, j + startPosition.z + 0.5), // Also move to center of first layer
                0.3,
                0xCBBD93,
                { x: 0, y: 0, z: 0, w: 1 }
            );
        }
    }

    // Third Layer
    for (var j = 0; j < 3; j++) { // 3 rows
        for (var i = 0; i < 3; i++) { // 3 columns
            createCube(
                new THREE.Vector3(1, 1, 1), // Size of each cube
                new THREE.Vector3(i + startPosition.x + 1, startPosition.y + 4, j + startPosition.z + 1),
                0.3,
                0xCBBD93,
                { x: 0, y: 0, z: 0, w: 1 }
            );
        }
    }
    
    // Third Layer
    for (var j = 0; j < 2; j++) { // 4 rows
        for (var i = 0; i < 2; i++) { // 4 columns
            createCube(
                new THREE.Vector3(1, 1, 1), // Size of each cube
                new THREE.Vector3(i + startPosition.x + 1.5, startPosition.y + 5, j + startPosition.z + 1.5),
                0.3,
                0xCBBD93,
                { x: 0, y: 0, z: 0, w: 1 }
            );
        }
    }
}


//
// MODEL LOADING & ANIMATIONS
//

gltfLoader.load(
    'low_poly_helicopter.glb',  // called when the resource is loaded
 
    (gltf) => {
        heliMesh = gltf.scene;
        heliMesh.position.set(10, 17, 20);
        heliMesh.rotation.set(0, 12, 0.2);
        heliMesh.scale.set(1, 1, 1);
        scene.add(heliMesh); //add GLTF to the scene

        heliMixer = new THREE.AnimationMixer(heliMesh);
        gltf.animations.forEach((clip) =>
        {
            heliMixer.clipAction(clip).play();
        })
 
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

function animations()
{
    if(heliMixer) heliMixer.update(0.01);
}

//
// FUNCTION TO LISTEN TO USER INPUTS
//

function addEventHandlers()
{
    window.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('resize', onWindowResize, false);
}

//
// READING MOUSE INPUT AND SHOOTING BALLS FUNCTION
//

function onMouseDown(event)
{
    // When no balls are left anything past this in the function wont happen
    if (currentBallCount <= 0)
    {
        return;
    }

    // Set normalised mouse coordinates for raycaster
    // origin will be the middle of the screen
    mouseCoords.set(
        ( event.clientX / window.innerWidth ) * 2 - 1,
        - ( event.clientY / window.innerHeight ) * 2 + 1
    );

    // Ray will be shot out from the camera through the position of the mouse
    // This allows for angled shots
    raycaster.setFromCamera( mouseCoords, camera );

    // Getting ray vector
    tmpPos.copy( raycaster.ray.direction ); // Get the ray's direction
    tmpPos.add( raycaster.ray.origin ); // Get the ray's origin

    // Setting the properties of the ball
    let pos = { x: tmpPos.x, y: tmpPos.y, z: tmpPos.z }; // Ball will start from here ( where the ray is pointing )
    let radius = 1; // Radius of the ball
    let quat = {x:0, y:0, z:0, w:1}; // Ball rotation
    let mass = 1; // Mass of ball

    // Creating ball using THREE js
    ball = new THREE.Mesh(
        new THREE.SphereGeometry(radius), // Setting ball size to radius
        new THREE.MeshPhongMaterial({ color: 0x26F7FD })
    );
    ball.position.set(pos.x, pos.y, pos.z); // Setting ball position
    scene.add(ball); // Adding the ball to the scene

    // Setting up ammo js physics
    let transform = new Ammo.btTransform(); // Storing ball translation and rotation
    transform.setIdentity(); // reset existing transforms
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z )); // Starting pos
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w )); // Starting rotation
    let motionState = new Ammo.btDefaultMotionState( transform ); // Automatically syncs with world transform

    // Creating collision shape
    let colShape = new Ammo.btSphereShape(radius); // Sphere collision set to radius size
    colShape.setMargin(0.05); // Collision margin of shape

    // Object Inertia
    let localInertia = new Ammo.btVector3(0, 0, 0); // Setting initial inertia
    colShape.calculateLocalInertia( mass, localInertia ); // Calculates the intertial by taking the mass and current inertia 

    // Create Rigidbody
    let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia); // Setup rigidbody info stuff
    let body = new Ammo.btRigidBody(rbInfo); // Builds rigidbody using the info setup previously

    // Adding the rigidbody to the world
    physicsWorld.addRigidBody(body);

    // Placing the ball
    tmpPos.copy(raycaster.ray.direction);
    tmpPos.multiplyScalar(100); // Setting initial linear velocity of ball

    body.setLinearVelocity(new Ammo.btVector3(tmpPos.x, tmpPos.y, tmpPos.z)); // Set motion of ball

    // Add physicsBody to the THREE js ball mesh
    ball.userData.physicsBody = body;
    rigidBody_List.push(ball); // Add to the array of rigidbodies

    // Remove from currentBallCount
    currentBallCount--;
}

//
// UPDATE BALL COUNT DISPLAY
//
function updateBallCount()
{
    const ballCountDisplay = document.getElementById('currentBallCount');
    ballCountDisplay.innerText = currentBallCount;
}

//
// FUNCTION TO UPDATE WORLD PHYSICS
//

function updatePhysicsWorld(deltaTime)
{
    // Time since last call, max num of substeps
    // Substeps are a series of seperate actions
    physicsWorld.stepSimulation( deltaTime, 10 );

    // Go through every rigidbody in the physics sim
    for (let i = 0; i < rigidBody_List.length; i++ )
    {
        let Graphics_Obj = rigidBody_List[i]; // Store THREE js cubes
        let Physics_Obj = Graphics_Obj.userData.physicsBody; // Store ammo js objects

        // Get pos and rotation in physics world
        let motionState = Physics_Obj.getMotionState();
        if (motionState)
        {
            motionState.getWorldTransform(tmpTransformation); // Get amount of transformation, how much was object changed
            let new_pos = tmpTransformation.getOrigin(); // Get transformation of position, store how much was object changed
            let new_qua = tmpTransformation.getRotation(); // Get transformation of rotation, store how much was object changed

            Graphics_Obj.position.set(new_pos.x(), new_pos.y(), new_pos.z()); // Update object to the new position
            Graphics_Obj.quaternion.set(new_qua.x(), new_qua.y(), new_qua.z(), new_qua.w()); // Update object to the new rotation
        }
    }
}

//
// MOVING CAMERA SCRIPT
//

function moveCamForward()
{
    camera.position.z += 0.05;
}

//
// RENDER FUNCTION
//

function render()
{
    stats.update(); // Updating fps counter

    animations(); // Calls animations each frame
    updateBallCount(); // Calls ball counter each frame

    let deltaTime = clock.getDelta(); // Get time since last update
    updatePhysicsWorld(deltaTime); // update the physics
    renderer.render(scene, camera); // render the THREE js objects on screen
    requestAnimationFrame(render); // keep looping the render function
}

//
// WINDOW RESIZE FUNCTION
//

function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}