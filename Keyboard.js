// Declaration of all global variables
let renderer = null,  scene = null, camera = null;
let asteroidBelt, figure, solarSystem;
let duration = 5000; 
let currentTime = Date.now();

function animate() {
    controls.update();
}

function run() {
    requestAnimationFrame(function() { run(); });
    renderer.render( scene, camera );
    animate();
}

// Start of WASD functionality
var xSpeed = 0.00001;
var ySpeed = 0.00001;
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
// Ending of WASD functionality

function createScene() {    
    renderer = new THREE.WebGLRenderer({antialias: true });
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth/ window.innerHeight, 1, 10000 );
    controls = new THREE.OrbitControls( camera, renderer.domElement );
    scene.background = new THREE.Color( 0, 0, 0 );
    camera.position.set( 0, 0, 0 );
    camera.position.z = 1000;
    controls.update();
    scene.add(camera);
    let ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    var pointColor = "#ffffff"; 
    var pointLight = new THREE.PointLight(pointColor); 
    pointLight.position.set(0,0,0);
    pointLight.intensity = 2.0;
    pointLight.castShadow = true;
    scene.add(pointLight); 
    let sun = addPlanet(30, 0, 0, "./models/planets/inhospitable/Volcanic.png", 1, 0, "");
    scene.add(sun);
}

function addPlanet(radius, x, y, mapUrl, mat, haveBump, bumpMap) {
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
    let geometry = new THREE.SphereGeometry(radius, 32, 32);
    let figure = new THREE.Mesh( geometry, material );
    figure.position.set(x, y, 0);
    return figure;
}
