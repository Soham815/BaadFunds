import React, { useEffect, useState } from "react";
import { api } from "../../api.js";

const empty = {
	name: "",
	description: "",
	interval_type: "daily",
	min_amount: 10,
	interest_rate: 8,
	maturity_months: 12,
};

export default function AdminPlans() {
	const [plans, setPlans] = useState([]);
	const [form, setForm] = useState(empty);
	const [busy, setBusy] = useState(false);
	const [editingId, setEditingId] = useState(null);

	useEffect(() => {
		load();
	}, []);

	function load() {
		api.getAllPlansAdmin().then(setPlans);
	}

	function updateField(key, value) {
		setForm((f) => ({ ...f, [key]: value }));
	}

	async function handleSubmit(e) {
		e.preventDefault();
		setBusy(true);
		try {
			if (editingId) {
				await api.updatePlan(editingId, form);
			} else {
				await api.createPlan(form);
			}
			setForm(empty);
			setEditingId(null);
			load();
		} catch (err) {
			alert(err.message);
		}
		setBusy(false);
	}

	function startEdit(plan) {
		setEditingId(plan.id);
		setForm({
			name: plan.name,
			description: plan.description,
			interval_type: plan.interval_type,
			min_amount: plan.min_amount,
			interest_rate: plan.interest_rate,
			maturity_months: plan.maturity_months,
		});
	}

	async function toggleActive(plan) {
		await api.updatePlan(plan.id, { is_active: !plan.is_active });
		load();
	}

	return (
		<div>
			<div className="card">
				<div className="admin-section-title">
					<h2>{editingId ? "Edit plan" : "New plan"}</h2>
					{editingId && (
						<button
							className="btn btn-ghost"
							onClick={() => {
								setEditingId(null);
								setForm(empty);
							}}
						>
							Cancel edit
						</button>
					)}
				</div>
				<form onSubmit={handleSubmit}>
					<div className="admin-form-grid">
						<div className="field">
							<label>Name</label>
							<input value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
						</div>
						<div className="field">
							<label>Interval</label>
							<select value={form.interval_type} onChange={(e) => updateField("interval_type", e.target.value)}>
								<option value="daily">Daily</option>
								<option value="monthly">Monthly</option>
								<option value="lumpsum">Lumpsum</option>
							</select>
						</div>
						<div className="field">
							<label>Min amount (₹)</label>
							<input
								type="number"
								value={form.min_amount}
								onChange={(e) => updateField("min_amount", Number(e.target.value))}
							/>
						</div>
						<div className="field">
							<label>Interest rate (% / yr)</label>
							<input
								type="number"
								step="0.1"
								value={form.interest_rate}
								onChange={(e) => updateField("interest_rate", Number(e.target.value))}
							/>
						</div>
						<div className="field">
							<label>Maturity (months)</label>
							<input
								type="number"
								value={form.maturity_months}
								onChange={(e) => updateField("maturity_months", Number(e.target.value))}
							/>
						</div>
					</div>
					<div className="field">
						<label>Description</label>
						<textarea
							rows="2"
							value={form.description}
							onChange={(e) => updateField("description", e.target.value)}
						/>
					</div>
					<button className="btn" disabled={busy}>
						{busy ? "Saving…" : editingId ? "Save changes" : "➕ Create plan"}
					</button>
				</form>
			</div>

			<div className="admin-list" style={{ marginTop: 20 }}>
				{plans.map((plan) => (
					<div key={plan.id} className="card admin-row">
						<div>
							<strong>{plan.name}</strong> · {plan.interval_type} · {plan.interest_rate}% ·{" "}
							{plan.maturity_months}mo
							{!plan.is_active && <span className="badge danger" style={{ marginLeft: 8 }}>inactive</span>}
						</div>
						<div className="admin-row-actions">
							<button className="btn btn-secondary" onClick={() => startEdit(plan)}>
								Edit
							</button>
							<button className="btn btn-ghost" onClick={() => toggleActive(plan)}>
								{plan.is_active ? "Deactivate" : "Activate"}
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
