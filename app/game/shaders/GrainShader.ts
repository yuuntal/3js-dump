export const GrainShader = {
    name: 'GrainShader',

    uniforms: {
        tDiffuse: { value: null as unknown },
        uTime: { value: 0.0 },
        uIntensity: { value: 0.06 },
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
        uniform float uTime;
        uniform float uIntensity;
        varying vec2 vUv;

        // simple hash noise
        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        void main() {
            vec4 color = texture2D(tDiffuse, vUv);

            // animated grain: offset hash seed by time
            float n = hash(vUv + fract(uTime * 0.37));

            // remap to [-0.5, 0.5] and scale by intensity
            n = (n - 0.5) * uIntensity;

            gl_FragColor = vec4(color.rgb + n, color.a);
        }
    `,
};
