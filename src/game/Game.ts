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

interface HidingSpot {
  x: number; y: number;
  w: number; h: number;
  type: 'bed' | 'wardrobe' | 'bucket' | 'box' | 'dumpster' | 'table';
  occupied: boolean;
  color: string;
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

interface CatSkin {
  name: string;
  body: string;
  bodyLight: string;
  bodyDark: string;
  eye: string;
  nose: string;
  description: string;
}

const CAT_SKINS: CatSkin[] = [
  { name: 'SHADOW', body: '#3a3a3a', bodyLight: '#555555', bodyDark: '#252525', eye: '#44cc66', nose: '#ff8899', description: 'Gato cinza clássico' },
  { name: 'LARANJA', body: '#cc7722', bodyLight: '#dd9944', bodyDark: '#995511', eye: '#44bb44', nose: '#ff6666', description: 'Gato laranja travesso' },
  { name: 'BRANCO', body: '#cccccc', bodyLight: '#eeeeee', bodyDark: '#999999', eye: '#4488dd', nose: '#ffaaaa', description: 'Gato branco elegante' },
  { name: 'PRETO', body: '#1a1a1a', bodyLight: '#333333', bodyDark: '#0a0a0a', eye: '#ffcc00', nose: '#cc6677', description: 'Gato preto misterioso' },
  { name: 'SIAMÊS', body: '#d4c4a0', bodyLight: '#e8dcc0', bodyDark: '#6b5040', eye: '#4488cc', nose: '#cc8888', description: 'Gato siamês esperto' },
  { name: 'MALHADO', body: '#887744', bodyLight: '#aa9966', bodyDark: '#554422', eye: '#66cc44', nose: '#ff9988', description: 'Gato malhado aventureiro' },
];

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
  // Cat colors will be overridden by selected skin
  // These are defaults used as fallback
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

import { SFX } from './SFX';

// --- MAIN GAME CLASS ---
export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  sfx = new SFX();
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
  gameState: 'title' | 'charSelect' | 'modeSelect' | 'playing' | 'gameover' | 'win' = 'title';
  camera = { x: 0 };
  levelWidth = 1600;
  stealthMeter = 0;
  time = 0;
  frameCount = 0;
  currentLevel = 1;
  maxLevel = 3;
  selectedCat = 0;
  gameMode: 'normal' | 'zombie' = 'normal';
  hidingSpots: HidingSpot[] = [];
  playerInSpot: HidingSpot | null = null;
  hideTimer = 0;



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
    this.sfx.destroy();
  }

  startGame(level = 1) {
    this.gameState = 'playing';
    this.currentLevel = level;
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
    this.hidingSpots = [];
    this.playerInSpot = null;
    this.hideTimer = 0;

    if (this.gameMode === 'zombie') {
      if (this.currentLevel === 3) this.initZombie3();
      else if (this.currentLevel === 2) this.initZombie2();
      else this.initZombie1();
    } else {
      if (this.currentLevel === 3) this.initLevel3();
      else if (this.currentLevel === 2) this.initLevel2();
      else this.initLevel1();
    }

    this.totalFish = this.collectibles.filter(c => c.type === 'fish').length;
  }

  initLevel1() {
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
      { x: 7 * TILE, y: 10 * TILE - 14, w: 10, h: 14, type: 'vase', falling: false, vy: 0, grounded: true, noiseRadius: 120, broken: false, breakable: true, color: COL.vase },
      { x: 9 * TILE, y: 10 * TILE - 10, w: 8, h: 10, type: 'cup', falling: false, vy: 0, grounded: true, noiseRadius: 80, broken: false, breakable: true, color: COL.cup },
      { x: 10 * TILE, y: 10 * TILE - 10, w: 8, h: 10, type: 'cup', falling: false, vy: 0, grounded: true, noiseRadius: 80, broken: false, breakable: true, color: COL.cup },
      { x: 8 * TILE, y: 7 * TILE - 16 + 8, w: 12, h: 12, type: 'plant', falling: false, vy: 0, grounded: true, noiseRadius: 100, broken: false, breakable: true, color: COL.plant },
      { x: 15 * TILE, y: 11 * TILE - 14, w: 10, h: 14, type: 'vase', falling: false, vy: 0, grounded: true, noiseRadius: 120, broken: false, breakable: true, color: COL.vase },
      { x: 17 * TILE, y: 11 * TILE - 10, w: 8, h: 10, type: 'cup', falling: false, vy: 0, grounded: true, noiseRadius: 80, broken: false, breakable: true, color: COL.cup },
      { x: 21 * TILE, y: 8 * TILE - 12, w: 14, h: 10, type: 'book', falling: false, vy: 0, grounded: true, noiseRadius: 60, broken: false, breakable: false, color: COL.book },
      { x: 21 * TILE, y: 10 * TILE - 12, w: 14, h: 10, type: 'book', falling: false, vy: 0, grounded: true, noiseRadius: 60, broken: false, breakable: false, color: COL.book },
      { x: 27 * TILE, y: 10 * TILE - 18, w: 10, h: 16, type: 'lamp', falling: false, vy: 0, grounded: true, noiseRadius: 100, broken: false, breakable: true, color: COL.lamp },
      { x: 40 * TILE, y: 11 * TILE - 14, w: 10, h: 14, type: 'vase', falling: false, vy: 0, grounded: true, noiseRadius: 120, broken: false, breakable: true, color: COL.vase },
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

  initLevel2() {
    this.levelWidth = 65 * TILE;

    // Player starts with fewer lives
    this.player = {
      x: 3 * TILE, y: 11 * TILE,
      vx: 0, vy: 0,
      w: CAT_W, h: CAT_H,
      grounded: false, crouching: false,
      facing: 1, hidden: false,
      lives: 7, invincible: 0,
      animFrame: 0, animTimer: 0,
      interactCooldown: 0,
    };

    // Rooftops & building layout - more vertical, more complex
    this.platforms = [
      // Ground floor
      { x: 0, y: 13 * TILE, w: 65 * TILE, h: 2 * TILE },
      // Left wall
      { x: 0, y: 0, w: TILE, h: 15 * TILE },
      // Right wall
      { x: 64 * TILE, y: 0, w: TILE, h: 15 * TILE },
      // Ceiling
      { x: 0, y: 0, w: 65 * TILE, h: TILE },

      // === COZINHA GRANDE (início) ===
      // Balcão da cozinha
      { x: 4 * TILE, y: 10 * TILE, w: 6 * TILE, h: TILE },
      // Prateleira alta da cozinha
      { x: 5 * TILE, y: 6 * TILE, w: 4 * TILE, h: TILE / 2 },
      // Mesa de jantar
      { x: 12 * TILE, y: 11 * TILE, w: 5 * TILE, h: TILE / 2 },

      // === CORREDOR ESTREITO ===
      // Prateleira do corredor (passagem apertada)
      { x: 19 * TILE, y: 9 * TILE, w: 2 * TILE, h: TILE / 2 },
      { x: 19 * TILE, y: 11 * TILE, w: 2 * TILE, h: TILE / 2 },

      // === SALA DE ESTAR ===
      // Estante grande (3 níveis)
      { x: 24 * TILE, y: 5 * TILE, w: 3 * TILE, h: TILE / 2 },
      { x: 24 * TILE, y: 7 * TILE, w: 3 * TILE, h: TILE / 2 },
      { x: 24 * TILE, y: 9 * TILE, w: 3 * TILE, h: TILE / 2 },
      // Sofá
      { x: 29 * TILE, y: 11 * TILE, w: 5 * TILE, h: TILE },
      // Mesa de centro
      { x: 31 * TILE, y: 12 * TILE, w: 2 * TILE, h: TILE / 2 },

      // === ESCRITÓRIO ===
      // Mesa do escritório
      { x: 37 * TILE, y: 10 * TILE, w: 5 * TILE, h: TILE / 2 },
      // Prateleira alta do escritório
      { x: 38 * TILE, y: 6 * TILE, w: 4 * TILE, h: TILE / 2 },
      // Armário
      { x: 37 * TILE, y: 8 * TILE, w: 2 * TILE, h: TILE },

      // === ÁREA DE TELHADOS ===
      // Plataformas escalonadas (telhados)
      { x: 45 * TILE, y: 11 * TILE, w: 3 * TILE, h: TILE / 2 },
      { x: 49 * TILE, y: 9 * TILE, w: 3 * TILE, h: TILE / 2 },
      { x: 53 * TILE, y: 7 * TILE, w: 3 * TILE, h: TILE / 2 },
      { x: 50 * TILE, y: 5 * TILE, w: 2 * TILE, h: TILE / 2 },
      // Plataforma final elevada
      { x: 57 * TILE, y: 8 * TILE, w: 4 * TILE, h: TILE / 2 },
      // Caixas empilhadas
      { x: 55 * TILE, y: 11 * TILE, w: 2 * TILE, h: TILE },
      { x: 55 * TILE, y: 10 * TILE, w: 2 * TILE, h: TILE },
    ];

    // Mais objetos, incluindo novos em posições estratégicas
    this.objects = [
      // Cozinha
      { x: 5 * TILE, y: 10 * TILE - 14, w: 10, h: 14, type: 'vase', falling: false, vy: 0, grounded: true, noiseRadius: 130, broken: false, breakable: true, color: COL.vase },
      { x: 7 * TILE, y: 10 * TILE - 10, w: 8, h: 10, type: 'cup', falling: false, vy: 0, grounded: true, noiseRadius: 90, broken: false, breakable: true, color: COL.cup },
      { x: 8 * TILE, y: 10 * TILE - 10, w: 8, h: 10, type: 'cup', falling: false, vy: 0, grounded: true, noiseRadius: 90, broken: false, breakable: true, color: COL.cup },
      { x: 9 * TILE, y: 10 * TILE - 10, w: 8, h: 10, type: 'cup', falling: false, vy: 0, grounded: true, noiseRadius: 90, broken: false, breakable: true, color: COL.cup },
      { x: 6 * TILE, y: 6 * TILE - 16 + 8, w: 12, h: 12, type: 'plant', falling: false, vy: 0, grounded: true, noiseRadius: 110, broken: false, breakable: true, color: COL.plant },
      // Mesa de jantar
      { x: 13 * TILE, y: 11 * TILE - 14, w: 10, h: 14, type: 'vase', falling: false, vy: 0, grounded: true, noiseRadius: 130, broken: false, breakable: true, color: COL.vase },
      { x: 15 * TILE, y: 11 * TILE - 10, w: 8, h: 10, type: 'cup', falling: false, vy: 0, grounded: true, noiseRadius: 90, broken: false, breakable: true, color: COL.cup },
      { x: 16 * TILE, y: 11 * TILE - 10, w: 8, h: 10, type: 'cup', falling: false, vy: 0, grounded: true, noiseRadius: 90, broken: false, breakable: true, color: COL.cup },
      // Corredor
      { x: 19 * TILE + 8, y: 9 * TILE - 12, w: 14, h: 10, type: 'book', falling: false, vy: 0, grounded: true, noiseRadius: 70, broken: false, breakable: false, color: COL.book },
      // Estante da sala (3 níveis de objetos!)
      { x: 25 * TILE, y: 5 * TILE - 14, w: 10, h: 14, type: 'vase', falling: false, vy: 0, grounded: true, noiseRadius: 130, broken: false, breakable: true, color: COL.vase },
      { x: 25 * TILE, y: 7 * TILE - 12, w: 14, h: 10, type: 'book', falling: false, vy: 0, grounded: true, noiseRadius: 70, broken: false, breakable: false, color: COL.book },
      { x: 25 * TILE, y: 9 * TILE - 12, w: 12, h: 12, type: 'plant', falling: false, vy: 0, grounded: true, noiseRadius: 110, broken: false, breakable: true, color: COL.plant },
      // Escritório
      { x: 38 * TILE, y: 10 * TILE - 18, w: 10, h: 16, type: 'lamp', falling: false, vy: 0, grounded: true, noiseRadius: 110, broken: false, breakable: true, color: COL.lamp },
      { x: 40 * TILE, y: 10 * TILE - 10, w: 8, h: 10, type: 'cup', falling: false, vy: 0, grounded: true, noiseRadius: 90, broken: false, breakable: true, color: COL.cup },
      { x: 39 * TILE, y: 6 * TILE - 14, w: 10, h: 14, type: 'vase', falling: false, vy: 0, grounded: true, noiseRadius: 130, broken: false, breakable: true, color: COL.vase },
      { x: 41 * TILE, y: 6 * TILE - 12, w: 14, h: 10, type: 'book', falling: false, vy: 0, grounded: true, noiseRadius: 70, broken: false, breakable: false, color: COL.book },
      // Telhados
      { x: 46 * TILE, y: 11 * TILE - 14, w: 10, h: 14, type: 'vase', falling: false, vy: 0, grounded: true, noiseRadius: 130, broken: false, breakable: true, color: COL.vase },
      { x: 50 * TILE, y: 9 * TILE - 12, w: 12, h: 12, type: 'plant', falling: false, vy: 0, grounded: true, noiseRadius: 110, broken: false, breakable: true, color: COL.plant },
    ];

    // Mais coletáveis espalhados
    this.collectibles = [
      { x: 6 * TILE, y: 9 * TILE, type: 'fish', collected: false, animTimer: 0 },
      { x: 14 * TILE, y: 10 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      { x: 20 * TILE, y: 8 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      { x: 26 * TILE, y: 4 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      { x: 30 * TILE, y: 10 * TILE, type: 'yarn', collected: false, animTimer: Math.random() * 100 },
      { x: 35 * TILE, y: 12 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      { x: 39 * TILE, y: 5 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      { x: 42 * TILE, y: 9 * TILE, type: 'food', collected: false, animTimer: Math.random() * 100 },
      { x: 50 * TILE, y: 4 * TILE, type: 'yarn', collected: false, animTimer: Math.random() * 100 },
      { x: 54 * TILE, y: 6 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      { x: 57 * TILE, y: 7 * TILE, type: 'food', collected: false, animTimer: Math.random() * 100 },
      // Chave escondida no topo dos telhados
      { x: 51 * TILE, y: 4 * TILE, type: 'key', collected: false, animTimer: Math.random() * 100 },
    ];

    // Exit door - no final, após área de telhados
    this.exit = { x: 60 * TILE, y: 5 * TILE, w: TILE * 1.5, h: 3 * TILE, locked: true };

    // 4 inimigos! Mais rápidos e com visão maior
    this.enemies = [
      // Patrulha cozinha - rápido
      {
        x: 10 * TILE, y: 13 * TILE - 40,
        w: 18, h: 38,
        patrolA: 4 * TILE, patrolB: 18 * TILE,
        facing: 1, state: 'normal',
        stateTimer: 0, investigateX: 0,
        speed: 1.6, visionRange: 180, visionAngle: Math.PI / 2.5,
      },
      // Patrulha sala - campo de visão largo
      {
        x: 30 * TILE, y: 13 * TILE - 40,
        w: 18, h: 38,
        patrolA: 23 * TILE, patrolB: 36 * TILE,
        facing: -1, state: 'normal',
        stateTimer: 0, investigateX: 0,
        speed: 1.4, visionRange: 200, visionAngle: Math.PI / 2,
      },
      // Patrulha escritório - muito rápido
      {
        x: 40 * TILE, y: 13 * TILE - 40,
        w: 18, h: 38,
        patrolA: 36 * TILE, patrolB: 48 * TILE,
        facing: 1, state: 'normal',
        stateTimer: 0, investigateX: 0,
        speed: 1.8, visionRange: 170, visionAngle: Math.PI / 3,
      },
      // Patrulha telhados - o mais perigoso
      {
        x: 55 * TILE, y: 13 * TILE - 40,
        w: 18, h: 38,
        patrolA: 48 * TILE, patrolB: 62 * TILE,
        facing: -1, state: 'normal',
        stateTimer: 0, investigateX: 0,
        speed: 2.0, visionRange: 220, visionAngle: Math.PI / 2,
      },
    ];
  }

  initLevel3() {
    this.levelWidth = 80 * TILE;

    // Player - apenas 5 vidas na fase mais difícil
    this.player = {
      x: 3 * TILE, y: 11 * TILE,
      vx: 0, vy: 0,
      w: CAT_W, h: CAT_H,
      grounded: false, crouching: false,
      facing: 1, hidden: false,
      lives: 5, invincible: 0,
      animFrame: 0, animTimer: 0,
      interactCooldown: 0,
    };

    // === TELHADOS NOTURNOS - layout vertical e complexo ===
    this.platforms = [
      // Chão base
      { x: 0, y: 13 * TILE, w: 80 * TILE, h: 2 * TILE },
      // Paredes
      { x: 0, y: 0, w: TILE, h: 15 * TILE },
      { x: 79 * TILE, y: 0, w: TILE, h: 15 * TILE },
      // Teto
      { x: 0, y: 0, w: 80 * TILE, h: TILE },

      // === PRÉDIO 1 - Apartamento inicial ===
      { x: 3 * TILE, y: 10 * TILE, w: 5 * TILE, h: TILE },
      { x: 4 * TILE, y: 7 * TILE, w: 3 * TILE, h: TILE / 2 },
      { x: 9 * TILE, y: 11 * TILE, w: 3 * TILE, h: TILE / 2 },

      // === TELHADO 1 - Transição externa ===
      { x: 13 * TILE, y: 9 * TILE, w: 4 * TILE, h: TILE / 2 },
      { x: 15 * TILE, y: 6 * TILE, w: 2 * TILE, h: TILE / 2 },

      // === PRÉDIO 2 - Edifício com varal ===
      { x: 19 * TILE, y: 8 * TILE, w: 6 * TILE, h: TILE },
      { x: 20 * TILE, y: 5 * TILE, w: 4 * TILE, h: TILE / 2 },
      { x: 19 * TILE, y: 11 * TILE, w: 6 * TILE, h: TILE / 2 },
      // Varal (plataformas finas)
      { x: 26 * TILE, y: 7 * TILE, w: 5 * TILE, h: TILE / 4 },

      // === ZONA DE PERIGO - Beco estreito ===
      { x: 32 * TILE, y: 10 * TILE, w: 2 * TILE, h: TILE / 2 },
      { x: 35 * TILE, y: 8 * TILE, w: 2 * TILE, h: TILE / 2 },
      { x: 33 * TILE, y: 12 * TILE, w: 3 * TILE, h: TILE / 2 },

      // === PRÉDIO 3 - Escritório abandonado ===
      { x: 38 * TILE, y: 9 * TILE, w: 7 * TILE, h: TILE },
      { x: 39 * TILE, y: 6 * TILE, w: 5 * TILE, h: TILE / 2 },
      { x: 40 * TILE, y: 3 * TILE, w: 3 * TILE, h: TILE / 2 },
      { x: 38 * TILE, y: 11 * TILE, w: 3 * TILE, h: TILE / 2 },
      { x: 43 * TILE, y: 11 * TILE, w: 2 * TILE, h: TILE / 2 },

      // === TELHADOS ALTOS - Parkour vertical ===
      { x: 47 * TILE, y: 11 * TILE, w: 3 * TILE, h: TILE / 2 },
      { x: 48 * TILE, y: 8 * TILE, w: 2 * TILE, h: TILE / 2 },
      { x: 51 * TILE, y: 10 * TILE, w: 2 * TILE, h: TILE / 2 },
      { x: 51 * TILE, y: 6 * TILE, w: 3 * TILE, h: TILE / 2 },
      { x: 55 * TILE, y: 8 * TILE, w: 2 * TILE, h: TILE / 2 },
      { x: 54 * TILE, y: 4 * TILE, w: 3 * TILE, h: TILE / 2 },

      // === PRÉDIO FINAL - Cobertura ===
      { x: 58 * TILE, y: 10 * TILE, w: 8 * TILE, h: TILE },
      { x: 59 * TILE, y: 7 * TILE, w: 6 * TILE, h: TILE / 2 },
      { x: 60 * TILE, y: 4 * TILE, w: 4 * TILE, h: TILE / 2 },
      { x: 67 * TILE, y: 11 * TILE, w: 3 * TILE, h: TILE / 2 },
      { x: 67 * TILE, y: 8 * TILE, w: 3 * TILE, h: TILE / 2 },

      // === PLATAFORMA SECRETA - Caminho alternativo ===
      { x: 71 * TILE, y: 6 * TILE, w: 3 * TILE, h: TILE / 2 },
      { x: 74 * TILE, y: 9 * TILE, w: 3 * TILE, h: TILE / 2 },
    ];

    // Muitos objetos para causar caos
    this.objects = [
      // Prédio 1
      { x: 4 * TILE, y: 10 * TILE - 14, w: 10, h: 14, type: 'vase', falling: false, vy: 0, grounded: true, noiseRadius: 140, broken: false, breakable: true, color: COL.vase },
      { x: 6 * TILE, y: 10 * TILE - 10, w: 8, h: 10, type: 'cup', falling: false, vy: 0, grounded: true, noiseRadius: 100, broken: false, breakable: true, color: COL.cup },
      { x: 5 * TILE, y: 7 * TILE - 16 + 8, w: 12, h: 12, type: 'plant', falling: false, vy: 0, grounded: true, noiseRadius: 120, broken: false, breakable: true, color: COL.plant },
      { x: 10 * TILE, y: 11 * TILE - 10, w: 8, h: 10, type: 'cup', falling: false, vy: 0, grounded: true, noiseRadius: 100, broken: false, breakable: true, color: COL.cup },
      // Prédio 2
      { x: 20 * TILE, y: 8 * TILE - 18, w: 10, h: 16, type: 'lamp', falling: false, vy: 0, grounded: true, noiseRadius: 120, broken: false, breakable: true, color: COL.lamp },
      { x: 23 * TILE, y: 8 * TILE - 14, w: 10, h: 14, type: 'vase', falling: false, vy: 0, grounded: true, noiseRadius: 140, broken: false, breakable: true, color: COL.vase },
      { x: 21 * TILE, y: 5 * TILE - 12, w: 14, h: 10, type: 'book', falling: false, vy: 0, grounded: true, noiseRadius: 80, broken: false, breakable: false, color: COL.book },
      { x: 20 * TILE, y: 11 * TILE - 10, w: 8, h: 10, type: 'cup', falling: false, vy: 0, grounded: true, noiseRadius: 100, broken: false, breakable: true, color: COL.cup },
      { x: 23 * TILE, y: 11 * TILE - 14, w: 10, h: 14, type: 'vase', falling: false, vy: 0, grounded: true, noiseRadius: 140, broken: false, breakable: true, color: COL.vase },
      // Escritório abandonado
      { x: 39 * TILE, y: 9 * TILE - 18, w: 10, h: 16, type: 'lamp', falling: false, vy: 0, grounded: true, noiseRadius: 120, broken: false, breakable: true, color: COL.lamp },
      { x: 42 * TILE, y: 9 * TILE - 14, w: 10, h: 14, type: 'vase', falling: false, vy: 0, grounded: true, noiseRadius: 140, broken: false, breakable: true, color: COL.vase },
      { x: 40 * TILE, y: 6 * TILE - 12, w: 14, h: 10, type: 'book', falling: false, vy: 0, grounded: true, noiseRadius: 80, broken: false, breakable: false, color: COL.book },
      { x: 43 * TILE, y: 6 * TILE - 12, w: 12, h: 12, type: 'plant', falling: false, vy: 0, grounded: true, noiseRadius: 120, broken: false, breakable: true, color: COL.plant },
      { x: 41 * TILE, y: 3 * TILE - 14, w: 10, h: 14, type: 'vase', falling: false, vy: 0, grounded: true, noiseRadius: 140, broken: false, breakable: true, color: COL.vase },
      // Prédio final
      { x: 60 * TILE, y: 10 * TILE - 14, w: 10, h: 14, type: 'vase', falling: false, vy: 0, grounded: true, noiseRadius: 140, broken: false, breakable: true, color: COL.vase },
      { x: 63 * TILE, y: 10 * TILE - 10, w: 8, h: 10, type: 'cup', falling: false, vy: 0, grounded: true, noiseRadius: 100, broken: false, breakable: true, color: COL.cup },
      { x: 61 * TILE, y: 7 * TILE - 18, w: 10, h: 16, type: 'lamp', falling: false, vy: 0, grounded: true, noiseRadius: 120, broken: false, breakable: true, color: COL.lamp },
      { x: 62 * TILE, y: 4 * TILE - 12, w: 12, h: 12, type: 'plant', falling: false, vy: 0, grounded: true, noiseRadius: 120, broken: false, breakable: true, color: COL.plant },
      { x: 68 * TILE, y: 8 * TILE - 14, w: 10, h: 14, type: 'vase', falling: false, vy: 0, grounded: true, noiseRadius: 140, broken: false, breakable: true, color: COL.vase },
    ];

    // Coletáveis espalhados estrategicamente
    this.collectibles = [
      // Prédio 1
      { x: 5 * TILE, y: 6 * TILE, type: 'fish', collected: false, animTimer: 0 },
      { x: 7 * TILE, y: 9 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      // Telhado 1
      { x: 14 * TILE, y: 8 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      { x: 16 * TILE, y: 5 * TILE, type: 'yarn', collected: false, animTimer: Math.random() * 100 },
      // Prédio 2
      { x: 22 * TILE, y: 4 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      { x: 28 * TILE, y: 6 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      // Beco
      { x: 33 * TILE, y: 9 * TILE, type: 'food', collected: false, animTimer: Math.random() * 100 },
      { x: 36 * TILE, y: 7 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      // Escritório
      { x: 41 * TILE, y: 2 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      { x: 44 * TILE, y: 10 * TILE, type: 'yarn', collected: false, animTimer: Math.random() * 100 },
      // Parkour
      { x: 52 * TILE, y: 5 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      { x: 55 * TILE, y: 3 * TILE, type: 'food', collected: false, animTimer: Math.random() * 100 },
      // Prédio final
      { x: 61 * TILE, y: 3 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      { x: 64 * TILE, y: 9 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      // Chave no caminho secreto!
      { x: 72 * TILE, y: 5 * TILE, type: 'key', collected: false, animTimer: Math.random() * 100 },
      // Bônus secreto
      { x: 75 * TILE, y: 8 * TILE, type: 'food', collected: false, animTimer: Math.random() * 100 },
    ];

    // Saída escondida na cobertura
    this.exit = { x: 76 * TILE, y: 6 * TILE, w: TILE * 1.5, h: 3 * TILE, locked: true };

    // 5 inimigos! Muito rápidos e com visão ampla
    this.enemies = [
      // Guarda do prédio 1
      {
        x: 8 * TILE, y: 13 * TILE - 40,
        w: 18, h: 38,
        patrolA: 3 * TILE, patrolB: 14 * TILE,
        facing: 1, state: 'normal',
        stateTimer: 0, investigateX: 0,
        speed: 1.8, visionRange: 180, visionAngle: Math.PI / 2.5,
      },
      // Guarda do prédio 2
      {
        x: 22 * TILE, y: 13 * TILE - 40,
        w: 18, h: 38,
        patrolA: 18 * TILE, patrolB: 32 * TILE,
        facing: -1, state: 'normal',
        stateTimer: 0, investigateX: 0,
        speed: 2.0, visionRange: 200, visionAngle: Math.PI / 2.5,
      },
      // Guarda do beco - patrulha curta mas rápido
      {
        x: 34 * TILE, y: 13 * TILE - 40,
        w: 18, h: 38,
        patrolA: 31 * TILE, patrolB: 38 * TILE,
        facing: 1, state: 'normal',
        stateTimer: 0, investigateX: 0,
        speed: 2.5, visionRange: 160, visionAngle: Math.PI / 2,
      },
      // Guarda do escritório - visão enorme
      {
        x: 42 * TILE, y: 13 * TILE - 40,
        w: 18, h: 38,
        patrolA: 37 * TILE, patrolB: 50 * TILE,
        facing: -1, state: 'normal',
        stateTimer: 0, investigateX: 0,
        speed: 1.6, visionRange: 250, visionAngle: Math.PI / 2,
      },
      // Guarda final - o mais perigoso
      {
        x: 62 * TILE, y: 13 * TILE - 40,
        w: 18, h: 38,
        patrolA: 57 * TILE, patrolB: 76 * TILE,
        facing: 1, state: 'normal',
        stateTimer: 0, investigateX: 0,
        speed: 2.2, visionRange: 240, visionAngle: Math.PI / 2,
      },
    ];
  }

  // ==================
  // ZOMBIE MODE LEVELS
  // ==================

  initZombie1() {
    this.levelWidth = 55 * TILE;
    this.maxLevel = 3;

    this.player = {
      x: 3 * TILE, y: 11 * TILE,
      vx: 0, vy: 0, w: CAT_W, h: CAT_H,
      grounded: false, crouching: false,
      facing: 1, hidden: false,
      lives: 5, invincible: 0,
      animFrame: 0, animTimer: 0,
      interactCooldown: 0,
    };

    this.platforms = [
      { x: 0, y: 13 * TILE, w: 55 * TILE, h: 2 * TILE },
      { x: 0, y: 0, w: TILE, h: 15 * TILE },
      { x: 54 * TILE, y: 0, w: TILE, h: 15 * TILE },
      { x: 0, y: 0, w: 55 * TILE, h: TILE },
      // Quarto 1
      { x: 5 * TILE, y: 10 * TILE, w: 4 * TILE, h: TILE },
      { x: 11 * TILE, y: 11 * TILE, w: 3 * TILE, h: TILE / 2 },
      // Corredor
      { x: 16 * TILE, y: 9 * TILE, w: 2 * TILE, h: TILE / 2 },
      // Sala
      { x: 20 * TILE, y: 10 * TILE, w: 6 * TILE, h: TILE },
      { x: 21 * TILE, y: 7 * TILE, w: 4 * TILE, h: TILE / 2 },
      // Cozinha
      { x: 28 * TILE, y: 11 * TILE, w: 5 * TILE, h: TILE / 2 },
      { x: 29 * TILE, y: 8 * TILE, w: 3 * TILE, h: TILE / 2 },
      // Garagem
      { x: 35 * TILE, y: 10 * TILE, w: 7 * TILE, h: TILE },
      { x: 36 * TILE, y: 7 * TILE, w: 3 * TILE, h: TILE / 2 },
      // Saída
      { x: 44 * TILE, y: 11 * TILE, w: 4 * TILE, h: TILE / 2 },
      { x: 49 * TILE, y: 9 * TILE, w: 3 * TILE, h: TILE / 2 },
    ];

    this.hidingSpots = [
      { x: 6 * TILE, y: 11 * TILE, w: 3 * TILE, h: 2 * TILE, type: 'bed', occupied: false, color: '#665544' },
      { x: 12 * TILE, y: 9 * TILE, w: TILE * 1.5, h: 4 * TILE, type: 'wardrobe', occupied: false, color: '#554433' },
      { x: 17 * TILE, y: 12 * TILE, w: TILE, h: TILE, type: 'bucket', occupied: false, color: '#777788' },
      { x: 22 * TILE, y: 11 * TILE, w: 2 * TILE, h: 2 * TILE, type: 'table', occupied: false, color: '#665533' },
      { x: 25 * TILE, y: 10 * TILE, w: TILE * 1.5, h: 3 * TILE, type: 'wardrobe', occupied: false, color: '#443322' },
      { x: 30 * TILE, y: 12 * TILE, w: TILE, h: TILE, type: 'bucket', occupied: false, color: '#888899' },
      { x: 37 * TILE, y: 11 * TILE, w: 2 * TILE, h: 2 * TILE, type: 'box', occupied: false, color: '#887755' },
      { x: 40 * TILE, y: 11 * TILE, w: 2 * TILE, h: 2 * TILE, type: 'dumpster', occupied: false, color: '#446644' },
      { x: 45 * TILE, y: 12 * TILE, w: TILE, h: TILE, type: 'bucket', occupied: false, color: '#777788' },
      { x: 50 * TILE, y: 10 * TILE, w: TILE * 1.5, h: 3 * TILE, type: 'wardrobe', occupied: false, color: '#554433' },
    ];

    this.objects = [
      { x: 7 * TILE, y: 10 * TILE - 14, w: 10, h: 14, type: 'vase', falling: false, vy: 0, grounded: true, noiseRadius: 120, broken: false, breakable: true, color: COL.vase },
      { x: 21 * TILE, y: 10 * TILE - 18, w: 10, h: 16, type: 'lamp', falling: false, vy: 0, grounded: true, noiseRadius: 100, broken: false, breakable: true, color: COL.lamp },
      { x: 29 * TILE, y: 11 * TILE - 10, w: 8, h: 10, type: 'cup', falling: false, vy: 0, grounded: true, noiseRadius: 80, broken: false, breakable: true, color: COL.cup },
      { x: 36 * TILE, y: 10 * TILE - 12, w: 12, h: 12, type: 'plant', falling: false, vy: 0, grounded: true, noiseRadius: 100, broken: false, breakable: true, color: COL.plant },
    ];

    this.collectibles = [
      { x: 8 * TILE, y: 9 * TILE, type: 'fish', collected: false, animTimer: 0 },
      { x: 16 * TILE, y: 8 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      { x: 23 * TILE, y: 6 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      { x: 31 * TILE, y: 7 * TILE, type: 'food', collected: false, animTimer: Math.random() * 100 },
      { x: 38 * TILE, y: 6 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      { x: 44 * TILE, y: 10 * TILE, type: 'yarn', collected: false, animTimer: Math.random() * 100 },
      { x: 49 * TILE, y: 8 * TILE, type: 'key', collected: false, animTimer: Math.random() * 100 },
    ];

    this.exit = { x: 52 * TILE, y: 6 * TILE, w: TILE * 1.5, h: 3 * TILE, locked: true };

    this.enemies = [
      {
        x: 14 * TILE, y: 13 * TILE - 40, w: 18, h: 38,
        patrolA: 5 * TILE, patrolB: 20 * TILE,
        facing: 1, state: 'normal', stateTimer: 0, investigateX: 0,
        speed: 0.8, visionRange: 180, visionAngle: Math.PI / 2.5,
      },
      {
        x: 32 * TILE, y: 13 * TILE - 40, w: 18, h: 38,
        patrolA: 20 * TILE, patrolB: 42 * TILE,
        facing: -1, state: 'normal', stateTimer: 0, investigateX: 0,
        speed: 0.7, visionRange: 200, visionAngle: Math.PI / 2,
      },
      {
        x: 48 * TILE, y: 13 * TILE - 40, w: 18, h: 38,
        patrolA: 42 * TILE, patrolB: 53 * TILE,
        facing: -1, state: 'normal', stateTimer: 0, investigateX: 0,
        speed: 1.0, visionRange: 160, visionAngle: Math.PI / 3,
      },
    ];
  }

  initZombie2() {
    this.levelWidth = 65 * TILE;

    this.player = {
      x: 3 * TILE, y: 11 * TILE,
      vx: 0, vy: 0, w: CAT_W, h: CAT_H,
      grounded: false, crouching: false,
      facing: 1, hidden: false,
      lives: 4, invincible: 0,
      animFrame: 0, animTimer: 0,
      interactCooldown: 0,
    };

    this.platforms = [
      { x: 0, y: 13 * TILE, w: 65 * TILE, h: 2 * TILE },
      { x: 0, y: 0, w: TILE, h: 15 * TILE },
      { x: 64 * TILE, y: 0, w: TILE, h: 15 * TILE },
      { x: 0, y: 0, w: 65 * TILE, h: TILE },
      // Hospital abandonado - Recepção
      { x: 4 * TILE, y: 10 * TILE, w: 5 * TILE, h: TILE },
      { x: 5 * TILE, y: 7 * TILE, w: 3 * TILE, h: TILE / 2 },
      // Corredor hospitalar
      { x: 11 * TILE, y: 11 * TILE, w: 3 * TILE, h: TILE / 2 },
      { x: 15 * TILE, y: 9 * TILE, w: 2 * TILE, h: TILE / 2 },
      // Enfermaria
      { x: 19 * TILE, y: 10 * TILE, w: 7 * TILE, h: TILE },
      { x: 20 * TILE, y: 7 * TILE, w: 5 * TILE, h: TILE / 2 },
      { x: 19 * TILE, y: 4 * TILE, w: 3 * TILE, h: TILE / 2 },
      // Laboratório
      { x: 28 * TILE, y: 11 * TILE, w: 6 * TILE, h: TILE / 2 },
      { x: 29 * TILE, y: 8 * TILE, w: 4 * TILE, h: TILE / 2 },
      { x: 30 * TILE, y: 5 * TILE, w: 3 * TILE, h: TILE / 2 },
      // Porão
      { x: 36 * TILE, y: 10 * TILE, w: 5 * TILE, h: TILE },
      { x: 37 * TILE, y: 7 * TILE, w: 3 * TILE, h: TILE / 2 },
      // Estacionamento
      { x: 43 * TILE, y: 11 * TILE, w: 4 * TILE, h: TILE / 2 },
      { x: 48 * TILE, y: 9 * TILE, w: 3 * TILE, h: TILE / 2 },
      { x: 52 * TILE, y: 10 * TILE, w: 4 * TILE, h: TILE },
      // Telhado do hospital
      { x: 57 * TILE, y: 8 * TILE, w: 4 * TILE, h: TILE / 2 },
      { x: 58 * TILE, y: 5 * TILE, w: 3 * TILE, h: TILE / 2 },
    ];

    this.hidingSpots = [
      { x: 5 * TILE, y: 11 * TILE, w: 3 * TILE, h: 2 * TILE, type: 'bed', occupied: false, color: '#556655' },
      { x: 8 * TILE, y: 9 * TILE, w: TILE * 1.5, h: 4 * TILE, type: 'wardrobe', occupied: false, color: '#445544' },
      { x: 12 * TILE, y: 12 * TILE, w: TILE, h: TILE, type: 'bucket', occupied: false, color: '#778877' },
      { x: 20 * TILE, y: 11 * TILE, w: 3 * TILE, h: 2 * TILE, type: 'bed', occupied: false, color: '#556655' },
      { x: 24 * TILE, y: 11 * TILE, w: 3 * TILE, h: 2 * TILE, type: 'bed', occupied: false, color: '#556655' },
      { x: 23 * TILE, y: 10 * TILE, w: TILE * 1.5, h: 3 * TILE, type: 'wardrobe', occupied: false, color: '#445544' },
      { x: 29 * TILE, y: 12 * TILE, w: TILE, h: TILE, type: 'bucket', occupied: false, color: '#778877' },
      { x: 33 * TILE, y: 12 * TILE, w: 2 * TILE, h: TILE, type: 'box', occupied: false, color: '#887755' },
      { x: 37 * TILE, y: 11 * TILE, w: 2 * TILE, h: 2 * TILE, type: 'dumpster', occupied: false, color: '#446644' },
      { x: 40 * TILE, y: 11 * TILE, w: TILE * 1.5, h: 2 * TILE, type: 'box', occupied: false, color: '#776655' },
      { x: 44 * TILE, y: 12 * TILE, w: TILE, h: TILE, type: 'bucket', occupied: false, color: '#778877' },
      { x: 48 * TILE, y: 10 * TILE, w: 2 * TILE, h: 3 * TILE, type: 'wardrobe', occupied: false, color: '#445544' },
      { x: 53 * TILE, y: 11 * TILE, w: 3 * TILE, h: 2 * TILE, type: 'bed', occupied: false, color: '#556655' },
      { x: 58 * TILE, y: 9 * TILE, w: 2 * TILE, h: 4 * TILE, type: 'dumpster', occupied: false, color: '#446644' },
    ];

    this.objects = [
      { x: 6 * TILE, y: 10 * TILE - 14, w: 10, h: 14, type: 'vase', falling: false, vy: 0, grounded: true, noiseRadius: 130, broken: false, breakable: true, color: COL.vase },
      { x: 21 * TILE, y: 10 * TILE - 18, w: 10, h: 16, type: 'lamp', falling: false, vy: 0, grounded: true, noiseRadius: 110, broken: false, breakable: true, color: COL.lamp },
      { x: 30 * TILE, y: 11 * TILE - 10, w: 8, h: 10, type: 'cup', falling: false, vy: 0, grounded: true, noiseRadius: 90, broken: false, breakable: true, color: COL.cup },
      { x: 38 * TILE, y: 10 * TILE - 12, w: 12, h: 12, type: 'plant', falling: false, vy: 0, grounded: true, noiseRadius: 110, broken: false, breakable: true, color: COL.plant },
      { x: 53 * TILE, y: 10 * TILE - 14, w: 10, h: 14, type: 'vase', falling: false, vy: 0, grounded: true, noiseRadius: 130, broken: false, breakable: true, color: COL.vase },
    ];

    this.collectibles = [
      { x: 6 * TILE, y: 6 * TILE, type: 'fish', collected: false, animTimer: 0 },
      { x: 15 * TILE, y: 8 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      { x: 21 * TILE, y: 3 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      { x: 25 * TILE, y: 6 * TILE, type: 'food', collected: false, animTimer: Math.random() * 100 },
      { x: 31 * TILE, y: 4 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      { x: 38 * TILE, y: 6 * TILE, type: 'yarn', collected: false, animTimer: Math.random() * 100 },
      { x: 44 * TILE, y: 10 * TILE, type: 'food', collected: false, animTimer: Math.random() * 100 },
      { x: 49 * TILE, y: 8 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      { x: 54 * TILE, y: 9 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      { x: 59 * TILE, y: 4 * TILE, type: 'key', collected: false, animTimer: Math.random() * 100 },
    ];

    this.exit = { x: 61 * TILE, y: 2 * TILE, w: TILE * 1.5, h: 3 * TILE, locked: true };

    this.enemies = [
      {
        x: 10 * TILE, y: 13 * TILE - 40, w: 18, h: 38,
        patrolA: 4 * TILE, patrolB: 18 * TILE,
        facing: 1, state: 'normal', stateTimer: 0, investigateX: 0,
        speed: 0.9, visionRange: 190, visionAngle: Math.PI / 2,
      },
      {
        x: 24 * TILE, y: 13 * TILE - 40, w: 18, h: 38,
        patrolA: 18 * TILE, patrolB: 35 * TILE,
        facing: -1, state: 'normal', stateTimer: 0, investigateX: 0,
        speed: 1.0, visionRange: 210, visionAngle: Math.PI / 2,
      },
      {
        x: 38 * TILE, y: 13 * TILE - 40, w: 18, h: 38,
        patrolA: 35 * TILE, patrolB: 48 * TILE,
        facing: 1, state: 'normal', stateTimer: 0, investigateX: 0,
        speed: 1.1, visionRange: 180, visionAngle: Math.PI / 2.5,
      },
      {
        x: 52 * TILE, y: 13 * TILE - 40, w: 18, h: 38,
        patrolA: 46 * TILE, patrolB: 62 * TILE,
        facing: -1, state: 'normal', stateTimer: 0, investigateX: 0,
        speed: 1.2, visionRange: 220, visionAngle: Math.PI / 2,
      },
    ];
  }

  initZombie3() {
    this.levelWidth = 75 * TILE;

    this.player = {
      x: 3 * TILE, y: 11 * TILE,
      vx: 0, vy: 0, w: CAT_W, h: CAT_H,
      grounded: false, crouching: false,
      facing: 1, hidden: false,
      lives: 3, invincible: 0,
      animFrame: 0, animTimer: 0,
      interactCooldown: 0,
    };

    this.platforms = [
      { x: 0, y: 13 * TILE, w: 75 * TILE, h: 2 * TILE },
      { x: 0, y: 0, w: TILE, h: 15 * TILE },
      { x: 74 * TILE, y: 0, w: TILE, h: 15 * TILE },
      { x: 0, y: 0, w: 75 * TILE, h: TILE },
      // Metrô abandonado - Plataforma
      { x: 4 * TILE, y: 10 * TILE, w: 6 * TILE, h: TILE },
      { x: 5 * TILE, y: 7 * TILE, w: 4 * TILE, h: TILE / 2 },
      // Túnel 1
      { x: 12 * TILE, y: 11 * TILE, w: 4 * TILE, h: TILE / 2 },
      { x: 14 * TILE, y: 8 * TILE, w: 2 * TILE, h: TILE / 2 },
      // Estação 2
      { x: 18 * TILE, y: 10 * TILE, w: 7 * TILE, h: TILE },
      { x: 19 * TILE, y: 7 * TILE, w: 5 * TILE, h: TILE / 2 },
      { x: 20 * TILE, y: 4 * TILE, w: 3 * TILE, h: TILE / 2 },
      // Passarela
      { x: 27 * TILE, y: 6 * TILE, w: 6 * TILE, h: TILE / 4 },
      // Depósito
      { x: 34 * TILE, y: 10 * TILE, w: 6 * TILE, h: TILE },
      { x: 35 * TILE, y: 7 * TILE, w: 4 * TILE, h: TILE / 2 },
      { x: 36 * TILE, y: 4 * TILE, w: 2 * TILE, h: TILE / 2 },
      // Esgoto
      { x: 42 * TILE, y: 11 * TILE, w: 5 * TILE, h: TILE / 2 },
      { x: 43 * TILE, y: 8 * TILE, w: 3 * TILE, h: TILE / 2 },
      // Sala do gerador
      { x: 49 * TILE, y: 10 * TILE, w: 6 * TILE, h: TILE },
      { x: 50 * TILE, y: 7 * TILE, w: 4 * TILE, h: TILE / 2 },
      // Escada final
      { x: 57 * TILE, y: 11 * TILE, w: 3 * TILE, h: TILE / 2 },
      { x: 58 * TILE, y: 8 * TILE, w: 2 * TILE, h: TILE / 2 },
      { x: 61 * TILE, y: 10 * TILE, w: 4 * TILE, h: TILE },
      { x: 62 * TILE, y: 6 * TILE, w: 3 * TILE, h: TILE / 2 },
      // Superfície
      { x: 66 * TILE, y: 9 * TILE, w: 4 * TILE, h: TILE / 2 },
      { x: 68 * TILE, y: 5 * TILE, w: 3 * TILE, h: TILE / 2 },
    ];

    this.hidingSpots = [
      { x: 5 * TILE, y: 11 * TILE, w: 2 * TILE, h: 2 * TILE, type: 'box', occupied: false, color: '#776655' },
      { x: 9 * TILE, y: 11 * TILE, w: TILE, h: 2 * TILE, type: 'bucket', occupied: false, color: '#667766' },
      { x: 13 * TILE, y: 12 * TILE, w: 2 * TILE, h: TILE, type: 'dumpster', occupied: false, color: '#446644' },
      { x: 19 * TILE, y: 11 * TILE, w: 3 * TILE, h: 2 * TILE, type: 'bed', occupied: false, color: '#556655' },
      { x: 23 * TILE, y: 10 * TILE, w: TILE * 1.5, h: 3 * TILE, type: 'wardrobe', occupied: false, color: '#445544' },
      { x: 29 * TILE, y: 7 * TILE, w: 2 * TILE, h: 6 * TILE, type: 'wardrobe', occupied: false, color: '#554433' },
      { x: 32 * TILE, y: 12 * TILE, w: TILE, h: TILE, type: 'bucket', occupied: false, color: '#667766' },
      { x: 35 * TILE, y: 11 * TILE, w: 2 * TILE, h: 2 * TILE, type: 'dumpster', occupied: false, color: '#446644' },
      { x: 38 * TILE, y: 11 * TILE, w: 2 * TILE, h: 2 * TILE, type: 'box', occupied: false, color: '#776655' },
      { x: 43 * TILE, y: 12 * TILE, w: 2 * TILE, h: TILE, type: 'dumpster', occupied: false, color: '#446644' },
      { x: 46 * TILE, y: 12 * TILE, w: TILE, h: TILE, type: 'bucket', occupied: false, color: '#667766' },
      { x: 50 * TILE, y: 11 * TILE, w: 3 * TILE, h: 2 * TILE, type: 'bed', occupied: false, color: '#556655' },
      { x: 54 * TILE, y: 10 * TILE, w: TILE * 1.5, h: 3 * TILE, type: 'wardrobe', occupied: false, color: '#445544' },
      { x: 58 * TILE, y: 12 * TILE, w: 2 * TILE, h: TILE, type: 'box', occupied: false, color: '#776655' },
      { x: 62 * TILE, y: 11 * TILE, w: 2 * TILE, h: 2 * TILE, type: 'dumpster', occupied: false, color: '#446644' },
      { x: 67 * TILE, y: 10 * TILE, w: 2 * TILE, h: 3 * TILE, type: 'wardrobe', occupied: false, color: '#554433' },
    ];

    this.objects = [
      { x: 6 * TILE, y: 10 * TILE - 14, w: 10, h: 14, type: 'vase', falling: false, vy: 0, grounded: true, noiseRadius: 140, broken: false, breakable: true, color: COL.vase },
      { x: 20 * TILE, y: 10 * TILE - 18, w: 10, h: 16, type: 'lamp', falling: false, vy: 0, grounded: true, noiseRadius: 120, broken: false, breakable: true, color: COL.lamp },
      { x: 35 * TILE, y: 10 * TILE - 10, w: 8, h: 10, type: 'cup', falling: false, vy: 0, grounded: true, noiseRadius: 100, broken: false, breakable: true, color: COL.cup },
      { x: 37 * TILE, y: 10 * TILE - 12, w: 12, h: 12, type: 'plant', falling: false, vy: 0, grounded: true, noiseRadius: 120, broken: false, breakable: true, color: COL.plant },
      { x: 50 * TILE, y: 10 * TILE - 14, w: 10, h: 14, type: 'vase', falling: false, vy: 0, grounded: true, noiseRadius: 140, broken: false, breakable: true, color: COL.vase },
      { x: 62 * TILE, y: 10 * TILE - 18, w: 10, h: 16, type: 'lamp', falling: false, vy: 0, grounded: true, noiseRadius: 120, broken: false, breakable: true, color: COL.lamp },
    ];

    this.collectibles = [
      { x: 7 * TILE, y: 6 * TILE, type: 'fish', collected: false, animTimer: 0 },
      { x: 14 * TILE, y: 7 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      { x: 21 * TILE, y: 3 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      { x: 28 * TILE, y: 5 * TILE, type: 'food', collected: false, animTimer: Math.random() * 100 },
      { x: 36 * TILE, y: 3 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      { x: 43 * TILE, y: 7 * TILE, type: 'yarn', collected: false, animTimer: Math.random() * 100 },
      { x: 51 * TILE, y: 6 * TILE, type: 'food', collected: false, animTimer: Math.random() * 100 },
      { x: 57 * TILE, y: 10 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      { x: 63 * TILE, y: 5 * TILE, type: 'fish', collected: false, animTimer: Math.random() * 100 },
      { x: 69 * TILE, y: 4 * TILE, type: 'key', collected: false, animTimer: Math.random() * 100 },
      { x: 66 * TILE, y: 8 * TILE, type: 'food', collected: false, animTimer: Math.random() * 100 },
    ];

    this.exit = { x: 71 * TILE, y: 2 * TILE, w: TILE * 1.5, h: 3 * TILE, locked: true };

    this.enemies = [
      {
        x: 8 * TILE, y: 13 * TILE - 40, w: 18, h: 38,
        patrolA: 3 * TILE, patrolB: 16 * TILE,
        facing: 1, state: 'normal', stateTimer: 0, investigateX: 0,
        speed: 1.0, visionRange: 200, visionAngle: Math.PI / 2,
      },
      {
        x: 22 * TILE, y: 13 * TILE - 40, w: 18, h: 38,
        patrolA: 17 * TILE, patrolB: 33 * TILE,
        facing: -1, state: 'normal', stateTimer: 0, investigateX: 0,
        speed: 1.2, visionRange: 220, visionAngle: Math.PI / 2,
      },
      {
        x: 38 * TILE, y: 13 * TILE - 40, w: 18, h: 38,
        patrolA: 33 * TILE, patrolB: 48 * TILE,
        facing: 1, state: 'normal', stateTimer: 0, investigateX: 0,
        speed: 1.3, visionRange: 200, visionAngle: Math.PI / 2.5,
      },
      {
        x: 52 * TILE, y: 13 * TILE - 40, w: 18, h: 38,
        patrolA: 48 * TILE, patrolB: 60 * TILE,
        facing: -1, state: 'normal', stateTimer: 0, investigateX: 0,
        speed: 1.4, visionRange: 230, visionAngle: Math.PI / 2,
      },
      {
        x: 65 * TILE, y: 13 * TILE - 40, w: 18, h: 38,
        patrolA: 58 * TILE, patrolB: 72 * TILE,
        facing: 1, state: 'normal', stateTimer: 0, investigateX: 0,
        speed: 1.5, visionRange: 250, visionAngle: Math.PI / 2,
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
      this.sfx.jump();
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

    // Hide timer
    if (this.hideTimer > 0) this.hideTimer -= dt;

    // Zombie mode: hide in spots with E key
    if (this.gameMode === 'zombie' && interact && this.hideTimer <= 0) {
      if (this.playerInSpot) {
        // Exit hiding spot
        this.playerInSpot.occupied = false;
        this.playerInSpot = null;
        p.hidden = false;
        this.hideTimer = 20;
      } else {
        // Try to enter a hiding spot
        for (const spot of this.hidingSpots) {
          const spotCenter = { x: spot.x + spot.w / 2, y: spot.y + spot.h / 2 };
          const playerCenter = { x: p.x + p.w / 2, y: p.y + p.h / 2 };
          const dist = Math.sqrt((spotCenter.x - playerCenter.x) ** 2 + (spotCenter.y - playerCenter.y) ** 2);
          if (dist < 50) {
            this.playerInSpot = spot;
            spot.occupied = true;
            p.hidden = true;
            p.x = spot.x + spot.w / 2 - p.w / 2;
            p.y = spot.y + spot.h - p.h;
            p.vx = 0;
            p.vy = 0;
            this.hideTimer = 20;
            this.sfx.meow();
            break;
          }
        }
      }
    }

    // If hiding in a spot, lock movement
    if (this.playerInSpot) {
      p.vx = 0;
      p.vy = 0;
      p.hidden = true;
      p.x = this.playerInSpot.x + this.playerInSpot.w / 2 - p.w / 2;
      p.y = this.playerInSpot.y + this.playerInSpot.h - p.h;
      return; // Skip all other movement
    }

    // Check hiding (normal mode)
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
                this.sfx.breakObject();
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
          this.sfx.suspicious();
        }
      }

      // Vision check
      if (this.canEnemySeePlayer(enemy)) {
        if (enemy.state !== 'alert') {
          enemy.state = 'alert';
          enemy.stateTimer = 180;
          this.stealthMeter = Math.min(100, this.stealthMeter + 30);
          this.sfx.alert();
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
    this.sfx.hit();
    if (p.lives <= 0) this.sfx.gameOver();
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
        this.sfx.collect(c.type);
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
      this.sfx.win();
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

    if (this.gameState === 'charSelect') {
      this.renderCharSelect();
      ctx.restore();
      return;
    }

    if (this.gameState === 'modeSelect') {
      this.renderModeSelect();
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
    this.renderHidingSpots();
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
      this.gameState = 'charSelect';
    }
  }

  renderCharSelect() {
    const ctx = this.ctx;
    ctx.fillStyle = COL.bg;
    ctx.fillRect(0, 0, this.width, this.height);

    // Title
    ctx.fillStyle = '#ddaa33';
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ESCOLHA SEU GATO', this.width / 2, 50);

    const cols = 3;
    const cardW = 200;
    const cardH = 160;
    const gapX = 30;
    const gapY = 20;
    const startX = (this.width - (cols * cardW + (cols - 1) * gapX)) / 2;
    const startY = 80;

    for (let i = 0; i < CAT_SKINS.length; i++) {
      const skin = CAT_SKINS[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = startX + col * (cardW + gapX);
      const cy = startY + row * (cardH + gapY);

      const selected = i === this.selectedCat;

      // Card background
      ctx.fillStyle = selected ? 'rgba(221,170,51,0.2)' : 'rgba(255,255,255,0.05)';
      ctx.fillRect(cx, cy, cardW, cardH);

      // Border
      ctx.strokeStyle = selected ? '#ddaa33' : '#444444';
      ctx.lineWidth = selected ? 3 : 1;
      ctx.strokeRect(cx, cy, cardW, cardH);

      // Draw cat preview with this skin's colors
      const prevCat = COL.cat;
      const prevLight = COL.catLight;
      const prevDark = COL.catDark;
      const prevEye = COL.catEye;
      const prevNose = COL.catNose;
      COL.cat = skin.body;
      COL.catLight = skin.bodyLight;
      COL.catDark = skin.bodyDark;
      COL.catEye = skin.eye;
      COL.catNose = skin.nose;

      const catX = cx + cardW / 2 - 11;
      const catY = cy + 30;
      this.drawCatSprite(ctx, catX, catY, 1, false, Math.floor(this.frameCount / 10) % 4, false);

      COL.cat = prevCat;
      COL.catLight = prevLight;
      COL.catDark = prevDark;
      COL.catEye = prevEye;
      COL.catNose = prevNose;

      // Name
      ctx.fillStyle = selected ? '#ddaa33' : '#aaaaaa';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(skin.name, cx + cardW / 2, cy + 80);

      // Description
      ctx.fillStyle = '#777777';
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.fillText(skin.description, cx + cardW / 2, cy + 100);

      // Number key hint
      ctx.fillStyle = selected ? '#ddaa33' : '#555555';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText(`[${i + 1}]`, cx + cardW / 2, cy + cardH - 15);
    }

    // Instructions
    if (Math.sin(this.frameCount * 0.05) > 0) {
      ctx.fillStyle = '#ddaa33';
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('← → Escolher  |  ESPAÇO Confirmar', this.width / 2, this.height - 30);
    }

    this.frameCount++;

    // Navigation
    if (this.keysJustPressed.has('ArrowRight') || this.keysJustPressed.has('KeyD')) {
      this.selectedCat = (this.selectedCat + 1) % CAT_SKINS.length;
    }
    if (this.keysJustPressed.has('ArrowLeft') || this.keysJustPressed.has('KeyA')) {
      this.selectedCat = (this.selectedCat - 1 + CAT_SKINS.length) % CAT_SKINS.length;
    }
    if (this.keysJustPressed.has('ArrowDown') || this.keysJustPressed.has('KeyS')) {
      this.selectedCat = Math.min(CAT_SKINS.length - 1, this.selectedCat + cols);
    }
    if (this.keysJustPressed.has('ArrowUp') || this.keysJustPressed.has('KeyW')) {
      this.selectedCat = Math.max(0, this.selectedCat - cols);
    }
    // Number keys
    for (let i = 0; i < CAT_SKINS.length; i++) {
      if (this.keysJustPressed.has(`Digit${i + 1}`)) {
        this.selectedCat = i;
      }
    }

    if (this.keysJustPressed.has('Space') || this.keysJustPressed.has('Enter')) {
      this.applyCatSkin();
      this.startGame();
    }
  }

  applyCatSkin() {
    const skin = CAT_SKINS[this.selectedCat];
    COL.cat = skin.body;
    COL.catLight = skin.bodyLight;
    COL.catDark = skin.bodyDark;
    COL.catEye = skin.eye;
    COL.catNose = skin.nose;
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
    ctx.fillText(`FASE ${this.currentLevel} | CAOS: ${this.chaos}`, this.width / 2, 14);

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
    ctx.fillText(`FASE ${this.currentLevel} COMPLETA!`, this.width / 2, this.height / 2 - 40);

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

    const hasNextLevel = this.currentLevel < this.maxLevel;

    if (Math.sin(this.frameCount * 0.05) > 0) {
      ctx.fillStyle = '#ddaa33';
      ctx.font = '10px "Press Start 2P", monospace';
      if (hasNextLevel) {
        ctx.fillText('ESPAÇO para a próxima fase', this.width / 2, this.height / 2 + 100);
      } else {
        ctx.fillText('Você completou o jogo!', this.width / 2, this.height / 2 + 100);
        ctx.fillStyle = '#888888';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText('ESPAÇO para jogar de novo', this.width / 2, this.height / 2 + 120);
      }
    }

    if (this.keysJustPressed.has('Space')) {
      if (hasNextLevel) {
        this.currentLevel++;
        this.gameState = 'playing';
        this.initLevel();
      } else {
        this.currentLevel = 1;
        this.gameState = 'playing';
        this.initLevel();
      }
    }
  }

  calculateStars(): number {
    let stars = 1;
    if (this.chaos >= 30) stars++;
    if (!this.seen) stars++;
    return stars;
  }
}
