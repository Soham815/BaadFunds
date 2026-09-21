function desireTier(desire) {
	if (desire <= 33) return "low";
	if (desire <= 66) return "medium";
	return "high";
}

const HOPEFUL_OPENERS = {
	low: ["Hope this comes your way soon 🌷", "Fingers crossed for this one 🤞"],
	medium: [
		"Really hoping you get this soon! Rooting for you 💫",
		"I've got a good feeling about this one 🌸",
	],
	high: [
		"Ahh I can already imagine how happy you'll be!! Manifesting this for you 🥹💖",
		"OK this one feels important — sending all the good vibes your way!! ✨",
	],
};

const TIMEFRAME_CLAUSES = {
	days: "any day now!",
	weeks: "in just a few weeks!",
	months: "before you know it!",
	years: "well, good things take time — but it'll be so worth the wait!",
	null: "sometime soon, hopefully sooner than later!",
};

function randomFrom(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

export function hopefulMessage(desire, timeframe) {
	const tier = desireTier(desire);
	const opener = randomFrom(HOPEFUL_OPENERS[tier]);
	const clause = TIMEFRAME_CLAUSES[timeframe || "null"];
	return `${opener} ${clause}`;
}

function expectedRangeDays(timeframe) {
	switch (timeframe) {
		case "days":
			return [0, 6];
		case "weeks":
			return [7, 27];
		case "months":
			return [28, 364];
		case "years":
			return [365, Infinity];
		default:
			return [0, 30]; // unspecified — assume "somewhere between days and months"
	}
}

function timingCategory(want) {
	const [lo, hi] = expectedRangeDays(want.expected_timeframe);
	const d = want.completed_duration_days ?? 0;
	if (d < lo) return "faster";
	if (d > hi) return "slower";
	return "on_time";
}

const CONGRATS_OPENERS = {
	low: ["Aww, that's so nice!", "Glad you finally got it!", "That's lovely news!"],
	medium: ["I'm SO happy for you!!", "Yesss, you got it!!", "This makes me so happy!! 🥰"],
	high: [
		"OH MY GOSH YOU GOT IT!!! 🎉🎉",
		"I am SCREAMING with joy for you!!",
		"THIS IS HUGE. Congratulations!!! 🥳",
	],
};

const TIMING_CLOSERS = {
	faster: "and even sooner than expected — lucky you! 🍀",
	on_time: "right around when you hoped for it 💫",
	slower: "It took a little longer, but good things come to those who wait 🌷",
};

export function congratsMessage(want) {
	const tier = desireTier(want.desire ?? 50);
	const opener = randomFrom(CONGRATS_OPENERS[tier]);
	const closer = TIMING_CLOSERS[timingCategory(want)];
	return `${opener} You got "${want.title}" ${closer}`;
}

// pale lavender (low desire) -> vivid coral (high desire)
function hexToRgb(hex) {
	const n = parseInt(hex.replace("#", ""), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex([r, g, b]) {
	return (
		"#" +
		[r, g, b]
			.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
			.join("")
	);
}

export function frameColorForDesire(desire = 50) {
	const start = hexToRgb("e7dbff");
	const end = hexToRgb("ff5c7a");
	const t = Math.max(0, Math.min(100, desire)) / 100;
	const mixed = start.map((s, i) => s + (end[i] - s) * t);
	return rgbToHex(mixed);
}

export function timeframeLabel(timeframe) {
	switch (timeframe) {
		case "days":
			return "Days";
		case "weeks":
			return "Weeks";
		case "months":
			return "Months";
		case "years":
			return "Years";
		default:
			return "Not sure yet";
	}
}
