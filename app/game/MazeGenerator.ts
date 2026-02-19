import * as THREE from 'three';
import {
    Cell, MazeGrid,
    WALL_N, WALL_S, WALL_E, WALL_W,
    AABB,
} from './types';
import {
    MAZE_COLS, MAZE_ROWS,
    CELL_SIZE, WALL_HEIGHT, WALL_THICKNESS,
} from './constants';

function makeGrid(): MazeGrid {
    const grid: MazeGrid = [];
    for (let r = 0; r < MAZE_ROWS; r++) {
        grid[r] = [];
        for (let c = 0; c < MAZE_COLS; c++) {
            grid[r][c] = { col: c, row: r, walls: 0, visited: false };
        }
    }
    return grid;
}

function shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

type Dir = 'N' | 'S' | 'E' | 'W';
const OPPOSITE: Record<Dir, Dir> = { N: 'S', S: 'N', E: 'W', W: 'E' };
const DR: Record<Dir, number> = { N: -1, S: 1, E: 0, W: 0 };
const DC: Record<Dir, number> = { N: 0, S: 0, E: 1, W: -1 };
const FLAG: Record<Dir, number> = { N: WALL_N, S: WALL_S, E: WALL_E, W: WALL_W };

function carve(grid: MazeGrid, r: number, c: number): void {
    grid[r][c].visited = true;
    const dirs = shuffle<Dir>(['N', 'S', 'E', 'W']);
    for (const dir of dirs) {

        const nr = r + DR[dir];
        const nc = c + DC[dir];

        if (nr >= 0 && nr < MAZE_ROWS && nc >= 0 && nc < MAZE_COLS && !grid[nr][nc].visited) {

            grid[r][c].walls |= FLAG[dir];
            grid[nr][nc].walls |= FLAG[OPPOSITE[dir]];
            carve(grid, nr, nc);

        }
    }
}


interface Room {
    col: number;
    row: number;
    w: number;
    h: number;
}

function carveRooms(grid: MazeGrid): Room[] {
    const rooms: Room[] = [];
    const roomCount = 4 + Math.floor(Math.random() * 3); // 4–6 rooms

    for (let attempt = 0; attempt < roomCount * 8; attempt++) {
        if (rooms.length >= roomCount) break;

        const w = 2 + Math.floor(Math.random() * 3);
        const h = 2 + Math.floor(Math.random() * 3);
        const rc = 1 + Math.floor(Math.random() * (MAZE_COLS - w - 2));
        const rr = 1 + Math.floor(Math.random() * (MAZE_ROWS - h - 2));

        const overlaps = rooms.some(r =>
            rc - 1 < r.col + r.w && rc + w + 1 > r.col &&
            rr - 1 < r.row + r.h && rr + h + 1 > r.row
        );
        if (overlaps) continue;

        // create room
        for (let y = rr; y < rr + h; y++) {
            for (let x = rc; x < rc + w; x++) {
                const cell = grid[y][x];

                // open south wall
                if (y < rr + h - 1) {
                    cell.walls |= WALL_S;
                    grid[y + 1][x].walls |= WALL_N;
                }
                // open east wall
                if (x < rc + w - 1) {
                    cell.walls |= WALL_E;
                    grid[y][x + 1].walls |= WALL_W;
                }
            }
        }

        rooms.push({ col: rc, row: rr, w, h });
    }

    return rooms;
}
function removeDeadEnds(grid: MazeGrid, passes: number = 2): void {
    for (let pass = 0; pass < passes; pass++) {
        for (let r = 0; r < MAZE_ROWS; r++) {
            for (let c = 0; c < MAZE_COLS; c++) {
                const cell = grid[r][c];
                const open = [
                    cell.walls & WALL_N,
                    cell.walls & WALL_S,
                    cell.walls & WALL_E,
                    cell.walls & WALL_W,
                ].filter(Boolean).length;


                if (open === 1) {
                    const candidates: Dir[] = [];
                    if (!(cell.walls & WALL_N) && r > 0) candidates.push('N');
                    if (!(cell.walls & WALL_S) && r < MAZE_ROWS - 1) candidates.push('S');
                    if (!(cell.walls & WALL_E) && c < MAZE_COLS - 1) candidates.push('E');
                    if (!(cell.walls & WALL_W) && c > 0) candidates.push('W');

                    if (candidates.length > 0) {
                        const dir = candidates[Math.floor(Math.random() * candidates.length)];
                        cell.walls |= FLAG[dir];
                        const nr = r + DR[dir];
                        const nc = c + DC[dir];
                        grid[nr][nc].walls |= FLAG[OPPOSITE[dir]];
                    }
                }
            }
        }
    }
}

export function generateMaze(): MazeGrid {
    const grid = makeGrid();

    // 1: carve corridors via recursive backtracking
    carve(grid, 0, 0);

    // 2: carve rectangular rooms by knocking out walls
    carveRooms(grid);

    // 3: remove dead-ends for more loop-y layout
    removeDeadEnds(grid, 1);

    return grid;
}


import {
    createWallMaterial,
    createFloorMaterial,
    createCeilingMaterial,
} from './Textures';


export function cellCenter(col: number, row: number): THREE.Vector2 {
    return new THREE.Vector2(col * CELL_SIZE, row * CELL_SIZE);
}

export function buildWallAABBs(grid: MazeGrid): AABB[] {
    const aabbs: AABB[] = [];
    const hs = CELL_SIZE / 2;
    const hw = WALL_THICKNESS / 2;

    for (let r = 0; r < MAZE_ROWS; r++) {
        for (let c = 0; c < MAZE_COLS; c++) {
            const cell = grid[r][c];
            const cx = c * CELL_SIZE;
            const cz = r * CELL_SIZE;

            // North (z = cz - hs)
            if (!(cell.walls & WALL_N)) {
                aabbs.push({ minX: cx - hs, maxX: cx + hs, minZ: cz - hs - hw, maxZ: cz - hs + hw });
            }
            // South (z = cz + hs)
            if (!(cell.walls & WALL_S)) {
                aabbs.push({ minX: cx - hs, maxX: cx + hs, minZ: cz + hs - hw, maxZ: cz + hs + hw });
            }
            // East (x = cx + hs)
            if (!(cell.walls & WALL_E)) {
                aabbs.push({ minX: cx + hs - hw, maxX: cx + hs + hw, minZ: cz - hs, maxZ: cz + hs });
            }
            // West (x = cx - hs)
            if (!(cell.walls & WALL_W)) {
                aabbs.push({ minX: cx - hs - hw, maxX: cx - hs + hw, minZ: cz - hs, maxZ: cz + hs });
            }
        }
    }
    return aabbs;
}

export class MazeBuilder {
    private walls: THREE.Mesh[] = [];
    private floors: THREE.Mesh[] = [];
    private ceilings: THREE.Mesh[] = [];
    private lights: THREE.PointLight[] = [];

    private wallMat: THREE.MeshStandardMaterial;
    private floorMat: THREE.MeshStandardMaterial;
    private ceilingMat: THREE.MeshStandardMaterial;

    constructor(private scene: THREE.Scene) {
        this.wallMat = createWallMaterial();
        this.floorMat = createFloorMaterial();
        this.ceilingMat = createCeilingMaterial();
    }

    build(grid: MazeGrid): void {
        const hs = CELL_SIZE / 2;
        const hw = WALL_THICKNESS / 2;
        const hh = WALL_HEIGHT / 2;

        const hWallGeo = new THREE.BoxGeometry(CELL_SIZE + WALL_THICKNESS, WALL_HEIGHT, WALL_THICKNESS);
        const vWallGeo = new THREE.BoxGeometry(WALL_THICKNESS, WALL_HEIGHT, CELL_SIZE + WALL_THICKNESS);
        const tileGeo = new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE);

        for (let r = 0; r < MAZE_ROWS; r++) {
            for (let c = 0; c < MAZE_COLS; c++) {
                const cell = grid[r][c];
                const cx = c * CELL_SIZE;
                const cz = r * CELL_SIZE;

                //  floor tile 
                const floor = new THREE.Mesh(tileGeo, this.floorMat);
                floor.rotation.x = -Math.PI / 2;
                floor.position.set(cx, 0, cz);
                floor.receiveShadow = true;
                this.scene.add(floor);
                this.floors.push(floor);

                //  ceiling tile 
                const ceil = new THREE.Mesh(tileGeo, this.ceilingMat);
                ceil.rotation.x = Math.PI / 2;
                ceil.position.set(cx, WALL_HEIGHT, cz);
                ceil.receiveShadow = true;
                this.scene.add(ceil);
                this.ceilings.push(ceil);

                //  North 
                if (!(cell.walls & WALL_N)) {
                    const w = new THREE.Mesh(hWallGeo, this.wallMat);
                    w.position.set(cx, hh, cz - hs);
                    w.castShadow = w.receiveShadow = true;
                    this.scene.add(w);
                    this.walls.push(w);
                }
                // South 
                if (r === MAZE_ROWS - 1 && !(cell.walls & WALL_S)) {
                    const w = new THREE.Mesh(hWallGeo, this.wallMat);
                    w.position.set(cx, hh, cz + hs);
                    w.castShadow = w.receiveShadow = true;
                    this.scene.add(w);
                    this.walls.push(w);
                }
                //  West wall 
                if (!(cell.walls & WALL_W)) {
                    const w = new THREE.Mesh(vWallGeo, this.wallMat);
                    w.position.set(cx - hs, hh, cz);
                    w.castShadow = w.receiveShadow = true;
                    this.scene.add(w);
                    this.walls.push(w);
                }
                //  East wall
                if (c === MAZE_COLS - 1 && !(cell.walls & WALL_E)) {
                    const w = new THREE.Mesh(vWallGeo, this.wallMat);
                    w.position.set(cx + hs, hh, cz);
                    w.castShadow = w.receiveShadow = true;
                    this.scene.add(w);
                    this.walls.push(w);
                }

                //  corridor lights
                if ((r + c) % 3 === 0) {

                    const pl = new THREE.PointLight(0xffcc88, 1.5, 10, 1.5);
                    pl.position.set(cx, WALL_HEIGHT - 0.2, cz);
                    pl.castShadow = false;
                    this.scene.add(pl);
                    this.lights.push(pl);

                    // bulb mesh - ceiling
                    const bulbGeo = new THREE.SphereGeometry(0.08, 8, 8);
                    const bulbMat = new THREE.MeshStandardMaterial({
                        color: 0xffcc88,
                        emissive: 0xffdd99,
                        emissiveIntensity: 5.0,
                    });
                    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
                    bulb.position.set(cx, WALL_HEIGHT - 0.06, cz);
                    this.scene.add(bulb);
                }
            }
        }
    }

    dispose(): void {
        const all = [...this.walls, ...this.floors, ...this.ceilings];
        all.forEach(m => {
            this.scene.remove(m);
            m.geometry.dispose();
        });
        this.lights.forEach(l => {
            this.scene.remove(l);
            l.dispose();
        });
        this.wallMat.dispose();
        this.floorMat.dispose();
        this.ceilingMat.dispose();
    }
}
