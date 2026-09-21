import React, { useState, useRef, useEffect } from "react";
import { api } from "../api.js";
import "../styles/Chatbot.css";

export default function Chatbot() {
	const [open, setOpen] = useState(false);
	const [messages, setMessages] = useState([
		{ sender: "soham", text: "Hiii Baad! I'm Soham 🐻 — ask me anything about investing!" },
	]);
	const [input, setInput] = useState("");
	const [busy, setBusy] = useState(false);
	const bottomRef = useRef(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, open]);

	async function send(e) {
		e.preventDefault();
		const text = input.trim();
		if (!text) return;
		setMessages((m) => [...m, { sender: "baad", text }]);
		setInput("");
		setBusy(true);
		try {
			const { reply } = await api.askSoham(text);
			setMessages((m) => [...m, { sender: "soham", text: reply }]);
		} catch {
			setMessages((m) => [...m, { sender: "soham", text: "Oops, my brain glitched! Try again?" }]);
		}
		setBusy(false);
	}

	return (
		<div className="chatbot-root">
			{open && (
				<div className="chatbot-panel">
					<div className="chatbot-header">
						<span>🐻 Soham — your money buddy</span>
						<button className="chatbot-close" onClick={() => setOpen(false)}>
							✕
						</button>
					</div>
					<div className="chatbot-messages">
						{messages.map((m, i) => (
							<div key={i} className={`chatbot-bubble ${m.sender}`}>
								{m.text}
							</div>
						))}
						<div ref={bottomRef} />
					</div>
					<form className="chatbot-input-row" onSubmit={send}>
						<input
							placeholder="Ask Soham something…"
							value={input}
							onChange={(e) => setInput(e.target.value)}
						/>
						<button className="btn" disabled={busy} type="submit">
							➤
						</button>
					</form>
				</div>
			)}
			<button className="chatbot-fab" onClick={() => setOpen((o) => !o)}>
				{open ? "✕" : "🐻"}
			</button>
		</div>
	);
}
