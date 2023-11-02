var ships = [];
var bullets = [];
var enemies = [];
var opShells = [];
var effects = [];
var barriers = [];
var grazeBar = [];
var waves;
var barrierCooldown = 60;
var reloadTime = 3;
var bombShellsAmount = 20;
var dashTimerStart = false;
var pKeyPressed = false;
var dashTimer = 0;
var dashCooldown = 300;
var start = false;

function createBasicEnemies(amount) {
  e = [];
  for (let i = 0; i < amount; i++) {
    e.push(new Enemy(random(width), random(height / 2), 35, 50, 150, 150)); //makes enemies
  }
  return e;
}

function createParabolaEnemies(amount) {
  p = [];
  for (let i = 0; i < amount; i++) {
    p.push(new ParabolaEnemy(random(width), random(height / 3), 60, 45, 350, 350));// makes enemies
  }
  return p;
}

function createExplosiveEnemies(amount) {
  ee = [];
  for (let i = 0; i < amount; i++) {
    ee.push(new ExplosiveEnemy(random(width), random(height / 4), 150, 25, 1500, 1500)); //makes enemies
  }
  return ee;
}

function createMultipleEnemies(eAmount,pAmount,eeAmount) {
 	m = [];
  for (let i = 0; i < eAmount; i++) {
   	m.push(new Enemy(random(width), random(height / 2), 35, 50, 150, 150));//makes basic enemies
  }
  for (let i = 0; i < pAmount; i++) {
    m.push(new ParabolaEnemy(random(width), random(height / 3), 60, 45, 350, 350)); //makes parabola enemies
  }
  for (let i = 0; i < eeAmount; i++) {
    m.push(new ExplosiveEnemy(random(width), random(height / 4), 150, 25, 1500, 1500)); //makes explosive enemies
  }
  return m;
}

function spawnBasicWaves(waveList) {
  if (waveList.length == 0) {
		return;
  }
  var wave = waveList[0];
  if (enemies.length == 0 && effects.length == 0) { // checks number of enemies and effects
    if (wave.effects.length > 0) { //runs only if there is an effect in store
      for (let i = 0; i < wave.effects[0].length; i++) {
        effects.push(wave.effects[0][i]);
      }

      wave.effects.splice(0, 1);

      return;
    }
    for (let i = 0; i < wave.enemies.length; i++) {
      enemies.push(wave.enemies[i]);
    }
    waveList.splice(0, 1);
  }
}

function setup() {
  createCanvas(400, 600).parent('above');
  rectMode(CENTER);
  textAlign(CENTER);
  textSize(10);
  ships.push(new Ship(width / 2, height * 2 / 3, 1)); //make ship
  grazeBar.push(new GrazeBar(20, 560, 0, 20, 100)); // make grazebar 

  waves = [ //stores wave data
    createBasicWave(2, 180),
    createBasicWave(4, 60),
    createParabolaWave(2, 60),
    createBasicWave(6, 60),
    createParabolaWave(3, 60),
    createExplosiveEnemyWave(1, 60),
    createMultipleEnemyWave(3,2,0,60),
    createMultipleEnemyWave(2,3,0,60),
    createMultipleEnemyWave(2,2,1,60),
    createMultipleEnemyWave(3,2,2,60),
    createMultipleEnemyWave(6,4,3,60),
  ]
}

function draw() {
  background(0);
  if(keyCode == 74) {
    start = true;
  }
  if(start == true) {
  	spawnBasicWaves(waves);
  } 
  
  for (let i = 0; i < ships.length; i++) {
    if (keyIsDown(74) && reloadTime <= 0 && ships.length >= 1) {
      bullets.push(new Bullet(ships[i].x, ships[i].y, 2, 15)); //right bullets
      bullets.push(new Bullet(ships[i].x, ships[i].y, 0, 15)); //middle bullets
      bullets.push(new Bullet(ships[i].x, ships[i].y, -2, 15)); //left bullets
      reloadTime = 3; 
    } else {
      reloadTime--;
    }
  }
  
	//calls functions for each individual object
  for (let i = 0; i < ships.length; i++) {
    ships[i].move();
    ships[i].display();
    ships[i].bound();
    ships[i].special();
    ships[i].dash();
  }

  for (let i = 0; i < bullets.length; i++) {
    bullets[i].display();
    bullets[i].move();
  }

  for (let i = 0; i < opShells.length; i++) {
    opShells[i].display();
    opShells[i].move();
  }

  for (let i = 0; i < effects.length; i++) {
    effects[i].display();
  }

  for (let i = 0; i < grazeBar.length; i++) {
    grazeBar[i].display();
  }

  for (let i = 0; i < barriers.length; i++) {
    barriers[i].display();
  }

  for (let i = 0; i < enemies.length; i++) {
    enemies[i].display();
    enemies[i].move();
    enemies[i].bound();
    if (enemies[i].readyToShoot()) {
      opShells.push(enemies[i].makeBullet());
    }
  }

  boundaryKill(bullets);
  boundaryKill(opShells);
  attack(bullets, enemies);
  enemyDeath(enemies);
  enemyDeath(effects);
  death(ships, enemies);
  death(ships, opShells);
  barrierBreak(barriers, opShells);
  grazes(ships, opShells, grazeBar);
  gameover();
}

const MOVEMENT_KEYS = [65, 87, 68, 83]; //[left,up,right,down]
const MOVEMENT_VECTORS = [
  [-1, 0], //left
  [0, -1], //up
  [1, 0], //right
  [0, 1] //down
];
const SHIFT = 16; //Shift
const SPECIAL_ATTACKS = [75, 76]; //[k,l]

function keyReleased() {
  for (let i = 0; i < MOVEMENT_KEYS.length; i++) {
    if (keyCode == MOVEMENT_KEYS[i]) { // checks if the key pressed is same as one within the array
      pKeyPressed = MOVEMENT_KEYS[i]; //saves previous button clicked
      dashTimer = 0;
    }
  }
}

class Ship {
  constructor(x, y, hp) {
    this.x = x;
    this.y = y;
    this.hp = hp;
    this.speed = 5;
    this.shiftSpeed = 2;
  }
  display() {
    stroke(0);
    strokeWeight(1);
    fill(0, 255, 0);
    rectMode(CENTER);

    quad(this.x, this.y, //bottom
      this.x + 10, this.y - 10, //right
      this.x, this.y - 40, //top
      this.x - 10, this.y - 10); //left

    quad(this.x - 10, this.y - 10, //top
      this.x, this.y + 10, //right
      this.x - 10, this.y + 25, //bottom
      this.x - 25, this.y + 10); //left

    quad(this.x + 10, this.y - 10, //top
      this.x, this.y + 10, //left
      this.x + 10, this.y + 25, //bottom
      this.x + 25, this.y + 10); //right

    fill(0, 255, 255);
    rect(this.x, this.y, 5, 5);
  }

  move() {
    var s;
    if (keyIsDown(SHIFT)) {
      s = this.shiftSpeed;
    } else {
      s = this.speed;
    }
    for (let i = 0; i < MOVEMENT_KEYS.length; i++) {
      if (keyIsDown(MOVEMENT_KEYS[i])) {
        this.x += MOVEMENT_VECTORS[i][0] * s; //multiplies by s
        this.y += MOVEMENT_VECTORS[i][1] * s; //^
      }
    }
  }

  dash() {
    var dashDist = 40;
    for (let i = 0; i < MOVEMENT_KEYS.length; i++) {
      if (keyIsDown(pKeyPressed) && dashTimer <= 25 && dashCooldown <= 0) { //checks if the key is pressed twice
        if (keyIsDown(MOVEMENT_KEYS[i])) {
          this.x += MOVEMENT_VECTORS[i][0] * dashDist; //multiplies by dash distance
          this.y += MOVEMENT_VECTORS[i][1] * dashDist; //^
          dashTimer = 0;
          pKeyPressed = false;
          dashCooldown = 300; // 5 seconds
        }
      } else {
        dashCooldown--;
        dashTimer++;
      }
    }
  }

  bound() { // checks if its outisde canvas
    if (this.x >= width) { //right
      this.x -= this.speed;
    } else {
      if (this.x <= 0) { //left
        this.x += this.speed;
      } else {
        if (this.y >= height) { //bottom
          this.y -= this.speed;
        } else {
          if (this.y <= 0) { // top
            this.y += this.speed;
          }
        }
      }
    }
  }

  special() {
    for (let i = 0; i < SPECIAL_ATTACKS.length; i++) {
      for (let j = 0; j < grazeBar.length; j++) {
        if (keyIsDown(SPECIAL_ATTACKS[i]) && ships.length >= 1 && grazeBar[j].w >= 75) { //checks if key is j
          barriers.push(new Barrier(this.x, this.y, 175, 15)); //makes barrier
          grazeBar[j].w -= 75;
        }
      }
    }
  }
}

class Bullet {
  constructor(x, y, velX, velY) {
    this.x = x;
    this.y = y;
    this.velX = velX; 
    this.velY = velY;
  }

  move() {
    this.y -= this.velY;
    this.x += this.velX;
  }

  display() {
    strokeWeight(1);
    fill(0, 255, 255);
    quad(this.x, this.y - 12, //top
      this.x + 4, this.y, //right
      this.x, this.y + 12, //bottom
      this.x - 4, this.y); //left
  }
}

class Enemy {
  constructor(x, y, w, h, hp, points) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.hp = hp;
    this.points = points;
    this.xSpeed = random(-2, 2);
    this.ySpeed = random(-2, 2);
  }

  display() {
    stroke(0);
    strokeWeight(1);
    rectMode(CENTER);
    fill(255, 0, 0);
    rect(this.x, this.y, this.w, this.h);
    fill(0);
    text(this.hp, this.x, this.y);
  }

  checkHit(ship) { // checks if ship is within itself
    if (ship.y <= this.y + this.h / 2 && // bottom hitbox
      ship.y >= this.y - this.h / 2 && // top hitbox
      ship.x <= this.x + this.w / 2 && // right hitbox
      ship.x >= this.x - this.w / 2) { // left hitbox
      return true;
    } else {
      return false;
    }
  }

  makeBullet() {
    return new Opshell(this.x, this.y, 8, 12, 3.5); //(x, y, w, h, vel,)
  }

  move() {
    this.x += this.xSpeed;
    this.y += this.ySpeed;
    if (frameCount % 120 == 0) { //changes directions every 2 seconds
      this.xSpeed = random(-2, 2);
      this.ySpeed = random(-2, 2);
    }
  }

  bound() { //checks if within canvas
    if (this.x >= width || this.x <= 0) { 
      this.xSpeed = -this.xSpeed;
    }

    if (this.y >= height / 2 || this.y <= 0) {
      this.ySpeed = -this.ySpeed;
    }
  }

  readyToShoot() {
    if (frameCount % int(random(10, 25)) == 0 && ships.length >= 1) { // timer to shoot
      return true;
    } else {
      return false;
    }
  }
}

class Opshell {
  constructor(x, y, w, h, vel) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.vel = vel;
    this.graze = false;
  }

  display() {
    stroke(0);
    strokeWeight(1);
    rectMode(CENTER);
    fill(255, 0, 0);
    rect(this.x, this.y, this.w, this.h, 5);
  }

  move() {
    this.y += this.vel;
  }

  checkHit(ship) { //checks if ship is within itself
    if (ship.y <= this.y + this.h / 2 && // bottom hitbox
      ship.y >= this.y - this.h / 2 && // top hitbox
      ship.x <= this.x + this.w / 2 && // right hitbox
      ship.x >= this.x - this.w / 2) { // left hitbox 
      return true;
    } else {
      return false;
    }
  }
}

class Effect {
  constructor() {
    this.hp = 1;
  }
  display() {}
}

class Boomerang {
  constructor(x, y, targetX, targetY, travelFrames) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.h = targetX;
    this.v = targetY;
    this.travelFrames = travelFrames;
    this.distance = 100;
    this.i = 0;

    this.d = this.startX - this.h;

    this.m = (this.startY - this.v) / Math.pow(this.startX - this.h, 2); // (y-v)/(x-h)**2
  }

  display() {
    stroke(0);
    strokeWeight(1);
    fill(255);
    push();
    translate(this.x, this.y)
    rotate(radians(this.i * 12));
    quad(0, -7, -12, 0, 0, 0, 12, 7);
    pop();
  }

  move() {
    this.x = this.startX - (this.i / this.travelFrames) * this.d; //time to get to target
    this.y = parabola(this.m, this.x, this.h, this.v); 
    this.i++;
  }

  checkHit(ship) { //checks if boomerang is within ship
    if (dist(this.x, this.y, ship.x, ship.y) <= 5) {
      return true;
    } else {
      return false;
    }
  }
}

class DeathEffect extends Effect {
  constructor(x, y, vX, vY, size, opacity, color) {
    super();
    this.x = x;
    this.y = y;
    this.vX = vX;
    this.vY = vY;
    this.size = size;
    this.opacity = opacity;
    this.color = color;
  }

  display() {
    stroke(0);
    strokeWeight(1);
    fill(this.color[0], this.color[1], this.color[2], this.opacity);
    ellipse(this.x, this.y, this.size);
    this.x += this.vX;
    this.y += this.vY;
    if (this.opacity <= 0) {
      this.hp = 0;
    } else {
      this.opacity -= 1;
    }
  }

}

function boundaryKill(array) { //removes "array" when its out of canvas
  for (let i = 0; i < array.length; i++) {

    if (array[i].y <= 0 || //top
      array[i].y >= height || //bottom
      array[i].x <= 0 || //left
      array[i].x >= width) { //right
      array.splice(i, 1);
    }
  }
}

function attack(array1, array2) {
  for (let i = 0; i < array1.length; i++) {
    for (let ii = 0; ii < array2.length; ii++) {
      if (array1.length >= 1) {
        if (array1[i].y <= array2[ii].y + array2[ii].h / 2 && // bottom hitbox
          array1[i].y >= array2[ii].y - array2[ii].h / 2 && // top hitbox
          array1[i].x <= array2[ii].x + array2[ii].w / 2 && // right hitbox
          array1[i].x >= array2[ii].x - array2[ii].w / 2) { //left hitbox

          array2[ii].hp -= 5; //removes hp
          array1.splice(i, 1);
          i--;
          break
        }
      }
    }
  }
}

function enemyDeath(array) {
  for (let i = 0; i < array.length; i++) {
    if (array[i].hp <= 0) { //check if no hp
      array.splice(i, 1);
      i--;
    }
  }
}

class DelayEffect extends Effect {
  constructor(frames) {
    super();
    this.frames = frames;
  }
  display() {
    if (this.frames <= 0) {
      this.hp = 0;
    } else {
      this.frames--;
    }
  }
}

function death(array1, array2) { 
  for (let i = 0; i < array1.length; i++) {
    for (let ii = 0; ii < array2.length; ii++) {
      if (array2[ii].checkHit(array1[i])) {
        spawnDeathEffect(array1[i].x, array1[i].y, 10, 200, 50);
        array1.splice(i, 1);
        break
      }
    }
  }
}

function barrierBreak(array1, array2) {
  for (let i = 0; i < array1.length; i++) {
    for (let j = 0; j < array2.length; j++) {
      if (array1[i].checkHit(array2[j])) {

        array2.splice(j, 1);
        array1[i].opacity -= 15;

        if (array1[i].hp <= 0) { //check barrier's hp
          array1.splice(i, 1);
          i--;
          break
        } else {
          array1[i].hp--;
        }
      }
    }
  }
}

function spawnDeathEffect(x, y, size, opacity, amount) {
  for (let i = 0; i < amount; i++) {
    var color = [random(255), 0, 0]; //range of red
    effects.push(new DeathEffect(x, y, random(-5, 5), random(-5, 5), size, opacity, color)) //makes death effect
  }
}

function createBasicWave(amount, frames) {
  return { //dictionary
    enemies: createBasicEnemies(amount),
    effects: [
      [
        new DelayEffect(frames),
      ],
    ]
  }
}

function createParabolaWave(amount, frames) {
  return {//dictionary
    enemies: createParabolaEnemies(amount),
    effects: [
      [
        new DelayEffect(frames),
      ],
    ]
  }
}

function createExplosiveEnemyWave(amount, frames) {
  return {//dictionary
    enemies: createExplosiveEnemies(amount),
    effects: [
      [
        new DelayEffect(frames),
      ],
    ]
  }
}
  
function createMultipleEnemyWave(amount1,amount2,amount3, frames) {
  return {//dictionary
    enemies: createMultipleEnemies(amount1,amount2,amount3),
    effects: [
      [
        new DelayEffect(frames),
      ],
    ]
  }
}

function parabola(m, x, h, v) { //y=m(x-h)**2+v
  return m * (Math.pow(x - h, 2)) + v;
}

class ParabolaEnemy extends Enemy {
  constructor(x, y, w, h, hp, points) {
    super(x, y, w, h, hp, points);
  }

  display() {
    stroke(0);
    strokeWeight(1);
    rectMode(CENTER);
    fill(255, 0, 0);
    rect(this.x, this.y, this.w, this.h, 5);
    fill(0);
    text(this.hp, this.x, this.y);
  }

  move() {
    this.x += this.xSpeed;
    this.y += this.ySpeed;
    if (frameCount % 120 == 0) { //change direction every 2 seconds
      this.xSpeed = random(-1, 1);
      this.ySpeed = random(-1, 1);
    }
  }

  makeBullet() {
    return new Boomerang(this.x, this.y, ships[0].x, ships[0].y, 60);
  }

  bound() {
    if (this.x >= width || this.x <= 0) {
      this.xSpeed = -this.xSpeed;
    }

    if (this.y >= height / 2 || this.y <= 0) {
      this.ySpeed = -this.ySpeed;
    }
  }

  readyToShoot() {
    if (frameCount % int(random(45, 60)) == 0 && ships.length >= 1) { //timer to shoot
      return true;
    } else {
      return false;
    }
  }
}

class Barrier {
  constructor(x, y, size, hp) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.hp = hp;
    this.opacity = 255;
  }

  display() {
    noFill();
    strokeWeight(5);
    stroke(230, 0, 255, this.opacity);
    ellipse(this.x, this.y, this.size);
  }

  checkHit(bullet) {
    if (dist(this.x, this.y, bullet.x, bullet.y) <= this.size / 2) { //checks if distance is close to the argument
      return true;
    } else {
      return false;
    }
  }
}

class GrazeBar {
  constructor(x, y, w, h, max) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.max = max;
  }

  display() {
    this.w = constrain(this.w, 0, this.max);
    strokeWeight(1);
    stroke(0);
    rectMode(CORNER);
    noFill();
    rect(this.x, this.y, this.max, this.h);
    fill(255, 255, 0, 150);
    rect(this.x, this.y, this.w, this.h);
    fill(0);
    text("Graze: " + this.w, this.x + this.w / 2, this.y + this.h / 1.5);
  }
}

function grazes(array1, array2, array3) {
  for (let i = 0; i < array1.length; i++) {
    for (let j = 0; j < array2.length; j++) {
      for (let k = 0; k < array3.length; k++) {
        if (dist(array1[i].x, array1[i].y, array2[j].x, array2[j].y) <= 35) { //checks if array1 is near array2
          if (array2[j].graze == false) {
            array3[k].w += 5;
            array2[j].graze = true;
          }
        }
      }
    }
  }
}

class ExplosiveEnemy extends Enemy {
  constructor(x, y, w, h, hp, points) {
    super(x, y, w, h, hp, points);
  }

  display() {
    stroke(0);
    strokeWeight(1);
    rectMode(CENTER);
    fill(255, 0, 0);
    ellipse(this.x, this.y, this.w);
    fill(0);
    ellipse(this.x, this.y, this.w / 1.5);
    rect(this.x, this.y, this.w - 10, this.h - 20);
    rect(this.x, this.y, this.h - 20, this.w - 10);
    fill(255, 0, 0);
    ellipse(this.x, this.y, this.w / 2);
    fill(0);
    text(this.hp, this.x, this.y);
  }

  move() {
    this.x += this.xSpeed;
    this.y += this.ySpeed;
    if (frameCount % 120 == 0) {
      this.xSpeed = random(-1, 1);
      this.ySpeed = random(-1, 1);
    }
  }

  checkHit(bullet) {
    if (dist(this.x, this.y, bullet.x, bullet.y) <= this.size / 2) {
      return true;
    } else {
      return false;
    }
  }

  readyToShoot() {
    if (frameCount % 240 == 0 && ships.length >= 1) { //checks if 4 seconds passed
      return true;
    } else {
      return false;
    }
  }

  makeBullet() {
    return new Bomb(this.x, this.y, 20, 3);
  }

  bound() {
    if (this.x >= width || this.x <= 0) {
      this.xSpeed = -this.xSpeed;
    }

    if (this.y >= height / 4 || this.y <= 0) { //spawns top quarter of the canvas
      this.ySpeed = -this.ySpeed;
    }
  }
}

class BombShell extends Opshell {
  constructor(x, y, d, vel) {
    super(x, y, d, d, 0);
    this.velocity = vel;
  }

  display() {
    fill(255, 0, 0);
    ellipse(this.x, this.y, 10, 10);
  }

  move() {
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }


}

class Bomb {
  constructor(x, y, d, ySpeed) {
    this.x = x;
    this.y = y;
    this.d = d;
    this.ySpeed = ySpeed;
  }

  display() {
    strokeWeight(1);
    stroke(0);
    fill(255, 0, 0);
    ellipse(this.x, this.y, this.d)
  }

  move() {
    this.ySpeed = constrain(this.ySpeed, 0, this.ySpeed);
    this.y += this.ySpeed;
    for (let i = 0; i < ships.length; i++) {
      if (dist(this.x, this.y, ships[i].x, ships[i].y) <= 150) { //explodes if ship is close to bomb
        for (let j = 0; j < bombShellsAmount; j++) {
          var v = createVector(1, 0);
          v.rotate(radians(360 / bombShellsAmount * j)); //formula for bomb
          opShells.push(new BombShell(this.x, this.y, 10, v));
        }
        this.x = -1; //spawns it outside of the canvas to splice it
      }
    }
  }
  
  checkHit(ship) {
    if (dist(this.x, this.y, ships.x, ships.y) <= 100) {
      return true;
    } else {
      return false;
    }
  }
}
  
function gameover() {
 	if(enemies.length == 0 && waves.length == 0 || ships.length == 0) {
   	fill(255,0,0);
    strokeWeight(1);
    text("GAME OVER",width/2,height/2);
  }
}
  
