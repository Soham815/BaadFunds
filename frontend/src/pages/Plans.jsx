import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import "./Plans.css";

const ICONS = { daily: "☀️", monthly: "🌙", lumpsum: "🎁" };

export default function Plans() {
	const [plans, setPlans] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		api
			.getPlans()
			.then(setPlans)
			.finally(() => setLoading(false));
	}, []);

	return (
		<div>
			<div className="plans-intro card">
				<h1>Pick your plant 🌷</h1>
				<p>
					Every plan grows at a fixed <strong>8% a year</strong> — the difference is just
					how often you water it (invest) and how long it needs to bloom (maturity).
				</p>
			</div>

			{loading && <p className="empty-state">Loading plans…</p>}

			<div className="grid cols-2" style={{ marginTop: 20 }}>
				{plans.map((plan) => (
					<div key={plan.id} className="card plan-card">
						<div className="plan-icon">{ICONS[plan.interval_type] || "🌱"}</div>
						<h3>{plan.name}</h3>
						<p>{plan.description || "A steady little plan to grow your savings."}</p>
						<ul className="plan-facts">
							<li>
								<strong>{plan.interest_rate}%</strong> fixed / year
							</li>
							<li>
								Pay <strong>{plan.interval_type}</strong>, min ₹{plan.min_amount}
							</li>
							<li>
								Matures in <strong>{plan.maturity_months} months</strong>
							</li>
						</ul>
						<Link to={`/enroll/${plan.id}`} className="btn">
							Start this plan
						</Link>
					</div>
				))}
			</div>

			{!loading && plans.length === 0 && (
				<div className="empty-state card">
					<h3>No plans available right now</h3>
					<p>Ask Soham to create one in the admin panel!</p>
				</div>
			)}
		</div>
	);
}
