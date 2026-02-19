import * as THREE from 'three';

const PS1_SNAP_GRID = 160.0;

function ps1Snap(mat: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
    mat.onBeforeCompile = (shader) => {
        shader.uniforms.uSnapGrid = { value: PS1_SNAP_GRID };

        shader.vertexShader = shader.vertexShader.replace(
            '#include <project_vertex>',
            /* glsl */ `
            #include <project_vertex>
            // PS1 vertex snap
            {
                float grid = ${PS1_SNAP_GRID.toFixed(1)};
                vec2 snapped = floor(gl_Position.xy / gl_Position.w * grid) / grid;
                gl_Position.xy = snapped * gl_Position.w;
            }
            `
        );
    };
    return mat;
}

//  Noise helpers

function fillNoise(
    ctx: CanvasRenderingContext2D,
    w: number, h: number,
    baseR: number, baseG: number, baseB: number,
    variance: number,
): void {
    const img = ctx.createImageData(w, h);
    for (let i = 0; i < img.data.length; i += 4) {
        const v = (Math.random() - 0.5) * variance;
        img.data[i] = Math.max(0, Math.min(255, baseR + v));
        img.data[i + 1] = Math.max(0, Math.min(255, baseG + v));
        img.data[i + 2] = Math.max(0, Math.min(255, baseB + v));
        img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
}

function drawBrickLines(
    ctx: CanvasRenderingContext2D,
    w: number, h: number,
    brickW: number, brickH: number,
    mortarColor: string,
    mortarWidth: number,
): void {
    ctx.strokeStyle = mortarColor;
    ctx.lineWidth = mortarWidth;

    // horizontal
    for (let y = 0; y <= h; y += brickH) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }

    // vertical
    for (let y = 0; y < h; y += brickH) {
        const row = Math.round(y / brickH);
        const offset = (row % 2 === 0) ? 0 : brickW / 2;
        for (let x = offset; x <= w; x += brickW) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + brickH);
            ctx.stroke();
        }
    }
}

//  stains
function addGrime(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const sw = 2 + Math.random() * 8;
        const sh = 4 + Math.random() * 20;
        ctx.fillStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.12})`;
        ctx.fillRect(x, y, sw, sh);
    }

    for (let i = 0; i < 15; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = 3 + Math.random() * 12;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.08})`;
        ctx.fill();
    }
}

//  cracks
function addCracks(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        let cx = Math.random() * w;
        let cy = Math.random() * h;
        ctx.moveTo(cx, cy);
        const segs = 3 + Math.floor(Math.random() * 5);
        for (let s = 0; s < segs; s++) {
            cx += (Math.random() - 0.5) * 30;
            cy += (Math.random() - 0.5) * 30;
            ctx.lineTo(cx, cy);
        }
        ctx.stroke();
    }
}

//  Canvas

function canvasToTexture(canvas: HTMLCanvasElement, repeat: number = 1): THREE.CanvasTexture {
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat, repeat);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    return tex;
}

// Generate a normal map from a height canvas

function generateNormalMap(heightCanvas: HTMLCanvasElement, strength: number = 2): HTMLCanvasElement {
    const w = heightCanvas.width;
    const h = heightCanvas.height;

    const srcCtx = heightCanvas.getContext('2d')!;
    const srcData = srcCtx.getImageData(0, 0, w, h).data;

    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    const ctx = out.getContext('2d')!;
    const dst = ctx.createImageData(w, h);

    // sobel-like per-pixel normal from luminance
    const lum = (x: number, y: number): number => {
        const nx = ((x % w) + w) % w;
        const ny = ((y % h) + h) % h;
        const idx = (ny * w + nx) * 4;
        return (srcData[idx] + srcData[idx + 1] + srcData[idx + 2]) / (3 * 255);
    };

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const l = lum(x - 1, y);
            const r = lum(x + 1, y);
            const t = lum(x, y - 1);
            const b = lum(x, y + 1);

            // tangent-space normal
            const nx = (l - r) * strength;
            const ny = (t - b) * strength;
            const nz = 1.0;

            // normalise
            const len = Math.sqrt(nx * nx + ny * ny + nz * nz);

            const idx = (y * w + x) * 4;
            dst.data[idx] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
            dst.data[idx + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
            dst.data[idx + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
            dst.data[idx + 3] = 255;
        }
    }

    ctx.putImageData(dst, 0, 0);
    return out;
}

// Public texture factories

export function createWallMaterial(): THREE.MeshStandardMaterial {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // base concrete colour
    fillNoise(ctx, size, size, 120, 115, 108, 30);

    // brick mortar grid overlay
    drawBrickLines(ctx, size, size, 64, 32, 'rgba(60,55,50,0.5)', 2);

    // grime and cracks
    addGrime(ctx, size, size);
    addCracks(ctx, size, size);

    // darker bottom strip
    const grad = ctx.createLinearGradient(0, size * 0.7, 0, size);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.2)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, size * 0.7, size, size * 0.3);

    // normal map from the same canvas
    const normalCanvas = generateNormalMap(canvas, 2.5);

    return ps1Snap(new THREE.MeshStandardMaterial({
        map: canvasToTexture(canvas),
        normalMap: canvasToTexture(normalCanvas),
        normalScale: new THREE.Vector2(1.2, 1.2),
        roughness: 0.82,
        metalness: 0.02,
    }));
}

// Concrete floor
export function createFloorMaterial(): THREE.MeshStandardMaterial {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // dark concrete base
    fillNoise(ctx, size, size, 70, 68, 65, 20);

    // tile grid
    ctx.strokeStyle = 'rgba(40,38,35,0.6)';
    ctx.lineWidth = 2;
    const tile = 128;
    for (let x = 0; x <= size; x += tile) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke();
    }
    for (let y = 0; y <= size; y += tile) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke();
    }

    addGrime(ctx, size, size);
    addCracks(ctx, size, size);

    // central scuff marks
    for (let i = 0; i < 8; i++) {
        const sx = Math.random() * size;
        const sy = Math.random() * size;
        ctx.fillStyle = `rgba(50,48,45,${0.15 + Math.random() * 0.1})`;
        ctx.fillRect(sx, sy, 40 + Math.random() * 60, 2);
    }

    const normalCanvas = generateNormalMap(canvas, 1.8);

    return ps1Snap(new THREE.MeshStandardMaterial({
        map: canvasToTexture(canvas),
        normalMap: canvasToTexture(normalCanvas),
        normalScale: new THREE.Vector2(0.8, 0.8),
        roughness: 0.92,
        metalness: 0.0,
    }));
}

// Ceiling
export function createCeilingMaterial(): THREE.MeshStandardMaterial {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // slightly lighter concrete
    fillNoise(ctx, size, size, 85, 82, 78, 18);

    // panel grid
    ctx.strokeStyle = 'rgba(45,42,40,0.5)';
    ctx.lineWidth = 2;
    const panel = 128;
    for (let x = 0; x <= size; x += panel) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke();
    }
    for (let y = 0; y <= size; y += panel) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke();
    }

    // water stains / dark patches
    for (let i = 0; i < 10; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = 10 + Math.random() * 25;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(40,35,30,0.15)');
        g.addColorStop(1, 'rgba(40,35,30,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    const normalCanvas = generateNormalMap(canvas, 1.5);

    return ps1Snap(new THREE.MeshStandardMaterial({
        map: canvasToTexture(canvas),
        normalMap: canvasToTexture(normalCanvas),
        normalScale: new THREE.Vector2(0.6, 0.6),
        roughness: 0.88,
        metalness: 0.0,
    }));
}
