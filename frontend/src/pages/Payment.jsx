import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import "../styles/Payment.css";

const UPI_ID = "9359118747@ptsbi";
const MERCHANT_NAME = "Soham Wani";
const WHATSAPP_NUMBER = "919359118747";

export default function Payment() {
	const { paymentId } = useParams();
	const navigate = useNavigate();
	const [payment, setPayment] = useState(null);
	const [chosenMethod, setChosenMethod] = useState(null);
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		window.scrollTo(0, 0);
		api.getPayment(paymentId).then(setPayment).catch(() => navigate("/"));
	}, [paymentId]);

	if (!payment) return <p className="empty-state">Loading payment…</p>;

	const amount = payment.amount;
	const planName = payment.investments?.plan_name_snapshot || "BaadFunds plan";

	const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(
		MERCHANT_NAME
	)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`BaadFunds - ${planName}`)}`;
	const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
		upiUrl
	)}`;

	async function chooseMethod(method) {
		setBusy(true);
		try {
			await api.attemptPayment(paymentId, method);
			setChosenMethod(method);
			setPayment({ ...payment, method, status: "attempted" });
		} catch (e) {
			alert(e.message);
		}
		setBusy(false);
	}

	function handleWhatsAppShare() {
		const message = `Hii Soham! I attempted a payment for ${planName}.\n\nAmount: ₹${amount}\nMethod: ${
			chosenMethod || payment.method || "not chosen yet"
		}\n\nPlease approve my payment when you can! 🐷💛`;

		window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
	}

	return (
		<div className="payment-page">
			<div className="card payment-container">
				<div className="payment-header">
					<span className="pill-tag">💌 {planName}</span>
					<h1>Time to water your plant!</h1>
					<p className="payment-amount">Amount due: ₹{amount}</p>
				</div>

				{payment.status === "approved" ? (
					<div className="payment-approved">
						<h2>✅ Already confirmed!</h2>
						<p>Soham has already approved this payment. You're all set.</p>
					</div>
				) : (
					<>
						<div className="payment-method-choice">
							<button
								className={`method-btn ${chosenMethod === "upi" || payment.method === "upi" ? "chosen" : ""}`}
								onClick={() => chooseMethod("upi")}
								disabled={busy}
							>
								📱 Pay via UPI
							</button>
							<button
								className={`method-btn ${chosenMethod === "cash" || payment.method === "cash" ? "chosen" : ""}`}
								onClick={() => chooseMethod("cash")}
								disabled={busy}
							>
								💵 I'll pay cash
							</button>
						</div>

						{(chosenMethod === "upi" || payment.method === "upi") && (
							<div className="payment-qr-section">
								<h2 className="section-title-pay">Scan to pay</h2>
								<div className="qr-code-wrapper">
									<img src={qrCodeUrl} alt="UPI QR Code" className="qr-code" />
								</div>
								<div className="upi-details">
									<div className="upi-detail-item">
										<span className="upi-label">UPI ID:</span>
										<div className="upi-value-box">
											<span className="upi-value">{UPI_ID}</span>
											<button
												className="copy-btn"
												onClick={() => {
													navigator.clipboard.writeText(UPI_ID);
													alert("UPI ID copied!");
												}}
											>
												Copy
											</button>
										</div>
									</div>
								</div>
							</div>
						)}

						{(chosenMethod === "cash" || payment.method === "cash") && (
							<div className="cash-note">
								<p>
									💵 Great — hand the cash to Soham directly. Don't forget to tell him it's for{" "}
									<strong>{planName}</strong>!
								</p>
							</div>
						)}

						{(chosenMethod || payment.method) && (
							<button className="whatsapp-btn" onClick={handleWhatsAppShare}>
								✅ Tell Soham I paid (WhatsApp)
							</button>
						)}
					</>
				)}

				<div className="payment-next-steps">
					<h2 className="section-title-pay">✨ What happens next?</h2>
					<div className="next-steps-grid">
						<div className="step-card">
							<div className="step-number">1</div>
							<p>Soham checks his UPI/cash to confirm your payment</p>
						</div>
						<div className="step-card">
							<div className="step-number">2</div>
							<p>He approves it in his admin garden 🌻</p>
						</div>
						<div className="step-card">
							<div className="step-number">3</div>
							<p>It shows up in your money trail, growing at your fixed rate</p>
						</div>
					</div>
				</div>

				<button className="back-btn" onClick={() => navigate("/")}>
					← Back to dashboard
				</button>
			</div>
		</div>
	);
}
