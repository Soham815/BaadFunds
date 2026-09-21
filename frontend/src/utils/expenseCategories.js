const CATEGORY_COLORS = {
	"Daily Needs": "#ffc2de",
	Trips: "#bdf3d4",
	Skincare: "#e7dbff",
	Food: "#ffe08a",
	"Clothing & Accessories": "#ff9ecb",
	Investments: "#7fe0a8",
	"Group Expenses": "#8ecbe0",
};

/** Known categories get a fixed pastel; custom ones get a stable hash-based pastel. */
export function categoryColor(name) {
	if (CATEGORY_COLORS[name]) return CATEGORY_COLORS[name];
	let hash = 0;
	for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
	const hue = Math.abs(hash) % 360;
	return `hsl(${hue}, 65%, 80%)`;
}

export const MONTH_NAMES = [
	"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const SARCASTIC_MESSAGES = [
	(month, amount) =>
		`Ooh, ${month} really said "let's see how fast I can spend ₹${amount}" 💸😂 Maybe let's be besties with our wallet next month?`,
	(month, amount) =>
		`${month} was... a whole vibe, spending-wise (₹${amount}). No judgment. Okay, a little judgment. 👀`,
	(month, amount) =>
		`Breaking news: ${month} single-handedly carried your yearly expenses (₹${amount}). Iconic, but maybe rest now? 🎀`,
	(month, amount) =>
		`${month} out here spending ₹${amount} like it's a competitive sport 🏅 We love the confidence though.`,
	(month, amount) =>
		`Just so you know, ${month} owes your savings an apology (₹${amount} 😭). It's giving "treat yourself," and also giving "oops."`,
];

export function highestMonthMessage(monthName, amount) {
	const picker = SARCASTIC_MESSAGES[Math.floor(Math.random() * SARCASTIC_MESSAGES.length)];
	return picker(monthName, amount.toLocaleString());
}
