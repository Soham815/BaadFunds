import React from "react";
import "../styles/BrushCheckbox.css";

/**
 * A hand-drawn circle + tick checkbox. Pass `checked` to trigger the
 * brush-stroke draw-in animation once. Used anywhere Baad marks something
 * complete (To-Do, Wants, and future lists).
 */
export default function BrushCheckbox({ checked, onClick, disabled, size = 36 }) {
	return (
		<button
			className={`brush-checkbox ${checked ? "checked" : ""}`}
			onClick={onClick}
			disabled={disabled}
			style={{ width: size, height: size }}
			aria-label="Mark complete"
		>
			<svg viewBox="0 0 40 40" className="brush-checkbox-svg">
				<path
					className="brush-checkbox-circle"
					d="M20 4 C 10 4, 4 11, 4 20 C 4 30, 11 36, 20 36 C 29 36, 36 29, 36 20 C 36 10, 29 4, 20 4"
					fill="none"
				/>
				<path className="brush-checkbox-tick" d="M11 20 L17 27 L29 12" fill="none" />
			</svg>
		</button>
	);
}
