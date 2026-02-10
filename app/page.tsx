"use client";

import * as THREE from "three";
import { useEffect, useRef } from "react";
import checker from "@/public/checker.png";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "lil-gui";

export default function Home() {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		// create cube instance
		const makeInstance = (
			geometry: THREE.BoxGeometry,
			color: THREE.ColorRepresentation,
			x: number = 0,
			y: number = 0,
			z: number = 0,
		) => {
			const material = new THREE.MeshPhongMaterial({ color });
			const cube = new THREE.Mesh(geometry, material);

			scene.add(cube);
			cube.position.x = x;

			return cube;
		};

		if (!containerRef.current) return;
		// scene constants
		const scale = 1.3;
		const scene = new THREE.Scene();
		const fov = 70;
		const aspect = window.innerWidth / window.innerHeight;
		const near = 0.01;
		const far = 1000;
		const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		camera.position.z = 2;
		const renderer = new THREE.WebGLRenderer();
		renderer.setSize(window.innerWidth / scale, window.innerHeight / scale);
		containerRef.current.appendChild(renderer.domElement);

		const lg = new GUI();
		lg.add(renderer.domElement, 'title');
		
		// OrbitControls
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.target.set(0, 0, 0);
		controls.update();

		// lighting
		const lightColor = 0xffffff;
		const intensity = 1;
		const light = new THREE.AmbientLight(lightColor, intensity);
		light.position.set(-1, 2, 4);

		const geometry = new THREE.BoxGeometry(1, 1, 1, 1);

		// cube
		const cubes = [makeInstance(geometry, 0xffffff, 1, 1, 1)];

		// plane
		const planeSize = 40;
		const loader = new THREE.TextureLoader();
		const texture = loader.load(checker.src);
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.magFilter = THREE.NearestFilter;
		const repeats = planeSize / 2;
		texture.repeat.set(repeats, repeats);

		const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
		const planeMat = new THREE.MeshPhongMaterial({
			map: texture,
			side: THREE.DoubleSide,
		});
		const mesh = new THREE.Mesh(planeGeo, planeMat);
		mesh.rotation.x = Math.PI * -0.5;
		mesh.position.y = -0.5;

		// add to scene
		scene.add(light);
		scene.add(mesh);

		function render(time: number) {
			renderer.render(scene, camera);
			requestAnimationFrame(render);
		}
		requestAnimationFrame(render);
		// Cleanup
		return () => {
			containerRef.current?.removeChild(renderer.domElement);

			renderer.dispose();
		};
	}, []);

	return (
		<div className="flex w-full h-full flex-col py-10">
			<div ref={containerRef} />
			<div className="">this is my 3js cube</div>
		</div>
	);
}
