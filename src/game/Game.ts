// =============================================
// STEALTH CAT - 2D Platformer Game Engine
// =============================================

// --- TYPES ---
interface Vec2 { x: number; y: number }
interface Rect { x: number; y: number; w: number; h: number }

interface Player {
  x: number; y: number;
  vx: number; vy: number;
  w: number; h: number;
  grounded: boolean;
  crouching: boolean;
  facing: 1 | -1;
  hidden: boolean;
  lives: number;
  invincible: number;
  animFrame: number;
  animTimer: number;
  interactCooldown: number;
}

interface Enemy {
  x: number; y: number;
  w: number; h: number;
  patrolA: number; patrolB: number;
  facing: 1 | -1;
  state: 'normal' | 'suspicious' | 'alert';
  stateTimer: number;
  investigateX: number;
  speed: number;
  visionRange: number;
  visionAngle: number;
}

interface GameObject {
  x: number; y: number;
  w: number; h: number;
  type: 'vase' | 'cup' | 'book' | 'plant' | 'lamp';
  falling: boolean;
  vy: number;
  grounded: boolean;
  noiseRadius: number;
  broken: boolean;
  breakable: boolean;
  color: string;
}

interface Collectible {
  x: number; y: number;
  type: 'fish' | 'yarn' | 'key' | 'food';
  collected: boolean;
  animTimer: number;
}

interface Noise {
  x: number; y: number;
  radius: number;
  timer: number;
  maxRadius: number;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

// --- CONSTANTS ---
const TILE = 32;
const GRAVITY = 0.55;
const JUMP_FORCE = -10;
const WALK_SPEED = 2.5;
const RUN_SPEED = 4.5;
const CROUCH_SPEED = 1.2;
const CAT_W = 22;
const CAT_H = 22;
const CAT_H_CROUCH = 14;

// --- COLORS ---
const COL = {
  bg: '#151a2e',
  wall: '#2a2f45',
  wallLight: '#353b55',
  floor: '#3d3528',
  floorLight: '#4d4538',
  furniture: '#4a3f30',
  furnitureLight: '#5a4f40',
  furnitureDark: '#3a2f20',
  cat: '#3a3a3a',
  catLight: '#555555',
  catDark: '#252525',
  catEye: '#44cc66',
  catNose: '#ff8899',
  human: '#886655',
  humanLight: '#997766',
  humanShirt: '#446688',
  humanShirtLight: '#557799',
  humanPants: '#334455',
  visionNormal: 'rgba(255,255,200,0.06)',
  visionSuspicious: 'rgba(255,200,50,0.1)',
  visionAlert: 'rgba(255,80,50,0.15)',
  fish: '#66aadd',
  fishLight: '#88ccff',
  yarn: '#dd6688',
  yarnLight: '#ff88aa',
  key: '#ddbb44',
  keyLight: '#ffdd66',
  food: '#88aa44',
  foodLight: '#aacc66',
  vase: '#7766aa',
  cup: '#ddddcc',
  book: '#cc5544',
  plant: '#448844',
  lamp: '#ddcc66',
  door: '#665533',
  doorFrame: '#887755',
  exitGlow: '#44cc66',
  noise: 'rgba(255,200,100,0.3)',
  particle: '#ffcc44',
  windowBg: '#1a2244',
  windowFrame: '#4a4a5a',
  star: '#ffffcc',
};

// --- MAIN GAME CLASS ---
export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width = 800;
  height = 480;
  keys = new Set<string>();
  keysJustPressed = new Set<string>();

  player!: Player;
  enemies: Enemy[] = [];
  objects: GameObject[] = [];
  collectibles: Collectible[] = [];
  platforms: Rect[] = [];
  exit!: Rect & { locked: boolean };
  noises: Noise[] = [];
  particles: Particle[] = [];

  score = 0;
  chaos = 0;
  totalFish = 0;
  collectedKeys = 0;
  seen = false;
  gameState: 'title' | 'playing' | 'gameover' | 'win' = 'title';
  camera = { x: 0 };
  levelWidth = 1600;
  stealthMeter = 0; // 0 = hidden, 100 = fully exposed
  time = 0;
  frameCount = 0;

  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private rafId = 0;
  private lastTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;

    this.boundKeyDown = (e) => {
      this.keys.add(e.code);
      this.keysJustPressed.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    };
    this.boundKeyUp = (e) => {
      this.keys.delete(e.code);
    };

    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
  }

  destroy() {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    cancelAnimationFrame(this.rafId);
  }

  startGame() {
    this.gameState = 'playing';
    this.initLevel();
    this.lastTime = performance.now();
    this.loop();
  }

  initLevel() {
    this.score = 0;
    this.chaos = 0;
    this.seen = false;
    this.stealthMeter = 0;
    this.time = 0;
    this.frameCount = 0;
    this.noises = [];
    this.particles = [];
    this.collectedKeys = 0;
    this.levelWidth = 50 * TILE;

    // Player
    this.player = {
      x: 3 * TILE, y: 11 * TILE,
      vx: 0, vy: 0,
      w: CAT_W, h: CAT_H,
      grounded: false, crouching: false,
      facing: 1, hidden: false,
      lives: 9, invincible: 0,
      animFrame: 0, animTimer: 0,
      interactCooldown: 0,
    };

    // Platforms - apartment layout
    this.platforms = [
      // Floor
      { x: 0, y: 13 * TILE, w: 50 * TILE, h: 2 * TILE },
      // Left wall
      { x: 0, y: 0, w: TILE, h: 15 * TILE },
      // Right wall
      { x: 49 * TILE, y: 0, w: TILE, h: 15 * TILE },
      // Ceiling
      { x: 0, y: 0, w: 50 * TILE, h: TILE },

      // Kitchen counter
      { x: 6 * TILE, y: 10 * TILE, w: 5 * TILE, h: TILE },
      // High shelf
      { x: 7 * TILE, y: 7 * TILE, w: 3 * TILE, h: TILE / 2 },
      // Table
      { x: 14 * TILE, y: 11 * TILE, w: 4 * TILE, h: TILE / 2 },
      // Bookshelf structure
      { x: 20 * TILE, y: 8 * TILE, w: 3 * TILE, h: TILE / 2 },
      { x: 20 * TILE, y: 10 * TILE, w: 3 * TILE, h: TILE / 2 },
      // Desk
      { x: 26 * TILE, y: 10 * TILE, w: 4 * TILE, h: TILE / 2 },
      // High shelf near desk
      { x: 27 * TILE, y: 7 * TILE, w: 3 * TILE, h: TILE / 2 },
      // Couch
      { x: 33 * TILE, y: 11 * TILE, w: 5 * TILE, h: TILE },
      // Side table
      { x: 39 * TILE, y: 11 * TILE, w: 2 * TILE, h: TILE / 2 },
      // Cabinet
      { x: 43 * TILE, y: 9 * TILE, w: 3 * TILE, h: TILE },
      // Step to cabinet
      { x: 42 * TILE, y: 11 * TILE, w: TILE, h: TILE / 2 },
    ];

    // Objects on surfaces
    this.objects = [
      // Kitchen objects
      { x: 7 * TILE, y: 10 * TILE - 14, w: 10, h: 14, type: 'vase', falling: false, vy: 0, grounded: true, noiseRadius: 120, broken: false, breakable: true, color: COL.vase },
      { x: 9 * TILE, y: 10 * TILE - 10, w: 8, h: 10, type: 'cup', falling: false, vy: 0, grounded: true, noiseRadius: 80, broken: false, breakable: true, color: COL.cup },
      { x: 10 * TILE, y: 10 * TILE - 10, w: 8, h: 10, type: 'cup', falling: false, vy: 0, grounded: true, noiseRadius: 80, broken: false, breakable: true, color: COL.cup },
      // High shelf objects
      { x: 8 * TILE, y: 7 * TILE - 16 + 8, w: 12, h: 12, type: 'plant', falling: false, vy: 0, grounded: true, noiseRadius: 100, broken: false, breakable: true, color: COL.plant },
      // Table objects
      { x: 15 * TILE, y: 11 * TILE - 14, w: 10, h: 14, type: 'vase', falling: false, vy: 0, grounded: true, noiseRadius: 120, broken: false, breakable: true, color: COL.vase },
      { x: 17 * TILE, y: 11 * TILE - 10, w: 8, h: 10, type: 'cup', falling: false, vy: 0, grounded: true, noiseRadius: 80, broken: false, breakable: true, color: COL.cup },
      // Bookshelf objects
      { x: 21 * TILE, y: 8 * TILE - 12, w: 14, h: 10, type: 'book', falling: false, vy: 0, grounded: true, noiseRadius: 60, broken: false, breakable: false, color: COL.book },
      { x: 21 * TILE, y: 10 * TILE - 12, w: 14, h: 10, type: 'book', falling: false, vy: 0, grounded: true, noiseRadius: 60, broken: false, breakable: false, color: COL.book },
      // Desk objects
      { x: 27 * TILE, y: 10 * TILE - 18, w: 10, h: 16, type: 'lamp', falling: false, vy: 0, grounded: true, noiseRadius: 100, broken: false, breakable: true, color: COL.lamp },
      // Side table
      { x: 40 * TILE, y: 11 * TILE - 14, w: 10, h: 14, type: 'vase', falling: false, vy: 0, grounded: true, noiseRadius: 120, broken: false, breakable: true, color: COL.vase },
      // Cabinet
      { x: 44 * TILE, y: 9 * TILE - 12, w: 12, h: 12, type: 'plant', falling: false, vy: 0, grounded: true, noiseRadius: 100, broken: false, breakable: true, color: COL.plant },
    ];

    // Collectibles
    this.collectibles = [
      { x: 8 * TILE, y: 9 * TILE, type: 'fish', collected: false, animTimer: 0 },
      { x: 16 * TILE, y: 10 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      { x: 22 * TILE, y: 7 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      { x: 28 * TILE, y: 6 * TILE, type: 'yarn', collected: false, animTimer: Math.random() * 100 },
      { x: 35 * TILE, y: 10 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      { x: 40 * TILE, y: 10 * TILE, type: 'food', collected: false, animTimer: Math.random() * 100 },
      { x: 44 * TILE, y: 8 * TILE, type: 'key', collected: false, animTimer: Math.random() * 100 },
      { x: 12 * TILE, y: 12 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      { x: 30 * TILE, y: 9 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
    ];

    this.totalFish = this.collectibles.filter(c => c.type === 'fish').length;

    // Exit door
    this.exit = { x: 47 * TILE, y: 10 * TILE, w: TILE * 1.5, h: 3 * TILE, locked: true };

    // Enemies (humans patrolling)
    this.enemies = [
      {
        x: 18 * TILE, y: 13 * TILE - 40,
        w: 18, h: 38,
        patrolA: 12 * TILE, patrolB: 25 * TILE,
        facing: 1, state: 'normal',
        stateTimer: 0, investigateX: 0,
        speed: 1.2, visionRange: 150, visionAngle: Math.PI / 3,
      },
      {
        x: 38 * TILE, y: 13 * TILE - 40,
        w: 18, h: 38,
        patrolA: 32 * TILE, patrolB: 46 * TILE,
        facing: -1, state: 'normal',
        stateTimer: 0, investigateX: 0,
        speed: 1.0, visionRange: 130, visionAngle: Math.PI / 3,
      },
    ];
  }

  loop = () => {
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 16.667, 3); // normalize to ~60fps
    this.lastTime = now;

    if (this.gameState === 'playing') {
      this.update(dt);
    }
    this.render();
    this.keysJustPressed.clear();
    this.rafId = requestAnimationFrame(this.loop);
  };

  update(dt: number) {
    this.frameCount++;
    this.time += dt;

    this.updatePlayer(dt);
    this.updateObjects(dt);
    this.updateEnemies(dt);
    this.updateCollectibles(dt);
    this.updateNoises(dt);
    this.updateParticles(dt);
    this.updateCamera();
    this.checkWin();

    if (this.player.lives <= 0) {
      this.gameState = 'gameover';
    }
  }

  updatePlayer(dt: number) {
    const p = this.player;
    const left = this.keys.has('ArrowLeft') || this.keys.has('KeyA');
    const right = this.keys.has('ArrowRight') || this.keys.has('KeyD');
    const jump = this.keysJustPressed.has('Space') || this.keysJustPressed.has('ArrowUp') || this.keysJustPressed.has('KeyW');
    const crouch = this.keys.has('ArrowDown') || this.keys.has('KeyS');
    const run = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const interact = this.keysJustPressed.has('KeyE');

    // Crouching
    const wasCrouching = p.crouching;
    p.crouching = crouch && p.grounded;
    if (p.crouching && !wasCrouching) {
      p.y += CAT_H - CAT_H_CROUCH;
      p.h = CAT_H_CROUCH;
    } else if (!p.crouching && wasCrouching) {
      p.h = CAT_H;
      p.y -= CAT_H - CAT_H_CROUCH;
    }

    // Movement
    let speed = p.crouching ? CROUCH_SPEED : (run ? RUN_SPEED : WALK_SPEED);
    if (left) { p.vx = -speed * dt; p.facing = -1; }
    else if (right) { p.vx = speed * dt; p.facing = 1; }
    else { p.vx = 0; }

    // Jump
    if (jump && p.grounded) {
      p.vy = JUMP_FORCE;
      p.grounded = false;
    }

    // Gravity
    p.vy += GRAVITY * dt;
    if (p.vy > 12) p.vy = 12;

    // Move X
    p.x += p.vx * dt;
    this.resolveCollisionX(p);

    // Move Y
    p.y += p.vy * dt;
    p.grounded = false;
    this.resolveCollisionY(p);

    // Animation
    p.animTimer += dt;
    if (p.animTimer > 8) {
      p.animTimer = 0;
      p.animFrame = (p.animFrame + 1) % 4;
    }

    // Invincibility
    if (p.invincible > 0) p.invincible -= dt;

    // Interact cooldown
    if (p.interactCooldown > 0) p.interactCooldown -= dt;

    // Interaction - push objects
    if (interact && p.interactCooldown <= 0) {
      p.interactCooldown = 15;
      this.interactWithObjects();
    }

    // Check hiding
    p.hidden = p.crouching && this.isNearFurniture(p);

    // Stealth meter decay
    if (!this.isPlayerVisibleToAnyEnemy()) {
      this.stealthMeter = Math.max(0, this.stealthMeter - 0.5 * dt);
    }

    // Clamp position
    p.x = Math.max(TILE, Math.min(this.levelWidth - TILE - p.w, p.x));
  }

  interactWithObjects() {
    const p = this.player;
    const interactRange = 20;
    const pushX = p.x + (p.facing === 1 ? p.w : -interactRange);

    for (const obj of this.objects) {
      if (obj.broken || obj.falling) continue;
      if (this.rectsOverlap(
        { x: pushX, y: p.y - 10, w: interactRange + p.w, h: p.h + 20 },
        { x: obj.x, y: obj.y, w: obj.w, h: obj.h }
      )) {
        obj.falling = true;
        obj.grounded = false;
        obj.vy = -3;
        // Push horizontally
        obj.x += p.facing * 15;
        break;
      }
    }
  }

  isNearFurniture(p: Player): boolean {
    for (const plat of this.platforms) {
      if (plat.y >= 13 * TILE) continue; // skip floor
      const expanded = { x: plat.x - 10, y: plat.y - 50, w: plat.w + 20, h: plat.h + 60 };
      if (this.rectsOverlap({ x: p.x, y: p.y, w: p.w, h: p.h }, expanded)) {
        return true;
      }
    }
    return false;
  }

  resolveCollisionX(entity: { x: number; y: number; w: number; h: number; vx: number }) {
    for (const plat of this.platforms) {
      if (this.rectsOverlap({ x: entity.x, y: entity.y, w: entity.w, h: entity.h }, plat)) {
        if (entity.vx > 0) entity.x = plat.x - entity.w;
        else if (entity.vx < 0) entity.x = plat.x + plat.w;
      }
    }
  }

  resolveCollisionY(entity: { x: number; y: number; w: number; h: number; vy: number; grounded?: boolean }) {
    for (const plat of this.platforms) {
      if (this.rectsOverlap({ x: entity.x, y: entity.y, w: entity.w, h: entity.h }, plat)) {
        if (entity.vy > 0) {
          entity.y = plat.y - entity.h;
          entity.vy = 0;
          if ('grounded' in entity) entity.grounded = true;
        } else if (entity.vy < 0) {
          entity.y = plat.y + plat.h;
          entity.vy = 0;
        }
      }
    }
  }

  updateObjects(dt: number) {
    for (const obj of this.objects) {
      if (obj.broken) continue;
      if (obj.falling) {
        obj.vy += GRAVITY * dt;
        obj.y += obj.vy * dt;

        // Check ground collision
        for (const plat of this.platforms) {
          if (this.rectsOverlap({ x: obj.x, y: obj.y, w: obj.w, h: obj.h }, plat)) {
            if (obj.vy > 0) {
              obj.y = plat.y - obj.h;
              obj.vy = 0;
              obj.falling = false;
              obj.grounded = true;

              // Create noise
              this.noises.push({
                x: obj.x + obj.w / 2, y: obj.y + obj.h,
                radius: 0, timer: 30, maxRadius: obj.noiseRadius,
              });

              // Break if breakable and fell far enough
              if (obj.breakable) {
                obj.broken = true;
                this.chaos += 10;
                this.score += 5;
                this.spawnBreakParticles(obj);
              }
            }
          }
        }
      }
    }
  }

  updateEnemies(dt: number) {
    for (const enemy of this.enemies) {
      // Check noises
      for (const noise of this.noises) {
        const dist = Math.abs(enemy.x - noise.x);
        if (dist < noise.maxRadius && enemy.state === 'normal') {
          enemy.state = 'suspicious';
          enemy.stateTimer = 120;
          enemy.investigateX = noise.x;
        }
      }

      // Vision check
      if (this.canEnemySeePlayer(enemy)) {
        if (enemy.state !== 'alert') {
          enemy.state = 'alert';
          enemy.stateTimer = 180;
          this.stealthMeter = Math.min(100, this.stealthMeter + 30);
        }
      }

      // State behavior
      switch (enemy.state) {
        case 'normal':
          // Patrol
          if (enemy.facing === 1) {
            enemy.x += enemy.speed * dt;
            if (enemy.x >= enemy.patrolB) enemy.facing = -1;
          } else {
            enemy.x -= enemy.speed * dt;
            if (enemy.x <= enemy.patrolA) enemy.facing = 1;
          }
          break;

        case 'suspicious':
          // Move toward noise
          const dx = enemy.investigateX - enemy.x;
          if (Math.abs(dx) > 5) {
            enemy.x += Math.sign(dx) * enemy.speed * 0.7 * dt;
            enemy.facing = dx > 0 ? 1 : -1;
          }
          enemy.stateTimer -= dt;
          if (enemy.stateTimer <= 0) {
            enemy.state = 'normal';
          }
          break;

        case 'alert':
          // Chase player
          const px = this.player.x - enemy.x;
          enemy.x += Math.sign(px) * enemy.speed * 1.5 * dt;
          enemy.facing = px > 0 ? 1 : -1;
          enemy.stateTimer -= dt;

          // Check if caught player
          if (this.rectsOverlap(
            { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h },
            { x: this.player.x, y: this.player.y, w: this.player.w, h: this.player.h }
          )) {
            this.hitPlayer();
          }

          if (enemy.stateTimer <= 0) {
            enemy.state = 'suspicious';
            enemy.stateTimer = 60;
            enemy.investigateX = enemy.x;
          }
          break;
      }

      // Keep enemy in bounds
      enemy.x = Math.max(TILE, Math.min(this.levelWidth - TILE - enemy.w, enemy.x));
    }
  }

  canEnemySeePlayer(enemy: Enemy): boolean {
    const p = this.player;
    if (p.hidden || p.invincible > 0) return false;

    const ex = enemy.x + enemy.w / 2;
    const ey = enemy.y + enemy.h / 3;
    const px = p.x + p.w / 2;
    const py = p.y + p.h / 2;

    const dist = Math.sqrt((px - ex) ** 2 + (py - ey) ** 2);
    if (dist > enemy.visionRange) return false;

    const angle = Math.atan2(py - ey, px - ex);
    const facingAngle = enemy.facing === 1 ? 0 : Math.PI;
    let diff = angle - facingAngle;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;

    return Math.abs(diff) < enemy.visionAngle / 2;
  }

  isPlayerVisibleToAnyEnemy(): boolean {
    return this.enemies.some(e => this.canEnemySeePlayer(e));
  }

  hitPlayer() {
    const p = this.player;
    if (p.invincible > 0) return;
    p.lives--;
    p.invincible = 90;
    this.seen = true;
    this.stealthMeter = 100;
    // Knock back
    p.vy = -6;
    p.vx = -p.facing * 5;
  }

  updateCollectibles(dt: number) {
    const p = this.player;
    for (const c of this.collectibles) {
      if (c.collected) continue;
      c.animTimer += dt * 0.05;

      if (this.rectsOverlap(
        { x: p.x, y: p.y, w: p.w, h: p.h },
        { x: c.x - 6, y: c.y - 6, w: 16, h: 16 }
      )) {
        c.collected = true;
        switch (c.type) {
          case 'fish': this.score += 10; break;
          case 'yarn': this.score += 15; break;
          case 'key':
            this.collectedKeys++;
            this.exit.locked = false;
            this.score += 25;
            break;
          case 'food':
            this.player.lives = Math.min(9, this.player.lives + 1);
            this.score += 5;
            break;
        }
        this.spawnCollectParticles(c);
      }
    }
  }

  updateNoises(dt: number) {
    this.noises = this.noises.filter(n => {
      n.timer -= dt;
      n.radius = Math.min(n.maxRadius, n.radius + 4 * dt);
      return n.timer > 0;
    });
  }

  updateParticles(dt: number) {
    this.particles = this.particles.filter(part => {
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.vy += 0.2 * dt;
      part.life -= dt;
      return part.life > 0;
    });
  }

  updateCamera() {
    const targetX = this.player.x - this.width / 3;
    this.camera.x += (targetX - this.camera.x) * 0.08;
    this.camera.x = Math.max(0, Math.min(this.levelWidth - this.width, this.camera.x));
  }

  checkWin() {
    if (!this.exit.locked && this.rectsOverlap(
      { x: this.player.x, y: this.player.y, w: this.player.w, h: this.player.h },
      this.exit
    )) {
      this.gameState = 'win';
    }
  }

  spawnBreakParticles(obj: GameObject) {
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x: obj.x + obj.w / 2, y: obj.y + obj.h / 2,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 1) * 4,
        life: 20 + Math.random() * 20,
        maxLife: 40, color: obj.color, size: 2 + Math.random() * 3,
      });
    }
  }

  spawnCollectParticles(c: Collectible) {
    const col = c.type === 'fish' ? COL.fishLight : c.type === 'key' ? COL.keyLight : c.type === 'yarn' ? COL.yarnLight : COL.foodLight;
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: c.x, y: c.y,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 1) * 3,
        life: 15 + Math.random() * 15,
        maxLife: 30, color: col, size: 2 + Math.random() * 2,
      });
    }
  }

  rectsOverlap(a: Rect, b: Rect): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // ==================
  // RENDERING
  // ==================
  render() {
    const ctx = this.ctx;
    ctx.save();

    if (this.gameState === 'title') {
      this.renderTitle();
      ctx.restore();
      return;
    }

    // Clear
    ctx.fillStyle = COL.bg;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.translate(-Math.floor(this.camera.x), 0);

    this.renderBackground();
    this.renderPlatforms();
    this.renderExit();
    this.renderObjects();
    this.renderCollectibles();
    this.renderNoises();
    this.renderEnemies();
    this.renderPlayer();
    this.renderParticles();

    ctx.restore();

    this.renderHUD();

    if (this.gameState === 'gameover') this.renderGameOver();
    if (this.gameState === 'win') this.renderWin();

    // Scanline effect
    ctx.fillStyle = 'rgba(0,0,0,0.03)';
    for (let y = 0; y < this.height; y += 3) {
      ctx.fillRect(0, y, this.width, 1);
    }

    ctx.restore();
  }

  renderTitle() {
    const ctx = this.ctx;
    ctx.fillStyle = COL.bg;
    ctx.fillRect(0, 0, this.width, this.height);

    // Stars
    for (let i = 0; i < 30; i++) {
      const sx = (i * 137 + 50) % this.width;
      const sy = (i * 97 + 30) % (this.height * 0.6);
      const blink = Math.sin(this.frameCount * 0.02 + i) > 0.7;
      if (!blink) {
        ctx.fillStyle = COL.star;
        ctx.fillRect(sx, sy, 2, 2);
      }
    }

    // Title
    ctx.fillStyle = '#ddaa33';
    ctx.font = '24px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('STEALTH CAT', this.width / 2, 140);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText('O gato mais travesso do prédio', this.width / 2, 180);

    // Cat sprite on title
    this.drawCatSprite(ctx, this.width / 2 - 24, 220, 1, false, 0, false);

    // Instructions
    ctx.fillStyle = '#888888';
    ctx.font = '8px "Press Start 2P", monospace';
    const instructions = [
      '← → ou A/D : Mover',
      'ESPAÇO ou W : Pular',
      '↓ ou S : Agachar/Esconder',
      'SHIFT : Correr',
      'E : Empurrar objetos',
    ];
    instructions.forEach((line, i) => {
      ctx.fillText(line, this.width / 2, 300 + i * 22);
    });

    // Blink prompt
    if (Math.sin(this.frameCount * 0.05) > 0) {
      ctx.fillStyle = '#ddaa33';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText('Pressione ESPAÇO para jogar', this.width / 2, 440);
    }

    this.frameCount++;

    if (this.keysJustPressed.has('Space')) {
      this.startGame();
    }
  }

  renderBackground() {
    const ctx = this.ctx;
    const camX = this.camera.x;

    // Windows in background
    for (let wx = 4; wx < 48; wx += 10) {
      const x = wx * TILE;
      if (x + 3 * TILE < camX || x > camX + this.width) continue;
      ctx.fillStyle = COL.windowFrame;
      ctx.fillRect(x, 2 * TILE, 3 * TILE, 4 * TILE);
      ctx.fillStyle = COL.windowBg;
      ctx.fillRect(x + 4, 2 * TILE + 4, 3 * TILE - 8, 4 * TILE - 8);

      // Stars in window
      ctx.fillStyle = COL.star;
      for (let s = 0; s < 3; s++) {
        ctx.fillRect(x + 10 + s * 25, 2 * TILE + 15 + s * 12, 2, 2);
      }

      // Window cross
      ctx.fillStyle = COL.windowFrame;
      ctx.fillRect(x + 3 * TILE / 2 - 2, 2 * TILE, 4, 4 * TILE);
      ctx.fillRect(x, 2 * TILE + 2 * TILE - 2, 3 * TILE, 4);
    }

    // Wallpaper pattern
    ctx.fillStyle = 'rgba(60,55,75,0.15)';
    for (let px = Math.floor(camX / 64) * 64; px < camX + this.width + 64; px += 64) {
      for (let py = TILE; py < 13 * TILE; py += 64) {
        ctx.fillRect(px + 28, py + 28, 8, 8);
      }
    }
  }

  renderPlatforms() {
    const ctx = this.ctx;
    const camX = this.camera.x;

    for (const plat of this.platforms) {
      if (plat.x + plat.w < camX || plat.x > camX + this.width) continue;

      if (plat.y >= 13 * TILE) {
        // Floor
        for (let tx = plat.x; tx < plat.x + plat.w; tx += TILE) {
          ctx.fillStyle = COL.floor;
          ctx.fillRect(tx, plat.y, TILE, TILE);
          ctx.fillStyle = COL.floorLight;
          ctx.fillRect(tx + 2, plat.y + 2, TILE - 4, 4);
          ctx.fillRect(tx + TILE / 2, plat.y + TILE / 2, TILE / 2 - 2, 4);
        }
      } else if (plat.y === 0 || plat.x === 0 || plat.x >= 49 * TILE) {
        // Walls/ceiling
        ctx.fillStyle = COL.wall;
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        ctx.fillStyle = COL.wallLight;
        ctx.fillRect(plat.x, plat.y, plat.w, 2);
      } else {
        // Furniture
        ctx.fillStyle = COL.furniture;
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        ctx.fillStyle = COL.furnitureLight;
        ctx.fillRect(plat.x, plat.y, plat.w, 3);
        ctx.fillStyle = COL.furnitureDark;
        ctx.fillRect(plat.x, plat.y + plat.h - 2, plat.w, 2);

        // Furniture legs (for tables/desks)
        if (plat.h <= TILE) {
          ctx.fillStyle = COL.furnitureDark;
          ctx.fillRect(plat.x + 2, plat.y + plat.h, 4, 13 * TILE - plat.y - plat.h);
          ctx.fillRect(plat.x + plat.w - 6, plat.y + plat.h, 4, 13 * TILE - plat.y - plat.h);
        }
      }
    }
  }

  renderExit() {
    const ctx = this.ctx;
    const e = this.exit;

    // Door frame
    ctx.fillStyle = COL.doorFrame;
    ctx.fillRect(e.x - 4, e.y - 4, e.w + 8, e.h + 4);

    // Door
    ctx.fillStyle = COL.door;
    ctx.fillRect(e.x, e.y, e.w, e.h);

    // Door details
    ctx.fillStyle = '#776644';
    ctx.fillRect(e.x + 4, e.y + 6, e.w - 8, e.h / 3 - 8);
    ctx.fillRect(e.x + 4, e.y + e.h / 3 + 6, e.w - 8, e.h / 3 - 8);

    // Handle
    ctx.fillStyle = this.exit.locked ? '#aa4444' : COL.exitGlow;
    ctx.fillRect(e.x + e.w - 12, e.y + e.h / 2 - 3, 6, 6);

    // Lock indicator
    if (this.exit.locked) {
      ctx.fillStyle = '#aa4444';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🔒', e.x + e.w / 2, e.y - 8);
    } else {
      // Glow effect
      ctx.fillStyle = 'rgba(68,204,102,0.1)';
      ctx.fillRect(e.x - 8, e.y - 8, e.w + 16, e.h + 16);
    }
  }

  renderObjects() {
    const ctx = this.ctx;
    for (const obj of this.objects) {
      if (obj.broken) continue;
      ctx.fillStyle = obj.color;

      switch (obj.type) {
        case 'vase':
          ctx.fillRect(obj.x + 2, obj.y, obj.w - 4, 3);
          ctx.fillRect(obj.x, obj.y + 3, obj.w, obj.h - 3);
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillRect(obj.x + 2, obj.y + 5, 2, obj.h - 8);
          break;
        case 'cup':
          ctx.fillRect(obj.x, obj.y + 2, obj.w, obj.h - 2);
          ctx.fillRect(obj.x + obj.w, obj.y + 3, 3, 4);
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillRect(obj.x + 1, obj.y + 3, 2, obj.h - 5);
          break;
        case 'book':
          ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
          ctx.fillStyle = '#eeddaa';
          ctx.fillRect(obj.x + 2, obj.y + 1, obj.w - 4, 1);
          ctx.fillRect(obj.x + 2, obj.y + obj.h - 2, obj.w - 4, 1);
          break;
        case 'plant':
          // Pot
          ctx.fillStyle = '#aa6633';
          ctx.fillRect(obj.x + 1, obj.y + obj.h / 2, obj.w - 2, obj.h / 2);
          // Leaves
          ctx.fillStyle = obj.color;
          ctx.fillRect(obj.x, obj.y, obj.w, obj.h / 2 + 2);
          ctx.fillRect(obj.x - 3, obj.y + 2, 4, 4);
          ctx.fillRect(obj.x + obj.w - 1, obj.y + 2, 4, 4);
          break;
        case 'lamp':
          // Shade
          ctx.fillStyle = obj.color;
          ctx.fillRect(obj.x, obj.y, obj.w, 6);
          // Stand
          ctx.fillStyle = '#888888';
          ctx.fillRect(obj.x + obj.w / 2 - 1, obj.y + 6, 3, obj.h - 6);
          // Base
          ctx.fillRect(obj.x + 1, obj.y + obj.h - 3, obj.w - 2, 3);
          // Light glow
          ctx.fillStyle = 'rgba(255,220,100,0.08)';
          ctx.fillRect(obj.x - 15, obj.y + 6, obj.w + 30, 40);
          break;
      }
    }
  }

  renderCollectibles() {
    const ctx = this.ctx;
    for (const c of this.collectibles) {
      if (c.collected) continue;
      const bob = Math.sin(c.animTimer) * 3;
      const cy = c.y + bob;

      switch (c.type) {
        case 'fish':
          ctx.fillStyle = COL.fish;
          ctx.fillRect(c.x, cy + 2, 10, 4);
          ctx.fillRect(c.x - 2, cy + 3, 2, 2);
          ctx.fillRect(c.x + 10, cy, 4, 3);
          ctx.fillRect(c.x + 10, cy + 5, 4, 3);
          ctx.fillStyle = COL.fishLight;
          ctx.fillRect(c.x + 2, cy + 3, 3, 2);
          // Eye
          ctx.fillStyle = '#222';
          ctx.fillRect(c.x + 1, cy + 3, 1, 1);
          break;
        case 'yarn':
          ctx.fillStyle = COL.yarn;
          ctx.beginPath();
          ctx.arc(c.x + 5, cy + 5, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = COL.yarnLight;
          ctx.fillRect(c.x + 3, cy + 2, 3, 2);
          // String
          ctx.fillStyle = COL.yarn;
          ctx.fillRect(c.x + 10, cy + 6, 5, 1);
          ctx.fillRect(c.x + 14, cy + 7, 1, 4);
          break;
        case 'key':
          ctx.fillStyle = COL.key;
          ctx.fillRect(c.x, cy + 2, 8, 4);
          ctx.fillRect(c.x + 8, cy, 4, 8);
          ctx.fillRect(c.x + 8, cy + 2, 2, 2);
          ctx.fillStyle = COL.keyLight;
          ctx.fillRect(c.x + 1, cy + 3, 6, 2);
          // Glow
          ctx.fillStyle = 'rgba(221,187,68,0.15)';
          ctx.fillRect(c.x - 6, cy - 4, 24, 20);
          break;
        case 'food':
          ctx.fillStyle = COL.food;
          ctx.fillRect(c.x, cy + 3, 10, 5);
          ctx.fillStyle = COL.foodLight;
          ctx.fillRect(c.x + 2, cy + 1, 6, 3);
          ctx.fillRect(c.x + 3, cy + 4, 4, 2);
          break;
      }
    }
  }

  renderNoises() {
    const ctx = this.ctx;
    for (const n of this.noises) {
      const alpha = (n.timer / 30) * 0.3;
      ctx.strokeStyle = `rgba(255,200,100,${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  renderEnemies() {
    const ctx = this.ctx;
    for (const enemy of this.enemies) {
      // Vision cone
      this.renderVisionCone(ctx, enemy);

      // Body
      const ex = Math.floor(enemy.x);
      const ey = Math.floor(enemy.y);

      // Pants
      ctx.fillStyle = COL.humanPants;
      ctx.fillRect(ex + 2, ey + 24, 6, 14);
      ctx.fillRect(ex + 10, ey + 24, 6, 14);

      // Shirt
      ctx.fillStyle = enemy.state === 'alert' ? '#884444' : enemy.state === 'suspicious' ? '#886644' : COL.humanShirt;
      ctx.fillRect(ex, ey + 10, enemy.w, 16);
      // Arms
      ctx.fillRect(ex - 3, ey + 12, 3, 10);
      ctx.fillRect(ex + enemy.w, ey + 12, 3, 10);

      // Head
      ctx.fillStyle = COL.human;
      ctx.fillRect(ex + 3, ey, 12, 12);

      // Eyes
      ctx.fillStyle = '#fff';
      const eyeX = enemy.facing === 1 ? ex + 9 : ex + 5;
      ctx.fillRect(eyeX, ey + 4, 3, 3);
      ctx.fillStyle = '#222';
      ctx.fillRect(eyeX + (enemy.facing === 1 ? 1 : 0), ey + 5, 2, 2);

      // State indicator
      if (enemy.state === 'suspicious') {
        ctx.fillStyle = '#ffcc44';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('?', ex + enemy.w / 2, ey - 6);
      } else if (enemy.state === 'alert') {
        ctx.fillStyle = '#ff4444';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('!', ex + enemy.w / 2, ey - 6);
      }
    }
  }

  renderVisionCone(ctx: CanvasRenderingContext2D, enemy: Enemy) {
    const ex = enemy.x + enemy.w / 2;
    const ey = enemy.y + enemy.h / 3;
    const dir = enemy.facing === 1 ? 0 : Math.PI;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.arc(ex, ey, enemy.visionRange, dir - enemy.visionAngle / 2, dir + enemy.visionAngle / 2);
    ctx.closePath();

    ctx.fillStyle = enemy.state === 'alert' ? COL.visionAlert :
                    enemy.state === 'suspicious' ? COL.visionSuspicious : COL.visionNormal;
    ctx.fill();
    ctx.restore();
  }

  renderPlayer() {
    const ctx = this.ctx;
    const p = this.player;

    // Blinking when invincible
    if (p.invincible > 0 && Math.floor(p.invincible) % 6 < 3) return;

    this.drawCatSprite(ctx, Math.floor(p.x), Math.floor(p.y), p.facing, p.crouching, p.animFrame, !p.grounded);
  }

  drawCatSprite(ctx: CanvasRenderingContext2D, x: number, y: number, facing: 1 | -1, crouching: boolean, frame: number, jumping: boolean) {
    ctx.save();
    if (facing === -1) {
      ctx.translate(x + CAT_W, y);
      ctx.scale(-1, 1);
      x = 0; y = 0;
    }

    if (crouching) {
      // Crouched cat
      // Body
      ctx.fillStyle = COL.catDark;
      ctx.fillRect(x, y + 2, 22, 10);
      ctx.fillStyle = COL.cat;
      ctx.fillRect(x + 1, y + 1, 20, 10);

      // Head
      ctx.fillRect(x + 14, y - 2, 8, 8);
      // Ears
      ctx.fillStyle = COL.catDark;
      ctx.fillRect(x + 15, y - 5, 3, 3);
      ctx.fillRect(x + 19, y - 5, 3, 3);
      // Eyes
      ctx.fillStyle = COL.catEye;
      ctx.fillRect(x + 17, y, 2, 2);
      ctx.fillRect(x + 20, y, 2, 2);
      // Nose
      ctx.fillStyle = COL.catNose;
      ctx.fillRect(x + 19, y + 3, 2, 1);

      // Tail
      ctx.fillStyle = COL.catDark;
      ctx.fillRect(x - 3, y, 5, 2);
      ctx.fillRect(x - 5, y - 2, 3, 3);
    } else {
      // Standing cat
      const legOffset = jumping ? 3 : (frame % 2 === 0 ? 0 : 2);

      // Body
      ctx.fillStyle = COL.cat;
      ctx.fillRect(x + 2, y + 4, 16, 10);
      ctx.fillStyle = COL.catLight;
      ctx.fillRect(x + 4, y + 6, 12, 4);

      // Head
      ctx.fillStyle = COL.cat;
      ctx.fillRect(x + 12, y, 10, 10);
      ctx.fillStyle = COL.catLight;
      ctx.fillRect(x + 14, y + 2, 6, 6);

      // Ears
      ctx.fillStyle = COL.catDark;
      ctx.fillRect(x + 13, y - 4, 3, 4);
      ctx.fillRect(x + 18, y - 4, 3, 4);
      // Inner ear
      ctx.fillStyle = COL.catNose;
      ctx.fillRect(x + 14, y - 2, 1, 2);
      ctx.fillRect(x + 19, y - 2, 1, 2);

      // Eyes
      ctx.fillStyle = COL.catEye;
      ctx.fillRect(x + 16, y + 3, 2, 2);
      ctx.fillRect(x + 19, y + 3, 2, 2);
      // Pupils
      ctx.fillStyle = '#113322';
      ctx.fillRect(x + 17, y + 3, 1, 2);
      ctx.fillRect(x + 20, y + 3, 1, 2);

      // Nose
      ctx.fillStyle = COL.catNose;
      ctx.fillRect(x + 18, y + 6, 2, 1);

      // Whiskers
      ctx.fillStyle = COL.catLight;
      ctx.fillRect(x + 21, y + 5, 4, 1);
      ctx.fillRect(x + 21, y + 7, 3, 1);

      // Legs
      ctx.fillStyle = COL.catDark;
      if (jumping) {
        // Stretched legs in air
        ctx.fillRect(x + 3, y + 14, 3, 6);
        ctx.fillRect(x + 8, y + 14, 3, 4);
        ctx.fillRect(x + 12, y + 14, 3, 4);
        ctx.fillRect(x + 15, y + 14, 3, 6);
      } else {
        // Walking legs
        ctx.fillRect(x + 3, y + 14, 3, 6 + legOffset);
        ctx.fillRect(x + 8, y + 14, 3, 6 - legOffset + 2);
        ctx.fillRect(x + 12, y + 14, 3, 6 - legOffset + 2);
        ctx.fillRect(x + 15, y + 14, 3, 6 + legOffset);
      }

      // Tail
      ctx.fillStyle = COL.catDark;
      const tailWave = Math.sin(this.frameCount * 0.08) * 3;
      ctx.fillRect(x - 2, y + 4 + tailWave, 4, 2);
      ctx.fillRect(x - 5, y + 2 + tailWave, 4, 2);
      ctx.fillRect(x - 7, y + tailWave, 3, 2);
    }

    ctx.restore();
  }

  renderParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  renderHUD() {
    const ctx = this.ctx;

    // Background panel
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, this.width, 32);

    // Lives
    ctx.fillStyle = '#ff6666';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('❤️'.repeat(Math.max(0, this.player.lives)), 8, 14);

    // Score
    ctx.fillStyle = '#ffcc44';
    ctx.textAlign = 'left';
    ctx.fillText(`PTS: ${this.score}`, 8, 26);

    // Chaos meter
    ctx.fillStyle = '#aaaaaa';
    ctx.textAlign = 'center';
    ctx.fillText(`CAOS: ${this.chaos}`, this.width / 2, 14);

    // Stealth indicator
    const stealthColor = this.stealthMeter > 70 ? '#ff4444' : this.stealthMeter > 30 ? '#ffcc44' : '#44cc66';
    ctx.fillStyle = '#333333';
    ctx.fillRect(this.width - 140, 6, 104, 8);
    ctx.fillStyle = stealthColor;
    ctx.fillRect(this.width - 139, 7, Math.floor(this.stealthMeter * 1.02), 6);
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('STEALTH', this.width - 142, 13);

    // Key indicator
    if (this.exit.locked) {
      ctx.fillStyle = '#ff8844';
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🔑 Encontre a chave!', this.width / 2, 26);
    } else {
      ctx.fillStyle = '#44cc66';
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('→ Vá para a saída! →', this.width / 2, 26);
    }

    // Hidden indicator
    if (this.player.hidden) {
      ctx.fillStyle = 'rgba(68,204,102,0.3)';
      ctx.fillRect(0, 32, this.width, 2);
    }
  }

  renderGameOver() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = '#ff4444';
    ctx.font = '20px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 30);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText(`Pontos: ${this.score}  Caos: ${this.chaos}`, this.width / 2, this.height / 2 + 10);

    if (Math.sin(this.frameCount * 0.05) > 0) {
      ctx.fillStyle = '#ddaa33';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText('ESPAÇO para tentar de novo', this.width / 2, this.height / 2 + 50);
    }

    if (this.keysJustPressed.has('Space')) {
      this.gameState = 'playing';
      this.initLevel();
    }
  }

  renderWin() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = '#44cc66';
    ctx.font = '18px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FASE COMPLETA!', this.width / 2, this.height / 2 - 40);

    // Stars rating
    const stars = this.calculateStars();
    ctx.fillStyle = '#ffcc44';
    ctx.font = '20px "Press Start 2P", monospace';
    ctx.fillText('⭐'.repeat(stars) + '☆'.repeat(3 - stars), this.width / 2, this.height / 2);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText(`Pontos: ${this.score}`, this.width / 2, this.height / 2 + 30);
    ctx.fillText(`Caos: ${this.chaos}  ${this.seen ? 'Visto!' : 'Fantasma!'}`, this.width / 2, this.height / 2 + 50);

    if (!this.seen) {
      ctx.fillStyle = '#44cc66';
      ctx.fillText('BÔNUS: Nunca foi visto! +50', this.width / 2, this.height / 2 + 70);
    }

    if (Math.sin(this.frameCount * 0.05) > 0) {
      ctx.fillStyle = '#ddaa33';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText('ESPAÇO para jogar de novo', this.width / 2, this.height / 2 + 100);
    }

    if (this.keysJustPressed.has('Space')) {
      this.gameState = 'playing';
      this.initLevel();
    }
  }

  calculateStars(): number {
    let stars = 1;
    if (this.chaos >= 30) stars++;
    if (!this.seen) stars++;
    return stars;
  }
}
