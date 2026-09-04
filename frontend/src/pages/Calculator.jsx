import React, { useMemo, useState } from "react";
import "./Calculator.css";

function projectMaturity({ intervalType, contributionAmount, annualRatePct, maturityMonths }) {
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
function round2(n) {
	return Math.round((n + Number.EPSILON) * 100) / 100;
}

const MILESTONES = [1, 3, 5, 10];

export default function Calculator() {
	const [intervalType, setIntervalType] = useState("monthly");
	const [amount, setAmount] = useState(500);
	const [rate, setRate] = useState(8);

	const milestoneResults = useMemo(
		() =>
			MILESTONES.map((years) => ({
				years,
				...projectMaturity({
					intervalType,
					contributionAmount: Number(amount) || 0,
					annualRatePct: Number(rate) || 0,
					maturityMonths: years * 12,
				}),
			})),
		[intervalType, amount, rate]
	);

	const maxValue = Math.max(...milestoneResults.map((m) => m.maturityValue), 1);

	return (
		<div className="calculator-page">
			<div className="card calc-intro">
				<h1>🧮 The Growing Calculator</h1>
				<p>
					Play around with the numbers and see how your little seeds could grow — this
					works exactly like a real SIP or fixed-deposit calculator, so it's useful
					outside BaadFunds too!
				</p>
			</div>

			<div className="card calc-form">
				<div className="grid cols-3">
					<div className="field">
						<label>How often do you invest?</label>
						<select value={intervalType} onChange={(e) => setIntervalType(e.target.value)}>
							<option value="daily">Daily</option>
							<option value="monthly">Monthly</option>
							<option value="lumpsum">One-time (lumpsum)</option>
						</select>
					</div>
					<div className="field">
						<label>Amount (₹) per {intervalType === "lumpsum" ? "one time" : intervalType.replace("ly", "")}</label>
						<input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
					</div>
					<div className="field">
						<label>Annual interest rate (%)</label>
						<input type="number" min="0" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} />
					</div>
				</div>
			</div>

			<div className="card calc-results">
				<h2>Growth over time</h2>
				<div className="calc-bars">
					{milestoneResults.map((m) => (
						<div className="calc-bar-col" key={m.years}>
							<div className="calc-bar-track">
								<div
									className="calc-bar-invested"
									style={{ height: `${(m.totalInvested / maxValue) * 100}%` }}
								/>
								<div
									className="calc-bar-interest"
									style={{ height: `${(m.interestEarned / maxValue) * 100}%` }}
								/>
							</div>
							<span className="calc-bar-label">{m.years}yr</span>
						</div>
					))}
				</div>
				<div className="calc-legend">
					<span><i className="dot dot-invested" /> Invested</span>
					<span><i className="dot dot-interest" /> Interest earned</span>
				</div>

				<table className="calc-table">
					<thead>
						<tr>
							<th>Years</th>
							<th>Total invested</th>
							<th>Interest earned</th>
							<th>Maturity value</th>
						</tr>
					</thead>
					<tbody>
						{milestoneResults.map((m) => (
							<tr key={m.years}>
								<td>{m.years}</td>
								<td>₹{m.totalInvested.toLocaleString()}</td>
								<td>+₹{m.interestEarned.toLocaleString()}</td>
								<td><strong>₹{m.maturityValue.toLocaleString()}</strong></td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
