export const OUTING_PRESETS = [
	{ value: "cafe", label: "Cafe", icon: "☕" },
	{ value: "club", label: "Club", icon: "🎉" },
	{ value: "mountains", label: "Mountains", icon: "⛰️" },
	{ value: "beach", label: "Beach", icon: "🏖️" },
];

export function typeLabel(type) {
	if (!type) return "Hangout";
	const preset = OUTING_PRESETS.find((p) => p.value === type);
	if (preset) return `${preset.icon} ${preset.label}`;
	return `🎈 ${type.charAt(0).toUpperCase() + type.slice(1)}`;
}

export function typeColor(type) {
	switch (type) {
		case "cafe":
			return "#c9986b";
		case "club":
			return "#c05fd0";
		case "mountains":
			return "#5fa87e";
		case "beach":
			return "#4fb3c9";
		default:
			return "#ffb266"; // custom type
	}
}

const TIMEFRAME_PHRASES = {
	days: "any day now",
	weeks: "in the next few weeks",
	months: "in the coming months",
	years: "eventually — but it'll be so worth it",
	null: "soon",
};

export function timeframePhrase(timeframe) {
	return TIMEFRAME_PHRASES[timeframe || "null"];
}

export function hangoutCongratsMessage(hangout) {
	const type = typeLabel(hangout.outing_type);
	const soon = timeframePhrase(hangout.expected_timeframe);
	return `Yay!! Your "${hangout.title}" hangout (${type}) is happening ${soon} — have the BEST time!! 🎉`;
}

export const TIMEFRAME_GROUPS = [
	{ value: "days", label: "Days", icon: "☀️", colorVar: "--yellow" },
	{ value: "weeks", label: "Weeks", icon: "🌙", colorVar: "--mint" },
	{ value: "months", label: "Months", icon: "🌸", colorVar: "--pink" },
	{ value: "years", label: "Years", icon: "🌳", colorVar: "--lavender" },
	{ value: null, label: "Someday", icon: "🌟", colorVar: "--cream" },
];
