import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import "./Dashboard.css";

export default function Dashboard() {
	const [investments, setInvestments] = useState([]);
	const [details, setDetails] = useState({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		load();
	}, []);

	async function load() {
		setLoading(true);
		try {
			const list = await api.getInvestments();
			setInvestments(list);
			const pairs = await Promise.all(
				list.map(async (inv) => [inv.id, await api.getInvestment(inv.id)])
			);
			setDetails(Object.fromEntries(pairs));
		} catch (e) {
			console.error(e);
		}
		setLoading(false);
	}

	const totals = Object.values(details).reduce(
		(acc, d) => {
			acc.invested += d.moneyTrail?.invested || 0;
			acc.current += d.moneyTrail?.currentValue || 0;
			return acc;
		},
		{ invested: 0, current: 0 }
	);

	return (
		<div className="dashboard">
			<section className="dashboard-hero card">
				<div>
					<span className="pill-tag">🌸 Hiii Baad!</span>
					<h1>Your money garden</h1>
					<p>
						Here's everything you've planted so far — what you put in, and how it's
						grown. Fixed 8% a year, no scary surprises.
					</p>
				</div>
				<div className="dashboard-hero-stats">
					<div className="stat-blob">
						<span className="stat-label">You've invested</span>
						<span className="stat-value">₹{totals.invested.toFixed(2)}</span>
					</div>
					<div className="stat-blob stat-blob-mint">
						<span className="stat-label">Worth right now</span>
						<span className="stat-value">₹{totals.current.toFixed(2)}</span>
					</div>
				</div>
			</section>

			{loading && <p className="empty-state">Watering your plants… 🌱</p>}

			{!loading && investments.length === 0 && (
				<div className="empty-state card">
					<h3>No plans yet!</h3>
					<p>Let's plant your first seed. It only takes a minute.</p>
					<Link to="/plans" className="btn">
						🌱 See plans
					</Link>
				</div>
			)}

			<div className="grid cols-2">
				{investments.map((inv) => (
					<InvestmentCard key={inv.id} investment={inv} detail={details[inv.id]} onChange={load} />
				))}
			</div>

			{investments.length > 0 && (
				<div className="dashboard-cta">
					<Link to="/plans" className="btn btn-secondary">
						➕ Start another plan
					</Link>
				</div>
			)}
		</div>
	);
}

function InvestmentCard({ investment, detail, onChange }) {
	const [busy, setBusy] = useState(false);
	if (!detail) return null;
	const { moneyTrail, payments, unpaidPenalties } = detail;

	const nextDue = (payments || []).find((p) => p.status === "pending" || p.status === "attempted");
	const isMature = new Date() >= new Date(investment.maturity_date);

	async function requestWithdraw() {
		setBusy(true);
		try {
			await api.requestWithdrawal(investment.id);
			alert(
				isMature
					? "Withdrawal requested! Soham will approve it soon. 🎉"
					: "Withdrawal requested — heads up, this is before maturity so a small charge (2 steamed momos 🥟) applies."
			);
			onChange();
		} catch (e) {
			alert(e.message);
		}
		setBusy(false);
	}

	return (
		<div className="card investment-card">
			<div className="investment-card-head">
				<h3>{investment.plan_name_snapshot}</h3>
				<span className="pill-tag">{investment.interval_type}</span>
			</div>
			<p className="investment-status">
				Status: <strong>{investment.status}</strong> · Matures{" "}
				{new Date(investment.maturity_date).toLocaleDateString()}
			</p>

			<div className="investment-numbers">
				<div>
					<span className="mini-label">Invested</span>
					<span className="mini-value">₹{moneyTrail.invested.toFixed(2)}</span>
				</div>
				<div>
					<span className="mini-label">Now worth</span>
					<span className="mini-value highlight">₹{moneyTrail.currentValue.toFixed(2)}</span>
				</div>
				<div>
					<span className="mini-label">Interest earned</span>
					<span className="mini-value">+₹{moneyTrail.interestEarned.toFixed(2)}</span>
				</div>
				<div>
					<span className="mini-label">Fixed rate</span>
					<span className="mini-value">{investment.interest_rate}% / yr</span>
				</div>
			</div>

			{unpaidPenalties?.length > 0 && (
				<div className="penalty-banner">
					🍔 {unpaidPenalties.length} unpaid penalty(ies) — {unpaidPenalties[0].penalty_units}{" "}
					{unpaidPenalties[0].penalty_item} owed for being late!
				</div>
			)}

			{nextDue && (
				<Link to={`/pay/${nextDue.id}`} className="btn btn-mint" style={{ marginTop: 12 }}>
					💰 Pay ₹{nextDue.amount} — due {new Date(nextDue.due_date).toLocaleDateString()}
				</Link>
			)}

			{investment.status === "active" && (
				<button className="btn btn-ghost" disabled={busy} onClick={requestWithdraw}>
					Request withdrawal {isMature ? "" : "(early — charge applies)"}
				</button>
			)}
		</div>
	);
}
