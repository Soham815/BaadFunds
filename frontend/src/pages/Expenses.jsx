import React, { useState } from "react";
import MyExpensesTab from "../components/MyExpensesTab.jsx";
import GroupExpensesTab from "../components/GroupExpensesTab.jsx";
import "../styles/Expenses.css";

export default function Expenses() {
	const [tab, setTab] = useState("mine");

	return (
		<div className="expenses-page">
			<div className="card expenses-intro">
				<h1>💸 Expense Tracker</h1>
				<p>See where it's all going, and split the fun stuff with friends.</p>
			</div>

			<div className="expenses-tabs">
				<button className={tab === "mine" ? "active" : ""} onClick={() => setTab("mine")}>
					🧾 My Expenses
				</button>
				<button className={tab === "group" ? "active" : ""} onClick={() => setTab("group")}>
					👯 Group Expenses
				</button>
			</div>

			{tab === "mine" ? <MyExpensesTab /> : <GroupExpensesTab />}
		</div>
	);
}
