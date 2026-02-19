import * as THREE from 'three';
import { AABB, Disposable, InputSnapshot, PlayerState, Updatable } from './types';
import {
    PLAYER_SPEED, PLAYER_SPRINT_MULT, PLAYER_HEIGHT,
    MOUSE_SENSITIVITY, PITCH_LIMIT,
    FOV_NORMAL, FOV_SPRINT, FOV_LERP,
} from './constants';
import { MAZE_COLS, MAZE_ROWS, CELL_SIZE } from './constants';

//  Player

export class Player implements Updatable, Disposable {
    readonly camera: THREE.PerspectiveCamera;

    state: PlayerState = {
        yaw: 0,
        pitch: 0,
        isMoving: false,
        isSprinting: false,
        fov: FOV_NORMAL,
    };

    private keys: Record<string, boolean> = {};
    private wallAABBs: AABB[];
    private radius = 0.35;

    constructor(aspect: number, walls: AABB[]) {
        this.camera = new THREE.PerspectiveCamera(FOV_NORMAL, aspect, 0.05, 100);


        this.camera.position.set(0, PLAYER_HEIGHT, 0);

        this.wallAABBs = walls;


        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);


        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('pointerlockchange', this.onPointerLock);
    }

    //  Input handlers

    private onKeyDown = (e: KeyboardEvent) => { this.keys[e.code] = true; };
    private onKeyUp = (e: KeyboardEvent) => { this.keys[e.code] = false; };

    private onMouseMove = (e: MouseEvent) => {

        if (document.pointerLockElement == null) return;

        this.state.yaw -= e.movementX * MOUSE_SENSITIVITY;
        this.state.pitch -= e.movementY * MOUSE_SENSITIVITY;
        this.state.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this.state.pitch));
    };

    private onPointerLock = () => {
    };

    get position(): THREE.Vector3 { return this.camera.position; }

    getInput(): InputSnapshot {
        return {
            forward: !!(this.keys['KeyW'] || this.keys['ArrowUp']),
            back: !!(this.keys['KeyS'] || this.keys['ArrowDown']),
            left: !!(this.keys['KeyA'] || this.keys['ArrowLeft']),
            right: !!(this.keys['KeyD'] || this.keys['ArrowRight']),
            sprint: !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']),
        };
    }

    //  Update
    update(dt: number): void {
        const inp = this.getInput();
        this.state.isSprinting = inp.sprint;

        // Apply camera rotation (yaw = Y axis, pitch = local X axis)
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.state.yaw;
        this.camera.rotation.x = this.state.pitch;

        // Build movement direction in XZ from yaw only
        const speed = PLAYER_SPEED * (this.state.isSprinting ? PLAYER_SPRINT_MULT : 1);
        const moveVec = new THREE.Vector3(0, 0, 0);

        if (inp.forward) moveVec.z -= 1;
        if (inp.back) moveVec.z += 1;
        if (inp.left) moveVec.x -= 1;
        if (inp.right) moveVec.x += 1;

        this.state.isMoving = moveVec.lengthSq() > 0;

        if (this.state.isMoving) {
            moveVec.normalize();


            const euler = new THREE.Euler(0, this.state.yaw, 0, 'YXZ');
            moveVec.applyEuler(euler);


            const pos = this.camera.position;
            const dx = moveVec.x * speed * dt;
            const dz = moveVec.z * speed * dt;

            if (!this.collides(pos.x + dx, pos.z)) pos.x += dx;
            if (!this.collides(pos.x, pos.z + dz)) pos.z += dz;
        }

        // FOV lerp
        const targetFov = this.state.isSprinting ? FOV_SPRINT : FOV_NORMAL;
        this.camera.fov += (targetFov - this.camera.fov) * FOV_LERP * dt;
        this.camera.updateProjectionMatrix();
    }

    //  AABB Collision
    private collides(x: number, z: number): boolean {
        const r = this.radius;
        for (const box of this.wallAABBs) {
            if (
                x + r > box.minX && x - r < box.maxX &&
                z + r > box.minZ && z - r < box.maxZ
            ) {
                return true;
            }
        }

        // also clamp to maze boundary
        const mazeW = MAZE_COLS * CELL_SIZE;
        const mazeH = MAZE_ROWS * CELL_SIZE;
        if (x < -CELL_SIZE / 2 + r || x > mazeW - CELL_SIZE / 2 - r) return true;
        if (z < -CELL_SIZE / 2 + r || z > mazeH - CELL_SIZE / 2 - r) return true;

        return false;
    }

    onResize(aspect: number): void {
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
    }

    dispose(): void {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('pointerlockchange', this.onPointerLock);
    }
}
