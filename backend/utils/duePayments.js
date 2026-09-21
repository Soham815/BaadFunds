import { supabase } from "../supabaseClient.js";
import { isPastMidnight } from "./calculations.js";

export function addMonths(date, months) {
	const d = new Date(date);
	d.setMonth(d.getMonth() + months);
	return d;
}
export function addDays(date, days) {
	const d = new Date(date);
	d.setDate(d.getDate() + days);
	return d;
}
export function toISODate(d) {
	return d.toISOString().slice(0, 10);
}

/**
 * Makes sure every due interval between the investment's start and today
 * has a payment row (creates missing ones as 'pending'), and flags any
 * pending/attempted payment whose due date has passed midnight as a penalty.
 */
export async function syncDuePayments(investment) {
	if (investment.interval_type === "lumpsum" || investment.status !== "active") return;

	const { data: existing } = await supabase
		.from("payments")
		.select("due_date")
		.eq("investment_id", investment.id);
	const existingDates = new Set((existing || []).map((p) => p.due_date));

	const today = new Date();
	let cursor = new Date(investment.start_date);
	const toInsert = [];

	while (cursor <= today) {
		const iso = toISODate(cursor);
		if (!existingDates.has(iso)) {
			toInsert.push({
				investment_id: investment.id,
				due_date: iso,
				amount: investment.contribution_amount,
				status: "pending",
			});
		}
		cursor =
			investment.interval_type === "daily" ? addDays(cursor, 1) : addMonths(cursor, 1);
	}

	if (toInsert.length) {
		await supabase.from("payments").insert(toInsert);
	}

	// Flag penalties for anything overdue and still not approved
	const { data: pending } = await supabase
		.from("payments")
		.select("*")
		.eq("investment_id", investment.id)
		.in("status", ["pending", "attempted"]);

	for (const p of pending || []) {
		if (isPastMidnight(p.due_date) && !p.is_penalty) {
			await supabase
				.from("payments")
				.update({ is_penalty: true, penalty_units: 2, penalty_item: "burgers" })
				.eq("id", p.id);
		}
	}
}

/** Runs syncDuePayments across every active investment (used by admin reminders) */
export async function syncAllActiveInvestments() {
	const { data: investments } = await supabase
		.from("investments")
		.select("*")
		.eq("status", "active");
	for (const inv of investments || []) {
		await syncDuePayments(inv);
	}
}
