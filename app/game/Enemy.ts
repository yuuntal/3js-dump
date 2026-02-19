import * as THREE from 'three';
import { MazeGrid } from './types';
import { Disposable } from './types';
import {
    ENEMY_SPEED, ENEMY_TRIGGER_DIST, ENEMY_WARN_DIST,
    ENEMY_WAYPOINT_DIST, ENEMY_RESPAWN_DELAY,
    CELL_SIZE, WALL_HEIGHT, PLAYER_HEIGHT,
} from './constants';
import { CameraEffects } from './CameraEffects';
import { cellCenter } from './MazeGenerator';

// Enemy

export class Enemy implements Disposable {
    readonly mesh: THREE.Mesh;

    private active = true;
    private waypoint = new THREE.Vector3();
    private triggered = false;
    private respawnTimer = 0;


    onJumpscare: (() => void) | null = null;
    onNear: ((dist: number) => void) | null = null;

    constructor(
        private scene: THREE.Scene,
        private grid: MazeGrid,
        private effects: CameraEffects,
    ) {

        const geo = new THREE.CapsuleGeometry(0.3, 1.4, 4, 8);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x000000,
            roughness: 1.0,
            metalness: 0.0,

            transparent: true,
            opacity: 0.8,
        });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.castShadow = true;


        this.teleportToRandom(0, 0);
        scene.add(this.mesh);


        this.pickWaypoint();
    }

    // Waypoint

    private randomCell(): [number, number] {
        const col = Math.floor(Math.random() * this.grid[0].length);
        const row = Math.floor(Math.random() * this.grid.length);
        return [col, row];
    }

    private teleportToRandom(avoidCol: number, avoidRow: number): void {
        let col: number, row: number;
    
        do {
            [col, row] = this.randomCell();
        } while (Math.abs(col - avoidCol) + Math.abs(row - avoidRow) < 6);

        const centre = cellCenter(col, row);
        this.mesh.position.set(centre.x, PLAYER_HEIGHT - 0.1, centre.y);
    }

    private pickWaypoint(): void {
        const [col, row] = this.randomCell();
        const centre = cellCenter(col, row);
        this.waypoint.set(centre.x, this.mesh.position.y, centre.y);
    }

    update(dt: number, playerPos: THREE.Vector3, playerHidden: boolean): void {
        if (!this.active) {
            this.respawnTimer -= dt * 1000;
            if (this.respawnTimer <= 0) {
                this.active = true;
                this.triggered = false;
                this.mesh.visible = true;
                const pc = cellCenter(
                    Math.round(playerPos.x / CELL_SIZE),
                    Math.round(playerPos.z / CELL_SIZE),
                );
                const avoidCol = Math.round(pc.x / CELL_SIZE);
                const avoidRow = Math.round(pc.y / CELL_SIZE);
                this.teleportToRandom(avoidCol, avoidRow);
                this.pickWaypoint();
            }
            return;
        }

        const dist = this.mesh.position.distanceTo(playerPos);


        if (playerHidden) {
            if (dist < ENEMY_WARN_DIST) {

                const away = new THREE.Vector3()
                    .subVectors(this.mesh.position, playerPos);
                away.y = 0;
                away.normalize().multiplyScalar(ENEMY_SPEED * 0.3 * dt);
                this.mesh.position.add(away);
            }

            return;
        }

        // detected
        if (dist < ENEMY_WARN_DIST) {
            const toPlayer = new THREE.Vector3()
                .subVectors(playerPos, this.mesh.position);
            toPlayer.y = 0;
            const chaseSpeed = ENEMY_SPEED * 1.3;
            toPlayer.normalize().multiplyScalar(chaseSpeed * dt);
            this.mesh.position.add(toPlayer);

            const angle = Math.atan2(toPlayer.x, toPlayer.z);
            this.mesh.rotation.y = angle;
        } else {
            // wander toward random waypoints
            const toWaypoint = new THREE.Vector3()
                .subVectors(this.waypoint, this.mesh.position);
            toWaypoint.y = 0;

            if (toWaypoint.length() < ENEMY_WAYPOINT_DIST) {
                this.pickWaypoint();
            } else {
                toWaypoint.normalize().multiplyScalar(ENEMY_SPEED * dt);
                this.mesh.position.add(toWaypoint);
                const angle = Math.atan2(toWaypoint.x, toWaypoint.z);
                this.mesh.rotation.y = angle;
            }
        }

        // proximity callback
        if (dist < ENEMY_WARN_DIST) {
            this.onNear?.(dist);
        }

        // jumpscare
        if (!this.triggered && dist < ENEMY_TRIGGER_DIST) {
            this.triggered = true;
            this.effects.addTrauma(1.0);
            this.onJumpscare?.();

            this.active = false;
            this.mesh.visible = false;
            this.respawnTimer = ENEMY_RESPAWN_DELAY;
        }
    }

    dispose(): void {
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        (this.mesh.material as THREE.Material).dispose();
    }
}
