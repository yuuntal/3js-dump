
export class LoadingScreen {
    private root: HTMLElement;
    private text: HTMLElement;
    private barFill: HTMLElement;

    constructor(container: HTMLElement) {
        this.root = document.createElement('div');
        Object.assign(this.root.style, {
            position: 'absolute',
            inset: '0',
            background: '#000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '1000',
            fontFamily: '"Courier New", monospace',
            color: '#cc4400',
            userSelect: 'none',
            transition: 'opacity 0.5s ease',
        });

        this.text = document.createElement('div');
        this.text.textContent = 'LOADING...';
        Object.assign(this.text.style, {
            fontSize: '24px',
            letterSpacing: '5px',
            marginBottom: '20px',
            textShadow: '0 0 10px #ff6600',
        });

        const barBg = document.createElement('div');
        Object.assign(barBg.style, {
            width: '200px',
            height: '4px',
            background: '#331100',
            border: '1px solid #662200',
            position: 'relative',
        });

        this.barFill = document.createElement('div');
        Object.assign(this.barFill.style, {
            width: '0%',
            height: '100%',
            background: '#ff6600',
            boxShadow: '0 0 10px #ff6600',
            transition: 'width 0.2s linear',
        });

        barBg.appendChild(this.barFill);
        this.root.appendChild(this.text);
        this.root.appendChild(barBg);

        container.appendChild(this.root);
    }

    setProgress(pct: number): void {
        this.barFill.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    }

    hide(): void {
        this.root.style.opacity = '0';
        setTimeout(() => {
            if (this.root.parentElement) {
                this.root.parentElement.removeChild(this.root);
            }
        }, 500);
    }
    dispose(): void {
        if (this.root && this.root.parentElement) {
            this.root.parentElement.removeChild(this.root);
        }
    }
}
