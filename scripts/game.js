/*------------------------------------------------------- game.js ---------
    |
    |   Purpose: THREEJS program that emulates a solar system.
    |
    |   Developer:  
    |       Carla Perez - https://github.com/CarlaPerezGavilan
    |       Carlos Garcia - https://github.com/cxrlos
    |       Juan Francisco Gortarez - https://github.com/Starfleet-Command
    |
    *--------------------------------------------------------------------*/

// Declaration of all global variables
let renderer = null, scene = null, camera = null;
let asteroidBelt, figure;
let firstSystem, secondSystem, thirdSystem;
let firstAsteroids, secondAsteroids, thirdAsteroids;
let duration = 5000;
let currentTime = Date.now();

let spaceships = null;
let paths = [];
let scoreboard = [];
let lookSpeed = 0.05;
let velocity = 150;
let spaceshipNo = 20;
let loopDuration = 20000;
let loopStart = Date.now();
let mouse = new THREE.Vector2();
let sensorImage = null;
let overlayText = null;
let timeText = null;
let last_position = 0, current_position = 0;	
let line, pivot_line;
let ring_y, ring_x, ring_z;

let arrow = null;
let arrow_pv = new THREE.Object3D;
let randomPlanet = new THREE.Object3D;

var xSpeed = 0.001;
var ySpeed = 0.001;
var zSpeed = 0.001;

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const collideEvent = new Event('collision');
raycaster.near = 30;
raycaster.far = 2000;





document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    var keyCode = event.which;
    if (keyCode == 87) {
        camera.position.y += ySpeed;
    } else if (keyCode == 83) {
        camera.position.y -= ySpeed;
    } else if (keyCode == 65) {
        camera.position.x -= xSpeed;
    } else if (keyCode == 68) {
        camera.position.x += xSpeed;
    } else if (keyCode == 32) {
        camera.position.set(0, 0, 0);
    }
};

document.addEventListener("mousemove", onMouseMove, false);
function onMouseMove(event) {

    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

}

document.addEventListener('collision', onCollision, false);

function onCollision(event) {

    scoreboardScene(clock.elapsedTime);
    resetCamera();
    clock.stop();
    clock.start();

}

function resetCamera() {
    locations = []
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

    selecter = Math.floor(Math.random() * 6);
    camera.position.copy(locations[selecter]);


}

/**
 * System is a class that contains all planets, it is created at the begining so that
 * we can iterate all planets and update them
 * @constructor
 */
class System {
    constructor() {
        this.planets = [];
        this.bounding = [];
    }
    newPlanet(object, moons, axis_speed, sun_speed, moon_speed, radius, sun_x, sun_y) {
        let p = new Planet(object, moons, axis_speed, sun_speed, moon_speed, radius, sun_x, sun_y);
        this.planets.push(p);
        
        let boundingBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
        boundingBox.setFromObject(p.object);

        let boxHelper = new THREE.Box3Helper(boundingBox, 0xffffff);
        // helper.visible = false;
        this.bounding.push(boxHelper);
        scene.add(boxHelper);
    }
}

/**
 * Planet is a class that constructs a planet with all of its necessary speeds and pivotPoints
 * @param object: the planet mesh
 * @param moons: number of moons this planet has
 * @param axis_speed: speed of rotation on its own axis
 * @param sun_speed: speed of rotation around the sun
 * @param moon_speed: speed of rotation of moons around planet
 * @param radius: planet's radius
 */
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

/**
 * ANIMATE: Updates scene every delta time
 */

function animate() {
    // Update scene controls
    controls.update(clock.getDelta());

    let timer = Date.now();
    let delta = timer - loopStart;

    for (let r = 0; r < spaceshipNo; r++) {
        if (typeof spaceships.children[r] !== "undefined") {
            if (delta < loopDuration) {
                spaceships.children[r].translateZ(paths[r]);
            } else {
                spaceships.children[r].rotation.y = Math.floor(Math.random() * 360);
                //paths[r] = -paths[r];	
                loopStart = Date.now();
            }
        }
    }

    // FirstSystem: Update all planets in planet array
    firstSystem.planets.forEach((planet, index) => {
        // Update rotation of planet on its own speed (axis rotation)
        planet.object.rotation.z += planet.axis_speed;
        // Update rotation of moons around planet (moon rotation)
        planet.privotCenter.rotation.z += planet.moon_speed;
        // Update rotation of planet around sun (orbital rotation)
        planet.pivotSun.rotation.z += planet.sun_speed;

        var absolutePos = new THREE.Vector3();
        planet.object.getWorldPosition(absolutePos);

        // if(index == 1)
            // console.log(firstSystem.bounding[index].position);

        firstSystem.bounding[index].position.copy(absolutePos);

        // if(index == 1)
            // console.log(firstSystem.bounding[index].position);
        

    });

    // SecondSystem: Update all planets in planet array
    secondSystem.planets.forEach(planet => {
        // Update rotation of planet on its own speed (axis rotation)
        planet.object.rotation.z += planet.axis_speed;
        // Update rotation of moons around planet (moon rotation)
        planet.privotCenter.rotation.z += planet.moon_speed;
        // Update rotation of planet around sun (orbital rotation)
        planet.pivotSun.rotation.z += planet.sun_speed;
    });

    // ThirdSystem: Update all planets in planet array
    thirdSystem.planets.forEach(planet => {
        // Update rotation of planet on its own speed (axis rotation)
        planet.object.rotation.z += planet.axis_speed;
        // Update rotation of moons around planet (moon rotation)
        planet.privotCenter.rotation.z += planet.moon_speed;
        // Update rotation of planet around sun (orbital rotation)
        planet.pivotSun.rotation.z += planet.sun_speed;
    });


    var randPlanetPos = new THREE.Vector3();
    randomPlanet.getWorldPosition(randPlanetPos);
    arrow_pv.lookAt(randPlanetPos);

    //establish origin and direction for raycaster
    raycaster.setFromCamera(mouse, camera);

    //detect which (if any) elements are in the raycaster's line of sight
    let intersects = raycaster.intersectObjects(scene.children, true);

    // if any one is found, show it. 
    if (typeof intersects[0] !== "undefined") {
        let figure = intersects[0].object.clone();

        if (figure.geometry.type == "SphereGeometry") {
            figure.scale.set(0.005, 0.005, 0.005);
        }

        else figure.scale.set(0.1, 0.1, 0.1);
        figure.position.set(0, -3, -15);

        //if nothing is on the sensor, add the intersected item
        if (sensorImage == null) {
            // camera.children.forEach(element => {


            //     element.geometry.dispose();
            //     element.material.dispose();
            //     scene.remove(element);

            // });
            // renderer.renderLists.dispose();

            sensorImage = figure;
            camera.add(figure);


        }
        //continuously update sensor data
        else {
            sensorImage.copy(figure);
            overlayText.innerHTML = "Distance: " + Math.round(intersects[0].distance) + " km";

            //Collision placeholder
            if (Math.round(intersects[0].distance) < 40) {
                document.dispatchEvent(collideEvent);
            }
        }

    }
    // else sensorImage = null;
    let minutes = Math.floor(Math.round(clock.elapsedTime) / 60);



    timeText.innerHTML = "Time: " + minutes + "m " + (Math.round(clock.elapsedTime) - (minutes * 60)) + "s";



    if (clock.elapsedTime > 5) {
        let sb = document.getElementById("scoreboard");
        sb.style.display = "none";
    }




}

/**
 * RUN: it renders scene and camera, calls animate
 */
function run() {
    requestAnimationFrame(function () { run(); });


    // Render the scene
    renderer.render(scene, camera);
    // Update rotations calling animate
    animate();
}

/**
 * createScene: Initializes all objects on the scene before any updates
 */

function createScene() {
    // Creation of renderer and setting size to browser window size
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    overlayText = document.getElementById("distance");
    timeText = document.getElementById("chrono");


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
    // resetCamera();

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

    {
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

    //Create spaceship interior and add it as a child of the camera.
    let plane_geometry = new THREE.PlaneGeometry(35, 20, 32);
    textureMap = new THREE.TextureLoader().load("../textures/cockpit/dashboard.png");
    let plane_material = new THREE.MeshBasicMaterial({ map: textureMap, transparent: true, side: THREE.DoubleSide });
    let plane = new THREE.Mesh(plane_geometry, plane_material);
    plane.position.set(0, 0, -20);
    plane.rotation.set(0, 0, 0);
    camera.add(plane);


    // Add arrow
    let arrowURL = { obj: '../models/arrow/arrow.obj', scale: 0.04};
    loadObj(arrowURL, arrow_pv, 0, 0, 0);
    arrow_pv.position.set(1.25,-.95,-5);
    // arrow_pv.lookAt(0,0,0);
    camera.add(arrow_pv);
    
    //Add speedometer
    let speedo_geomerty = new THREE.PlaneGeometry(2.25, 1.5, 32);
    texture_speedo = new THREE.TextureLoader().load("../textures/speedometer/velocity.png");
    let speedo_material = new THREE.MeshBasicMaterial( {map: texture_speedo, transparent:true, side: THREE.DoubleSide} );
    let speedometer = new THREE.Mesh( speedo_geomerty, speedo_material );
    speedometer.position.set(-3.6, -4.3, 5);
    speedometer.rotation.set(0, 0, 0);
    plane.add( speedometer );


    //Speedometer pointer 
    const material = new THREE.LineBasicMaterial({
        color: 0x0000ff
    });
    
    const points = [];
    points.push( new THREE.Vector3( 0, 0, 0) );
    points.push( new THREE.Vector3( -1, 0, 0) );
    
    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    
    line = new THREE.Line( geometry, material );
    line.position.set(0, 0, 0);
    pivot_line = new THREE.Object3D();
    pivot_line.position.set(-3.7, -4.8, 5);
    pivot_line.add(line);
    plane.add( pivot_line );
  
    //Rotation dashboard x
    let x_ring_geomtery = new THREE.RingGeometry( 0.6, 0.5, 32 );
    let x_ring_material = new THREE.MeshBasicMaterial( { color: 0xffff00, side: THREE.DoubleSide } );
    ring_x = new THREE.Mesh( x_ring_geomtery, x_ring_material );
    plane.add( ring_x );
    ring_x.position.set(-4, -3, 3);

    //Rotation dashboard y
    let y_ring_geometry = new THREE.RingGeometry( 0.6, 0.5, 32 );
    let y_ring_material = new THREE.MeshBasicMaterial( { color: 0xff0000, side: THREE.DoubleSide } );
    ring_y = new THREE.Mesh( y_ring_geometry, y_ring_material );
    plane.add( ring_y );
    ring_y.position.set(-4, -3, 3);
    ring_y.rotation.set(0, 1, 0);

    
    //Rotation dashboard z
    let z_ring_geometry = new THREE.RingGeometry( 0.6, 0.5, 32 );
    let z_ring_material = new THREE.MeshBasicMaterial( { color: 0x00ff00, side: THREE.DoubleSide } );
    ring_z = new THREE.Mesh( z_ring_geometry, z_ring_material );
    plane.add( ring_z );
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

    //genSpaceship(objModelUrl, spaceships, 60, 60, 40);
    scene.add(spaceships);

    let random_texture_index = 0;
    // First System
    firstSystem = new System();

    // Sun First System addPlanet(radius, x, y, mapUrl, mat, haveBump, bumpMap)
    let sun_a = addPlanet(180, 0, 0, "../models/planets/inhospitable/Volcanic.png", 1, 0, "");
    scene.add(sun_a);

    random_texture_index = Math.round(Math.random() * 15);

    let planetA1 = addPlanet(100, 60, 2.5, "../models/planets/" + all_textures[random_texture_index], 1, 0, "");
    firstSystem.newPlanet(planetA1, 0, 0.01, 0.01, 0.02, 5, sun_a.position.x, sun_a.position.y);

    random_texture_index = Math.round(Math.random() * 15);
    let planetA2 = addPlanet(130, 850, 3, "../models/planets/" + all_textures[random_texture_index], 1, 0, "");
    firstSystem.newPlanet(planetA2, 0, 0.01, 0.008, 0.01, 6, sun_a.position.x, sun_a.position.y);

    random_texture_index = Math.round(Math.random() * 15);
    let planetA3 = addPlanet(80, 1100, 3.5, "../models/planets/" + all_textures[random_texture_index], 1, 0, "");
    firstSystem.newPlanet(planetA3, 0, 0.01, 0.009, 0.01, 7, sun_a.position.x, sun_a.position.y);

    random_texture_index = Math.round(Math.random() * 15);
    let planetA4 = addPlanet(110, 1800, 3, "../models/planets/" + all_textures[random_texture_index], 1, 0, "");
    firstSystem.newPlanet(planetA4, 0, 0.01, 0.005, 0.02, 6, sun_a.position.x, sun_a.position.y);

    //  Second System
    secondSystem = new System();

    // Seocnd System Sun  addPlanet(radius, x, y, mapUrl, mat, haveBump, bumpMap)
    let sun_b = addPlanet(200, 1000, 5000, "../models/planets/inhospitable/Venusian.png", 1, 0, "");
    scene.add(sun_b);

    random_texture_index = Math.round(Math.random() * 15);
    let planetB1 = addPlanet(120, 400, 2.5, "../models/planets/" + all_textures[random_texture_index], 1, 0, "");
    secondSystem.newPlanet(planetB1, 0, 0.01, 0.01, 0.02, 5, sun_b.position.x, sun_b.position.y);

    random_texture_index = Math.round(Math.random() * 15);
    let planetB2 = addPlanet(90, 800, 3, "../models/planets/" + all_textures[random_texture_index], 1, 0, "");
    secondSystem.newPlanet(planetB2, 0, 0.01, 0.008, 0.01, 6, sun_b.position.x, sun_b.position.y);

    random_texture_index = Math.round(Math.random() * 15);
    let planetB3 = addPlanet(80, 1200, 3.5, "../models/planets/" + all_textures[random_texture_index], 1, 0, "");
    secondSystem.newPlanet(planetB3, 0, 0.01, 0.009, 0.01, 7, sun_b.position.x, sun_b.position.y);

    random_texture_index = Math.round(Math.random() * 15);
    let planetB4 = addPlanet(150, 1600, 3, "../models/planets/" + all_textures[random_texture_index], 1, 0, "");
    secondSystem.newPlanet(planetB4, 0, 0.01, 0.005, 0.02, 6, sun_b.position.x, sun_b.position.y);

    random_texture_index = Math.round(Math.random() * 15);
    let planetB5 = addPlanet(95, 2400, 3, "../models/planets/" + all_textures[random_texture_index], 1, 0, "");
    secondSystem.newPlanet(planetB5, 0, 0.01, 0.005, 0.02, 6, sun_b.position.x, sun_b.position.y);

    //  Second System
    thirdSystem = new System();

    // Second System Sun  addPlanet(radius, x, y, mapUrl, mat, haveBump, bumpMap)
    let sun_c = addPlanet(400, -7000, -3000, "../models/planets/inhospitable/Volcanic.png", 1, 0, "");
    scene.add(sun_c);

    random_texture_index = Math.round(Math.random() * 15);
    let planetC1 = addPlanet(150, 1000, 2.5, "../models/planets/" + all_textures[random_texture_index], 1, 0, "");
    thirdSystem.newPlanet(planetC1, 0, 0.01, 0.01, 0.02, 5, sun_c.position.x, sun_c.position.y);

    random_texture_index = Math.round(Math.random() * 15);
    let planetC2 = addPlanet(400, 1200, 3, "../models/planets/" + all_textures[random_texture_index], 1, 0, "");
    thirdSystem.newPlanet(planetC2, 0, 0.01, 0.008, 0.01, 6, sun_c.position.x, sun_c.position.y);

    random_texture_index = Math.round(Math.random() * 15);
    let planetC3 = addPlanet(120, 1400, 3.5, "../models/planets/" + all_textures[random_texture_index], 1, 0, "");
    thirdSystem.newPlanet(planetC3, 0, 0.01, 0.009, 0.01, 7, sun_c.position.x, sun_c.position.y);

    random_texture_index = Math.round(Math.random() * 15);
    let planetC4 = addPlanet(90, 1600, 3, "../models/planets/" + all_textures[random_texture_index], 1, 0, "");
    thirdSystem.newPlanet(planetC4, 0, 0.01, 0.005, 0.02, 6, sun_c.position.x, sun_c.position.y);


     firstAsteroids = new THREE.Object3D;	
     secondAsteroids = new THREE.Object3D;	
     thirdAsteroids = new THREE.Object3D;	
     
     generateRandom(1000, -1000);

     scene.add(firstAsteroids);
     scene.add(secondAsteroids);
     scene.add(thirdAsteroids);


    randomPlanet = getRandSys();


     updateSpeed();
     updateRotation();
}

function timeSort(a, b) {
    return a - b;
}

function scoreboardScene(time) {
    // Creation of renderer and setting size to browser window size

    let sb = document.getElementById("scoreboard");
    let sbText = "Scoreboard: <br>"
    scoreboard.push(time);

    scoreboard.sort(timeSort);

    for (i = 0; i < scoreboard.length; i++) {
        sbText = sbText + " " + (i + 1) + ". \t" + Math.round(scoreboard[i]) + "s. " + "<br>";
    }
    sbText = sbText + "<br>" + "Congratulations! You ended up at number " + (scoreboard.indexOf(time) + 1);
    sb.innerHTML = sbText;
    sb.style.display = "block";

}


    //sb.style.display = "none";
     
function generateRandom(max_pos, min_pos){
    setInterval(function() {
        let rand_x = Math.random()* (max_pos - min_pos) + min_pos;
        let rand_y = Math.random()* (max_pos - min_pos) + min_pos;
        let random_system = Math.round(Math.random()*2);
        let objModelUrl = { obj: '../models/asteroids/A2.obj', map: '../models/asteroids/Textures/Normal.jpg', scale: 0.4 };	

        if(random_system == 0){
            loadObj(objModelUrl, firstAsteroids, rand_x, rand_y, 0);
            // console.log("added asteroid  1 y: "+rand_y+" x: "+rand_x);
        }

        if(random_system == 1){
            loadObj(objModelUrl, secondAsteroids, rand_x, rand_y, 0);
            // console.log("added asteroid  2 y: "+rand_y+" x: "+rand_x);
        }
        if(random_system == 2){
            loadObj(objModelUrl, thirdAsteroids, 200, 200, 0);
            // console.log("added asteroid  3 y: "+rand_y+" x: "+rand_x);

        }
      }, 5000);
}


/**
 * Creates x amount of spaceship objects at the specified x,y,z coordinates	
 * @param objModelUrl: an object with the .obj url and the .jpg/.png texture
 * @param number amount of spaceships to generate
 * @param lowerLimit array of size 3 that contains the x,y,z coordinates (in that order) of the lower limit
 * @param upperLimit array of size 3 that contains the x,y,z coordinates (in that order) of the upper limit
 * 
**/
function spaceshipMultigen(objModelUrl, number, lowerLimit, upperLimit) {
    var x, y, z;
    for (let index = 0; index < number; index++) {
        x = Math.floor(Math.random() * (upperLimit[0] - lowerLimit[0]) + lowerLimit[0]);
        y = Math.floor(Math.random() * (upperLimit[1] - lowerLimit[1]) + lowerLimit[1]);
        z = Math.floor(Math.random() * (upperLimit[2] - lowerLimit[2]) + lowerLimit[2]);

        genSpaceship(objModelUrl, spaceships, x, y, z);
    }
}


/**	   
 * Creates a spaceship object at the specified x,y,z coordinates
 * @param objModelUrl: an object with the .obj url and the .jpg/.png texture
 * @param objectList: the master object that will contain the spaceship 
 *
**/
function genSpaceship(objModelUrl, objectList, x, y, z) {
    loadObj(objModelUrl, objectList, x, y, z);
}

function addPlanet(radius, x, y, mapUrl, mat, haveBump, bumpMap) {
    // Load texture map
    textureMap = new THREE.TextureLoader().load(mapUrl);

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
        if(texture)
            PivotPoint.rotation.y = Math.floor(Math.random() * 360); 
        objectList.add(PivotPoint);
    }
    catch (err) {
        return onError(err);
    }
}

function updateSpeed(){
    let speed_x, speed_y, speed_z;
    let last_position_x, last_position_y,last_position_z;
    setInterval(function() {
        speed_x = camera.position.x-last_position_x;
        speed_y = camera.position.y-last_position_y;
        speed_z = camera.position.z-last_position_z;
     
        speed = Math.sqrt((speed_x*speed_x)+(speed_y*speed_y)+(speed_z*speed_z));
       

        line.rotation.z = -speed/1000;
        let speed_element = document.getElementById("speed");
        speed_element.innerHTML = "Speed: "+Math.round(speed/100);
        last_position_x = camera.position.x;
        last_position_y = camera.position.x;
        last_position_z = camera.position.x;
    }, 1000);
}


function updateRotation(){
    setInterval(function() {
        current_rotation_x = camera.rotation.x;
        current_rotation_y = camera.rotation.y;
        current_rotation_z = camera.rotation.z;

        let rot_x = Math.round((current_rotation_x * 180)/Math.PI);
        let rot_y = Math.round(current_rotation_y * (180/Math.PI));
        let rot_z = Math.round(current_rotation_z * (180/Math.PI));

        ring_x.rotation.set(current_rotation_x, current_rotation_y, current_rotation_z);
        let rotation_element = document.getElementById("rotation");
        rotation_element.innerHTML = "Rotation: "+rot_x+", "+rot_y+", "+rot_y;

    }, 1000);
}

function getRandSys(){

    var ranSystem = (Math.floor(Math.random()*3));

    switch(ranSystem){
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
    return ranPlanet.object;
}

