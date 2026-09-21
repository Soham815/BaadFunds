import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { baadWhatsAppLink, dueReminderMessage } from "../utils/whatsapp.js";
import "../styles/AdminDueReminderPopup.css";

const SHOWN_KEY = "baadfunds_admin_due_popup_date";

function todayIso() {
	return new Date().toISOString().slice(0, 10);
}

export default function AdminDueReminderPopup() {
	const [reminders, setReminders] = useState([]);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		api
			.getDueReminders()
			.then((data) => {
				if (!data || data.length === 0) return;
				setReminders(data);
				if (localStorage.getItem(SHOWN_KEY) !== todayIso()) {
					setVisible(true);
				}
			})
			.catch(() => {});
	}, []);

	function dismiss() {
		localStorage.setItem(SHOWN_KEY, todayIso());
		setVisible(false);
	}

	function remind(payment) {
		window.open(baadWhatsAppLink(dueReminderMessage(payment)), "_blank");
	}

	if (!visible || reminders.length === 0) return null;

	return (
		<div className="due-popup-overlay">
			<div className="due-popup-modal">
				<button className="due-popup-close" onClick={dismiss}>
					✕
				</button>
				<p className="due-popup-eyebrow">⏰ Heads up!</p>
				<h2>
					{reminders.length === 1
						? "A payment needs a nudge"
						: `${reminders.length} payments need a nudge`}
				</h2>
				<p>Want to remind Baad? One tap sends her a friendly WhatsApp message.</p>

				<div className="due-popup-list">
					{reminders.map((p) => (
						<div key={p.id} className={`due-popup-item ${p.is_overdue ? "overdue" : ""}`}>
							<div>
								<strong>{p.investments?.plan_name_snapshot || "Plan"}</strong> · ₹{p.amount}
								<div className="due-popup-meta">
									{p.is_overdue ? (
										<span className="badge danger">
											overdue since {new Date(p.due_date).toLocaleDateString()}
											{p.is_penalty ? " · 🍔 penalty active" : ""}
										</span>
									) : p.days_until_due === 0 ? (
										<span className="badge warn">due today!</span>
									) : (
										<span className="badge">
											due in {p.days_until_due} day{p.days_until_due === 1 ? "" : "s"}
										</span>
									)}
								</div>
							</div>
							<button className="btn btn-mint" onClick={() => remind(p)}>
								💌 Remind on WhatsApp
							</button>
						</div>
					))}
				</div>

				<button className="btn btn-ghost" onClick={dismiss} style={{ marginTop: 14 }}>
					I'll deal with this later today
				</button>
			</div>
		</div>
	);
}
