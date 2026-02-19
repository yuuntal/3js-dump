"use client";
import { useEffect, useRef } from "react";
import { Game } from "./game/Game";

export default function Home() {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!containerRef.current) return;

		const game = new Game(containerRef.current);
		game.init();

		// cleanup
		return () => {
			game.dispose();
		};
	}, []);

	return (
		<div
			ref={containerRef}
			style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#000" }}
		/>
	);
}
