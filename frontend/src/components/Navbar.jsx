import React from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
	return (
		<header className="navbar">
			<NavLink to="/" className="navbar-brand">
				<span className="navbar-piggy">🐷</span> BaadFunds
			</NavLink>
			<nav className="navbar-links">
				<NavLink to="/" end className={navClass}>
					Dashboard
				</NavLink>
				<NavLink to="/plans" className={navClass}>
					Plans
				</NavLink>
				<NavLink to="/calculator" className={navClass}>
					Calculator
				</NavLink>
				<NavLink to="/loan" className={navClass}>
					Loan
				</NavLink>
			</nav>
		</header>
	);
}

function navClass({ isActive }) {
	return isActive ? "navbar-link active" : "navbar-link";
}
