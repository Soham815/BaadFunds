import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { api } from "../api.js";
import BrushCheckbox from "../components/BrushCheckbox.jsx";
import HowSoonStepper from "../components/HowSoonStepper.jsx";
import CollageMaker from "../components/CollageMaker.jsx";
import CollapsibleList from "../components/CollapsibleList.jsx";
import UncheckConfirm from "../components/UncheckConfirm.jsx";
import {
	OUTING_PRESETS,
	typeLabel,
	typeColor,
	hangoutCongratsMessage,
	TIMEFRAME_GROUPS,
} from "../utils/hangouts.js";
import "../styles/Hangouts.css";
import "../styles/ItemActions.css";
import "../styles/CompletedSection.css";

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
	const [editingDetails, setEditingDetails] = useState(false);
	const [detailsForm, setDetailsForm] = useState(null);
	const [detailsUploading, setDetailsUploading] = useState(false);

	// inline editing (active hangouts)
	const [editingId, setEditingId] = useState(null);
	const [editForm, setEditForm] = useState(null);
	const [editUploading, setEditUploading] = useState(false);
	const [savingEdit, setSavingEdit] = useState(false);

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
				api.completeHangout(hangout.id, true),
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
		setEditingDetails(false);
	}

	function closeFeedback() {
		setFeedbackTarget(null);
		setEditingDetails(false);
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

	async function reopenHangout() {
		await api.completeHangout(feedbackTarget.id, false);
		closeFeedback();
	}

	const [showReopenConfirm, setShowReopenConfirm] = useState(false);

	function startEditDetails() {
		setDetailsForm({
			title: feedbackTarget.title,
			outing_type: feedbackTarget.outing_type || "",
			expected_timeframe: feedbackTarget.expected_timeframe,
			image_url: feedbackTarget.image_url || "",
			description: feedbackTarget.description || "",
		});
		setEditingDetails(true);
	}

	async function handleDetailsImageChange(e) {
		const file = e.target.files?.[0];
		if (!file) return;
		setDetailsUploading(true);
		try {
			const { url } = await api.uploadImage(file);
			setDetailsForm((f) => ({ ...f, image_url: url }));
		} catch (err) {
			alert(err.message);
		}
		setDetailsUploading(false);
	}

	async function saveDetails(e) {
		e.preventDefault();
		try {
			const updated = await api.updateHangout(feedbackTarget.id, {
				title: detailsForm.title.trim(),
				outing_type: detailsForm.outing_type.trim() || null,
				expected_timeframe: detailsForm.expected_timeframe,
				image_url: detailsForm.image_url || null,
				description: detailsForm.description.trim() || null,
			});
			setFeedbackTarget(updated);
			setEditingDetails(false);
			load();
		} catch (err) {
			alert(err.message);
		}
	}

	async function removeHangout(id) {
		if (!confirm("Remove this hangout for good?")) return;
		await api.deleteHangout(id);
		load();
	}

	function startEdit(hangout) {
		setEditingId(hangout.id);
		setEditForm({
			title: hangout.title,
			presetType: OUTING_PRESETS.some((p) => p.value === hangout.outing_type) ? hangout.outing_type : null,
			customType: OUTING_PRESETS.some((p) => p.value === hangout.outing_type) ? "" : hangout.outing_type || "",
			expected_timeframe: hangout.expected_timeframe,
			image_url: hangout.image_url || "",
			description: hangout.description || "",
		});
	}

	function cancelEdit() {
		setEditingId(null);
		setEditForm(null);
	}

	async function handleEditImageChange(e) {
		const file = e.target.files?.[0];
		if (!file) return;
		setEditUploading(true);
		try {
			const { url } = await api.uploadImage(file);
			setEditForm((f) => ({ ...f, image_url: url }));
		} catch (err) {
			alert(err.message);
		}
		setEditUploading(false);
	}

	async function saveEdit(e) {
		e.preventDefault();
		if (!editForm.title.trim()) return;
		setSavingEdit(true);
		try {
			await api.updateHangout(editingId, {
				title: editForm.title.trim(),
				outing_type: editForm.customType.trim() || editForm.presetType || null,
				expected_timeframe: editForm.expected_timeframe,
				image_url: editForm.image_url || null,
				description: editForm.description.trim() || null,
			});
			cancelEdit();
			load();
		} catch (err) {
			alert(err.message);
		}
		setSavingEdit(false);
	}

	const active = hangouts.filter((h) => !h.is_completed);
	const trophies = hangouts.filter((h) => h.is_completed);

	function renderTrophy(h) {
		return (
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
		);
	}

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
					const isEditing = editingId === h.id;

					if (isEditing) {
						return (
							<form key={h.id} className="card hangouts-item hangouts-item-editing" onSubmit={saveEdit}>
								<div className="field">
									<label>Title</label>
									<input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required />
								</div>
								<div className="field">
									<label>Type of outing</label>
									<div className="hangouts-type-row">
										{OUTING_PRESETS.map((p) => (
											<button
												type="button"
												key={p.value}
												className={`hangouts-type-btn ${editForm.presetType === p.value ? "selected" : ""}`}
												onClick={() =>
													setEditForm({
														...editForm,
														presetType: editForm.presetType === p.value ? null : p.value,
														customType: "",
													})
												}
											>
												<span>{p.icon}</span> {p.label}
											</button>
										))}
									</div>
									<input
										className="hangouts-custom-type"
										placeholder="Or type your own"
										value={editForm.customType}
										onChange={(e) =>
											setEditForm({ ...editForm, customType: e.target.value, presetType: e.target.value ? null : editForm.presetType })
										}
									/>
								</div>
								<HowSoonStepper
									value={editForm.expected_timeframe}
									onChange={(v) => setEditForm({ ...editForm, expected_timeframe: v })}
									label="How soon?"
								/>
								<div className="field">
									<label>Photo</label>
									<input type="file" accept="image/*" onChange={handleEditImageChange} disabled={editUploading} />
									{editForm.image_url && (
										<img src={editForm.image_url} alt="preview" style={{ maxHeight: 90, borderRadius: 12, marginTop: 8 }} />
									)}
								</div>
								<div className="field">
									<label>Details</label>
									<textarea
										rows="2"
										value={editForm.description}
										onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
									/>
								</div>
								<div className="item-edit-actions">
									<button className="btn btn-mint" disabled={savingEdit || editUploading}>
										{savingEdit ? "Saving…" : "Save"}
									</button>
									<button type="button" className="btn btn-ghost" onClick={cancelEdit}>
										Cancel
									</button>
								</div>
							</form>
						);
					}

					return (
						<div
							key={h.id}
							className={`card hangouts-item ${isAnimating ? "hangouts-item-animating" : ""}`}
							style={{ borderLeft: `8px solid var(${group.colorVar})` }}
						>
							<div className="hangouts-item-head">
								<BrushCheckbox checked={isAnimating} onClick={() => !isAnimating && beginComplete(h)} size={32} />
								<span className="pill-tag">
									{group.icon} {group.label}
								</span>
								{!isAnimating && (
									<div className="item-actions">
										<button className="item-edit-btn" onClick={() => startEdit(h)} title="Edit">
											✏️
										</button>
										<button className="item-delete-btn" onClick={() => removeHangout(h.id)} title="Remove">
											🗑️
										</button>
									</div>
								)}
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
				<div className="completed-section">
					<h2 className="completed-section-heading">🏆 Hangout trophies ({trophies.length})</h2>
					<div className="hangouts-trophy-grid">
						<CollapsibleList items={trophies} threshold={5} renderItem={renderTrophy} />
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

						{!editingDetails ? (
							<button type="button" className="btn btn-ghost" onClick={startEditDetails} style={{ marginBottom: 12 }}>
								✏️ Edit hangout details
							</button>
						) : (
							<form onSubmit={saveDetails} className="hangouts-details-edit">
								<div className="field">
									<label>Title</label>
									<input value={detailsForm.title} onChange={(e) => setDetailsForm({ ...detailsForm, title: e.target.value })} />
								</div>
								<div className="field">
									<label>Type</label>
									<input
										value={detailsForm.outing_type}
										onChange={(e) => setDetailsForm({ ...detailsForm, outing_type: e.target.value })}
									/>
								</div>
								<HowSoonStepper
									value={detailsForm.expected_timeframe}
									onChange={(v) => setDetailsForm({ ...detailsForm, expected_timeframe: v })}
									label="How soon was it?"
								/>
								<div className="field">
									<label>Photo</label>
									<input type="file" accept="image/*" onChange={handleDetailsImageChange} disabled={detailsUploading} />
								</div>
								<div className="field">
									<label>Description</label>
									<textarea
										rows="2"
										value={detailsForm.description}
										onChange={(e) => setDetailsForm({ ...detailsForm, description: e.target.value })}
									/>
								</div>
								<div className="item-edit-actions">
									<button className="btn btn-mint" disabled={detailsUploading}>
										Save details
									</button>
									<button type="button" className="btn btn-ghost" onClick={() => setEditingDetails(false)}>
										Cancel
									</button>
								</div>
							</form>
						)}

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

						<button type="button" className="btn btn-ghost" onClick={() => setShowReopenConfirm(true)} style={{ marginTop: 12 }}>
							↩️ Not done yet — move back to active list
						</button>
					</div>
				</div>
			)}

			{showReopenConfirm && (
				<UncheckConfirm
					onConfirm={reopenHangout}
					onClose={() => setShowReopenConfirm(false)}
				/>
			)}
		</div>
	);
}
