<h1 align="center">Journey to Orion</h1>
<h2 align="center">Computer Graphics</h2>
<p align="center">Final Project</p>

## Description
Journey to Orion is a Space Exploration Simulator that puts you in the cockpit of a small spaceship in a big galaxy! Explore a vast 3D system with procedurally generated planets, ships, and asteroids, and attempt to reach different planets while keeping yourself safe from obstacles and avoiding collisions with tiny and not-so-tiny balls of rock. 

## Dependencies
The libraries used for the development are the following:
- [THREE.js](https://threejs.org/)
- [TWEEN.js](https://createjs.com/tweenjs)
- [JQuery](https://jquery.com/)

## Development Path (requirements)
1. Create the basic scene for the project; this will include the basic will include the basic illumination, camera and spaceship interior (dashboard).
2. Spaceship movement using the keyboard and mouse combo.
3. Environment generation: The environment will contain static planets with fixed rotation and translation values. These will be the same for every game but the starting point and goal will vary randomly.
4. Random generation of "AI-controlled" spaceships and asteroids with variable directions, acceleration and rotation values.
5. Collision system between the user and its surrounding objects. There will be an alert whenever an object approaches the user (minimum distance yet to be defined).
6. Random assignation of goal planet with a visual indicator that stays on screen regardless of player
7. Countdown to achieve mission (arrive at particular planet), and mission creation at random when simulation begins (displayed in a map). The countdown will also be relative to the linear distance between the objective and the user.
8. Interior sensors inside spaceships which will display the user's spaceship rotation, velocity, and position values.
9. Development of interactive dashboard that will show useful information of the asteroid, planet or spaceship that are closest to the user using raycasting
10. Respawn system that restarts the game whenever the user dies due to a collision.


## How to Play
You spawn near a planet, and in your screen you will get a prompt for the first planet you need to visit. You must navigate ships, obstacle and obstacles to reach that planet, under time pressure! After you reach a planet,the time you have to reach the next planet will decrease, and so you must go FASTER. When you lose, you will be able to see the leaderboard, and compare your results with those that came before you!


## Initialize with inside spaceship PoV. 
3. Update map position in dashboard to visualize mission completion status
4. Warning alerts when approaching objects generated randomly. 
5. Mission Complete: displays sign when reaching target planet. 
6. Display scoreboard and play again option. 
2. Movement options with keyboard (right, left, up or down) and rotation options with mouseGeneral Work-flow
1. 

## Code Sections

The code is separated into distinct parts that will be described in a simple fashion in the following subsections:

### Global Variables
```javascript
let mult;
let translations = {};
let rotations = {};
let object_array = [];          
```

## License
The license information can be reviewed in the [LICENSE](https://github.com/cxrlos/Journey_to_Orion/blob/master/LICENSE) file.
