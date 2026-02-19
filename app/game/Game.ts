import * as THREE from 'three';
import { generateMaze, MazeBuilder, buildWallAABBs } from './MazeGenerator';
import { Player } from './Player';
import { Flashlight } from './Flashlight';
import { CameraEffects } from './CameraEffects';
import { Enemy } from './Enemy';
import { AudioManager } from './AudioManager';
import { HUD } from './HUD';
import { GameScene } from './Scene';

import {
    SANITY_MAX, SANITY_DRAIN_NEAR, SANITY_REGEN, SANITY_JUMPSCARE_HIT,
    VIGNETTE_BASE, VIGNETTE_MAX,
    ENEMY_WARN_DIST,
    EXIT_COL, EXIT_ROW, CELL_SIZE, EXIT_TRIGGER_DIST,
} from './constants';

import { LoadingScreen } from './LoadingScreen';

// Game 

export class Game {
    private gameScene: GameScene;
    private loadingScreen: LoadingScreen;
    private player!: Player;
    private flashlight!: Flashlight;
    private camEffects!: CameraEffects;
    private enemy!: Enemy;
    private audio!: AudioManager;
    private hud!: HUD;
    private mazeBuilder!: MazeBuilder;

    private sanity = SANITY_MAX;
    private rafId = 0;
    private lastTime = 0;
    private running = false;
    private locked = false;
    private won = false;
    private elapsed = 0;
    private exitPos!: THREE.Vector3;

    constructor(container: HTMLElement) {
        // scene + renderer
        this.gameScene = new GameScene(container);

        // loading screen
        this.loadingScreen = new LoadingScreen(container);
    }

    async init(): Promise<void> {
        await this.loadLevel();
        this.start();
    }

    private async loadLevel(): Promise<void> {
        // 1. Show loading
        this.loadingScreen.setProgress(10);
        this.hud?.showHint(false); // hide hint during load if present

        // Wait for UI to render
        await new Promise(r => requestAnimationFrame(r));
        await new Promise(r => setTimeout(r, 50)); // small buffer

        const { scene, renderer } = this.gameScene;

        // 2. Heavy work
        this.loadingScreen.setProgress(30);

        // maze
        const grid = generateMaze();
        this.mazeBuilder = new MazeBuilder(scene);
        this.mazeBuilder.build(grid);
        const walls = buildWallAABBs(grid);

        this.loadingScreen.setProgress(50);
        await new Promise(r => setTimeout(r, 20));

        // player / camera
        const aspect = window.innerWidth / window.innerHeight;
        this.player = new Player(aspect, walls);
        scene.add(this.player.camera);

        // camera effects
        this.camEffects = new CameraEffects(this.player.camera);

        // flashlight 
        this.flashlight = new Flashlight(this.player.camera, scene);

        // enemy 
        this.enemy = new Enemy(scene, grid, this.camEffects);

        this.enemy.onJumpscare = () => {
            // sanity hit
            this.sanity = Math.max(0, this.sanity - SANITY_JUMPSCARE_HIT);
            this.hud.triggerRedFlash();
            this.hud.showMessage('IT SAW YOU', 1800);
            this.audio.playJumpscare();
            this.flashlight.forceFlicker();
        };

        this.enemy.onNear = (dist: number) => {
            const t = 1 - (dist / ENEMY_WARN_DIST); // 0 = far, 1 = very close
            this.audio.setDroneIntensity(t);
        };

        this.loadingScreen.setProgress(70);

        // audio
        this.audio = new AudioManager(this.player.camera);

        // HUD - reuse existing if available, or create
        if (!this.hud) {
            this.hud = new HUD(this.gameScene.renderer.domElement.parentElement!);
        }

        // Reset HUD state
        this.sanity = SANITY_MAX;
        this.won = false;
        this.elapsed = 0;
        this.hud.setSanity(this.sanity);
        this.hud.setFlashlightOn(true);
        this.hud.showHint(true); // show hint at start of level

        // Bind restart
        this.hud.onRestart = () => {
            this.restart();
        };

        // pointer lock - ensure listeners are bound (idempotent)
        renderer.domElement.removeEventListener('click', this.onCanvasClick);
        document.removeEventListener('pointerlockchange', this.onPointerLockChange);
        renderer.domElement.addEventListener('click', this.onCanvasClick);
        document.addEventListener('pointerlockchange', this.onPointerLockChange);

        // resize 
        window.removeEventListener('resize', this.onResize);
        window.addEventListener('resize', this.onResize);

        // exit position
        this.exitPos = new THREE.Vector3(
            EXIT_COL * CELL_SIZE, 0, EXIT_ROW * CELL_SIZE,
        );

        this.loadingScreen.setProgress(85);

        // Force shader compilation
        this.gameScene.renderer.compile(this.gameScene.scene, this.player.camera);

        // WARMUP RENDER to fix lag spike
        // Render from different angles to ensure all geometry/shadows are hot
        const originalRot = this.player.camera.rotation.clone();
        const angles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
        for (const ang of angles) {
            this.player.camera.rotation.y = ang;
            this.player.camera.updateMatrixWorld();
            this.gameScene.render(this.player.camera, 0);
        }
        this.player.camera.rotation.copy(originalRot);
        this.player.camera.updateMatrixWorld();

        this.loadingScreen.setProgress(100);
        await new Promise(r => setTimeout(r, 200));

        this.loadingScreen.hide();
    }

    private cleanupLevel(): void {
        this.running = false;
        if (this.rafId) cancelAnimationFrame(this.rafId);

        // Dispose level assets
        if (this.mazeBuilder) this.mazeBuilder.dispose();
        if (this.player) {
            this.gameScene.scene.remove(this.player.camera);
            this.player.dispose();
        }
        if (this.flashlight) this.flashlight.dispose();
        if (this.enemy) this.enemy.dispose();
        if (this.audio) this.audio.dispose();

        // We keep GameScene (renderer/composer) and HUD instance, but reset HUD state in loadLevel
    }

    async restart(): Promise<void> {
        this.cleanupLevel();
        if (document.pointerLockElement) document.exitPointerLock();
        await this.loadLevel();
        this.start();
    }

    // Event handlers

    private onCanvasClick = () => {
        if (!this.locked) {
            this.gameScene.renderer.domElement.requestPointerLock();
        }
    };

    private onPointerLockChange = () => {
        const prev = this.locked;
        this.locked = document.pointerLockElement === this.gameScene.renderer.domElement;
        this.hud.showHint(!this.locked);

        if (!prev && this.locked) {

            this.audio.init();
        }
    };

    private onResize = () => {
        const aspect = window.innerWidth / window.innerHeight;
        this.player.onResize(aspect);
        this.gameScene.onResize();
    };

    // Loop

    start(): void {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        this.rafId = requestAnimationFrame(this.loop);
    }

    private loop = (now: number) => {
        if (!this.running) return;

        const dt = Math.min((now - this.lastTime) / 1000, 0.05); // cap at 50 ms
        this.lastTime = now;

        this.update(dt, now * 0.001);
        this.gameScene.render(this.player.camera, now * 0.001);

        this.rafId = requestAnimationFrame(this.loop);
    };

    private update(dt: number, time: number): void {
        if (this.won) return;

        this.elapsed += dt;
        const { isMoving, isSprinting } = this.player.state;

        // player movement + look
        this.player.update(dt);

        // camera effects
        this.camEffects.update(dt, isMoving, isSprinting);

        // flashlight flicker
        this.flashlight.update(dt);
        this.hud.setFlashlightOn(this.flashlight.isOn);

        // enemy — escalates speed over time (+30% per minute)
        const speedMult = 1 + this.elapsed * 0.005;
        const playerHidden = !this.flashlight.isOn && !isMoving;
        this.enemy.update(dt * speedMult, this.player.position, playerHidden);

        // audio footsteps
        this.audio.update(dt, isMoving, isSprinting);

        // exit check
        const exitDist = this.player.position.distanceTo(this.exitPos);
        if (exitDist < EXIT_TRIGGER_DIST) {
            this.won = true;
            document.exitPointerLock();
            this.hud.showWin();
            return;
        }

        // sanity
        const enemyDist = this.enemy.mesh.position.distanceTo(this.player.position);
        const nearEnemy = enemyDist < ENEMY_WARN_DIST;

        if (nearEnemy) {
            this.sanity = Math.max(0, this.sanity - SANITY_DRAIN_NEAR * dt);
        } else {
            this.sanity = Math.min(SANITY_MAX, this.sanity + SANITY_REGEN * dt);
        }

        this.hud.setSanity(this.sanity);

        // proximity warn
        const proximityT = nearEnemy ? 1 - (enemyDist / ENEMY_WARN_DIST) : 0;
        this.hud.setProximity(proximityT);
        if (proximityT > 0.15) this.flashlight.forceFlicker();
        if (proximityT > 0.5) this.camEffects.addTrauma(0.05 * dt);

        // vignette strength increases as sanity drops
        const sanityT = 1 - this.sanity / SANITY_MAX;
        const vigStrength = VIGNETTE_BASE + sanityT * (VIGNETTE_MAX - VIGNETTE_BASE);
        this.gameScene.setVignetteStrength(vigStrength);
    }

    // Cleanup

    dispose(): void {
        this.running = false;
        cancelAnimationFrame(this.rafId);

        window.removeEventListener('resize', this.onResize);
        document.removeEventListener('pointerlockchange', this.onPointerLockChange);
        this.gameScene.renderer.domElement.removeEventListener('click', this.onCanvasClick);

        this.player.dispose();
        this.flashlight.dispose();
        this.enemy.dispose();
        this.audio.dispose();
        this.mazeBuilder.dispose();
        this.hud.dispose();
        this.gameScene.dispose();
    }
}
