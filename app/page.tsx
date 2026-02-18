"use client";

import * as THREE from "three";
import { useEffect, useRef } from "react";
import checker from "@/public/checker.png";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { GUI } from "lil-gui";

import {
	EffectComposer,
	RenderPass,
	AsciiEffect,
} from "three/examples/jsm/Addons.js";

import { Mesh } from "./components/Mesh";

export default function Home() {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
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

		// ascii effect
		const effect = new AsciiEffect(renderer, " .:-+*=%@#&()", { invert: true });
		effect.setSize(window.innerWidth / scale, window.innerHeight / scale);
		effect.domElement.style.color = "white";
		effect.domElement.style.backgroundColor = "black";

		// composer and passes
		const composer = new EffectComposer(renderer);
		const renderPass = new RenderPass(scene, camera);
		composer.addPass(renderPass);
		// const luminosityHighPassShader = new ShaderPass(LuminosityHighPassShader);
		// composer.addPass(luminosityHighPassShader);
		// const copyPass = new ShaderPass(CopyShader);
		// composer.addPass(copyPass);

		containerRef.current.appendChild(effect.domElement);

		// gui
		const lg = new GUI();
		lg.add(effect.domElement, "title").name("ambient color");

		// OrbitControls
		const controls = new OrbitControls(camera, effect.domElement);
		controls.target.set(0, 0, 0);
		controls.update();

		// lighting
		const lightColor = 0xffffff;
		const intensity = 1;
		const light = new THREE.AmbientLight(lightColor, intensity);
		light.position.set(-1, 2, 4);

		// create different meshes using the generic class
		const meshes: Mesh[] = [];

		// cube
		meshes.push(
			new Mesh(
				new THREE.BoxGeometry(1, 1, 1),
				new THREE.MeshPhongMaterial({ color: 0x44aa88 }),
				0,
				0,
				0,
			),
		);

		// sphere
		meshes.push(
			new Mesh(
				new THREE.SphereGeometry(0.7, 16, 16),
				new THREE.MeshPhongMaterial({ color: 0x8844aa }),
				-2,
				0,
				0,
			),
		);

		// cone
		meshes.push(
			new Mesh(
				new THREE.ConeGeometry(0.6, 1.5, 16),
				new THREE.MeshPhongMaterial({ color: 0xaa8844 }),
				2,
				0,
				0,
			),
		);

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
		meshes.forEach((m) => m.addTo(scene));

		function render(time: number) {
			time *= 0.001;

			meshes.forEach((m, ndx) => {
				const speed = 1 + ndx * 0.1;
				const rot = time * speed;
				m.mesh.rotation.x = rot;
				m.mesh.rotation.y = rot;
			});

			// ascii render
			effect.render(scene, camera);
			requestAnimationFrame(render);

			// normal render
			// renderer.render(scene, camera);

			// composer.render();
		}
		// start rendering for the first time
		requestAnimationFrame(render);

		// cleanup
		return () => {
			containerRef.current?.removeChild(renderer.domElement);

			meshes.forEach((m) => {
				m.removeFrom(scene);
				m.dispose();
			});

			// clean up plane
			planeGeo.dispose();
			planeMat.dispose();

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
