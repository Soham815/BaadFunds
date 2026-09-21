import React, { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import "../styles/Navbar.css";

const HAMBURGER_ITEMS = [
	{ to: "/todo", label: "📝 To-Do List" },
	{ to: "/wants", label: "🎀 Wants List" },
	{ to: "/hangouts", label: "🏖️ Hangout List" },
	{ to: "/expenses", label: "💸 Expense Tracker" },
];

export default function Navbar() {
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef(null);

	useEffect(() => {
		function handleClickOutside(e) {
			if (menuRef.current && !menuRef.current.contains(e.target)) {
				setMenuOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<header className="navbar">
			<NavLink to="/" className="navbar-brand">
				<span className="navbar-piggy">🐷</span> BaadFunds
			</NavLink>
			<div className="navbar-right">
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

				<div className="navbar-hamburger-wrap" ref={menuRef}>
					<button
						className="navbar-hamburger-btn"
						onClick={() => setMenuOpen((o) => !o)}
						aria-label="More features"
						title="More fun stuff"
					>
						☰
					</button>
					{menuOpen && (
						<div className="navbar-hamburger-menu">
							<p className="navbar-hamburger-title">✨ Also for you, Baad</p>
							{HAMBURGER_ITEMS.map((item) => (
								<NavLink
									key={item.to}
									to={item.to}
									className="navbar-hamburger-link"
									onClick={() => setMenuOpen(false)}
								>
									{item.label}
								</NavLink>
							))}
						</div>
					)}
				</div>
			</div>
		</header>
	);
}

function navClass({ isActive }) {
	return isActive ? "navbar-link active" : "navbar-link";
}
