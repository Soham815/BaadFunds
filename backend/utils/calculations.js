// Real-world-accurate (enough) compounding math for BaadFunds.
// We use daily compounding on every individual contribution, which is how
// a real fixed-rate recurring deposit / SIP-style product would accrue.

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(a, b) {
	return Math.max(0, Math.floor((b - a) / DAY_MS));
}

/** Future value of a single contribution, compounded daily at annual rate r (%) */
export function futureValue(amount, annualRatePct, fromDate, toDate = new Date()) {
	const r = annualRatePct / 100;
	const days = daysBetween(new Date(fromDate), new Date(toDate));
	return amount * Math.pow(1 + r / 365, days);
}

/**
 * Given a list of approved payments (each {amount, approved_at}),
 * returns { invested, currentValue, interestEarned }
 */
export function computeCurrentValue(payments, annualRatePct, asOf = new Date()) {
	let invested = 0;
	let currentValue = 0;
	for (const p of payments) {
		const base = Number(p.amount);
		invested += base;
		currentValue += futureValue(base, annualRatePct, p.approved_at || p.created_at, asOf);
	}
	return {
		invested: round2(invested),
		currentValue: round2(currentValue),
		interestEarned: round2(currentValue - invested),
	};
}

/**
 * Projects what a recurring plan will be worth at maturity, for the SIP calculator.
 * intervalType: 'daily' | 'monthly' | 'lumpsum'
 */
export function projectMaturity({
	intervalType,
	contributionAmount,
	annualRatePct,
	maturityMonths,
}) {
	const r = annualRatePct / 100;
	let totalInvested = 0;
	let futureVal = 0;

	if (intervalType === "lumpsum") {
		totalInvested = contributionAmount;
		const days = maturityMonths * 30;
		futureVal = contributionAmount * Math.pow(1 + r / 365, days);
	} else {
		const stepsPerMonth = intervalType === "daily" ? 30 : 1;
		const totalSteps = stepsPerMonth * maturityMonths;
		const dayStep = intervalType === "daily" ? 1 : 30;

		for (let i = 0; i < totalSteps; i++) {
			totalInvested += contributionAmount;
			const daysRemaining = (totalSteps - i) * dayStep;
			futureVal += contributionAmount * Math.pow(1 + r / 365, daysRemaining);
		}
	}

	return {
		totalInvested: round2(totalInvested),
		maturityValue: round2(futureVal),
		interestEarned: round2(futureVal - totalInvested),
	};
}

/** Year-by-year (or step-by-step) growth chart data for the calculator */
export function projectionSeries({
	intervalType,
	contributionAmount,
	annualRatePct,
	maturityMonths,
}) {
	const points = [];
	const monthsStep = 1;
	for (let m = monthsStep; m <= maturityMonths; m += monthsStep) {
		const partial = projectMaturity({
			intervalType,
			contributionAmount,
			annualRatePct,
			maturityMonths: m,
		});
		points.push({ month: m, ...partial });
	}
	return points;
}

export function round2(n) {
	return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function isPastMidnight(dueDateStr) {
	const due = new Date(dueDateStr + "T23:59:59");
	return new Date() > due;
}
