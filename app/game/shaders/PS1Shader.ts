// PS1-style post-processing: color banding, dithering, and resolution downscale

export const PS1Shader = {
    name: 'PS1Shader',

    uniforms: {
        tDiffuse: { value: null },
        uResolution: { value: [320, 240] },
        uColorDepth: { value: 32.0 },
        uDither: { value: 1.0 },
    },

    vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,

    fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse;
        uniform vec2 uResolution;
        uniform float uColorDepth;
        uniform float uDither;
        varying vec2 vUv;

        // 4×4 Bayer dithering matrix (normalized to 0-1)
        float bayer4(vec2 pos) {
            ivec2 p = ivec2(mod(pos, 4.0));
            int idx = p.x + p.y * 4;

            // Bayer 4×4 matrix values
            float m[16];
            m[0]  =  0.0 / 16.0;  m[1]  =  8.0 / 16.0;  m[2]  =  2.0 / 16.0;  m[3]  = 10.0 / 16.0;
            m[4]  = 12.0 / 16.0;  m[5]  =  4.0 / 16.0;  m[6]  = 14.0 / 16.0;  m[7]  =  6.0 / 16.0;
            m[8]  =  3.0 / 16.0;  m[9]  = 11.0 / 16.0;  m[10] =  1.0 / 16.0;  m[11] =  9.0 / 16.0;
            m[12] = 15.0 / 16.0;  m[13] =  7.0 / 16.0;  m[14] = 13.0 / 16.0;  m[15] =  5.0 / 16.0;

            return m[idx] - 0.5;
        }

        void main() {
            // snap UV to low-res grid (pixelation)
            vec2 pixelUv = floor(vUv * uResolution) / uResolution;
            vec3 col = texture2D(tDiffuse, pixelUv).rgb;

            // Bayer dithering
            vec2 pixelPos = vUv * uResolution;
            float dither = bayer4(pixelPos) * uDither / uColorDepth;

            // color quantization (reduce to N levels per channel)
            col = floor((col + dither) * uColorDepth) / uColorDepth;

            gl_FragColor = vec4(col, 1.0);
        }
    `,
};
