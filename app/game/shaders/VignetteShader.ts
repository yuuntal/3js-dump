export const VignetteShader = {
    name: 'VignetteShader',

    uniforms: {
        tDiffuse: { value: null as unknown },
        uStrength: { value: 0.35 },
        uSoftness: { value: 0.6 },
    },

    vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,

    fragmentShader: /* glsl */`
        uniform sampler2D tDiffuse;
        uniform float uStrength;
        uniform float uSoftness;
        varying vec2 vUv;

        void main() {
            vec4 color = texture2D(tDiffuse, vUv);

            // distance from centre (0 at centre, ~0.7 at corner)
            vec2 uv  = vUv - 0.5;
            float d  = length(uv);

            // smooth step from inner to outer radius
            float inner = 0.5 - uSoftness * 0.5;
            float outer = 0.5 + uSoftness * 0.5;
            float vig   = 1.0 - smoothstep(inner, outer, d);

            // vignette darkens; uStrength 0→no effect, 1→full black at edges
            vig = mix(1.0, vig, uStrength);
            gl_FragColor = vec4(color.rgb * vig, color.a);
        }
    `,
};
