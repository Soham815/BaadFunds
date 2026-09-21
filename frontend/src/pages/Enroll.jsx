import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import "../styles/Enroll.css";

export default function Enroll() {
	const { planId } = useParams();
	const navigate = useNavigate();
	const [plan, setPlan] = useState(null);
	const [amount, setAmount] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		api.getPlans().then((plans) => {
			const found = plans.find((p) => p.id === planId);
			setPlan(found);
			if (found) setAmount(found.min_amount);
		});
	}, [planId]);

	async function handleSubmit(e) {
		e.preventDefault();
		setError("");
		setBusy(true);
		try {
			const investment = await api.enroll({
				plan_id: planId,
				contribution_amount: Number(amount),
			});
			navigate("/", { state: { justEnrolled: investment.id } });
		} catch (err) {
			setError(err.message);
		}
		setBusy(false);
	}

	if (!plan) return <p className="empty-state">Loading plan…</p>;

	return (
		<div className="enroll-page">
			<div className="card enroll-card">
				<span className="pill-tag">🌱 New plan</span>
				<h1>{plan.name}</h1>
				<p>{plan.description}</p>

				<div className="enroll-facts">
					<div>
						<span className="mini-label">Fixed rate</span>
						<span className="mini-value">{plan.interest_rate}%/yr</span>
					</div>
					<div>
						<span className="mini-label">Pay</span>
						<span className="mini-value">{plan.interval_type}</span>
					</div>
					<div>
						<span className="mini-label">Matures</span>
						<span className="mini-value">{plan.maturity_months}mo</span>
					</div>
				</div>

				<form onSubmit={handleSubmit}>
					<div className="field">
						<label>
							How much per {plan.interval_type === "lumpsum" ? "one-time payment" : plan.interval_type.replace("ly", "")}?
						</label>
						<input
							type="number"
							min={plan.min_amount}
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							required
						/>
						<small style={{ color: "var(--plum-soft)" }}>
							Minimum ₹{plan.min_amount}
						</small>
					</div>

					{error && <p style={{ color: "#e63e63" }}>{error}</p>}

					<button className="btn" type="submit" disabled={busy}>
						{busy ? "Planting…" : "🌷 Confirm plan"}
					</button>
				</form>
			</div>
		</div>
	);
}
