import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { api } from "../api.js";
import BrushCheckbox from "../components/BrushCheckbox.jsx";
import HowSoonStepper from "../components/HowSoonStepper.jsx";
import CollageMaker from "../components/CollageMaker.jsx";
import {
	OUTING_PRESETS,
	typeLabel,
	typeColor,
	hangoutCongratsMessage,
	TIMEFRAME_GROUPS,
} from "../utils/hangouts.js";
import "../styles/Hangouts.css";

function fireConfetti() {
	confetti({
		particleCount: 110,
		spread: 85,
		origin: { y: 0.6 },
		colors: ["#ff7a9e", "#ffc2de", "#bdf3d4", "#ffe08a", "#e7dbff"],
	});
}

function groupMeta(timeframe) {
	return TIMEFRAME_GROUPS.find((g) => g.value === timeframe) || TIMEFRAME_GROUPS[4];
}

export default function Hangouts() {
	const [hangouts, setHangouts] = useState([]);

	// add form
	const [title, setTitle] = useState("");
	const [presetType, setPresetType] = useState(null);
	const [customType, setCustomType] = useState("");
	const [timeframe, setTimeframe] = useState(null);
	const [imageUrl, setImageUrl] = useState("");
	const [uploading, setUploading] = useState(false);
	const [description, setDescription] = useState("");
	const [showMoreFields, setShowMoreFields] = useState(false);
	const [busy, setBusy] = useState(false);

	// completion flow
	const [animatingId, setAnimatingId] = useState(null);
	const [congrats, setCongrats] = useState(null);
	const [feedbackTarget, setFeedbackTarget] = useState(null);
	const [feedbackText, setFeedbackText] = useState("");
	const [feedbackCost, setFeedbackCost] = useState("");
	const [savingFeedback, setSavingFeedback] = useState(false);

	useEffect(() => {
		load();
	}, []);

	function load() {
		api.getHangouts().then(setHangouts);
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
		setPresetType(null);
		setCustomType("");
		setTimeframe(null);
		setImageUrl("");
		setDescription("");
		setShowMoreFields(false);
	}

	async function handleAdd(e) {
		e.preventDefault();
		if (!title.trim()) return;
		setBusy(true);
		try {
			const outingType = customType.trim() || presetType || null;
			await api.createHangout({
				title: title.trim(),
				outing_type: outingType,
				expected_timeframe: timeframe,
				image_url: imageUrl || undefined,
				description: description.trim() || undefined,
			});
			resetForm();
			load();
		} catch (err) {
			alert(err.message);
		}
		setBusy(false);
	}

	async function beginComplete(hangout) {
		if (animatingId) return;
		setAnimatingId(hangout.id);
		try {
			const [updated] = await Promise.all([
				api.completeHangout(hangout.id),
				new Promise((resolve) => setTimeout(resolve, 550)),
			]);
			fireConfetti();
			setCongrats(updated);
		} catch (err) {
			alert(err.message);
			setAnimatingId(null);
		}
	}

	function closeCongratsAndOpenFeedback() {
		const target = congrats;
		setCongrats(null);
		setAnimatingId(null);
		load();
		openFeedback(target);
	}

	function openFeedback(hangout) {
		setFeedbackTarget(hangout);
		setFeedbackText(hangout.feedback_text || "");
		setFeedbackCost(hangout.feedback_cost ?? "");
	}

	function closeFeedback() {
		setFeedbackTarget(null);
		load();
	}

	async function submitFeedback(e) {
		e.preventDefault();
		setSavingFeedback(true);
		try {
			await api.saveHangoutFeedback(feedbackTarget.id, {
				feedback_text: feedbackText,
				feedback_cost: feedbackCost === "" ? null : Number(feedbackCost),
			});
			closeFeedback();
		} catch (err) {
			alert(err.message);
		}
		setSavingFeedback(false);
	}

	async function removeHangout(id) {
		if (!confirm("Remove this hangout for good?")) return;
		await api.deleteHangout(id);
		load();
	}

	const active = hangouts.filter((h) => !h.is_completed);
	const trophies = hangouts.filter((h) => h.is_completed);

	return (
		<div className="hangouts-page">
			<div className="card hangouts-intro">
				<h1>🏖️ Your hangout list</h1>
				<p>Plan the fun, then look back on it as a little trophy shelf.</p>
			</div>

			<div className="card hangouts-form-card">
				<form onSubmit={handleAdd}>
					<div className="field">
						<label>Where do you want to hang out?</label>
						<input
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="e.g. That new rooftop cafe ☁️"
							required
						/>
					</div>

					<div className="field">
						<label>What kind of outing?</label>
						<div className="hangouts-type-row">
							{OUTING_PRESETS.map((p) => (
								<button
									type="button"
									key={p.value}
									className={`hangouts-type-btn ${presetType === p.value ? "selected" : ""}`}
									onClick={() => {
										setPresetType(presetType === p.value ? null : p.value);
										setCustomType("");
									}}
								>
									<span>{p.icon}</span> {p.label}
								</button>
							))}
						</div>
						<input
							className="hangouts-custom-type"
							placeholder="Or type your own (e.g. Road trip 🚗)"
							value={customType}
							onChange={(e) => {
								setCustomType(e.target.value);
								if (e.target.value) setPresetType(null);
							}}
						/>
					</div>

					<HowSoonStepper value={timeframe} onChange={setTimeframe} label="How soon do you want this?" />

					{!showMoreFields ? (
						<button
							type="button"
							className="btn btn-ghost"
							style={{ marginBottom: 14 }}
							onClick={() => setShowMoreFields(true)}
						>
							+ Add a photo or description (optional)
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
								<label>Any details? (optional)</label>
								<textarea
									rows="2"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="What's the plan..."
								/>
							</div>
						</>
					)}

					<button className="btn" disabled={busy || uploading}>
						{busy ? "Adding…" : "🏖️ Add hangout"}
					</button>
				</form>
			</div>

			<div className="hangouts-active-grid">
				{active.length === 0 && (
					<div className="empty-state card">
						<h3>Nothing planned yet!</h3>
						<p>Add your first hangout above 🎉</p>
					</div>
				)}
				{active.map((h) => {
					const isAnimating = animatingId === h.id;
					const group = groupMeta(h.expected_timeframe);
					return (
						<div
							key={h.id}
							className={`card hangouts-item ${isAnimating ? "hangouts-item-animating" : ""}`}
							style={{ borderLeft: `8px solid var(${group.colorVar})` }}
						>
							<div className="hangouts-item-head">
								<BrushCheckbox
									checked={isAnimating}
									onClick={() => !isAnimating && beginComplete(h)}
									disabled={isAnimating}
									size={32}
								/>
								<span className="pill-tag">
									{group.icon} {group.label}
								</span>
								<button className="hangouts-delete" onClick={() => removeHangout(h.id)} title="Remove">
									🗑️
								</button>
							</div>

							{h.image_url && <img src={h.image_url} alt={h.title} className="hangouts-thumb" />}

							<h4 className="hangouts-title">{h.title}</h4>
							{h.outing_type && (
								<span className="hangouts-type-tag" style={{ background: typeColor(h.outing_type) }}>
									{typeLabel(h.outing_type)}
								</span>
							)}
							{h.description && <p className="hangouts-desc">{h.description}</p>}
						</div>
					);
				})}
			</div>

			{trophies.length > 0 && (
				<div className="hangouts-trophy-section">
					<h2>🏆 Hangout trophies</h2>
					<div className="hangouts-trophy-grid">
						{trophies.map((h) => (
							<button key={h.id} className="hangouts-trophy" onClick={() => openFeedback(h)}>
								<div className="hangouts-trophy-icon">🏆</div>
								<h4>{h.title}</h4>
								<div className="hangouts-trophy-tags">
									{h.outing_type && (
										<span className="hangouts-type-tag small" style={{ background: typeColor(h.outing_type) }}>
											{typeLabel(h.outing_type)}
										</span>
									)}
									{h.tag_label && <span className="hangouts-duration-tag">{h.tag_label}</span>}
								</div>
								{h.feedback_cost != null && <p className="hangouts-trophy-cost">Cost: ₹{h.feedback_cost}</p>}
								<span className="hangouts-trophy-hint">Tap to view/edit feedback</span>
							</button>
						))}
					</div>
				</div>
			)}

			{congrats && (
				<div className="hangouts-overlay">
					<div className="hangouts-modal">
						<p className="hangouts-eyebrow">🎉 It's happening!</p>
						<h2>{hangoutCongratsMessage(congrats)}</h2>
						<button className="btn" onClick={closeCongratsAndOpenFeedback}>
							Yay, thank you! 💖
						</button>
					</div>
				</div>
			)}

			{feedbackTarget && (
				<div className="hangouts-overlay">
					<div className="hangouts-modal hangouts-feedback-modal">
						<button className="hangouts-modal-close" onClick={closeFeedback}>
							✕
						</button>
						<p className="hangouts-eyebrow">💭 How was it?</p>
						<h2>{feedbackTarget.title}</h2>
						<form onSubmit={submitFeedback}>
							<div className="field">
								<label>Tell me about it (optional)</label>
								<textarea
									rows="3"
									value={feedbackText}
									onChange={(e) => setFeedbackText(e.target.value)}
									placeholder="How did it go?"
								/>
							</div>
							<div className="field">
								<label>Approximately how much did it cost? (optional)</label>
								<input
									type="number"
									min="0"
									value={feedbackCost}
									onChange={(e) => setFeedbackCost(e.target.value)}
									placeholder="₹"
								/>
							</div>

							<CollageMaker />

							<button className="btn" disabled={savingFeedback}>
								{savingFeedback ? "Saving…" : "💾 Save feedback"}
							</button>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
