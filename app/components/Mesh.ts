import * as THREE from 'three';

export class ManagedMesh {
    mesh: THREE.Mesh;

    constructor(
        geometry: THREE.BufferGeometry,
        material: THREE.Material | THREE.Material[],
        x: number = 0,
        y: number = 0,
        z: number = 0
    ) {
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
    }

    addTo(scene: THREE.Scene) {
        scene.add(this.mesh);
    }

    removeFrom(scene: THREE.Scene) {
        scene.remove(this.mesh);
    }

    dispose() {
        this.mesh.geometry.dispose();

        if (Array.isArray(this.mesh.material)) {
            this.mesh.material.forEach(m => m.dispose());
        } else {
            this.mesh.material.dispose();
        }
    }
}
