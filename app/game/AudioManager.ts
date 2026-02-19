import * as THREE from 'three';
import { Disposable } from './types';

export class AudioManager implements Disposable {
    private listener: THREE.AudioListener;
    private ctx: AudioContext | null = null;

    private droneOsc: OscillatorNode | null = null;
    private droneOsc2: OscillatorNode | null = null;
    private droneGain: GainNode | null = null;


    private footstepTimer = 0;
    private stepInterval = 0.42; 

    constructor(camera: THREE.Camera) {
        this.listener = new THREE.AudioListener();
        camera.add(this.listener);
    }

    init(): void {
        if (this.ctx) return;

        try {
            const AudioCtx = window.AudioContext || (window as never as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            this.ctx = new AudioCtx();
            this.startAmbientDrone();
        } catch {
            console.warn('[AudioManager] AudioContext unavailable');
        }
    }

    // Ambient drone

    private startAmbientDrone(): void {
        if (!this.ctx) return;

        this.droneGain = this.ctx.createGain();
        this.droneGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        this.droneGain.connect(this.ctx.destination);

        this.droneOsc = this.ctx.createOscillator();
        this.droneOsc.type = 'sine';
        this.droneOsc.frequency.setValueAtTime(55, this.ctx.currentTime);
        this.droneOsc.connect(this.droneGain);

        this.droneOsc2 = this.ctx.createOscillator();
        this.droneOsc2.type = 'sine';
        this.droneOsc2.frequency.setValueAtTime(56.3, this.ctx.currentTime); // slight beat
        this.droneOsc2.connect(this.droneGain);

        this.droneOsc.start();
        this.droneOsc2.start();
    }


    setDroneIntensity(t: number): void {
        if (!this.droneGain || !this.ctx) return;
        const vol = 0.08 + t * 0.18;
        this.droneGain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.1);


        this.droneOsc?.frequency.linearRampToValueAtTime(55 + t * 30, this.ctx.currentTime + 0.2);
        this.droneOsc2?.frequency.linearRampToValueAtTime(56.3 + t * 30, this.ctx.currentTime + 0.2);
    }

    //  Footsteps

    update(dt: number, isMoving: boolean, isSprinting: boolean): void {
        if (!this.ctx || !isMoving) {
            this.footstepTimer = 0;
            return;
        }

        const interval = isSprinting ? this.stepInterval * 0.6 : this.stepInterval;
        this.footstepTimer += dt;

        if (this.footstepTimer >= interval) {
            this.footstepTimer = 0;
            this.playFootstep();
        }
    }

    private playFootstep(): void {
        if (!this.ctx) return;

        const dur = 0.04;
        const freq = 120 + Math.random() * 60;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.3, this.ctx.currentTime + dur);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + dur);
    }

    // Jumpscare sting

    playJumpscare(): void {
        if (!this.ctx) return;

        // loud burst of noise
        const bufSize = this.ctx.sampleRate * 0.4;
        const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);

        const src = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        src.buffer = buffer;
        gain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
        src.connect(gain);
        gain.connect(this.ctx.destination);
        src.start();
    }

    dispose(): void {
        this.droneOsc?.stop();
        this.droneOsc2?.stop();
        this.ctx?.close();
    }
}
