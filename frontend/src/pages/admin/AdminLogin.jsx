import React, { useState } from "react";
import { api } from "../../api.js";
import "../../styles/Admin.css";

export default function AdminLogin() {
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);

	async function handleSubmit(e) {
		e.preventDefault();
		setBusy(true);
		setError("");
		try {
			const { token } = await api.adminLogin(password);
			localStorage.setItem("baadfunds_admin_token", token);
			window.location.reload();
		} catch (err) {
			setError(err.message);
		}
		setBusy(false);
	}

	return (
		<div className="admin-login-page">
			<form className="card admin-login-card" onSubmit={handleSubmit}>
				<h1>🔐 Soham's Control Room</h1>
				<p>This area is just for admin stuff — enter the password to continue.</p>
				<div className="field">
					<label>Admin password</label>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						autoFocus
						required
					/>
				</div>
				{error && <p style={{ color: "#e63e63" }}>{error}</p>}
				<button className="btn" disabled={busy}>
					{busy ? "Checking…" : "Enter"}
				</button>
			</form>
		</div>
	);
}
