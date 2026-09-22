import React, { useState } from "react";
import "../styles/UncheckConfirm.css";

const CONFIRM_VARIANTS = [
	"punha chukine check kel, lahans baad ahe ka g tu?",
	"punha chukine check kel, lahans baad ahe ka g tu?",
	"punha chukine check kel, lahans baad ahe ka g tu?",
	"punha chukine chech kel, mand ahe ka g bada tu?",
];

function randomConfirmMessage() {
	return CONFIRM_VARIANTS[Math.floor(Math.random() * CONFIRM_VARIANTS.length)];
}

/**
 * Shown before unchecking anything already marked done. "Ho" (yes) actually
 * triggers the uncheck and swaps to a sweet closable message; "Nahi" (no)
 * or closing the sweet message just dismisses without changing anything.
 */
export default function UncheckConfirm({ onConfirm, onClose }) {
	const [message] = useState(randomConfirmMessage);
	const [confirmed, setConfirmed] = useState(false);

	function handleYes() {
		onConfirm();
		setConfirmed(true);
	}

	return (
		<div className="uncheck-confirm-overlay">
			<div className="uncheck-confirm-modal">
				{!confirmed ? (
					<>
						<p className="uncheck-confirm-text">{message}</p>
						<div className="uncheck-confirm-actions">
							<button className="btn btn-mint" onClick={handleYes}>
								Ho
							</button>
							<button className="btn btn-ghost" onClick={onClose}>
								Nahi
							</button>
						</div>
					</>
				) : (
					<>
						<p className="uncheck-confirm-text">Ahech tu maaz itkus chotus najuks lahans baad 💖</p>
						<button className="btn" onClick={onClose}>
							💖
						</button>
					</>
				)}
			</div>
		</div>
	);
}
