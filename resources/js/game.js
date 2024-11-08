import * as THREE from '/resources/ammo/three.module.js'; // Importing three.js from downloaded files

// DECLARE VARIABLES

// Ammo Variables
let physicsWorld;
let rigidBody_List = new Array(); // Array to store all rigidbodies
let tmpTransformation = undefined; // Temp storage of transformation to be applied

// three.js Variables
let clock, scene, camera, renderer;
let raycaster = new THREE.Raycaster();
let tmpPos = new THREE.Vector3(); // raycaster vector, where the projectile starts from
let mouseCoords = new THREE.Vector2(); // x, y, position of mouse for the raycaster

// Ammo.js Initialization - 
Ammo().then(start)

// After Ammo is initialised do this
function start()
{
    tmpTransformation = new Ammo.btTransform();

    initPhysicsWorld();
    initGraphicsWorld();

    createGround();
    createGridCubes();

    addEventHandlers();

    render();
}

function initPhysicsWorld()
{
    let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();

    let dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);

    let overlappingPairCache = new Ammo.btDbvtBroadphase();

    let solver = new Ammo.btSequentialImpulseConstraintSolver();

    physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
     physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
}

function initGraphicsWorld()
{
    clock = new THREE.Clock();

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xabfeff );

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth/ window.innerHeight, 1, 1000 );
    camera.position.set( -3, 10, -8 );
    camera.lookAt(new THREE.Vector3( 0, 10, 0 ));

    let ambientLight = new THREE.AmbientLight( 0xcccccc, 0.5 );
    ambientLight.position.set( 0, 10, 0 );
    scene.add( ambientLight );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    render.outputEncoding = THREE.sRGBEncoding;
}

function createCube(scale, position, mass, color, quaternion)
{
    let newCube = new THREE.Mesh(
        new THREE.BoxGeometry(scale.x, scale.y, scale.z),
        new THREE.MeshPhongMaterial({ color: color })
    );
    newCube.position.set(position.x, position.y, position.z);
    scene.add(newCube);

    let transform = new Ammo.btTransform();
    transform.setIdentity();

    transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
    transform.setRotation(new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));
    let defaultMotionState = new Ammo.btDefaultMotionState( transform );

    let structColShape = new Ammo.btBoxShape( new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5));
    structColShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3( 0, 0, 0, );
    structColShape.calculateLocalInertia(mass, localInertia);

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(
        mass,
        defaultMotionState,
        structColShape,
        localInertia
    );
    let rBody = new Ammo.btRigidBody( rbInfo );

    physicsWorld.addRigidBody( rBody );

    newCube.userData.physicsBody = rBody;
    rigidBody_List.push(newCube);
}

function createGround()
{
    createCube(
        new THREE.Vector3(50, 2, 40),
        new THREE.Vector3(15, -5, 30),
        0,
        0x567d46,
        {x:0, y:0, z:0, w:1}
    );
}

function createGridCubes()
{
    for (var j = 0; j < 15; j += 2.2)
    {
        for (var i = 0; i < 30; i += 2.1)
        {
            createCube(
                new THREE.Vector3(2, 2, 1.5),
                new THREE.Vector3(i, j, 25),
                1,
                Math.random() * 0xffffff,
                {x:0, y:0, z:0, w:1}
            );
        }
     }
}

function addEventHandlers()
{
    window.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('resize', onWindowResize, false);
}

function onMouseDown(event)
{
    mouseCoords.set(
        ( event.clientX / window.innerWidth ) * 2 - 1,
        - ( event.clientY / window.innerHeight ) * 2 + 1
    );

    raycaster.setFromCamera( mouseCoords, camera );

    tmpPos.copy( raycaster.ray.direction );
    tmpPos.add( raycaster.ray.origin );

    let pos = { x: tmpPos.x, y: tmpPos.y, z: tmpPos.z };
    let radius = 1;
    let quat = {x:0, y:0, z:0, w:1};
    let mass = 1;

    let ball = new THREE.Mesh(
        new THREE.SphereGeometry(radius),
        new THREE.MeshToonMaterial({ emissive: 0xff2bed, emissiveIntensity: 0.8 })
    );
    ball.position.set(pos.x, pos.y, pos.z);
    scene.add(ball);

    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ));
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ));
    let motionState = new Ammo.btDefaultMotionState( transform );

    let colShape = new Ammo.btSphereShape(radius);
    colShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia( mass, localInertia );

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
    let body = new Ammo.btRigidBody(rbInfo);

    physicsWorld.addRigidBody(body);

    tmpPos.copy(raycaster.ray.direction);
    tmpPos.multiplyScalar(100);

    body.setLinearVelocity(new Ammo.btVector3(tmpPos.x, tmpPos.y, tmpPos.z));

    ball.userData.physicsBody = body;
    rigidBody_List.push(ball);
}

function updatePhysicsWorld(deltaTime)
{
    physicsWorld.stepSimulation( deltaTime, 10 );

    for (let i = 0; i < rigidBody_List.length; i++ )
    {
        let Graphics_Obj = rigidBody_List[i];
        let Physics_Obj = Graphics_Obj.userData.physicsBody;

        let motionState = Physics_Obj.getMotionState();
        if (motionState)
        {
            motionState.getWorldTransform(tmpTransformation);
            let new_pos = tmpTransformation.getOrigin();
            let new_qua = tmpTransformation.getRotation();

            Graphics_Obj.position.set(new_pos.x(), new_pos.y(), new_pos.z());
            Graphics_Obj.quaternion.set(new_qua.x(), new_qua.y(), new_qua.z(), new_qua.w());
        }
    }
}

function render()
{
    let deltaTime = clock.getDelta();
    updatePhysicsWorld(deltaTime);
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}