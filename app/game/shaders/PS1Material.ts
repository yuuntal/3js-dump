import * as THREE from 'three';

const PS1_GRID = 160.0;

const ps1Vertex = /* glsl */ `
    uniform float uSnapGrid;
    uniform vec2 uScreenSize;
    varying vec2 vUv;
    varying float vFog;

    void main() {
        vUv = uv;

        vec4 clipPos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

        // snap vertex to screen-space grid (PS1 vertex jitter)
        vec2 screenPos = clipPos.xy / clipPos.w;
        screenPos = floor(screenPos * uSnapGrid) / uSnapGrid;
        clipPos.xy = screenPos * clipPos.w;

        gl_Position = clipPos;

        // simple distance fog
        float depth = length((modelViewMatrix * vec4(position, 1.0)).xyz);
        vFog = clamp(depth * 0.06, 0.0, 1.0);
    }
`;

// Fragment shader: affine texture + fog
const ps1Fragment = /* glsl */ `
    uniform sampler2D uMap;
    uniform sampler2D uNormalMap;
    uniform vec3 uColor;
    uniform vec3 uFogColor;
    uniform float uHasMap;
    varying vec2 vUv;
    varying float vFog;

    void main() {
        vec3 col = uColor;

        if (uHasMap > 0.5) {
            vec4 texel = texture2D(uMap, vUv);
            col *= texel.rgb;
        }

        // mix with fog
        col = mix(col, uFogColor, vFog);

        gl_FragColor = vec4(col, 1.0);
    }
`;

export function createPS1Material(options: {
    color?: number;
    map?: THREE.Texture | null;
    normalMap?: THREE.Texture | null;
    roughness?: number;
}): THREE.ShaderMaterial {
    const color = new THREE.Color(options.color ?? 0x888888);

    // force nearest-neighbor on textures for that crunchy PS1 look
    if (options.map) {
        options.map.magFilter = THREE.NearestFilter;
        options.map.minFilter = THREE.NearestFilter;
        options.map.generateMipmaps = false;
    }

    return new THREE.ShaderMaterial({
        uniforms: {
            uSnapGrid: { value: PS1_GRID },
            uScreenSize: { value: [window.innerWidth, window.innerHeight] },
            uMap: { value: options.map ?? null },
            uNormalMap: { value: options.normalMap ?? null },
            uColor: { value: color },
            uFogColor: { value: new THREE.Color(0x050505) },
            uHasMap: { value: options.map ? 1.0 : 0.0 },
        },
        vertexShader: ps1Vertex,
        fragmentShader: ps1Fragment,
    });
}
