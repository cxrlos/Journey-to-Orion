/*------------------------------------------------------- game.js ---------
    |
    |   Purpose: This is aa THREE.js based game which allows you to fly among 
    |       the celestial bodies with an objective planet in mind.
    |
    |   Developers:  
    |       Carla Perez - https://github.com/CarlaPerezGavilan
    |       Carlos Garcia - https://github.com/cxrlos
    |       Juan Francisco Gortarez - https://github.com/Starfleet-Command
    |
    *--------------------------------------------------------------------*/

// Base global variables
let currentTime = Date.now();
let loopStart = Date.now();
let renderer = null, scene = null, camera = null;

// Static values which will dictate the game's behavior
let duration = 5000;
let acceleration = 0.2;
let maxSpeed = 25;
let lookSpeed = 0.05;
let velocity = 0;
let spaceshipNo = 20;
let loopDuration = 20000;
var xSpeed = 0.001;
var ySpeed = 0.001;
var zSpeed = 0.001;

// Definition of global objects that will be used in different functions 
// throughout the code
let firstSystem, secondSystem, thirdSystem;
let firstAsteroids, secondAsteroids, thirdAsteroids;
let asteroidBelt, figure;
let randomPlanetCopy = null;
let spaceships = null;
let currentSpeed = null;
let sensorImage = null;
let overlayText = null;
let timeText = null;
let alarmText = null;
let arrow = null;
let ring_y, ring_x, ring_z;
let last_position = 0, current_position = 0;
let line, pivot_line;
let arrow_pv = new THREE.Object3D;
let randomPlanet = new THREE.Object3D;
let mouse = new THREE.Vector2();
let paths = [];
let scoreboard = [];

// Specific object UUIDs used for collision detection and classification
let planeUUID = null;
let collisionUUID = null;

// Raycaster related dwfinitions
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const collideEvent = new Event('collision');
raycaster.near = 30;
raycaster.far = 2000;

/*-------------------------------------------------------------------------
    |
    |   The following function allows the spaceship to move with the "WASD"
    |   keys. It takes into account an acceleration value that will
    |   increase the velocity of the spaceship until it reaches its maximum
    |   value.
    |
    *--------------------------------------------------------------------*/

// Waits for keypress
document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    var keyCode = event.which;
    var direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    currentSpeed = ySpeed * 100;

    if (keyCode == 87) { // Movement for W

        if (ySpeed < maxSpeed)
            ySpeed = ySpeed + acceleration;

        else if (ySpeed >= maxSpeed)
            ySpeed = maxSpeed

        camera.position.add(direction.multiplyScalar(ySpeed));

    } else if (keyCode == 83) { // Movement for A

        if (ySpeed < maxSpeed)
            ySpeed = ySpeed - acceleration;

        else if (ySpeed >= maxSpeed)
            ySpeed = maxSpeed

        camera.position.add(direction.multiplyScalar(ySpeed));

    } else if (keyCode == 65)  // Movement for S
        camera.position.x -= xSpeed;

    else if (keyCode == 68)  // Movement for D
        camera.position.x += xSpeed;

    else if (keyCode == 32)  // Reset camera using the Space key
        camera.position.set(0, 0, 0);

};


/*-------------------------------------------------------------------------
    |
    |   Keyup listener to determine acceleration modification and function
    |   that serves as a counter for the acceleration calculation.
    |
    *--------------------------------------------------------------------*/

document.addEventListener("keyup", event => {
    if (event.isComposing || event.code === 229) {
        return;
    }
    if (event.code == "KeyA" || event.code == "KeyW" || event.code == "KeyS" || event.code == "KeyD") {
        xSpeed = 0.001;
        ySpeed = 0.001;
        zSpeed = 0.001;
    }
    if (event.code == "KeyW" || event.code == "KeyS") {
        decreaseCounter();
    }
}, false);

function decreaseCounter() {
    setInterval(function () {
        if (currentSpeed > 0) {
            currentSpeed = currentSpeed - acceleration * 200;
        }
        if (currentSpeed < 0) {
            currentSpeed = 0;
        }
    }, 200);

}


/*-------------------------------------------------------------------------
    |
    |   Listener and function for mouse movement.
    |
    *--------------------------------------------------------------------*/

document.addEventListener("mousemove", onMouseMove, false);
function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}


/*-------------------------------------------------------------------------
    |
    |   Collision event listener and function to determine what to do in
    |   case the player collides with an object. The objects are classified
    |   by their respective UUID which is obtained during the execution.
    |
    *--------------------------------------------------------------------*/

document.addEventListener('collision', onCollision, false);
function onCollision(event) {

    // In case it collides with an object different than the objective
    if (collisionUUID != randomPlanet.uuid) {
        loserScene();
        resetCamera();
        clock.stop();
        clock.start();
    }

    // In case it collides with the randomly assigned objective 
    else {
        scoreboardScene(clock.elapsedTime);
        resetCamera();
        clock.stop();
        clock.start();
    }

}


/*-------------------------------------------------------------------------
    |
    |   Helper function to reset the player's position to a given set of
    |   locations.
    |
    *--------------------------------------------------------------------*/

function resetCamera() {
    locations = [] // Storage for the pre-selected locations
    let loc1 = new THREE.Vector3(0, 0, 1000);
    locations.push(loc1);
    loc1 = new THREE.Vector3(1000, 5000, 1000);
    locations.push(loc1);
    loc1 = new THREE.Vector3(-7000, -3000, 1000);
    locations.push(loc1);
    loc1 = new THREE.Vector3(-6500, -2000, 800);
    locations.push(loc1);
    loc1 = new THREE.Vector3(1500, 4300, 700);
    locations.push(loc1);
    loc1 = new THREE.Vector3(0, 600, 1000);
    locations.push(loc1);

    // Randomly pick a new location for the player
    selecter = Math.floor(Math.random() * 6);
    camera.position.copy(locations[selecter]);

    // Given a camera reset, a new objective planet is set
    getRandSys();
}


/*-------------------------------------------------------------------------
    |
    |   Class that serves as a representation for a planetary system. It 
    |   contains a list of planets as a constructor.
    |
    *--------------------------------------------------------------------*/

class System {
    constructor() {
        // Contains system's planets to easily iterate over them
        this.planets = [];
    }

    // Instance of planet generation function
    newPlanet(object, moons, axis_speed, sun_speed, moon_speed, radius, sun_x, sun_y) {
        let p = new Planet(object, moons, axis_speed, sun_speed, moon_speed, radius, sun_x, sun_y);
        this.planets.push(p); // Add to instance of class planet list
    }
}


/*-------------------------------------------------------------------------
    |
    |   Planet is a class that constructs a planet with all of its 
    |   necessary speeds and pivotPoints.
    |       @param object: the planet mesh
    |       @param moons: number of moons this planet has
    |       @param axis_speed: speed of rotation on its own axis
    |       @param sun_speed: speed of rotation around the sun
    |       @param moon_speed: speed of rotation of moons around planet
    |       @param radius: planet's radius
    |
    *--------------------------------------------------------------------*/

class Planet {
    constructor(object, moons, axis_speed, sun_speed, moon_speed, radius, sun_x, sun_y) {
        // Create an empty object of type all and
        this.all = new THREE.Object3D();
        this.all.add(object);
        this.object = object;

        // Create empty object as pivot point in reference to Sun
        this.pivotSun = new THREE.Object3D();
        this.pivotSun.position.set(sun_x, sun_y, 0);
        this.pivotSun.rotation.set(0, 0, 0);

        // Add planet to sun pivot point
        this.pivotSun.add(object);

        // Add all other objects to pivotSun
        this.pivotSun.add(this.all);

        // Add pivotSun to the scene
        scene.add(this.pivotSun);

        // Create empty object as pivot of rotating moves in reference to center of planet
        this.privotCenter = new THREE.Object3D();
        this.privotCenter.position.set(object.position.x, object.position.y, 0);
        this.privotCenter.rotation.set(0, 0, 0);

        // Add center of planet to all empty object
        this.all.add(this.privotCenter);

        // Other variables: moon array and speed
        this.moons = [];
        this.axis_speed = axis_speed;
        this.sun_speed = sun_speed;
        this.moon_speed = moon_speed;

        // Create number of moons per planet in random positions around planet
        for (var i = 0; i < moons; i++) {
            // Generate random angle from 0-2*PI
            let maxA = Math.PI * 2;
            let minA = 0;
            let ran_x = (radius + 10) * Math.cos((Math.random() * (maxA - minA)) + minA);
            let ran_y = (radius + 10) * Math.sin((Math.random() * (maxA - minA)) + minA);

            // Use function to add planet in random position with texture
            let m = addPlanet(2, ran_x, ran_y, "../../images/system/moon.jpg", 0, 1, "../../images/moon_bump.jpg");

            // Add moon to moon array
            this.moons.push(m);

            // Add moon to pivot center, so that it can rotate around planet
            this.privotCenter.add(m);
        }
    }
}


/*-------------------------------------------------------------------------
    |
    |   Function that updates different values every delta time.
    |
    *--------------------------------------------------------------------*/

function animate() {
    controls.update(clock.getDelta()); // Update scene controls

    let timer = Date.now();
    let delta = timer - loopStart;

    // Update the randomly generated spacesips and loop over the traslation
    for (let r = 0; r < spaceshipNo; r++) {
        if (typeof spaceships.children[r] !== "undefined") {
            if (delta < loopDuration)
                spaceships.children[r].translateZ(paths[r]);

            else {
                spaceships.children[r].rotation.y = Math.floor(Math.random() * 360);
                loopStart = Date.now();
            }
        }
    }

    // FirstSystem: Update all planets in planet array
    firstSystem.planets.forEach(planet => {
        planet.object.rotation.z += planet.axis_speed; // Planet axial rotation
        planet.privotCenter.rotation.z += planet.moon_speed; // Moon rotation
        planet.pivotSun.rotation.z += planet.sun_speed; // Traslation
    });

    // SecondSystem: Update all planets in planet array
    secondSystem.planets.forEach(planet => {
        planet.object.rotation.z += planet.axis_speed; // Planet axial rotation
        planet.privotCenter.rotation.z += planet.moon_speed; // Moon rotation
        planet.pivotSun.rotation.z += planet.sun_speed; // Traslation
    });

    // ThirdSystem: Update all planets in planet array
    thirdSystem.planets.forEach(planet => {
        planet.object.rotation.z += planet.axis_speed; // Planet axial rotation
        planet.privotCenter.rotation.z += planet.moon_speed; // Moon rotation
        planet.pivotSun.rotation.z += planet.sun_speed; // Traslation
    });

    //Asteroid system transformations
    firstAsteroids.children.forEach(asteroid => {
        asteroid.rotation.z += 0.01;
    });
    secondAsteroids.children.forEach(asteroid => {
        asteroid.rotation.z += 0.01;
    });
    thirdAsteroids.children.forEach(asteroid => {
        asteroid.rotation.z += 0.01;
    });

    // Calculate the objective planet position to update the guiding arrow 
    // rotation value.
    var randPlanetPos = new THREE.Vector3();
    randomPlanet.getWorldPosition(randPlanetPos);
    arrow_pv.lookAt(randPlanetPos);

    // Establish origin and direction for raycaster
    raycaster.setFromCamera(mouse, camera);

    // Detect which (if any) elements are in the raycaster's line of sight
    let intersects = raycaster.intersectObjects(scene.children, true);

    if (typeof intersects[0] !== "undefined") { // If any one is found, show it 
        let figure = intersects[0].object.clone();

        if (figure.geometry.type == "SphereGeometry") { // Scaling for planet
            figure.scale.set(0.005, 0.005, 0.005);
        }

        else figure.scale.set(0.01, 0.01, 0.01); // Scaling for spaceships
        figure.position.set(0, -3, -15);

        if (sensorImage == null) { // If nothing is on the sensor, add the intersected item
            sensorImage = figure;
            camera.add(figure);
        }
        else { // Continuously update sensor data
            sensorImage.copy(figure);
            overlayText.innerHTML = "Distance: " + Math.round(intersects[0].distance) + " km";

            // UUID of intersected object to classify the collision
            let intersectUUID = intersects[0].object.uuid;

            if (Math.round(intersects[0].distance) < 40) { // Collision event
                // Detection for inner control plane and UNDEF values
                if (intersectUUID != planeUUID || intersectUUID == null) {
                    collisionUUID = intersectUUID;
                    document.dispatchEvent(collideEvent);
                }
            }

            // Warning when the user approaches a dangerous object
            else if (Math.round(intersects[0].distance) > 40 && Math.round(intersects[0].distance) < 300) {
                // Logical statements that allows the warning text to blink
                if (randomPlanet.uuid != intersects[0].object.uuid) {
                    if (Math.floor(clock.elapsedTime) % 2 == 0) {
                        alarmText.style.display = "block"
                    } else {
                        alarmText.style.display = "none"
                    }
                }
            } else {
                alarmText.style.display = "none"
            }
        }
    }

    // From this line and until the end of the function, there are self-
    // explanatory calculations that have the purpose of displaying useful
    // values in the user's control pane
    let minutes = Math.floor(Math.round(clock.elapsedTime) / 60);
    timeText.innerHTML = "Time: " + minutes + "m " + (Math.round(clock.elapsedTime) - (minutes * 60)) + "s";

    if (clock.elapsedTime > 5) {
        let sb = document.getElementById("scoreboard");
        sb.style.display = "none";
    }

    if (currentSpeed == null) {
        currentSpeed = 0;
    }

    let final_speed = (Math.abs(currentSpeed) * Math.PI) / 2000;

    if (final_speed > Math.PI) {
        final_speed = Math.PI;
    }
    line.rotation.set(0, 0, -final_speed);
    let speed_element = document.getElementById("speed");
    speed_element.innerHTML = "Speed: " + Math.abs(Math.round(currentSpeed));
}


/*-------------------------------------------------------------------------
    |
    |   Function that renders scene and camera, calls animate.
    |
    *--------------------------------------------------------------------*/

function run() {
    requestAnimationFrame(function () { run(); });
    renderer.render(scene, camera); // Render the scene
    animate(); // Update rotations calling animate
}


/*-------------------------------------------------------------------------
    |
    |   Initializes all objects on the scene before any updates.
    |
    *--------------------------------------------------------------------*/

function createScene() {
    // Creation of renderer and setting size to browser window size
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    overlayText = document.getElementById("distance");
    timeText = document.getElementById("chrono");
    alarmText = document.getElementById("warning");

    // Create scene object
    scene = new THREE.Scene();

    // Create camera with ratio of window
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);

    // Create first Person Controls
    controls = new THREE.FirstPersonControls(camera, renderer.domElement);
    controls.movementSpeed = velocity;
    controls.lookSpeed = lookSpeed;

    // Start scene background with black
    scene.background = new THREE.Color(0, 0, 0);

    // Initialize camara position on top of solar system
    camera.position.set(0, 0, 1000);
    controls.update(clock.getDelta());

    // Add camara to scene
    scene.add(camera);

    // Create ambient light to iluminate all scene when sun isn't iluminating it
    let ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    // Creating point light that simulates sun light
    var pointColor = "#ffffff";
    var pointLight = new THREE.PointLight(pointColor);

    // Set sun's point light to center
    pointLight.position.set(0, 0, 0);
    pointLight.intensity = 2.0;

    // Making sure pointLight casts shadow
    pointLight.castShadow = true;

    //Adding pointlight to sceen 
    scene.add(pointLight);

    { // Skybox pane definition for loading
        const loader = new THREE.CubeTextureLoader();
        const texture = loader.load([
            '../textures/skybox/corona_ft.png',
            '../textures/skybox/corona_bk.png',
            '../textures/skybox/corona_up.png',
            '../textures/skybox/corona_dn.png',
            '../textures/skybox/corona_rt.png',
            '../textures/skybox/corona_lf.png',
        ]);
        scene.background = texture;
    }

    //Create spaceship interior and add it as a child of the camera
    let plane_geometry = new THREE.PlaneGeometry(35, 20, 32);
    textureMap = new THREE.TextureLoader().load("../textures/cockpit/dashboard.png");
    let plane_material = new THREE.MeshBasicMaterial({ map: textureMap, transparent: true, side: THREE.DoubleSide });
    let plane = new THREE.Mesh(plane_geometry, plane_material);
    plane.position.set(0, 0, -20);
    plane.rotation.set(0, 0, 0);
    planeUUID = plane.uuid;
    camera.add(plane);


    // Add arrow that will serve as a pointer towards the objective planet
    let arrowURL = { obj: '../models/arrow/arrow.obj', scale: 0.02 };
    loadObj(arrowURL, arrow_pv, 0, 0, 0);
    arrow_pv.position.set(0, .1, -5);
    camera.add(arrow_pv);

    //Add speedometer
    let speedo_geomerty = new THREE.PlaneGeometry(2.25, 1.5, 32);
    texture_speedo = new THREE.TextureLoader().load("../textures/speedometer/velocity.png");
    let speedo_material = new THREE.MeshBasicMaterial({ map: texture_speedo, transparent: true, side: THREE.DoubleSide });
    let speedometer = new THREE.Mesh(speedo_geomerty, speedo_material);
    speedometer.position.set(-3.6, -4.3, 5);
    speedometer.rotation.set(0, 0, 0);
    plane.add(speedometer);


    //Speedometer pointer 
    const material = new THREE.LineBasicMaterial({
        color: 0x00FFFF
    });

    const points = [];
    points.push(new THREE.Vector3(0, 0, 0));
    points.push(new THREE.Vector3(-1, 0, 0));

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    line = new THREE.Line(geometry, material);
    line.position.set(0, 0, 0);
    pivot_line = new THREE.Object3D();
    pivot_line.position.set(-3.7, -4.8, 5);
    pivot_line.add(line);
    plane.add(pivot_line);

    //Rotation dashboard x
    let x_ring_geomtery = new THREE.RingGeometry(0.6, 0.5, 32);
    let x_ring_material = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
    ring_x = new THREE.Mesh(x_ring_geomtery, x_ring_material);
    plane.add(ring_x);
    ring_x.position.set(-4, -3, 3);

    //Rotation dashboard y
    let y_ring_geometry = new THREE.RingGeometry(0.6, 0.5, 32);
    let y_ring_material = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
    ring_y = new THREE.Mesh(y_ring_geometry, y_ring_material);
    plane.add(ring_y);
    ring_y.position.set(-4, -3, 3);
    ring_y.rotation.set(0, 1, 0);


    //Rotation dashboard z
    let z_ring_geometry = new THREE.RingGeometry(0.6, 0.5, 32);
    let z_ring_material = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
    ring_z = new THREE.Mesh(z_ring_geometry, z_ring_material);
    plane.add(ring_z);
    ring_z.position.set(-4, -3, 3);
    ring_z.rotation.set(1, 0, 0);

    // Creating the sun 
    let sun = addPlanet(30, 0, 0, "../models/planets/inhospitable/Volcanic.png", 1, 0, "");
    scene.add(sun);

    let all_textures = [
        "inhospitable/Volcanic.png",
        "inhospitable/Icy.png",
        "inhospitable/Martian.png",
        "inhospitable/Venusian.png",
        "gas_giants/Gaseous1.png",
        "gas_giants/Gaseous2.png",
        "gas_giants/Gaseous3.png",
        "gas_giants/Gaseous4.png",
        "habitable/Alpine.png",
        "habitable/Savannah.png",
        "habitable/Swamp.png",
        "habitable/Tropical.png",
        "terrestrial/Terrestrial1.png",
        "terrestrial/Terrestrial2.png",
        "terrestrial/Terrestrial3.png",
        "terrestrial/Terrestrial4.png"
    ]

    //Load and generate the spaceship at a random point in space	
    spaceships = new THREE.Object3D;
    let objModelUrl = { obj: '../models/spaceships/luminaris/Luminaris.obj', map: '../models/spaceships/viper/face.jpg', scale: 0.4 };
    let lowerLimit = [0, 0, 0];
    let upperLimit = [2000, 2000, 2000];
    spaceshipMultigen(objModelUrl, spaceshipNo, lowerLimit, upperLimit);

    for (let i = 0; i < spaceshipNo; i++) {
        let z = Math.random();
        paths.push(z);
    }
    scene.add(spaceships);

    let random_texture_index = 0;

    firstSystem = new System(); // First System

    // Sun First System addPlanet(radius, x, y, mapUrl, mat, haveBump, bumpMap)
    let sun_a = addPlanet(180, 0, 0, "../models/planets/inhospitable/Volcanic.png", 1, 0, "");
    scene.add(sun_a);

    random_texture_index = Math.round(Math.random() * 15);
    let planetA1 = addPlanet(100, 60, 2.5, "../models/planets/" + all_textures[random_texture_index], 1, 0, "");
    firstSystem.newPlanet(planetA1, 0, 0.01, 0.01, 0.02, 5, sun_a.position.x, sun_a.position.y);
    all_textures.splice(random_texture_index, 1);

    random_texture_index = Math.round(Math.random() * 14);
    let planetA2 = addPlanet(130, 850, 3, "../models/planets/" + all_textures[random_texture_index], 1, 0, "");
    firstSystem.newPlanet(planetA2, 0, 0.01, 0.008, 0.01, 6, sun_a.position.x, sun_a.position.y);
    all_textures.splice(random_texture_index, 1);

    random_texture_index = Math.round(Math.random() * 13);
    let planetA3 = addPlanet(80, 1100, 3.5, "../models/planets/" + all_textures[random_texture_index], 1, 0, "");
    firstSystem.newPlanet(planetA3, 0, 0.01, 0.009, 0.01, 7, sun_a.position.x, sun_a.position.y);
    all_textures.splice(random_texture_index, 1);

    random_texture_index = Math.round(Math.random() * 12);
    let planetA4 = addPlanet(110, 1800, 3, "../models/planets/" + all_textures[random_texture_index], 1, 0, "");
    firstSystem.newPlanet(planetA4, 0, 0.01, 0.005, 0.02, 6, sun_a.position.x, sun_a.position.y);
    all_textures.splice(random_texture_index, 1);


    secondSystem = new System(); // Second System

    // Seocnd System Sun  addPlanet(radius, x, y, mapUrl, mat, haveBump, bumpMap)
    let sun_b = addPlanet(200, 1000, 5000, "../models/planets/inhospitable/Venusian.png", 1, 0, "");
    scene.add(sun_b);

    random_texture_index = Math.round(Math.random() * 11);
    let planetB1 = addPlanet(120, 400, 2.5, "../models/planets/" + all_textures[random_texture_index], 1, 0, "");
    secondSystem.newPlanet(planetB1, 0, 0.01, 0.01, 0.02, 5, sun_b.position.x, sun_b.position.y);
    all_textures.splice(random_texture_index, 1);

    random_texture_index = Math.round(Math.random() * 10);
    let planetB2 = addPlanet(90, 800, 3, "../models/planets/" + all_textures[random_texture_index], 1, 0, "");
    secondSystem.newPlanet(planetB2, 0, 0.01, 0.008, 0.01, 6, sun_b.position.x, sun_b.position.y);
    all_textures.splice(random_texture_index, 1);

    random_texture_index = Math.round(Math.random() * 9);
    let planetB3 = addPlanet(80, 1200, 3.5, "../models/planets/" + all_textures[random_texture_index], 1, 0, "");
    secondSystem.newPlanet(planetB3, 0, 0.01, 0.009, 0.01, 7, sun_b.position.x, sun_b.position.y);
    all_textures.splice(random_texture_index, 1);

    random_texture_index = Math.round(Math.random() * 8);
    let planetB4 = addPlanet(150, 1600, 3, "../models/planets/" + all_textures[random_texture_index], 1, 0, "");
    secondSystem.newPlanet(planetB4, 0, 0.01, 0.005, 0.02, 6, sun_b.position.x, sun_b.position.y);
    all_textures.splice(random_texture_index, 1);

    random_texture_index = Math.round(Math.random() * 7);
    let planetB5 = addPlanet(95, 2400, 3, "../models/planets/" + all_textures[random_texture_index], 1, 0, "");
    secondSystem.newPlanet(planetB5, 0, 0.01, 0.005, 0.02, 6, sun_b.position.x, sun_b.position.y);
    all_textures.splice(random_texture_index, 1);


    thirdSystem = new System(); // Third System

    // Second System Sun  addPlanet(radius, x, y, mapUrl, mat, haveBump, bumpMap)
    let sun_c = addPlanet(400, -7000, -3000, "../models/planets/inhospitable/Volcanic.png", 1, 0, "");
    scene.add(sun_c);

    random_texture_index = Math.round(Math.random() * 6);
    let planetC1 = addPlanet(150, 1000, 2.5, "../models/planets/" + all_textures[random_texture_index], 1, 0, "");
    thirdSystem.newPlanet(planetC1, 0, 0.01, 0.01, 0.02, 5, sun_c.position.x, sun_c.position.y);
    all_textures.splice(random_texture_index, 1);

    random_texture_index = Math.round(Math.random() * 5);
    let planetC2 = addPlanet(400, 1200, 3, "../models/planets/" + all_textures[random_texture_index], 1, 0, "");
    thirdSystem.newPlanet(planetC2, 0, 0.01, 0.008, 0.01, 6, sun_c.position.x, sun_c.position.y);
    all_textures.splice(random_texture_index, 1);

    random_texture_index = Math.round(Math.random() * 4);
    let planetC3 = addPlanet(120, 1400, 3.5, "../models/planets/" + all_textures[random_texture_index], 1, 0, "");
    thirdSystem.newPlanet(planetC3, 0, 0.01, 0.009, 0.01, 7, sun_c.position.x, sun_c.position.y);
    all_textures.splice(random_texture_index, 1);

    random_texture_index = Math.round(Math.random() * 3);
    let planetC4 = addPlanet(90, 1600, 3, "../models/planets/" + all_textures[random_texture_index], 1, 0, "");
    thirdSystem.newPlanet(planetC4, 0, 0.01, 0.005, 0.02, 6, sun_c.position.x, sun_c.position.y);
    all_textures.splice(random_texture_index, 1);

    // Asteroid generation
    firstAsteroids = new THREE.Object3D;
    secondAsteroids = new THREE.Object3D;
    thirdAsteroids = new THREE.Object3D;

    generateRandom(5000, -5000);

    firstAsteroids.position.set(sun_a.position.x, sun_a.position.y, 0);
    scene.add(firstAsteroids);

    secondAsteroids.position.set(sun_b.position.x, sun_b.position.y, 0);
    scene.add(secondAsteroids);

    thirdAsteroids.position.set(sun_c.position.x, sun_c.position.y, 0);
    scene.add(thirdAsteroids);

    // Random planet assignation
    randomPlanet = getRandSys();
    camera.add(randomPlanetCopy);

    updateRotation();
}


/*-------------------------------------------------------------------------
    |
    |   Simple function that ranks the successful missions by time
    |
    *--------------------------------------------------------------------*/

function timeSort(a, b) {
    return a - b;
}


/*-------------------------------------------------------------------------
    |
    |   Display of the loser scene for when the user collides with an
    |   object that's not the objective.
    |
    *--------------------------------------------------------------------*/

function loserScene() {
    // Creation of renderer and setting size to browser window size

    let sb = document.getElementById("scoreboard");
    let sbText = "Scoreboard: <br>"
    scoreboard.sort(timeSort);
    scoreLen = scoreboard.length;

    if (scoreLen > 10) {
        scoreLen = 10;
    }

    for (i = 0; i < scoreLen; i++) {
        sbText = sbText + " " + (i + 1) + ". \t" + Math.round(scoreboard[i]) + "s. " + "<br>";
    }
    sbText = sbText + "<br>" + "You collided with an astral object! Try again to get into the scoreboard!";
    sb.innerHTML = sbText;
    sb.style.display = "block";

}


/*-------------------------------------------------------------------------
    |
    |   Display of the winner scene for when the user collides with the
    |   objective.
    |
    *--------------------------------------------------------------------*/

function scoreboardScene(time) {
    // Creation of renderer and setting size to browser window size

    let sb = document.getElementById("scoreboard");
    let sbText = "Scoreboard: <br>"
    scoreboard.push(time);

    scoreboard.sort(timeSort);

    scoreLen = scoreboard.length;

    if (scoreLen > 10) {
        scoreLen = 10;
    }

    for (i = 0; i < scoreLen; i++) {
        sbText = sbText + " " + (i + 1) + ". \t" + Math.round(scoreboard[i]) + "s. " + "<br>";
    }
    sbText = sbText + "<br>" + "Congratulations! You ended up at number " + (scoreboard.indexOf(time) + 1);
    sb.innerHTML = sbText;
    sb.style.display = "block";

}


/*-------------------------------------------------------------------------
    |
    |   Function that generates asteroids with a random position.
    |
    *--------------------------------------------------------------------*/

function generateRandom(max_pos, min_pos) {
    setInterval(function () {
        let rand_x = Math.random() * (max_pos - min_pos) + min_pos;
        let rand_y = Math.random() * (max_pos - min_pos) + min_pos;
        let random_system = Math.round(Math.random() * 2);
        let objModelUrl = { obj: '../models/asteroids/A2.obj', map: '../models/asteroids/Textures/Normal.jpg', scale: 25 };

        if (random_system == 0) {
            loadObj(objModelUrl, firstAsteroids, rand_x, rand_y, -400);
        }

        if (random_system == 1) {
            loadObj(objModelUrl, secondAsteroids, rand_x, rand_y, -400);
        }
        if (random_system == 2) {
            loadObj(objModelUrl, thirdAsteroids, rand_x, rand_y, -400);
        }
    }, 20000);
}


/*-------------------------------------------------------------------------
    |
    |   Creates x amount of spaceship objects at the specified x,y,z 
    |   coordinates	
    |       @param objModelUrl: an object with the .obj url and the 
    |          .jpg/.png texture
    |       @param number amount of spaceships to generate
    |       @param lowerLimit array of size 3 that contains the x,y,z 
    |           coordinates (in that order) of the lower limit
    |       @param upperLimit array of size 3 that contains the x,y,z 
    |           coordinates (in that order) of the upper limit
    |
    *--------------------------------------------------------------------*/
function spaceshipMultigen(objModelUrl, number, lowerLimit, upperLimit) {
    var x, y, z;
    for (let index = 0; index < number; index++) {
        x = Math.floor(Math.random() * (upperLimit[0] - lowerLimit[0]) + lowerLimit[0]);
        y = Math.floor(Math.random() * (upperLimit[1] - lowerLimit[1]) + lowerLimit[1]);
        z = Math.floor(Math.random() * (upperLimit[2] - lowerLimit[2]) + lowerLimit[2]);

        genSpaceship(objModelUrl, spaceships, x, y, z);
    }
}


/*-------------------------------------------------------------------------
    |
    |   Function that calls the different THREE.js functions required to
    |   create a sphere object representing a planet.
    |
    *--------------------------------------------------------------------*/

function addPlanet(radius, x, y, mapUrl, mat, haveBump, bumpMap) {
    textureMap = new THREE.TextureLoader().load(mapUrl); // Load texture map 

    if (mat == 0) {
        if (haveBump == 1) {
            bumpMap = new THREE.TextureLoader().load(bumpMap);
            material = new THREE.MeshPhongMaterial({ map: textureMap, bumpMap: bumpMap, bumpScale: 0.06 });
        } else {
            material = new THREE.MeshPhongMaterial({ map: textureMap });
        }
    }
    else {
        material = new THREE.MeshBasicMaterial({ map: textureMap });
    }

    // Create planet with geometry and material
    let geometry = new THREE.SphereGeometry(radius, 32, 32);
    let figure = new THREE.Mesh(geometry, material);

    // Initialize Position
    figure.position.set(x, y, 0);
    return figure;
}


/*-------------------------------------------------------------------------
    |
    |   Creates a spaceship object at the specified x,y,z coordinates.
    |       @param objModelUrl: an object with the .obj url and the 
    |           .jpg/.png texture
    |       @param objectList: the master object that will contain the 
    |           spaceship 
    |
    *--------------------------------------------------------------------*/

function genSpaceship(objModelUrl, objectList, x, y, z) {
    loadObj(objModelUrl, objectList, x, y, z);
}

const onError = ((err) => { console.error(err); });

async function loadObj(objModelUrl, objectList, x, y, z) {
    const objPromiseLoader = promisifyLoader(new THREE.OBJLoader());
    try {
        const object = await objPromiseLoader.load(objModelUrl.obj);

        let texture = objModelUrl.hasOwnProperty('map') ? new THREE.TextureLoader().load(objModelUrl.map) : null;
        let normalMap = objModelUrl.hasOwnProperty('normalMap') ? new THREE.TextureLoader().load(objModelUrl.normalMap) : null;
        let specularMap = objModelUrl.hasOwnProperty('specularMap') ? new THREE.TextureLoader().load(objModelUrl.specularMap) : null;
        let scale = objModelUrl.hasOwnProperty('scale') ? objModelUrl.scale : null;

        object.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material.map = texture;
                child.material.normalMap = normalMap;
                child.material.specularMap = specularMap;
            }
        });

        object.scale.set(scale, scale, scale);
        object.position.z = z;
        object.position.x = x;
        object.position.y = y;
        object.rotation.y = 2 * Math.PI;
        object.name = "Spaceship";

        let PivotPoint = new THREE.Object3D;

        PivotPoint.add(object);
        PivotPoint.position.z = z;
        PivotPoint.position.x = x;
        PivotPoint.position.y = y;
        if (texture)
            PivotPoint.rotation.y = Math.floor(Math.random() * 360);
        objectList.add(PivotPoint);
    }
    catch (err) {
        return onError(err);
    }
}


function promisifyLoader(loader, onProgress) {
    function promiseLoader(url) {
        return new Promise((resolve, reject) => {
            loader.load(url, resolve, onProgress, reject);
        });
    }

    return {
        originalLoader: loader,
        load: promiseLoader,
    };
}


/*-------------------------------------------------------------------------
    |
    |   .obj loader function mainly inspired from the one seen on the 
    |   classroom examples.
    |
    *--------------------------------------------------------------------*/

async function loadObj(objModelUrl, objectList, x, y, z) {
    const objPromiseLoader = promisifyLoader(new THREE.OBJLoader());
    try {
        const object = await objPromiseLoader.load(objModelUrl.obj);

        let texture = objModelUrl.hasOwnProperty('map') ? new THREE.TextureLoader().load(objModelUrl.map) : null;
        let normalMap = objModelUrl.hasOwnProperty('normalMap') ? new THREE.TextureLoader().load(objModelUrl.normalMap) : null;
        let specularMap = objModelUrl.hasOwnProperty('specularMap') ? new THREE.TextureLoader().load(objModelUrl.specularMap) : null;
        let scale = objModelUrl.hasOwnProperty('scale') ? objModelUrl.scale : null;

        object.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material.map = texture;
                child.material.normalMap = normalMap;
                child.material.specularMap = specularMap;
            }
        });

        object.scale.set(scale, scale, scale);
        object.position.z = z;
        object.position.x = x;
        object.position.y = y;
        object.rotation.y = 2 * Math.PI;
        object.name = "Spaceship";

        let PivotPoint = new THREE.Object3D;

        PivotPoint.add(object);
        PivotPoint.position.z = z;
        PivotPoint.position.x = x;
        PivotPoint.position.y = y;

        // As we re-used the function for thr arrow generation, it is the 
        // simplest way to avoid rotation in this object
        if (texture)
            PivotPoint.rotation.y = Math.floor(Math.random() * 360);
        objectList.add(PivotPoint);
    }
    catch (err) {
        return onError(err);
    }
}


/*-------------------------------------------------------------------------
    |
    |   Function that calculates the spaceship rotation to feed the gyro
    |   with the updated rotation data.
    |
    *--------------------------------------------------------------------*/

function updateRotation() {
    setInterval(function () {
        current_rotation_x = camera.rotation.x;
        current_rotation_y = camera.rotation.y;
        current_rotation_z = camera.rotation.z;

        let rot_x = Math.round((current_rotation_x * 180) / Math.PI);
        let rot_y = Math.round(current_rotation_y * (180 / Math.PI));
        let rot_z = Math.round(current_rotation_z * (180 / Math.PI));

        ring_x.rotation.set(current_rotation_x, current_rotation_y, current_rotation_z);
        let rotation_element = document.getElementById("rotation");
        rotation_element.innerHTML = "Rotation: " + rot_x + ", " + rot_y + ", " + rot_z;

    }, 1000);
}


/*-------------------------------------------------------------------------
    |
    |   Returns a random planet object from a random system, used to 
    |   generate random objective.
    |
    *--------------------------------------------------------------------*/

function getRandSys() {
    var ranSystem = (Math.floor(Math.random() * 3)); // Select between three systems

    switch (ranSystem) { // Select a random planet from a given random system index
        case 0:
            var ranPlanet = firstSystem.planets[Math.floor(Math.random() * firstSystem.planets.length)];
            break;
        case 1:
            var ranPlanet = secondSystem.planets[Math.floor(Math.random() * secondSystem.planets.length)];
            break;
        case 2:
            var ranPlanet = thirdSystem.planets[Math.floor(Math.random() * thirdSystem.planets.length)];
            break;
        default:
            break;
    }
    let figure = ranPlanet.object.clone(); // Used to copy it to the dashboard

    // Positions the copy on the dashboard to visualize it
    figure.scale.set(.005, .005, .005);
    figure.position.set(3.75, -3, -15);
    if (randomPlanetCopy == null) {
        randomPlanetCopy = figure;
        camera.add(figure);
    } else {
        randomPlanetCopy.copy(figure);
    }
    return ranPlanet.object;
}

