import * as THREE from 'three';
import { Disposable, Updatable } from './types';
import {
    FL_INTENSITY, FL_ANGLE, FL_PENUMBRA,
    FL_DISTANCE, FL_DECAY,
    FL_FLICKER_RATE, FL_FLICKER_DUR,
} from './constants';

export class Flashlight implements Updatable, Disposable {
    readonly light: THREE.SpotLight;
    readonly target: THREE.Object3D;

    private on = true;
    private flicking = false;
    private flickTimer = 0;

    // key binding
    private togglePending = false;
    private onKey = (e: KeyboardEvent) => {
        if (e.code === 'KeyF') this.togglePending = true;
    };

    constructor(camera: THREE.Camera, scene: THREE.Scene) {
        this.light = new THREE.SpotLight(
            0xfff4cc,
            FL_INTENSITY,
            FL_DISTANCE,
            FL_ANGLE,
            FL_PENUMBRA,
            FL_DECAY,
        );
        this.light.castShadow = true;
        this.light.shadow.mapSize.set(512, 512);
        this.light.shadow.camera.near = 0.1;
        this.light.shadow.camera.far = FL_DISTANCE;

        // light offset
        this.light.position.set(0.15, -0.15, -0.1);

        this.target = new THREE.Object3D();
        this.target.position.set(0, -0.3, -5);
        camera.add(this.target);
        camera.add(this.light);
        this.light.target = this.target;

        scene.add(camera);

        window.addEventListener('keydown', this.onKey);
    }

    toggle(): void {
        this.on = !this.on;
        if (!this.on) {
            this.light.intensity = 0;
            this.flicking = false;
        }
    }

    forceFlicker(): void {
        if (this.on) this.startFlicker();
    }

    private startFlicker(): void {
        this.flicking = true;
        this.flickTimer = FL_FLICKER_DUR;
        this.light.intensity = 0.05;
    }

    update(dt: number): void {
        if (this.togglePending) {
            this.toggle();
            this.togglePending = false;
        }

        if (!this.on) return;

        // flicker
        if (this.flicking) {
            this.flickTimer -= dt * 1000;
            if (this.flickTimer <= 0) {
                this.flicking = false;
                this.light.intensity = FL_INTENSITY;
            } else {

                this.light.intensity = Math.random() < 0.4
                    ? 0
                    : FL_INTENSITY * (0.3 + Math.random() * 0.7);
                    
            }
        } else {

            if (Math.random() < FL_FLICKER_RATE * dt) {
                this.startFlicker();
            } else {
                this.light.intensity = FL_INTENSITY;
            }
            
        }
    }

    get isOn(): boolean { return this.on; }

    dispose(): void {
        window.removeEventListener('keydown', this.onKey);
        this.light.dispose();
    }
}
