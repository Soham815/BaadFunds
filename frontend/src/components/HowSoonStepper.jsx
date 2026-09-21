import React from "react";
import "../styles/HowSoonStepper.css";

const STEPS = [
	{ value: "days", label: "Days", icon: "☀️" },
	{ value: "weeks", label: "Weeks", icon: "🌙" },
	{ value: "months", label: "Months", icon: "🌸" },
	{ value: "years", label: "Years", icon: "🌳" },
];

/** value: one of 'days'|'weeks'|'months'|'years'|null. Click again to deselect. */
export default function HowSoonStepper({ value, onChange, label = "How soon?", optional = true }) {
	return (
		<div className="how-soon">
			<label>
				{label} {optional && <span className="how-soon-optional">(optional)</span>}
			</label>
			<div className="how-soon-track">
				{STEPS.map((step, i) => (
					<React.Fragment key={step.value}>
						<button
							type="button"
							className={`how-soon-step ${value === step.value ? "selected" : ""}`}
							onClick={() => onChange(value === step.value ? null : step.value)}
						>
							<span className="how-soon-icon">{step.icon}</span>
							<span className="how-soon-label">{step.label}</span>
						</button>
						{i < STEPS.length - 1 && <span className="how-soon-line" />}
					</React.Fragment>
				))}
			</div>
		</div>
	);
}
