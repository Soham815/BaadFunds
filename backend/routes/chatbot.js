import express from "express";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

// A small, friendly, rule-based knowledge base. No external AI key needed —
// this keeps things simple, free, and fully under our control.
const KB = [
	{
		keywords: ["sip", "systematic"],
		reply:
			"A SIP (Systematic Investment Plan) means putting in a small fixed amount regularly — daily or monthly — instead of one big lump sum. It's less scary on your wallet and it lets compounding work quietly in the background. That's exactly what your Daily and Monthly plans here do! 🌱",
	},
	{
		keywords: ["compound", "compounding", "interest work", "how does interest"],
		reply:
			"Compounding is interest earning interest! Say you invest ₹100 at 8% a year — next year you don't just earn 8% on ₹100 forever, you earn 8% on ₹108, then on that new total, and so on. The longer you leave it, the faster it snowballs. 🐹",
	},
	{
		keywords: ["mutual fund", "mutual funds"],
		reply:
			"A mutual fund pools money from lots of people and a professional manager invests it in stocks, bonds, or both. You own a slice of the whole pool. Returns aren't fixed like our plans here — they move with the market, up and down.",
	},
	{
		keywords: ["bond", "bonds"],
		reply:
			"A bond is basically a loan YOU give to a company or government. They pay you back later with fixed interest along the way. Much steadier than stocks, which is why our fixed 8% plans here are inspired by how bonds behave.",
	},
	{
		keywords: ["penalty", "burger", "late"],
		reply:
			"If a payment is due and it isn't made by midnight, a little penalty kicks in — here that's 2 burgers 🍔🍔. In the real world, that's usually a late fee or lost interest for that period. Paying on time is always the cheaper option!",
	},
	{
		keywords: ["momo", "withdraw", "withdrawal", "early exit"],
		reply:
			"Withdrawing before your plan matures usually costs something — here it's 2 steamed momos 🥟🥟. In real investing this is called an 'exit load' or early-withdrawal penalty. Plans reward patience!",
	},
	{
		keywords: ["loan"],
		reply:
			"A loan is money you borrow now and pay back later — usually with interest on top, because the lender is taking a risk on you. Ours here is playfully priced at 50% a month, so paying it back quickly really matters. Real-world loans work the same way, just usually with smaller interest!",
	},
	{
		keywords: ["maturity", "mature", "lock"],
		reply:
			"Maturity date is simply the day your plan's lock-in period ends and you can withdraw everything penalty-free. Think of it like a plant finally ready to be picked. 🌻",
	},
	{
		keywords: ["interest rate", "8%", "rate"],
		reply:
			"Our plans currently pay a fixed 8% per year. That means, roughly, ₹100 grows into ₹108 after one year if left untouched. Fixed rates like this are steady and predictable, unlike the stock market.",
	},
	{
		keywords: ["risk", "safe", "safety"],
		reply:
			"Fixed-rate plans (like bonds or these BaadFunds plans) are lower risk — you know roughly what you'll get. Mutual funds and stocks can grow faster but can also fall. A healthy real-world portfolio often mixes both!",
	},
	{
		keywords: ["hi", "hello", "hey"],
		reply: "Hiii Baad! 🐷 I'm Soham, your money buddy. Ask me anything about SIPs, interest, loans, or how your plans work!",
	},
];

const FALLBACK =
	"Hmm, I'm still learning that one! Try asking me about SIPs, compounding, mutual funds, bonds, loans, penalties, or maturity — those I know really well. 💭";

function findReply(message) {
	const lower = message.toLowerCase();
	for (const entry of KB) {
		if (entry.keywords.some((k) => lower.includes(k))) {
			return entry.reply;
		}
	}
	return FALLBACK;
}

router.post("/", async (req, res) => {
	const { message } = req.body;
	if (!message) return res.status(400).json({ error: "message is required" });

	const reply = findReply(message);

	// best-effort logging; ignore failures so chat never breaks if the table's missing
	try {
		await supabase.from("chat_messages").insert([
			{ sender: "baad", message },
			{ sender: "soham", message: reply },
		]);
	} catch (_) {}

	res.json({ reply });
});

export default router;
