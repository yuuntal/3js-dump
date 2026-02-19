// Maze 
export const MAZE_COLS = 17;
export const MAZE_ROWS = 17;
export const CELL_SIZE = 4;
export const WALL_HEIGHT = 3;
export const WALL_THICKNESS = 0.3;
export const EXIT_COL = MAZE_COLS - 1;
export const EXIT_ROW = MAZE_ROWS - 1;
export const EXIT_TRIGGER_DIST = 1.8;


export const PLAYER_SPEED = 5;
export const PLAYER_SPRINT_MULT = 1.8;
export const PLAYER_HEIGHT = 1.6;
export const MOUSE_SENSITIVITY = 0.002;
export const PITCH_LIMIT = Math.PI / 2 - 0.05;

// Camera FOV
export const FOV_NORMAL = 75;
export const FOV_SPRINT = 82;
export const FOV_LERP = 6;

// Head-bob
export const BOB_FREQ_WALK = 9;
export const BOB_FREQ_SPRINT = 13;
export const BOB_AMP_Y = 0.04;
export const BOB_AMP_X = 0.02;

// Trauma / camera shake
export const SHAKE_DECAY = 2.5;
export const SHAKE_MAX_ANGLE = 0.06;

// Flashlight
export const FL_INTENSITY = 8;
export const FL_ANGLE = Math.PI / 5;
export const FL_PENUMBRA = 0.35;
export const FL_DISTANCE = 25;
export const FL_DECAY = 1.2;
export const FL_FLICKER_RATE = 0.06;
export const FL_FLICKER_DUR = 80;

// Fog
export const FOG_COLOR = 0x050505;
export const FOG_DENSITY = 0.04;

// Lighting
export const AMBIENT_COLOR = 0x121218;
export const AMBIENT_INTENSITY = 0.8;
export const ACCENT_COLOR = 0x440022;
export const ACCENT_INTENSITY = 1.2;

// Enemy
export const ENEMY_SPEED = 2.2;
export const ENEMY_TRIGGER_DIST = 2.5;
export const ENEMY_WARN_DIST = 14;
export const ENEMY_WAYPOINT_DIST = 0.4;
export const ENEMY_RESPAWN_DELAY = 5000;
export const ENEMY_RETREAT_FACTOR = 3.0;

// Sanity
export const SANITY_MAX = 100;
export const SANITY_DRAIN_NEAR = 12;
export const SANITY_REGEN = 3;
export const SANITY_JUMPSCARE_HIT = 40;

// Post-processing
export const GRAIN_INTENSITY = 0.06;
export const VIGNETTE_BASE = 0.2;
export const VIGNETTE_MAX = 0.7;
