import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { CategoryPieChart, YearBarChart } from "./ExpenseCharts.jsx";
import { MONTH_NAMES, highestMonthMessage, categoryColor } from "../utils/expenseCategories.js";
import "../styles/MyExpensesTab.css";

function currentMonthStr() {
	return new Date().toISOString().slice(0, 7);
}

export default function MyExpensesTab() {
	const [categories, setCategories] = useState([]);
	const [expenses, setExpenses] = useState([]);
	const [monthSummary, setMonthSummary] = useState(null);
	const [overallSummary, setOverallSummary] = useState(null);
	const [yearSummary, setYearSummary] = useState(null);
	const [year, setYear] = useState(new Date().getFullYear());
	const [pieView, setPieView] = useState("month");

	// form
	const [amount, setAmount] = useState("");
	const [category, setCategory] = useState("");
	const [addingCategory, setAddingCategory] = useState(false);
	const [newCategory, setNewCategory] = useState("");
	const [note, setNote] = useState("");
	const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		loadAll();
	}, []);

	useEffect(() => {
		api.getYearSummary(year).then(setYearSummary);
	}, [year]);

	function loadAll() {
		api.getExpenseCategories().then((cats) => {
			setCategories(cats);
			if (cats.length && !category) setCategory(cats[0].name);
		});
		api.getExpenses().then(setExpenses);
		api.getMonthSummary(currentMonthStr()).then(setMonthSummary);
		api.getOverallSummary().then(setOverallSummary);
		api.getYearSummary(year).then(setYearSummary);
	}

	async function handleAddCategory() {
		if (!newCategory.trim()) return;
		const created = await api.addExpenseCategory(newCategory.trim());
		setCategories((c) => [...c, created].sort((a, b) => a.name.localeCompare(b.name)));
		setCategory(created.name);
		setNewCategory("");
		setAddingCategory(false);
	}

	async function handleAdd(e) {
		e.preventDefault();
		if (!amount || !category) return;
		setBusy(true);
		try {
			await api.createExpense({ amount: Number(amount), category, note, expense_date: date });
			setAmount("");
			setNote("");
			loadAll();
		} catch (err) {
			alert(err.message);
		}
		setBusy(false);
	}

	async function removeExpense(id) {
		if (!confirm("Delete this expense?")) return;
		await api.deleteExpense(id);
		loadAll();
	}

	const yearBarData = useMemo(() => {
		if (!yearSummary) return [];
		return yearSummary.monthlyTotals.map((m) => ({
			label: MONTH_NAMES[m.month - 1],
			total: m.total,
		}));
	}, [yearSummary]);

	const [highestMsg, setHighestMsg] = useState("");
	useEffect(() => {
		if (yearSummary?.highestMonth) {
			setHighestMsg(
				highestMonthMessage(MONTH_NAMES[yearSummary.highestMonth.month - 1], yearSummary.highestMonth.total)
			);
		} else {
			setHighestMsg("");
		}
	}, [yearSummary]);

	const pieData = pieView === "month" ? monthSummary?.byCategory : overallSummary?.byCategory;

	return (
		<div className="my-expenses">
			<div className="expense-stats-row">
				<div className="expense-stat-blob">
					<span className="stat-label">This month</span>
					<span className="stat-value">₹{(monthSummary?.total ?? 0).toLocaleString()}</span>
				</div>
				<div className="expense-stat-blob expense-stat-mint">
					<span className="stat-label">All time</span>
					<span className="stat-value">₹{(overallSummary?.total ?? 0).toLocaleString()}</span>
				</div>
			</div>

			<div className="card expense-form-card">
				<h2>Log an expense</h2>
				<form onSubmit={handleAdd}>
					<div className="grid cols-3">
						<div className="field">
							<label>Amount (₹)</label>
							<input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
						</div>
						<div className="field">
							<label>Category</label>
							{!addingCategory ? (
								<select value={category} onChange={(e) => setCategory(e.target.value)}>
									{categories.map((c) => (
										<option key={c.id} value={c.name}>
											{c.name}
										</option>
									))}
								</select>
							) : (
								<div style={{ display: "flex", gap: 6 }}>
									<input
										value={newCategory}
										onChange={(e) => setNewCategory(e.target.value)}
										placeholder="New category name"
										autoFocus
									/>
									<button type="button" className="btn btn-mint" onClick={handleAddCategory}>
										✓
									</button>
								</div>
							)}
							{!addingCategory && (
								<button
									type="button"
									className="btn btn-ghost"
									style={{ padding: "4px 8px", fontSize: 12 }}
									onClick={() => setAddingCategory(true)}
								>
									+ New category
								</button>
							)}
						</div>
						<div className="field">
							<label>Date</label>
							<input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
						</div>
					</div>
					<div className="field">
						<label>Note (optional)</label>
						<input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was it for?" />
					</div>
					<button className="btn" disabled={busy}>
						{busy ? "Saving…" : "💸 Add expense"}
					</button>
				</form>
			</div>

			<div className="grid cols-2">
				<div>
					<div className="expense-pie-toggle">
						<button className={pieView === "month" ? "active" : ""} onClick={() => setPieView("month")}>
							This month
						</button>
						<button className={pieView === "overall" ? "active" : ""} onClick={() => setPieView("overall")}>
							All time
						</button>
					</div>
					<CategoryPieChart data={pieData} title={pieView === "month" ? "Where it went this month" : "Where it's all gone"} />
				</div>

				<div>
					<div className="expense-year-toggle">
						<button onClick={() => setYear((y) => y - 1)}>◀</button>
						<span>{year}</span>
						<button onClick={() => setYear((y) => y + 1)}>▶</button>
					</div>
					<YearBarChart data={yearBarData} year={year} />
				</div>
			</div>

			{highestMsg && (
				<div className="card expense-sarcasm-card">
					<p>{highestMsg}</p>
				</div>
			)}

			<div className="card expense-recent-card">
				<h2>Recent expenses</h2>
				{expenses.length === 0 && <p className="empty-state">Nothing logged yet!</p>}
				<div className="expense-recent-list">
					{expenses.slice(0, 15).map((e) => (
						<div key={e.id} className="expense-recent-row">
							<span className="expense-cat-dot" style={{ background: categoryColor(e.category) }} />
							<div className="expense-recent-info">
								<strong>₹{e.amount}</strong> — {e.category}
								{e.note && <span className="expense-note"> · {e.note}</span>}
								<div className="expense-recent-date">{new Date(e.expense_date).toLocaleDateString()}</div>
							</div>
							{e.source === "manual" && (
								<button className="expense-delete-btn" onClick={() => removeExpense(e.id)} title="Delete">
									🗑️
								</button>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
