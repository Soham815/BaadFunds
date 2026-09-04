import React, { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import "./CouponPopup.css";

const SCRATCH_THRESHOLD = 0.45; // reveal once 45% is scratched away

export default function CouponPopup() {
	const [coupon, setCoupon] = useState(null);
	const [revealed, setRevealed] = useState(false);
	const [visible, setVisible] = useState(false);
	const canvasRef = useRef(null);
	const isDrawing = useRef(false);

	useEffect(() => {
		api
			.getNextCoupon()
			.then((c) => {
				if (c) {
					setCoupon(c);
					setTimeout(() => setVisible(true), 500); // little delayed "surprise" entrance
				}
			})
			.catch(() => {});
	}, []);

	useEffect(() => {
		if (!coupon || !visible) return;
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");

		const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
		gradient.addColorStop(0, "#c9c2ff");
		gradient.addColorStop(1, "#ffb5d8");
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		ctx.fillStyle = "rgba(74,46,92,0.85)";
		ctx.font = "600 18px Fredoka, sans-serif";
		ctx.textAlign = "center";
		ctx.fillText("✨ Scratch me! ✨", canvas.width / 2, canvas.height / 2);
	}, [coupon, visible]);

	function getPos(e, canvas) {
		const rect = canvas.getBoundingClientRect();
		const point = e.touches ? e.touches[0] : e;
		return {
			x: ((point.clientX - rect.left) / rect.width) * canvas.width,
			y: ((point.clientY - rect.top) / rect.height) * canvas.height,
		};
	}

	function scratch(e) {
		if (!isDrawing.current || revealed) return;
		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d");
		const { x, y } = getPos(e, canvas);
		ctx.globalCompositeOperation = "destination-out";
		ctx.beginPath();
		ctx.arc(x, y, 24, 0, Math.PI * 2);
		ctx.fill();
		checkRevealProgress(ctx, canvas);
	}

	function checkRevealProgress(ctx, canvas) {
		const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
		let cleared = 0;
		for (let i = 3; i < data.length; i += 4 * 20) {
			if (data[i] === 0) cleared++;
		}
		const total = data.length / (4 * 20);
		if (cleared / total > SCRATCH_THRESHOLD) {
			setRevealed(true);
			api.revealCoupon(coupon.id).catch(() => {});
		}
	}

	if (!coupon || !visible) return null;

	return (
		<div className="coupon-overlay">
			<div className="coupon-modal">
				<button className="coupon-close" onClick={() => setVisible(false)}>
					✕
				</button>
				<p className="coupon-eyebrow">🎁 A surprise for you, Baad!</p>
				<div className="coupon-scratch-wrap">
					<div className="coupon-content">
						{coupon.image_url && <img src={coupon.image_url} alt={coupon.title} className="coupon-image" />}
						<h2>{coupon.title}</h2>
						<p>{coupon.description}</p>
					</div>
					{!revealed && (
						<canvas
							ref={canvasRef}
							width={320}
							height={220}
							className="coupon-canvas"
							onMouseDown={() => (isDrawing.current = true)}
							onMouseUp={() => (isDrawing.current = false)}
							onMouseLeave={() => (isDrawing.current = false)}
							onMouseMove={scratch}
							onTouchStart={() => (isDrawing.current = true)}
							onTouchEnd={() => (isDrawing.current = false)}
							onTouchMove={scratch}
						/>
					)}
				</div>
				{revealed && (
					<button className="btn" onClick={() => setVisible(false)}>
						Yay, thank you! 💖
					</button>
				)}
			</div>
		</div>
	);
}
