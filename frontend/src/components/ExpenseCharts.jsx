import React from "react";
import {
	PieChart,
	Pie,
	Cell,
	Tooltip,
	Legend,
	ResponsiveContainer,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
} from "recharts";
import { categoryColor } from "../utils/expenseCategories.js";
import "../styles/ExpenseCharts.css";

export function CategoryPieChart({ data, title }) {
	if (!data || data.length === 0) {
		return (
			<div className="expense-chart-empty">
				<p>No expenses here yet — nothing to chart!</p>
			</div>
		);
	}
	return (
		<div className="expense-chart-card">
			<h3>{title}</h3>
			<ResponsiveContainer width="100%" height={280}>
				<PieChart>
					<Pie
						data={data}
						dataKey="amount"
						nameKey="category"
						cx="50%"
						cy="50%"
						outerRadius={95}
						label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
					>
						{data.map((entry) => (
							<Cell key={entry.category} fill={categoryColor(entry.category)} />
						))}
					</Pie>
					<Tooltip formatter={(value) => `₹${value}`} />
					<Legend />
				</PieChart>
			</ResponsiveContainer>
		</div>
	);
}

export function YearBarChart({ data, year }) {
	return (
		<div className="expense-chart-card">
			<h3>Spending by month — {year}</h3>
			<ResponsiveContainer width="100%" height={280}>
				<BarChart data={data}>
					<CartesianGrid strokeDasharray="3 3" stroke="#f0e6ff" />
					<XAxis dataKey="label" tick={{ fontSize: 12 }} />
					<YAxis tick={{ fontSize: 12 }} />
					<Tooltip formatter={(value) => `₹${value}`} />
					<Bar dataKey="total" fill="#ff9ecb" radius={[8, 8, 0, 0]} />
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
