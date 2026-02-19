import * as THREE from 'three';
import {
    EffectComposer,
    RenderPass,
    ShaderPass,
} from 'three/examples/jsm/Addons.js';

import { VignetteShader } from './shaders/VignetteShader';
import { GrainShader } from './shaders/GrainShader';
import { PS1Shader } from './shaders/PS1Shader';
import {
    FOG_COLOR, FOG_DENSITY,
    AMBIENT_COLOR, AMBIENT_INTENSITY,
    ACCENT_COLOR, ACCENT_INTENSITY,
    GRAIN_INTENSITY, VIGNETTE_BASE,
} from './constants';
import { MAZE_COLS, MAZE_ROWS, CELL_SIZE, WALL_HEIGHT } from './constants';

// Scene setup

export class GameScene {
    readonly scene: THREE.Scene;
    readonly renderer: THREE.WebGLRenderer;

    private composer: EffectComposer;
    private vignettePass: ShaderPass;
    private grainPass: ShaderPass;
    private ps1Pass: ShaderPass;

    constructor(container: HTMLElement) {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(FOG_COLOR, FOG_DENSITY);
        this.scene.background = new THREE.Color(0x000000);

        this.renderer = new THREE.WebGLRenderer({
            antialias: false,
            powerPreference: 'high-performance',
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(1);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.toneMappingExposure = 1.5;
        container.appendChild(this.renderer.domElement);

        // lighting
        const ambient = new THREE.AmbientLight(AMBIENT_COLOR, AMBIENT_INTENSITY);
        this.scene.add(ambient);


        const accent = new THREE.PointLight(ACCENT_COLOR, ACCENT_INTENSITY, 30);
        accent.position.set(
            (MAZE_COLS / 2) * CELL_SIZE,
            WALL_HEIGHT * 0.8,
            (MAZE_ROWS / 2) * CELL_SIZE,
        );
        this.scene.add(accent);

        //  post-processing pipeline
        this.composer = new EffectComposer(this.renderer);

        const renderPass = new RenderPass(this.scene, new THREE.Camera());
        this.composer.addPass(renderPass);



        this.ps1Pass = new ShaderPass(PS1Shader as never);
        this.ps1Pass.uniforms['uResolution'].value = [320, 240];
        this.ps1Pass.uniforms['uColorDepth'].value = 32.0;
        this.ps1Pass.uniforms['uDither'].value = 1.0;
        this.composer.addPass(this.ps1Pass);


        this.vignettePass = new ShaderPass(VignetteShader as never);
        this.vignettePass.uniforms['uStrength'].value = VIGNETTE_BASE;
        this.composer.addPass(this.vignettePass);

        this.grainPass = new ShaderPass(GrainShader as never);
        this.grainPass.uniforms['uIntensity'].value = GRAIN_INTENSITY;
        this.grainPass.renderToScreen = true;
        this.composer.addPass(this.grainPass);
    }

    //  Render
    render(camera: THREE.Camera, time: number): void {

        (this.composer.passes[0] as RenderPass).camera = camera;

        this.grainPass.uniforms['uTime'].value = time;
        this.composer.render();
    }

    //  Uniforms
    setVignetteStrength(v: number): void {
        this.vignettePass.uniforms['uStrength'].value = v;
    }

    onResize(): void {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.renderer.setSize(w, h);
        this.composer.setSize(w, h);

        const scale = Math.min(w, h) / 240;
        this.ps1Pass.uniforms['uResolution'].value = [
            Math.floor(w / scale),
            Math.floor(h / scale),
        ];
    }

    dispose(): void {
        this.renderer.dispose();
    }
}
