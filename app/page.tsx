"use client";

import * as THREE from "three";
import { useEffect, useRef } from "react";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const makeInstance = (
      geometry: THREE.BoxGeometry,
      color: THREE.ColorRepresentation,
      x: number,
    ) => {
      const material = new THREE.MeshPhongMaterial({ color });
      const cube = new THREE.Mesh(geometry, material);

      scene.add(cube);
      cube.position.x = x;

      return cube;
    };

    if (!containerRef.current) return;

    // scene constants
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // lighting
    const lightColor = 0xffffff;
    const intensity = 3;
    const light = new THREE.DirectionalLight(lightColor, intensity);
    light.position.set(-1, 2, 4);

    // cube
    const geometry = new THREE.BoxGeometry(1, 1, 1, 1);
    const cube = makeInstance(geometry, 0x44aa88, 0);

    // add to scene
    scene.add(light);

    // animate cube
    function animate() {
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;

      renderer.render(scene, camera);
    }

    // campos
    camera.position.z = 5;
    renderer.setAnimationLoop(animate);

    // Cleanup
    return () => {
      containerRef.current?.removeChild(renderer.domElement);

      renderer.dispose();
    };
  }, []);

  return (
    <div className="flex w-full h-full flex-col py-10">
      <div ref={containerRef} />
      <div className="absolute">
        {/*<p>
          this is my 3js cube
        </p>*/}
      </div>
    </div>
  );
}
