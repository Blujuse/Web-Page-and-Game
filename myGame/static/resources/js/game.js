import * as THREE from 'three'; // Importing three.js from downloaded files in the ammo folder
import Stats from 'https://unpkg.com/three@0.169.0/examples/jsm/libs/stats.module.js'; // Importing stats for fps counter
import { GLTFLoader } from "https://unpkg.com/three@0.169.0/examples/jsm/loaders/GLTFLoader.js";

// DECLARE VARIABLES

//
// Ammo VARIABLES
//
let physicsWorld;
let rigidBody_List = new Array(); // Array to store all rigidbodies
let tmpTransformation = undefined; // Temp storage of transformation to be applied

//
// THREE.js VARIABLES
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
// Ammo.js INITIALISATION
//
Ammo().then(start)

//
// MODEL VARIABLES
//
const gltfLoader  = new GLTFLoader().setPath("resources/models/");
let heliMesh;

//
// BALL VARIABLES
//
let ball;
let currentBallCount;
let maxBalls = 5;
let ballTriggerZone = []; // Array of ball zones
let sandcastleTriggerZone = []; // Array of sandcastle zones
let ballPhysicsBody;

//
// SCORE VARIABLES
//
let currentScore;

//
// SANDCASTLE SPAWN CHECKERS
//
let spawnDist = 20;
let nextSpawn = 50;
let spawnOnce = false;

//
// LEVEL GENERATION & CAMERA CONTROLS VARIABLES
//
let groundSpawnPos = 150;
let waterSpawnPos = 150;
let currentCastlesSpawned = 0;
const spawnEveryFewCastles = 2;
let camMoveSpeed = 0.05;
let speedMultiplier = 1.0;  // Start at normal speed
let accelerationRate = 0.001;  // Controls how fast the speed increases
const maxCamSpeed = 0.4;

//
// PAUSING VARIABLES
//
let renderId;

//
// ANIMATION VARIABLES
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

    // Call this here to update text size in game
    currentBallCount = maxBalls;
    updateBallCount();

    // Call this here to update text size in game
    currentScore = 0;
    updateCurrentScore();

    // ALL THE BELOW FUNCTIONS ARE MY OWN, JUST CALLING THEM FROM HERE
    initPhysicsWorld();
    initGraphicsWorld();

    // Creating Floor
    createGround(groundSpawnPos);
    createWater();

    // Building Sandcastles
    createShootingGallery(4, 10);
    
    addEventHandlers();

    // Loops the moveCamForward function which will just make the camera move continuously
    renderer.setAnimationLoop(moveCamForward);

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
    camera.position.set( 0, 10, 0 ); // Setting the cameras position
    camera.lookAt(new THREE.Vector3( 0, 10, 180 )); // Telling the camera where to look towards

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
    document.getElementById('gameContainer').appendChild( renderer.domElement ); // Canvas where the renderer will draw the output

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

function createPerformanceCube(scale)
{
    let hullShape = new Ammo.btConvexHullShape();

    let halfScale = scale.clone().multiplyScalar(0.5);

    let vertices = 
    [
        new Ammo.btVector3(halfScale.x, halfScale.y, halfScale.z),
        new Ammo.btVector3(-halfScale.x, halfScale.y, halfScale.z),
        new Ammo.btVector3(halfScale.x, -halfScale.y, halfScale.z),
        new Ammo.btVector3(-halfScale.x, -halfScale.y, halfScale.z),
        new Ammo.btVector3(halfScale.x, halfScale.y, -halfScale.z),
        new Ammo.btVector3(-halfScale.x, halfScale.y, -halfScale.z),
        new Ammo.btVector3(halfScale.x, -halfScale.y, -halfScale.z),
        new Ammo.btVector3(-halfScale.x, -halfScale.y, -halfScale.z),
    ];

    for (let v of vertices) 
    {
        hullShape.addPoint(v, true);
    }

    return hullShape;
}

function createCube(scale, position, mass, color, quaternion)
{
    // Creates a cube using the function parameters & sets its position
    let newCube = new THREE.Mesh(
        new THREE.BoxGeometry(scale.x, scale.y, scale.z),
        new THREE.MeshPhongMaterial({ color: color })
    );
    newCube.position.set(position.x, position.y, position.z);

    // Cubes should be able to receive and cast their own shadows
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
    let defaultMotionState = new Ammo.btDefaultMotionState(transform); // Automatically syncs with world transform

    // Setting Collision Geometry
    let structColShape = createPerformanceCube(scale);
    structColShape.setMargin(0.05); // Collision margins of shape

    // Sets the initial object inertia
    let localInertia = new Ammo.btVector3(0, 0, 0);
    structColShape.calculateLocalInertia(mass, localInertia); // Calculates the inertial by taking the mass and current inertia

    // Building rigidbody, using function parameters
    let rbInfo = new Ammo.btRigidBodyConstructionInfo(
        mass,
        defaultMotionState,
        structColShape,
        localInertia
    );
    let rBody = new Ammo.btRigidBody(rbInfo); // Creates a rigid body for the cube using the info just made

    rBody.setSleepingThresholds(0.01, 0.01);

    // Adding rigidbody to the world
    physicsWorld.addRigidBody(rBody);

    // THREE js cube has the rigid body assigned to it
    newCube.userData.physicsBody = rBody;
    rigidBody_List.push(newCube); // Add the created cube to the array of rigid bodies
}

//
// FUNCTION TO CREATE FLOOR
//

function createGround(spawnPos)
{
    // Building a cube using the function I made
    createCube(
        new THREE.Vector3(50, 2, 500), // Cube scale, x, y, z
        new THREE.Vector3(0, 0, spawnPos), // Cube position, x, y, z
        0, // Object Mass
        0xC2B280, // Colour of object
        {x:0, y:0, z:0, w:1} // Rotation
    );
}

function createWater(spawnPos)
{
    // Creates a cube using the function parameters & sets its position
    let waterCube = new THREE.Mesh(
        new THREE.BoxGeometry(500, 2, 500),
        new THREE.MeshPhongMaterial({ color: 0x1e90ff })
    );
    waterCube.position.set(0, -2, spawnPos);
    scene.add(waterCube);
}

//
// FUNCTION TO CREATE SAND CASTLES FROM CUBES
//

function createSandcastle(startPosition) 
{
    let spawnDelay = 0;
    let delayAddition = 10;

    // First Layer
    for (let j = 0; j < 4; j++) { // 4 rows
        for (let i = 0; i < 4; i++) { // 4 columns
            setTimeout(() => {
                createCube(
                    new THREE.Vector3(1.1, 1, 1.1), // Size of each cube
                    new THREE.Vector3(i + startPosition.x + 0.5, 1.9, j + startPosition.z), // Spawning each layer slightly above the last
                    0.3,
                    0xCBBD93,
                    { x: 0, y: 0, z: 0, w: 1 }
                );
            }, spawnDelay);
            spawnDelay += delayAddition;
        }
    }

    // Second Layer
    for (let j = 0; j < 3; j++) { // 3 rows
        for (let i = 0; i < 3; i++) { // 3 columns
            setTimeout(() => {
                createCube(
                    new THREE.Vector3(1.1, 1, 1.1), // Size of each cube
                    new THREE.Vector3(i + startPosition.x + 1, 2.9, j + startPosition.z), // Spawning each layer slightly above the last
                    0.3,
                    0xCBBD93,
                    { x: 0, y: 0, z: 0, w: 1 }
                );
            }, spawnDelay);
            spawnDelay += delayAddition;
        }
    }
    
    // Fourth Layer
    for (let j = 0; j < 2; j++) { // 4 rows
        for (let i = 0; i < 2; i++) { // 4 columns
            setTimeout(() => {
                createCube(
                    new THREE.Vector3(1.1, 1, 1.1), // Size of each cube
                    new THREE.Vector3(i + startPosition.x + 1.5, 3.9, j + startPosition.z), // Spawning each layer slightly above the last
                    0.3,
                    0xCBBD93,
                    { x: 0, y: 0, z: 0, w: 1 }
                );
            }, spawnDelay);
            spawnDelay += delayAddition;
        }
    }

    setTimeout(() => {
        createCube(
            new THREE.Vector3(1.1, 1, 1.1), // Size of each cube
            new THREE.Vector3(startPosition.x + 2, 4.9,startPosition.z), // Spawning each layer slightly above the last
            0.3,
            0xCBBD93,
            { x: 0, y: 0, z: 0, w: 1 }
        );
    }, spawnDelay);

    // CREATE TRIGGER ZONE FOR CASTE
    const triggerBoxMesh = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 3.25, 3.5),
        new THREE.MeshPhongMaterial({ color: 0xCBBD93 })
    );
    triggerBoxMesh.position.set(startPosition.x + 2, startPosition.y + 2.75, startPosition.z + 1);
    triggerBoxMesh.visible = false; // Debugging purposes
    scene.add(triggerBoxMesh);

    // Add to array of trigger zones
    let tempSandcastleTriggerZone = new THREE.Box3().setFromObject(triggerBoxMesh);
    sandcastleTriggerZone.push(tempSandcastleTriggerZone);
}

//
// CREATING "SHOOTING GALLERY"
//

function createShootingGallery(maxSandcastleNum, spawnPositions)
{
    let sandcastlePositions = []; // Store current sandcastle positions
    let currentSandcastleNum = 0;
    
    // Below numbers come from the original spawn locations of sandcastles
    let minX = -10;
    let maxX = 10;
    let minZ = 15;
    let maxZ = 50;

    while (currentSandcastleNum < maxSandcastleNum) // Loop
    {
        let posX = Math.floor(Math.random() * (maxX - minX + 1) + minX); // posX is set to random num between spawn locations
        let posZ = Math.floor(Math.random() * (maxZ - minZ + 1) + minZ); // posZ is set to random num between spawn locations
        posZ += spawnPositions;

        let newPos = new THREE.Vector3(posX, 0, posZ); // Used to store posX and posZ so they can be pushed into array
        const minDistance = 10; // Distance the castles should be apart

        let tooClose = false; // Used to check if the new position is too close to any existing sandcastles
        for (let i = 0; i < sandcastlePositions.length; i++) // Loop
        {
            let distance = newPos.distanceTo(sandcastlePositions[i]); // Gets the distance from spawn location to other sandcastles
            
            if (distance < minDistance) // Checks if the distance is less than the minDistance
            {  
            tooClose = true; // If it is less tooClose is true
            break; // and then get out of the loop
            }
        }

        // If the position is not too close, create the sandcastle and store the position
        if (!tooClose) 
        {
            createSandcastle(newPos); // Sandcastle is spawned at the random location
            sandcastlePositions.push(newPos);  // Store the position of the new sandcastle
            currentSandcastleNum++; // Increase number of sandcastles
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

    // Creating mesh to check for collisions
    const triggerBallMesh = new THREE.Mesh(
        new THREE.BoxGeometry(3, 3, 3),
        new THREE.MeshPhongMaterial({ color: 0xff0000 })
    )
    triggerBallMesh.visible = false; // Debugging purposes
    scene.add(triggerBallMesh);

    // Add to array of ball triggers
    let tempBallTriggerZone = new THREE.Box3().setFromObject(triggerBallMesh);
    ballTriggerZone.push(tempBallTriggerZone);

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
    ballPhysicsBody = new Ammo.btRigidBody(rbInfo); // Builds rigidbody using the info setup previously

    // Adding the rigidbody to the world
    physicsWorld.addRigidBody(ballPhysicsBody);

    // Placing the ball
    tmpPos.copy(raycaster.ray.direction);
    tmpPos.multiplyScalar(100); // Setting initial linear velocity of ball

    ballPhysicsBody.setLinearVelocity(new Ammo.btVector3(tmpPos.x, tmpPos.y, tmpPos.z)); // Set motion of ball

    // Add physicsBody to the THREE js ball mesh
    ball.userData.physicsBody = ballPhysicsBody;
    rigidBody_List.push(ball); // Add to the array of rigidbodies

    // Remove from currentBallCount
    currentBallCount--;
}

//
// UPDATE BALL COUNT DISPLAY && SCORE
//

function updateBallCount()
{
    const ballCountDisplay = document.getElementById('currentBallCount');
    ballCountDisplay.innerText = currentBallCount;
}

function updateCurrentScore()
{
    let scoreCountDisplay = document.getElementById('currentScoreCount');
    scoreCountDisplay.innerText = currentScore;
}

//
// CHECK INTERSECTION BETWEEN BALL AND CASTLES
//

function checkIntersection()
{
    // Errors if not checking if balls exist first
    if (ball != null)
    {
        // Sets the ball trigger zones to the location of their respective balls
        ballTriggerZone.forEach((ballZones) => {
            ballZones.setFromObject(ball);
        })
    }

    // Checks each of the ball zones against sandcastle zones
    sandcastleTriggerZone.forEach((sandcastleZones, index) => {
        if (ballTriggerZone.some(ballZones => ballZones.intersectsBox(sandcastleZones)))
        {
            //console.log("HIT");
            sandcastleTriggerZone.splice(index, 1); // Destroys whatever is currently the element, basically whatever is hit

            currentScore += 100;
            updateCurrentScore();

            currentBallCount ++;

            // Check if ball exists, prevents erroring
            if (ball != null)
            {
                // Go through list of balls
                ballTriggerZone.forEach((ballZones) => {
                    
                    // Dispose of each part of the ball individually
                    // dispose method removes every part of the thing, and the ball does not include everything dispose want to remove
                    // this causes errors doing it like this prevents them
                    if (ballZones.geometry)
                    {
                        ballZones.geometry.dispose();
                    }

                    if (ballZones.material)
                    {
                        ballZones.material.dispose();
                    }

                    if (ballZones.parent) 
                    {
                        ballZones.parent.remove(ballZones);
                    }

                    // Checks is physicsWorld is there and if balls have got physics
                    if (physicsWorld && ballZones.ballPhysicsBody) 
                    {
                        // Remove the ball physics from physics world
                        physicsWorld.removeRigidBody(ballZones.ballPhysicsBody);
    
                        // Clean up the physics objects associated with the ball
                        ballZones.ballPhysicsBody.dispose();  // Dispose of the rigid body in Ammo.js
                        
                        // Nullify physics objects
                        ballZones.ballPhysicsBody = null;
                    }
                });

                scene.remove(ball); // Remove ball from scene

                ball = null; // make sure its gone
            }
        }
    })
}

//
// FUNCTION TO UPDATE WORLD PHYSICS
//

function updatePhysicsWorld(deltaTime)
{
    // Time since last call, max num of substeps
    // Substeps are a series of seperate actions
    physicsWorld.stepSimulation( deltaTime, 1 );

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

    for (let i = rigidBody_List.length - 1; i >= 0; i--) {
        const object = rigidBody_List[i];
        if (isBehindCamera(object, camera)) {
            // Remove the object from scene and physics world
            scene.remove(object);
            physicsWorld.removeRigidBody(object.userData.physicsBody);
            rigidBody_List.splice(i, 1); // Remove from array

            //console.log("rigid remove");
        }
    }
}

//
// MOVING CAMERA SCRIPT
//

function moveCamForward()
{
    // Accelerate the camera over time
    speedMultiplier += accelerationRate;
    let currentSpeed = camMoveSpeed * speedMultiplier;

    if (currentSpeed > maxCamSpeed) 
    {
        currentSpeed = maxCamSpeed;
    }

    // Move the camera forward at the new speed
    camera.position.z += currentSpeed;

    let previousCamPosZ = camera.position.z;

    //console.log('Sandcastles Spawned', currentCastlesSpawned);
    //console.log('Ground Spawn', groundSpawnPos);
    //console.log('Water Spawn', waterSpawnPos);
    //console.log('Current Speed:', currentSpeed.toFixed(2));

    // Increment first to avoid one-frame delay
    currentCastlesSpawned++;

    // Floating point tolerance check
    if (previousCamPosZ >= spawnDist - 0.01 && spawnOnce == false)
    {
        createShootingGallery(4, nextSpawn);

        spawnDist += 50;
        nextSpawn += 50;

        if (currentCastlesSpawned >= spawnEveryFewCastles)
        {
            // Calculate exact spawn positions to avoid drift
            groundSpawnPos = Math.floor(previousCamPosZ / 50) * 50 + 50;
            waterSpawnPos = groundSpawnPos;

            createGround(groundSpawnPos);
            createWater(waterSpawnPos);

            //console.log('Spawning Ground');

            currentCastlesSpawned = 0;
        }

        spawnOnce = true;
    }

    if (spawnDist > previousCamPosZ)
    {
        spawnOnce = false;
    }
}

//
// CHECK IF OBJECTS ARE BEHIND CAMERA SO THE CAN BE REMOVED
//

function isBehindCamera(object, camera) 
{
    const frustum = new THREE.Frustum();
    const cameraViewProjectionMatrix = new THREE.Matrix4();

    // Update the camera view-projection matrix
    camera.updateMatrixWorld(); // Ensure camera matrix is updated
    cameraViewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);

    // Check if the object's bounding box intersects the frustum
    const objectBoundingBox = new THREE.Box3().setFromObject(object);
    return !frustum.intersectsBox(objectBoundingBox);
}

//
// END GAME FUNCTION
//

function endGame()
{
    // When no balls are left anything past this in the function wont happen
    if (currentBallCount <= 0)
    {
        document.querySelector('.signIn').classList.remove('hidden');

        window.cancelAnimationFrame(renderId);
    
        let finalScoreCountDisplay = document.querySelector('#finalScoreCount h2');
    
        if (!finalScoreCountDisplay) 
        {
            // If h2 doesn't exist, create and append it
            finalScoreCountDisplay = document.createElement('h2');
            document.getElementById('finalScoreCount').appendChild(finalScoreCountDisplay);
        }   
    
        // Now it's safe to set the text
        finalScoreCountDisplay.textContent = currentScore;
    }
}

//
// RENDER FUNCTION
//

function render()
{
    stats.update(); // Updating fps counter

    animations(); // Calls animations each frame
    checkIntersection(); // Calls hit check each frame
    updateBallCount();

    let deltaTime = clock.getDelta(); // Get time since last update
    updatePhysicsWorld(deltaTime); // update the physics
    renderId = requestAnimationFrame(render); // keep looping the render function, also using renderId to store current frame to use in pausing
    renderer.render(scene, camera); // render the THREE js objects on screen

    if (window.timerExpired == true) // Access the global variable set in countdowntimer.js
    {
        currentBallCount = 0; // Set ball count to 0, which will end the game
    }

    endGame();
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