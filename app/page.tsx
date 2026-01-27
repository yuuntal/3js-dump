"use client";

import * as THREE from "three";
import { useEffect, useRef } from "react";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    
    // create cube instance
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
    const scale = 1.3
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      80,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth / scale, window.innerHeight / scale);
    containerRef.current.appendChild(renderer.domElement);

    // lighting
    const lightColor = 0xffffff;
    const intensity = 3;
    const light = new THREE.DirectionalLight(lightColor, intensity);
    light.position.set(-1, 2, 4);

    
    const geometry = new THREE.BoxGeometry(1, 1, 1, 1);
    
    // cube
    
    const cubes = [
      makeInstance(geometry, 0x44aa88, 0),
      makeInstance(geometry, 0x8844aa, -2),
      makeInstance(geometry, 0xaa8844, 2),
    ];

    // add to scene
    scene.add(light);

    function render(time: number) {
      time *= 0.001;
      
      cubes.forEach((cube, index) => {
        const speed = 1 + index * 0.1;
        const rot = time * speed;
        cube.rotation.x = rot;
        cube.rotation.y = rot;
      });
      
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    // campos
    camera.position.z = 5;
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
