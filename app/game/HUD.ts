import { SANITY_MAX } from './constants';

export class HUD {
    private root: HTMLElement;
    private sanityFill: HTMLElement;
    private flashIcon: HTMLElement;
    private hintEl: HTMLElement;
    private flashEl: HTMLElement;
    private messageEl: HTMLElement;
    private proximityEl: HTMLElement;
    private messageTimer = 0;

    onRestart?: () => void;

    constructor(container: HTMLElement) {
        this.root = document.createElement('div');
        this.root.id = 'hud-root';
        Object.assign(this.root.style, {
            position: 'absolute',
            inset: '0',
            pointerEvents: 'none',
            fontFamily: '"Courier New", monospace',
            color: '#cc4400',
            userSelect: 'none',
        });

        // sanity bar
        const sanityWrap = document.createElement('div');
        Object.assign(sanityWrap.style, {
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
        });

        const label = document.createElement('span');
        label.textContent = 'SANITY';
        Object.assign(label.style, { fontSize: '10px', letterSpacing: '3px', opacity: '0.7' });

        const barBg = document.createElement('div');
        Object.assign(barBg.style, {
            width: '160px',
            height: '6px',
            background: 'rgba(100,0,0,0.4)',
            border: '1px solid #441100',
        });

        this.sanityFill = document.createElement('div');
        Object.assign(this.sanityFill.style, {
            width: '100%',
            height: '100%',
            background: '#cc3300',
            transition: 'width 0.3s ease',
        });

        barBg.appendChild(this.sanityFill);
        sanityWrap.appendChild(label);
        sanityWrap.appendChild(barBg);

        // flashlight icon
        this.flashIcon = document.createElement('div');
        Object.assign(this.flashIcon.style, {
            position: 'absolute',
            bottom: '24px',
            right: '24px',
            fontSize: '20px',
            opacity: '0.8',
            textShadow: '0 0 8px #ff6600',
        });
        this.flashIcon.textContent = '🔦';

        // control hint
        this.hintEl = document.createElement('div');
        Object.assign(this.hintEl.style, {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '13px',
            textAlign: 'center',
            color: 'rgba(200,100,50,0.85)',
            letterSpacing: '1px',
            pointerEvents: 'none',
        });
        this.hintEl.innerHTML = 'CLICK TO CONTINUE<br><span style="font-size:11px;opacity:0.6">WASD · MOUSE LOOK · F = FLASHLIGHT · SHIFT = SPRINT</span><br><span style="font-size:10px;opacity:0.45;margin-top:6px;display:inline-block"></span>';

        // crosshair
        const xhair = document.createElement('div');
        Object.assign(xhair.style, {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: 'rgba(255,100,50,0.6)',
        });

        // red flash
        this.flashEl = document.createElement('div');
        Object.assign(this.flashEl.style, {
            position: 'absolute',
            inset: '0',
            background: 'rgba(180,0,0,0)',
            transition: 'background 0.05s ease',
            pointerEvents: 'none',
        });

        // centre message
        this.messageEl = document.createElement('div');
        Object.assign(this.messageEl.style, {
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '28px',
            letterSpacing: '6px',
            color: '#ff1100',
            textShadow: '0 0 20px #ff0000',
            opacity: '0',
            transition: 'opacity 0.1s ease',
            textAlign: 'center',
        });

        // enemy proximity edge glow
        this.proximityEl = document.createElement('div');
        Object.assign(this.proximityEl.style, {
            position: 'absolute',
            inset: '0',
            pointerEvents: 'none',
            opacity: '0',
            transition: 'opacity 0.15s ease',
            boxShadow: 'inset 0 0 120px 60px rgba(200,0,0,0.8), inset 0 0 40px 10px rgba(255,30,0,0.5)',
        });

        this.root.appendChild(this.flashEl);
        this.root.appendChild(this.proximityEl);
        this.root.appendChild(sanityWrap);
        this.root.appendChild(this.flashIcon);
        this.root.appendChild(this.hintEl);
        this.root.appendChild(xhair);
        this.root.appendChild(this.messageEl);

        container.style.position = 'relative';
        container.appendChild(this.root);
    }

    // Public API

    setSanity(value: number): void {
        const pct = Math.max(0, Math.min(100, (value / SANITY_MAX) * 100));
        this.sanityFill.style.width = `${pct}%`;

        const r = Math.round(180 + (1 - pct / 100) * 75);
        const g = Math.round(pct / 100 * 80);

        this.sanityFill.style.background = `rgb(${r},${g},0)`;
    }

    setFlashlightOn(on: boolean): void {
        this.flashIcon.style.opacity = on ? '0.9' : '0.3';
        this.flashIcon.style.filter = on ? 'none' : 'grayscale(1)';
    }

    showHint(visible: boolean): void {
        this.hintEl.style.opacity = visible ? '1' : '0';
    }

    triggerRedFlash(): void {
        this.flashEl.style.background = 'rgba(180,0,0,0.75)';
        setTimeout(() => {
            this.flashEl.style.background = 'rgba(180,0,0,0)';
        }, 120);
    }

    showMessage(text: string, durationMs = 2000): void {
        this.messageEl.textContent = text;
        this.messageEl.style.opacity = '1';
        clearTimeout(this.messageTimer as unknown as number);
        this.messageTimer = setTimeout(() => {
            this.messageEl.style.opacity = '0';
        }, durationMs) as unknown as number;
    }

    /* 0 = safe, 1 = very close */
    setProximity(t: number): void {
        const pulse = t > 0.01
            ? t * (0.5 + 0.5 * Math.sin(Date.now() * 0.01))
            : 0;
        this.proximityEl.style.opacity = String(Math.max(0, Math.min(1, pulse)));

        // show warning text when moderately close
        if (t > 0.3) {
            this.messageEl.textContent = t > 0.7 ? 'IT\'S RIGHT BEHIND YOU' : 'SOMETHING IS NEAR...';
            this.messageEl.style.opacity = String(0.3 + t * 0.7);
        } else {
            if (this.messageEl.textContent === 'SOMETHING IS NEAR...' ||
                this.messageEl.textContent === 'IT\'S RIGHT BEHIND YOU') {
                this.messageEl.style.opacity = '0';
            }
        }
    }

    showWin(): void {
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'absolute',
            inset: '0',
            background: 'rgba(0,0,0,0)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '999',
            transition: 'background 2s ease',
        });

        const title = document.createElement('div');
        Object.assign(title.style, {
            fontSize: '42px',
            letterSpacing: '12px',
            color: '#00ffaa',
            textShadow: '0 0 40px #00ffaa, 0 0 80px #00aa66',
            opacity: '0',
            transition: 'opacity 1.5s ease',
            fontFamily: '"Courier New", monospace',
        });
        title.textContent = 'YOU ESCAPED';

        const sub = document.createElement('div');
        Object.assign(sub.style, {
            fontSize: '13px',
            letterSpacing: '3px',
            color: 'rgba(200,255,220,0.6)',
            marginTop: '24px',
            opacity: '0',
            transition: 'opacity 2s ease 1s',
            fontFamily: '"Courier New", monospace',
        });
        sub.textContent = 'CLICK TO PLAY AGAIN';

        overlay.appendChild(title);
        overlay.appendChild(sub);
        this.root.appendChild(overlay);

        // animate in
        requestAnimationFrame(() => {
            overlay.style.background = 'rgba(0,0,0,0.85)';
            title.style.opacity = '1';
            sub.style.opacity = '1';
        });

        // click to reload
        overlay.style.pointerEvents = 'auto';
        overlay.style.cursor = 'pointer';
        overlay.addEventListener('click', () => {
            if (this.onRestart) {
                // remove overlay
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 1000);
                this.onRestart();
            } else {
                window.location.reload();
            }
        });
    }

    dispose(): void {
        this.root.remove();
    }
}
