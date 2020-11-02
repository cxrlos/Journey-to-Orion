/*
Carla Pérez Gavilán Del Castillo, A01023033
Juan Francisco Gortarez, A0102
Carlos García,
*/

// Declaration of all global variables
let renderer = null,  scene = null, camera = null;
let asteroidBelt, figure, solarSystem;
let duration = 5000; 
let currentTime = Date.now();
let planets = [];

/**
 * System is a class that contains all planets, it is created at the begining so that 
 * we can iterate all planets and update them
 * @constructor
 */
class System
{
    constructor()
    {
        this.planets = [];
    }
    newPlanet(object, moons, axis_speed, sun_speed, moon_speed, radius)
    {
        let p = new Planet(object, moons, axis_speed, sun_speed, moon_speed, radius);
        this.planets.push(p);
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
class Planet
{
    constructor(object, moons, axis_speed, sun_speed, moon_speed, radius)
    {

        // Create an empty object of type all and 
        this.all = new THREE.Object3D();
        this.all.add(object);
        this.object = object;

        // Create empty object as pivot point in reference to Sun
        this.pivotSun = new THREE.Object3D();
        this.pivotSun.position.set(0, 0, 0);
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
        for(var i=0; i<moons; i++)
        {
            // Generate random angle from 0-2*PI
            let maxA = Math.PI*2;
            let minA = 0;
            let ran_x = (radius+10)*Math.cos((Math.random()*(maxA-minA))+minA);
            let ran_y = (radius+10)*Math.sin((Math.random()*(maxA-minA))+minA);

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

function animate() 
{
    // Update scene controls 
    controls.update();

    // Planets rotation in own axis
    planets.forEach( planet => {
        planet.rotation.z += 0.05;
    }
    );


        
}

/**
 * RUN: it renders scene and camera, calls animate 
 */
function run() 
{
    requestAnimationFrame(function() { run(); });
    
    // Render the scene
    renderer.render( scene, camera );

    // Update rotations calling animate 
    animate();
}

function generateRandom(max_pos, min_pos){
    var c = 0;
    setInterval(function() {
        let rand_x = Math.random()* (max_pos - min_pos) + min_pos;
        let rand_y = Math.random()* (max_pos - min_pos) + min_pos;
        let planet = addPlanet(30, rand_x, rand_y, "./models/planets/gas_giants/Gaseous1.png", 1, 0, "");
        planets.push(planet);
        scene.add(planet);
        console.log("added planet!");
      }, 5000);
}

/**
 * createScene: Initializes all objects on the scene before any updates
 */

function createScene()
{    
    // Creation of renderer and setting size to browser window size 
    renderer = new THREE.WebGLRenderer({antialias: true });
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    // Create scene object
    scene = new THREE.Scene();

    // Create camera with ratio of window
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth/ window.innerHeight, 1, 10000 );

    // Create orbit controls for Obrit Controller
    controls = new THREE.OrbitControls( camera, renderer.domElement );

    // Start scene background with black 
    scene.background = new THREE.Color( 0, 0, 0 );

    // Initialize camara position on top of solar system
    camera.position.set( 0, 0, 0 );
    camera.position.z = 1000;

    controls.update();

    // Add camara to scene 
    scene.add(camera);

    // Create ambient light to iluminate all scene when sun isn't iluminating it 
    let ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Creating point light that simulates sun light 
    var pointColor = "#ffffff"; 
    var pointLight = new THREE.PointLight(pointColor); 

    // Set sun's point light to center
    pointLight.position.set(0,0,0);
    pointLight.intensity = 2.0;

    // Making sure pointLight casts shadow 
    pointLight.castShadow = true;

    //Adding pointlight to sceen 
    scene.add(pointLight); 

    //Generates plantes randomly
    generateRandom(500, -500);


}

/**
 * Adds an orbit to the scene at a given radius from center of scene 
 * @param {number} radius radius of orbit 
 */

function addOrbit(radius)
{
    // Create material and mesh 
    let material = new THREE.MeshBasicMaterial( { color: 0xffffff, side: THREE.DoubleSide } );
    let figure = new THREE.RingGeometry( radius, radius+0.1, 32, 30 );
    let orbit = new THREE.Mesh( figure, material );

    // Set position and add to scene 
    orbit.position.set(0, 0, 0);
    scene.add( orbit );

}

/**
 * Adds two numbers.
 * @param {number} num1 The first number to add.
 * @param {number} num2 The second number to add.
 * @return {number} The result of adding num1 and num2.
 */
function addRing(planet, radius, mapUrl, x, y)
{
    textureMap = new THREE.TextureLoader().load(mapUrl);
    let material = new THREE.MeshBasicMaterial( { map: textureMap});
    let figure = new THREE.RingGeometry( radius, radius+5, 32, 30 );
    let orbit = new THREE.Mesh( figure, material );
    orbit.rotation.x= Math.PI/5;
    planet.add(orbit);
}

/**
 * Add planet to scene with specific texture and position.
 * @param {number} radius Planet radius
 * @param {number} x x coordinates where to add planet
 * @param {number} y y coordinates  where to add planet
 * @param {string} mapUrl path to map picture
 * @param {number} mat indicates whether touse phong or basic material
 * @return {Mesh} Planet Mesh
 */

function addPlanet(radius, x, y, mapUrl, mat, haveBump, bumpMap)
{
    // Load texture map
    textureMap = new THREE.TextureLoader().load(mapUrl);

    if(mat == 0){
        if(haveBump == 1){
            bumpMap = new THREE.TextureLoader().load(bumpMap);
            material = new THREE.MeshPhongMaterial({ map: textureMap, bumpMap: bumpMap, bumpScale: 0.06 });
        }else{
            material = new THREE.MeshPhongMaterial({ map: textureMap});

        }
    }
    else {
        material = new THREE.MeshBasicMaterial({ map: textureMap});
    }

    // Create planet with geometry and material
    let geometry = new THREE.SphereGeometry(radius, 32, 32);
    let figure = new THREE.Mesh( geometry, material );

    // Initialize Position
    figure.position.set(x, y, 0);
    return figure;

}

/**
 * Add asteorids to scene in belt with random positions
 * @param {number} radius Asteorid radius (size)
 * @param {number} x  x coordinates where to place asteroids
 * @param {number} y y cooridnates where to place astoeroids
 */
function addAsteroid(radius, x, y)
    {
    // Material for asteroids 
    textureMap = new THREE.TextureLoader().load("../../images/system/asteroid.jpg");
    let material = new THREE.MeshPhongMaterial({ map: textureMap});

    //  First asteroid in random position
    let geometry_A = new THREE.SphereGeometry(radius, 7, 5, 0, 6.3, 0, 3.1);
    let asteroid_A = new THREE.Mesh( geometry_A, material );
    let random_A = Math.random()*30;
    asteroid_A.position.set(x+random_A, y+random_A, 0);

    // Second asteroid in random position on larger scale
    let geometry_B = new THREE.SphereGeometry(radius+1.2, 7, 5, 0, 6.3, 0, 3.1);
    let asteroid_B = new THREE.Mesh( geometry_B, material );
    let random_B = Math.random()*30;
    asteroid_B.position.set(x+random_B, y+random_B, 0);

    // Third asteroid in random position medium scale. 
    let geometry_C = new THREE.SphereGeometry(radius+1.0, 7, 5, 0, 6.3, 0, 3.1);
    let asteroid_C = new THREE.Mesh( geometry_C, material );
    let random_C = Math.random()*30;
    asteroid_C.position.set(x+random_C, y+random_C, 0);

    // Adding three asteroids to asteroid belt 
    asteroidBelt.add(asteroid_B);
    asteroidBelt.add(asteroid_A);
    asteroidBelt.add(asteroid_C);
}