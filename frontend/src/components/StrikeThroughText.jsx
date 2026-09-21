import React from "react";
import "../styles/StrikeThroughText.css";

/**
 * Wraps text and, once phase !== "idle", overlays a hand-drawn line across
 * it. phase: "drawing" animates the cut in; "drawn" shows it already done.
 */
export default function StrikeThroughText({ children, phase = "idle", as: Tag = "span" }) {
	return (
		<Tag className="strike-wrap">
			{children}
			{phase !== "idle" && (
				<svg className="strike-svg" viewBox="0 0 100 20" preserveAspectRatio="none">
					<path
						className={`strike-path ${phase === "drawing" ? "drawing" : "drawn"}`}
						d="M2,11 C 20,6 35,15 50,9 C 65,4 80,13 98,8"
					/>
				</svg>
			)}
		</Tag>
	);
}
