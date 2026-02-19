import * as THREE from 'three';

// Maze

export const WALL_N = 1 << 0;
export const WALL_S = 1 << 1;
export const WALL_E = 1 << 2;
export const WALL_W = 1 << 3;

export interface Cell {
    col: number;
    row: number;
    walls: number;
    visited: boolean;
}

export type MazeGrid = Cell[][];

// Player

export interface PlayerState {
    yaw: number;
    pitch: number;
    isMoving: boolean;
    isSprinting: boolean;
    fov: number;
}

// Enemy

export interface EnemyState {
    active: boolean;
    waypoint: THREE.Vector3;
    triggered: boolean;
}

// Input snapshot

export interface InputSnapshot {
    forward: boolean;
    back: boolean;
    left: boolean;
    right: boolean;
    sprint: boolean;
}

// AABB used for wall collision

export interface AABB {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
}

// Generic disposable entity

export interface Disposable {
    dispose(): void;
}

export interface Updatable {
    update(dt: number): void;
}
