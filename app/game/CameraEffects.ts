import * as THREE from 'three';

import {
    BOB_AMP_X, BOB_AMP_Y, BOB_FREQ_SPRINT, BOB_FREQ_WALK,
    SHAKE_DECAY, SHAKE_MAX_ANGLE,
    PLAYER_HEIGHT,
} from './constants';

// seeded random
function rng(seed: number): number {
    const x = Math.sin(seed) * 43758.5453;
    return x - Math.floor(x);
}

export class CameraEffects {
    private bobT = 0;

    // trauma: 0 = calm, 1 = max shake
    private trauma = 0;
    private shakeSeed = 0;
    private shakeTime = 0;

    // base Y offset so bob stays near eye height
    private baseY = PLAYER_HEIGHT;

    constructor(private camera: THREE.PerspectiveCamera) { }


    addTrauma(amount: number): void {
        this.trauma = Math.min(1, this.trauma + amount);
        this.shakeSeed = Math.random() * 9999;
    }

    update(dt: number, isMoving: boolean, isSprinting: boolean): void {
        // head-bob
        if (isMoving) {
            const freq = isSprinting ? BOB_FREQ_SPRINT : BOB_FREQ_WALK;
            this.bobT += dt * freq;
        } else {

            this.bobT *= 0.9;
        }

        const bobY = Math.sin(this.bobT) * BOB_AMP_Y;
        const bobX = Math.cos(this.bobT * 0.5) * BOB_AMP_X;

        this.camera.position.y = this.baseY + bobY;


        const currentRoll = this.camera.rotation.z;
        const targetRoll = isMoving ? bobX * 0.4 : 0;
        this.camera.rotation.z += (targetRoll - currentRoll) * 8 * dt;

        // trauma shake
        if (this.trauma > 0) {
            this.shakeTime += dt * 60;
            this.trauma = Math.max(0, this.trauma - SHAKE_DECAY * dt);

            const sq = this.trauma * this.trauma;
            const angle = sq * SHAKE_MAX_ANGLE;

            const rx = (rng(this.shakeTime) * 2 - 1) * angle;
            const ry = (rng(this.shakeTime + 100) * 2 - 1) * angle;

            
            this.camera.rotation.x += rx;
            this.camera.rotation.y += ry;
        }
    }


    setBaseY(y: number): void { this.baseY = y; }
}
