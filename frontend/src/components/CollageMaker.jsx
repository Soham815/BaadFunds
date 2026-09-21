import React, { useState } from "react";
import { downloadDataUrl } from "../utils/download.js";
import "../styles/CollageMaker.css";

const MAX_PHOTOS = 20;

// ---------- canvas helpers ----------

function loadImageFromFile(file) {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error("Couldn't read one of the photos"));
		img.src = url;
	});
}

/** A jagged rectangle path — the "torn paper" edge. */
function tornRectPath(ctx, x, y, w, h, jag = 6, segs = 8) {
	const pts = [];
	function edge(x1, y1, x2, y2, n) {
		for (let i = 0; i <= n; i++) {
			const t = i / n;
			let px = x1 + (x2 - x1) * t;
			let py = y1 + (y2 - y1) * t;
			if (i > 0 && i < n) {
				const dx = x2 - x1;
				const dy = y2 - y1;
				const len = Math.hypot(dx, dy) || 1;
				const nx = -dy / len;
				const ny = dx / len;
				const j = (Math.random() - 0.5) * 2 * jag;
				px += nx * j;
				py += ny * j;
			}
			pts.push([px, py]);
		}
	}
	edge(x, y, x + w, y, segs);
	edge(x + w, y, x + w, y + h, segs);
	edge(x + w, y + h, x, y + h, segs);
	edge(x, y + h, x, y, segs);

	ctx.beginPath();
	ctx.moveTo(pts[0][0], pts[0][1]);
	for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
	ctx.closePath();
}

function drawImageCover(ctx, img, x, y, w, h) {
	const ir = img.width / img.height;
	const r = w / h;
	let sx, sy, sw, sh;
	if (ir > r) {
		sh = img.height;
		sw = sh * r;
		sx = (img.width - sw) / 2;
		sy = 0;
	} else {
		sw = img.width;
		sh = sw / r;
		sx = 0;
		sy = (img.height - sh) / 2;
	}
	ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/** Draws one photo with a white torn-paper backing, optionally rotated. */
function drawTornPhoto(ctx, img, x, y, w, h, rotationDeg = 0) {
	ctx.save();
	const cx = x + w / 2;
	const cy = y + h / 2;
	ctx.translate(cx, cy);
	ctx.rotate((rotationDeg * Math.PI) / 180);
	ctx.translate(-cx, -cy);

	const pad = Math.max(8, w * 0.03);

	ctx.save();
	ctx.shadowColor = "rgba(74,46,92,0.28)";
	ctx.shadowBlur = 14;
	ctx.shadowOffsetY = 5;
	ctx.fillStyle = "#fffdf8";
	tornRectPath(ctx, x - pad, y - pad, w + pad * 2, h + pad * 2, pad * 0.9, 10);
	ctx.fill();
	ctx.restore();

	ctx.save();
	tornRectPath(ctx, x, y, w, h, pad * 0.7, 10);
	ctx.clip();
	drawImageCover(ctx, img, x, y, w, h);
	ctx.restore();

	ctx.restore();
}

function randRotation(spread = 6) {
	return (Math.random() - 0.5) * 2 * spread;
}

function paintBackground(ctx, w, h) {
	const grad = ctx.createLinearGradient(0, 0, w, h);
	grad.addColorStop(0, "#fff8f0");
	grad.addColorStop(0.5, "#ffe9f2");
	grad.addColorStop(1, "#eee6ff");
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, w, h);
}

/** Builds one canvas from 1-4 images, laid out differently per count. */
function buildCollageCanvas(images) {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	const n = images.length;

	if (n === 4) {
		canvas.width = 800;
		canvas.height = 800;
		paintBackground(ctx, canvas.width, canvas.height);
		const cells = [
			[50, 50],
			[420, 50],
			[50, 420],
			[420, 420],
		];
		cells.forEach(([x, y], i) => drawTornPhoto(ctx, images[i], x, y, 330, 330, randRotation(5)));
	} else if (n === 3) {
		canvas.width = 800;
		canvas.height = 600;
		paintBackground(ctx, canvas.width, canvas.height);
		drawTornPhoto(ctx, images[0], 40, 40, 420, 520, randRotation(4));
		drawTornPhoto(ctx, images[1], 480, 40, 280, 240, randRotation(6));
		drawTornPhoto(ctx, images[2], 480, 320, 280, 240, randRotation(-6));
	} else if (n === 2) {
		canvas.width = 800;
		canvas.height = 500;
		paintBackground(ctx, canvas.width, canvas.height);
		drawTornPhoto(ctx, images[0], 40, 50, 350, 400, -5);
		drawTornPhoto(ctx, images[1], 410, 50, 350, 400, 5);
	} else {
		canvas.width = 700;
		canvas.height = 700;
		paintBackground(ctx, canvas.width, canvas.height);
		drawTornPhoto(ctx, images[0], 70, 70, 560, 560, randRotation(3));
	}

	ctx.font = "600 22px Fredoka, sans-serif";
	ctx.fillStyle = "rgba(74,46,92,0.55)";
	ctx.textAlign = "center";
	ctx.fillText("🐷 BaadFunds hangout memories 🐷", canvas.width / 2, canvas.height - 16);

	return canvas;
}

// ---------- component ----------

export default function CollageMaker() {
	const [files, setFiles] = useState([]);
	const [generating, setGenerating] = useState(false);
	const [results, setResults] = useState([]); // [{ id, dataUrl, count }]

	function handleFiles(e) {
		const picked = Array.from(e.target.files || []);
		if (picked.length === 0) return;
		const combined = [...files, ...picked].slice(0, MAX_PHOTOS);
		if (files.length + picked.length > MAX_PHOTOS) {
			alert(`Max ${MAX_PHOTOS} photos — using the first ${MAX_PHOTOS}.`);
		}
		setFiles(combined);
		e.target.value = "";
	}

	function removeFile(idx) {
		setFiles(files.filter((_, i) => i !== idx));
	}

	function clearAll() {
		setFiles([]);
		setResults([]);
	}

	async function generate() {
		if (files.length === 0) return;
		setGenerating(true);
		try {
			if (document.fonts?.ready) await document.fonts.ready.catch(() => {});
			const images = await Promise.all(files.map(loadImageFromFile));
			const chunks = [];
			for (let i = 0; i < images.length; i += 4) chunks.push(images.slice(i, i + 4));

			const built = chunks.map((chunk, i) => ({
				id: `collage-${i}`,
				count: chunk.length,
				dataUrl: buildCollageCanvas(chunk).toDataURL("image/png"),
			}));
			setResults(built);
		} catch (err) {
			alert(err.message || "Couldn't build the collage — try different photos?");
		}
		setGenerating(false);
	}

	return (
		<div className="collage-maker">
			<p className="collage-maker-hint">
				Upload up to {MAX_PHOTOS} photos — they'll be grouped into cute torn-paper collages
				of 4, with a smaller edit for whatever's left over. Nothing is saved; download
				whichever ones you like!
			</p>

			<input type="file" accept="image/*" multiple onChange={handleFiles} disabled={generating} />

			{files.length > 0 && (
				<div className="collage-maker-thumbs">
					{files.map((f, i) => (
						<div className="collage-maker-thumb" key={i}>
							<img src={URL.createObjectURL(f)} alt={`upload ${i + 1}`} />
							<button type="button" onClick={() => removeFile(i)}>
								✕
							</button>
						</div>
					))}
				</div>
			)}

			{files.length > 0 && (
				<div className="collage-maker-actions">
					<button type="button" className="btn btn-mint" onClick={generate} disabled={generating}>
						{generating ? "Sticking things together…" : `✂️ Make collage${files.length > 4 ? "s" : ""}`}
					</button>
					<button type="button" className="btn btn-ghost" onClick={clearAll} disabled={generating}>
						Clear all
					</button>
				</div>
			)}

			{results.length > 0 && (
				<div className="collage-maker-results">
					{results.map((r, i) => (
						<div className="collage-maker-result" key={r.id}>
							<img src={r.dataUrl} alt={`collage ${i + 1}`} />
							<button
								type="button"
								className="btn btn-secondary"
								onClick={() => downloadDataUrl(r.dataUrl, `baadfunds-hangout-collage-${i + 1}.png`)}
							>
								⬇️ Download ({r.count} photo{r.count === 1 ? "" : "s"})
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
