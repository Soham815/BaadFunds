import { round2 } from "./calculations.js";

const BAAD_KEY = "baad";

function memberKey(payerType, friendId) {
	return payerType === "baad" ? BAAD_KEY : friendId;
}

/**
 * Computes each member's net balance in an activity from its payment ledger.
 * Positive balance = the group owes this member money.
 * Negative balance = this member owes the group money.
 */
export function computeBalances(members, payments) {
	const balances = { [BAAD_KEY]: 0 };
	for (const m of members) balances[m.friend_id] = 0;

	const groupSize = members.length + 1; // + Baad

	for (const p of payments) {
		if (p.type === "expense") {
			const share = Number(p.amount) / groupSize;
			const payerKey = memberKey(p.payer_type, p.payer_friend_id);
			for (const key of Object.keys(balances)) {
				balances[key] += key === payerKey ? Number(p.amount) - share : -share;
			}
		} else if (p.type === "settlement") {
			const payerKey = memberKey(p.payer_type, p.payer_friend_id);
			const receiverKey = memberKey(p.receiver_type, p.receiver_friend_id);
			if (payerKey in balances) balances[payerKey] += Number(p.amount);
			if (receiverKey in balances) balances[receiverKey] -= Number(p.amount);
		}
	}

	for (const key of Object.keys(balances)) balances[key] = round2(balances[key]);
	return balances;
}

/**
 * Greedy min-transaction debt simplification: matches the biggest creditor
 * with the biggest debtor repeatedly until everyone nets to ~zero.
 * `members` is [{ key, name, type }] — key matches computeBalances' keys.
 */
export function simplifyDebts(balances, memberInfo) {
	const infoByKey = Object.fromEntries(memberInfo.map((m) => [m.key, m]));

	const creditors = [];
	const debtors = [];
	for (const [key, amount] of Object.entries(balances)) {
		if (amount > 0.01) creditors.push({ key, amount });
		else if (amount < -0.01) debtors.push({ key, amount: -amount });
	}
	creditors.sort((a, b) => b.amount - a.amount);
	debtors.sort((a, b) => b.amount - a.amount);

	const settlements = [];
	let i = 0;
	let j = 0;
	while (i < debtors.length && j < creditors.length) {
		const d = debtors[i];
		const c = creditors[j];
		const amt = Math.min(d.amount, c.amount);
		settlements.push({
			from: infoByKey[d.key] || { key: d.key, name: "Unknown", type: "friend" },
			to: infoByKey[c.key] || { key: c.key, name: "Unknown", type: "friend" },
			amount: round2(amt),
		});
		d.amount -= amt;
		c.amount -= amt;
		if (d.amount < 0.01) i++;
		if (c.amount < 0.01) j++;
	}
	return settlements;
}

export { BAAD_KEY };
