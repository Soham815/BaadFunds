import React, { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { downloadDataUrl, slugify } from "../utils/download.js";
import "../styles/CouponPopup.css";

const SCRATCH_THRESHOLD = 0.45; // reveal once 45% is scratched away

const NAG_MESSAGES = [
	"Are you sure? This one's really cute 🥺",
	"C'mon Baad, it only takes one click ✨",
	"Pleeeease keep this one forever? 🐷💭",
	"Last chance to say yes nicely... 👉👈",
	"Okay fine, taking matters into my own hands 😤",
];

function dismissKey(couponId) {
	return `baadfunds_coupon_dismissed_${couponId}`;
}

export default function CouponPopup() {
	const [coupon, setCoupon] = useState(null);
	const [revealed, setRevealed] = useState(false);
	const [visible, setVisible] = useState(false);
	const [asking, setAsking] = useState(false);
	const [declineCount, setDeclineCount] = useState(0);
	const [downloading, setDownloading] = useState(false);
	const [forcedMessage, setForcedMessage] = useState(false);
	const canvasRef = useRef(null);
	const isDrawing = useRef(false);

	useEffect(() => {
		api
			.getNextCoupon()
			.then((c) => {
				if (!c) return;
				setCoupon(c);
				const alreadyDismissed =
					sessionStorage.getItem(dismissKey(c.id)) === "1";
				if (!alreadyDismissed) {
					setTimeout(() => setVisible(true), 500); // little delayed "surprise" entrance
				}
				// if already dismissed this session, stay hidden — the bell icon
				// lets her reopen it whenever she wants instead of auto-popping again
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

	// ---------- close / download-insistence flow ----------

	function attemptClose() {
		if (!revealed) {
			setVisible(false);
			if (coupon) sessionStorage.setItem(dismissKey(coupon.id), "1");
			return;
		}
		setAsking(true);
	}

	async function handleYes() {
		setDownloading(true);
		try {
			const dataUrl = await buildCouponImage(coupon);
			triggerDownload(dataUrl, coupon.title);
		} catch (e) {
			console.error("Coupon download failed:", e);
		}
		setDownloading(false);
		setVisible(false);
		setCoupon(null); // fully done — bell disappears too, nothing left to reopen
	}

	async function handleNo() {
		const next = declineCount + 1;
		setDeclineCount(next);
		if (next >= NAG_MESSAGES.length) {
			setDownloading(true);
			try {
				const dataUrl = await buildCouponImage(coupon);
				triggerDownload(dataUrl, coupon.title);
			} catch (e) {
				console.error("Coupon download failed:", e);
			}
			setDownloading(false);
			setForcedMessage(true);
			setTimeout(() => {
				setVisible(false);
				setCoupon(null); // fully done — bell disappears too
			}, 2600);
		}
	}

	function reopenFromBell() {
		setAsking(false);
		setForcedMessage(false);
		setDeclineCount(0);
		setVisible(true);
	}

	if (!coupon) return null;

	if (!visible) {
		// She dismissed it before scratching — keep a small bell around so
		// it's never truly gone, without shoving the popup back in her face.
		return (
			<button className="coupon-bell-fab" onClick={reopenFromBell} title="You have a coupon waiting!">
				🎁
			</button>
		);
	}

	return (
		<div className="coupon-overlay">
			<div className="coupon-modal">
				{!asking && (
					<button className="coupon-close" onClick={attemptClose}>
						✕
					</button>
				)}

				{!asking ? (
					<>
						<p className="coupon-eyebrow">🎁 A surprise for you, Baad!</p>
						<div className="coupon-scratch-wrap">
							<div className="coupon-content">
								{coupon.image_url && (
									<img src={coupon.image_url} alt={coupon.title} className="coupon-image" />
								)}
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
							<button className="btn" onClick={attemptClose}>
								Yay, thank you! 💖
							</button>
						)}
					</>
				) : (
					<div className="coupon-ask-download">
						{!forcedMessage ? (
							<>
								<p className="coupon-eyebrow">📥 Keep this coupon?</p>
								<h2 style={{ marginBottom: 10 }}>
									{declineCount === 0 ? "Want to download it?" : NAG_MESSAGES[declineCount - 1]}
								</h2>
								<p>Downloads a cute little keepsake version, just for you.</p>
								<div className="coupon-ask-actions">
									<button className="btn" disabled={downloading} onClick={handleYes}>
										{downloading ? "Wrapping it up…" : "Yes, download! 🎀"}
									</button>
									<button className="btn btn-ghost" disabled={downloading} onClick={handleNo}>
										No thanks
									</button>
								</div>
							</>
						) : (
							<>
								<p className="coupon-eyebrow">💌 Downloaded anyway!</p>
								<h2>This one was only ever meant for you.</h2>
								<p>So... it's already saved to your downloads. No takebacks! 🐷💖</p>
							</>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

// ---------- helpers: render a nice keepsake image + trigger a download ----------

function loadImage(src) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error("image failed to load"));
		img.src = src;
	});
}

function roundRectPath(ctx, x, y, w, h, r) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.arcTo(x + w, y, x + w, y + h, r);
	ctx.arcTo(x + w, y + h, x, y + h, r);
	ctx.arcTo(x, y + h, x, y, r);
	ctx.arcTo(x, y, x + w, y, r);
	ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
	const words = text.split(" ");
	let line = "";
	let curY = y;
	for (let n = 0; n < words.length; n++) {
		const testLine = line + words[n] + " ";
		if (ctx.measureText(testLine).width > maxWidth && n > 0) {
			ctx.fillText(line.trim(), x, curY);
			line = words[n] + " ";
			curY += lineHeight;
		} else {
			line = testLine;
		}
	}
	ctx.fillText(line.trim(), x, curY);
	return curY;
}

async function buildCouponImage(coupon) {
	if (document.fonts?.ready) {
		try {
			await document.fonts.ready;
		} catch (_) {}
	}

	const canvas = document.createElement("canvas");
	canvas.width = 640;
	canvas.height = 420;
	const ctx = canvas.getContext("2d");

	const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
	gradient.addColorStop(0, "#ffe08a");
	gradient.addColorStop(0.5, "#ffc2de");
	gradient.addColorStop(1, "#e7dbff");
	ctx.fillStyle = gradient;
	roundRectPath(ctx, 0, 0, canvas.width, canvas.height, 32);
	ctx.fill();

	ctx.strokeStyle = "#ffffff";
	ctx.lineWidth = 10;
	roundRectPath(ctx, 12, 12, canvas.width - 24, canvas.height - 24, 26);
	ctx.stroke();

	ctx.fillStyle = "#4a2e5c";
	ctx.textAlign = "center";
	ctx.font = "600 20px Fredoka, sans-serif";
	ctx.fillText("🎁 A BaadFunds Coupon 🎁", canvas.width / 2, 54);

	let cursorY = 90;
	if (coupon.image_url) {
		try {
			const img = await loadImage(coupon.image_url);
			const imgSize = 150;
			const x = (canvas.width - imgSize) / 2;
			roundRectPath(ctx, x, cursorY, imgSize, imgSize, 18);
			ctx.save();
			ctx.clip();
			ctx.drawImage(img, x, cursorY, imgSize, imgSize);
			ctx.restore();
			cursorY += imgSize + 26;
		} catch (_) {
			// no image, or CORS blocked it — keep going without it
			cursorY += 10;
		}
	}

	ctx.font = "600 30px Fredoka, sans-serif";
	ctx.fillStyle = "#ff7a9e";
	ctx.fillText(coupon.title, canvas.width / 2, cursorY + 30);

	ctx.font = "400 17px Nunito, sans-serif";
	ctx.fillStyle = "#4a2e5c";
	wrapText(ctx, coupon.description, canvas.width / 2, cursorY + 68, canvas.width - 100, 26);

	ctx.font = "400 13px Nunito, sans-serif";
	ctx.fillStyle = "#7a5d8f";
	ctx.fillText("Made with love, just for Baad 💖", canvas.width / 2, canvas.height - 26);

	return canvas.toDataURL("image/png");
}

function triggerDownload(dataUrl, title) {
	downloadDataUrl(dataUrl, `baadfunds-coupon-${slugify(title)}.png`);
}
