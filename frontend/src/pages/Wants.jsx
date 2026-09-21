import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { api } from "../api.js";
import BrushCheckbox from "../components/BrushCheckbox.jsx";
import HowSoonStepper from "../components/HowSoonStepper.jsx";
import { hopefulMessage, congratsMessage, frameColorForDesire, timeframeLabel } from "../utils/wants.js";
import "../styles/Wants.css";

function fireConfetti() {
	confetti({
		particleCount: 100,
		spread: 80,
		origin: { y: 0.6 },
		colors: ["#ff7a9e", "#ffc2de", "#bdf3d4", "#ffe08a", "#e7dbff"],
	});
}

export default function Wants() {
	const [wants, setWants] = useState([]);
	const [title, setTitle] = useState("");
	const [desire, setDesire] = useState(50);
	const [desireTouched, setDesireTouched] = useState(false);
	const [imageUrl, setImageUrl] = useState("");
	const [uploading, setUploading] = useState(false);
	const [purchaseLink, setPurchaseLink] = useState("");
	const [description, setDescription] = useState("");
	const [timeframe, setTimeframe] = useState(null);
	const [showMoreFields, setShowMoreFields] = useState(false);
	const [busy, setBusy] = useState(false);

	const [hopeful, setHopeful] = useState(null);
	const [congrats, setCongrats] = useState(null);
	const [animatingId, setAnimatingId] = useState(null);

	useEffect(() => {
		load();
	}, []);

	function load() {
		api.getWants().then(setWants);
	}

	async function handleImageChange(e) {
		const file = e.target.files?.[0];
		if (!file) return;
		setUploading(true);
		try {
			const { url } = await api.uploadImage(file);
			setImageUrl(url);
		} catch (err) {
			alert(err.message);
			e.target.value = "";
		}
		setUploading(false);
	}

	function resetForm() {
		setTitle("");
		setDesire(50);
		setDesireTouched(false);
		setImageUrl("");
		setPurchaseLink("");
		setDescription("");
		setTimeframe(null);
		setShowMoreFields(false);
	}

	async function handleAdd(e) {
		e.preventDefault();
		if (!title.trim()) return;
		setBusy(true);
		try {
			// if she never touched the slider, treat it as medium desire (50, the default)
			const finalDesire = desireTouched ? desire : 50;
			await api.createWant({
				title: title.trim(),
				desire: finalDesire,
				image_url: imageUrl || undefined,
				purchase_link: purchaseLink.trim() || undefined,
				description: description.trim() || undefined,
				expected_timeframe: timeframe,
			});
			setHopeful(hopefulMessage(finalDesire, timeframe));
			resetForm();
			load();
		} catch (err) {
			alert(err.message);
		}
		setBusy(false);
	}

	async function beginComplete(want) {
		if (animatingId) return;
		setAnimatingId(want.id);
		try {
			const [updated] = await Promise.all([
				api.completeWant(want.id),
				new Promise((resolve) => setTimeout(resolve, 550)),
			]);
			fireConfetti();
			setCongrats(updated);
		} catch (err) {
			alert(err.message);
			setAnimatingId(null);
		}
	}

	function closeCongrats() {
		setCongrats(null);
		setAnimatingId(null);
		load();
	}

	async function removeWant(id) {
		if (!confirm("Remove this want for good?")) return;
		await api.deleteWant(id);
		load();
	}

	return (
		<div className="wants-page">
			<div className="card wants-intro">
				<h1>🎀 Your wants list</h1>
				<p>Write down what you want, how badly you want it, and watch it come true.</p>
			</div>

			<div className="card wants-form-card">
				<form onSubmit={handleAdd}>
					<div className="field">
						<label>What do you want?</label>
						<input
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="e.g. That cute cardigan 🧶"
							required
						/>
					</div>

					<div className="field">
						<label>How badly do you want it?</label>
						<input
							type="range"
							min="0"
							max="100"
							value={desire}
							onChange={(e) => {
								setDesire(Number(e.target.value));
								setDesireTouched(true);
							}}
							className="wants-slider"
							style={{
								accentColor: frameColorForDesire(desireTouched ? desire : 50),
							}}
						/>
						<div className="wants-slider-caption">
							{desireTouched ? desireCaption(desire) : "Slide to show me how much! (medium if left alone)"}
						</div>
					</div>

					{!showMoreFields ? (
						<button
							type="button"
							className="btn btn-ghost"
							style={{ marginBottom: 14 }}
							onClick={() => setShowMoreFields(true)}
						>
							+ Add a photo, link, or description (optional)
						</button>
					) : (
						<>
							<div className="field">
								<label>Photo (optional)</label>
								<input type="file" accept="image/*" onChange={handleImageChange} disabled={uploading} />
								{uploading && <small style={{ color: "var(--plum-soft)" }}>Uploading…</small>}
								{imageUrl && (
									<img src={imageUrl} alt="preview" style={{ maxHeight: 100, borderRadius: 12, marginTop: 8 }} />
								)}
							</div>
							<div className="field">
								<label>Link to buy it (optional)</label>
								<input
									type="url"
									value={purchaseLink}
									onChange={(e) => setPurchaseLink(e.target.value)}
									placeholder="https://..."
								/>
							</div>
							<div className="field">
								<label>Any details? (optional)</label>
								<textarea
									rows="2"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="Color, size, why you love it..."
								/>
							</div>
						</>
					)}

					<HowSoonStepper value={timeframe} onChange={setTimeframe} label="How soon do you expect this?" />

					<button className="btn" disabled={busy || uploading}>
						{busy ? "Adding…" : "🎀 Add to wants list"}
					</button>
				</form>
			</div>

			{hopeful && (
				<div className="wants-hopeful card">
					<span>{hopeful}</span>
					<button className="wants-msg-close" onClick={() => setHopeful(null)}>
						✕
					</button>
				</div>
			)}

			<div className="wants-list">
				{wants.length === 0 && (
					<div className="empty-state card">
						<h3>Nothing here yet!</h3>
						<p>Add your first want above 🎀</p>
					</div>
				)}

				{wants.map((want) => {
					const isAnimating = animatingId === want.id;
					const isDone = want.is_completed && !isAnimating;
					const frameColor = frameColorForDesire(want.desire);

					return (
						<div
							key={want.id}
							className={`card wants-item ${isDone ? "wants-item-done" : ""} ${
								isAnimating ? "wants-item-animating" : ""
							}`}
							style={
								isDone
									? { borderLeft: `8px solid ${frameColor}`, background: `${frameColor}18` }
									: undefined
							}
						>
							<BrushCheckbox
								checked={isDone || isAnimating}
								onClick={() => !want.is_completed && !isAnimating && beginComplete(want)}
								disabled={want.is_completed || isAnimating}
								size={36}
							/>

							{want.image_url && <img src={want.image_url} alt={want.title} className="wants-thumb" />}

							<div className="wants-text-wrap">
								<h4 className="wants-title">{want.title}</h4>
								{want.description && <p className="wants-desc">{want.description}</p>}
								<div className="wants-meta">
									{!want.is_completed && (
										<span className="pill-tag">⏳ {timeframeLabel(want.expected_timeframe)}</span>
									)}
									{isDone && want.tag_label && <span className="wants-tag">{want.tag_label}</span>}
									{want.purchase_link && (
										<a href={want.purchase_link} target="_blank" rel="noreferrer" className="wants-link-btn">
											🔗 View item
										</a>
									)}
								</div>
							</div>

							{!want.is_completed && !isAnimating && (
								<button className="todo-delete" onClick={() => removeWant(want.id)} title="Remove">
									🗑️
								</button>
							)}
						</div>
					);
				})}
			</div>

			{congrats && (
				<div className="wants-congrats-overlay">
					<div className="wants-congrats-modal">
						<p className="wants-eyebrow">🎉 You got it!</p>
						<h2>{congratsMessage(congrats)}</h2>
						{congrats.tag_label && <span className="wants-tag" style={{ marginTop: 8 }}>{congrats.tag_label}</span>}
						<button className="btn" onClick={closeCongrats} style={{ marginTop: 16 }}>
							Yay, thank you! 💖
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

function desireCaption(desire) {
	if (desire <= 20) return "It'd be nice, but no pressure 🌷";
	if (desire <= 40) return "Would genuinely love this 💫";
	if (desire <= 60) return "Really really want this 🥰";
	if (desire <= 80) return "Been thinking about this a LOT 😩💖";
	return "I NEED THIS. Manifesting hard. 🔮✨";
}
