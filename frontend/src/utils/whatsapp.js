const BAAD_NUMBER = import.meta.env.VITE_BAAD_WHATSAPP_NUMBER || "";
const SITE_URL = import.meta.env.VITE_BAADFUNDS_URL || "";

export function baadWhatsAppLink(message) {
	return whatsAppLinkTo(BAAD_NUMBER, message);
}

/** Generic wa.me link builder — used for messaging any friend's number too. */
export function whatsAppLinkTo(number, message) {
	const digits = (number || "").replace(/[^\d]/g, "");
	return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function activityDebtMessage({ activityName, amount, toName }) {
	const link = SITE_URL ? `\n\n${SITE_URL}` : "";
	return `Heyy! For "${activityName}", you owe ₹${amount} to ${toName}. Whenever you get a chance, no rush at all! 💸💛${link}`;
}

export function dueReminderMessage(payment) {
	const plan = payment.investments?.plan_name_snapshot || "your plan";
	const amount = payment.amount;
	const dueDate = new Date(payment.due_date).toLocaleDateString();
	const link = SITE_URL ? `\n\n${SITE_URL}` : "";

	if (payment.is_overdue) {
		const penaltyLine = payment.is_penalty
			? `\n\nHeads up — since it's late, a little penalty of ${payment.penalty_units || 2} ${
					payment.penalty_item || "burgers"
			  } has kicked in 🍔 (no stress, just settle it whenever!)`
			: "";
		return `Hiii Baad! 🐷 Just a gentle nudge — your payment of ₹${amount} for ${plan} was due on ${dueDate} and hasn't come through yet.${penaltyLine}${link}`;
	}

	if (payment.days_until_due === 0) {
		return `Hiii Baad! 🐷 Your payment of ₹${amount} for ${plan} is due TODAY. Whenever you get a sec! 💛${link}`;
	}

	return `Hiii Baad! 🌱 Friendly reminder — your payment of ₹${amount} for ${plan} is due in ${payment.days_until_due} day${
		payment.days_until_due === 1 ? "" : "s"
	} (${dueDate}). No rush, just didn't want you to forget! 💌${link}`;
}

export function penaltyReminderMessage(penalty) {
	const plan = penalty.investments?.plan_name_snapshot || "your plan";
	const link = SITE_URL ? `\n\n${SITE_URL}` : "";
	return `Hiii Baad! 🍔 You've got a little unpaid penalty — ${penalty.penalty_units || 2} ${
		penalty.penalty_item || "burgers"
	} — from being a bit late on ${plan}. Whenever you're free, let's settle it! 💕${link}`;
}
