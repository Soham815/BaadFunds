import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { api } from "../api.js";
import BrushCheckbox from "../components/BrushCheckbox.jsx";
import StrikeThroughText from "../components/StrikeThroughText.jsx";
import CollapsibleList from "../components/CollapsibleList.jsx";
import UncheckConfirm from "../components/UncheckConfirm.jsx";
import "../styles/ToDo.css";
import "../styles/ItemActions.css";
import "../styles/CompletedSection.css";

const MOTIVATION_MESSAGES = [
	"You've got this! Every tiny step counts 🌱",
	"Future you is already proud of present you 💖",
	"One task at a time — no rush, just progress ✨",
	"Look at you, being productive and adorable 🐷",
	"This is going to feel SO good once it's done 🎀",
	"Small steps still move the whole garden forward 🌸",
	"You're doing better than you think, promise 🥰",
	"Add it to the list, then watch yourself crush it 💪",
];

const CONGRATS_MESSAGES = [
	"Yesss! You actually did it — so proud of you 🎉",
	"Look at you go! One more thing off your plate 💖",
	"That's my Baad! Crushing tasks like a champ 🏆",
	"Amazing work — treat yourself, you earned it 🍰",
	"You just leveled up in real life. Incredible 🌟",
	"Task: defeated. Baad: victorious. 🐷👑",
];

function randomFrom(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

function fireConfetti() {
	confetti({
		particleCount: 90,
		spread: 75,
		origin: { y: 0.6 },
		colors: ["#ff7a9e", "#ffc2de", "#bdf3d4", "#ffe08a", "#e7dbff"],
	});
}

export default function ToDo() {
	const [todos, setTodos] = useState([]);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [showDescField, setShowDescField] = useState(false);
	const [busy, setBusy] = useState(false);

	const [motivation, setMotivation] = useState(null);
	const [congrats, setCongrats] = useState(null);

	// animation state for whichever task is currently mid-completion
	const [animatingId, setAnimatingId] = useState(null);
	const [animPhase, setAnimPhase] = useState(null); // 'tick' | 'strike' | null

	// inline editing
	const [editingId, setEditingId] = useState(null);
	const [editTitle, setEditTitle] = useState("");
	const [editDescription, setEditDescription] = useState("");
	const [savingEdit, setSavingEdit] = useState(false);

	useEffect(() => {
		load();
	}, []);

	function load() {
		api.getTodos().then(setTodos);
	}

	async function handleAdd(e) {
		e.preventDefault();
		if (!title.trim()) return;
		setBusy(true);
		try {
			await api.createTodo(title.trim(), description.trim());
			setTitle("");
			setDescription("");
			setShowDescField(false);
			setMotivation(randomFrom(MOTIVATION_MESSAGES));
			load();
		} catch (err) {
			alert(err.message);
		}
		setBusy(false);
	}

	function beginComplete(todo) {
		if (animatingId) return; // one at a time keeps it feeling special, not chaotic
		setAnimatingId(todo.id);
		setAnimPhase("tick");

		// persist in the background — the animation is just for show
		api.completeTodo(todo.id, true).catch(() => {});

		setTimeout(() => {
			setAnimPhase("strike");
		}, 550);

		setTimeout(() => {
			fireConfetti();
			setCongrats(randomFrom(CONGRATS_MESSAGES));
		}, 550 + 950);
	}

	function closeCongrats() {
		setCongrats(null);
		setAnimatingId(null);
		setAnimPhase(null);
		load(); // now it settles into its proper "completed" spot at the bottom
	}

	async function uncheckTodo(todo) {
		try {
			await api.completeTodo(todo.id, false);
			load();
		} catch (err) {
			alert(err.message);
		}
	}

	const [pendingUncheck, setPendingUncheck] = useState(null);

	async function removeTodo(id) {
		if (!confirm("Delete this task for good?")) return;
		await api.deleteTodo(id);
		load();
	}

	function startEdit(todo) {
		setEditingId(todo.id);
		setEditTitle(todo.title);
		setEditDescription(todo.description || "");
	}

	function cancelEdit() {
		setEditingId(null);
	}

	async function saveEdit(e) {
		e.preventDefault();
		if (!editTitle.trim()) return;
		setSavingEdit(true);
		try {
			await api.updateTodo(editingId, { title: editTitle.trim(), description: editDescription.trim() });
			setEditingId(null);
			load();
		} catch (err) {
			alert(err.message);
		}
		setSavingEdit(false);
	}

	function renderTodo(todo) {
		const isAnimating = animatingId === todo.id;
		const isDone = todo.is_completed && !isAnimating;
		const isEditing = editingId === todo.id;
		const strikePhase = isAnimating
			? animPhase === "strike"
				? "drawing"
				: "idle"
			: isDone
			? "drawn"
			: "idle";

		if (isEditing) {
			return (
				<form key={todo.id} className="card todo-item todo-item-editing" onSubmit={saveEdit}>
					<div className="field">
						<label>Title</label>
						<input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
					</div>
					<div className="field">
						<label>Description</label>
						<textarea rows="2" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
					</div>
					<div className="item-edit-actions">
						<button className="btn btn-mint" disabled={savingEdit}>
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
				key={todo.id}
				className={`todo-item card ${isDone ? "todo-item-done" : ""} ${isAnimating ? "todo-item-animating" : ""}`}
			>
				<BrushCheckbox
					checked={isDone || isAnimating}
					onClick={() => {
						if (isAnimating) return;
						if (todo.is_completed) setPendingUncheck(todo);
						else beginComplete(todo);
					}}
					size={36}
				/>

				<div className="todo-text-wrap">
					<h4 className="todo-title">
						<StrikeThroughText phase={strikePhase}>{todo.title}</StrikeThroughText>
					</h4>
					{todo.description && <p className="todo-desc">{todo.description}</p>}
				</div>

				{!isAnimating && (
					<div className="item-actions">
						<button className="item-edit-btn" onClick={() => startEdit(todo)} title="Edit task">
							✏️
						</button>
						<button className="todo-delete" onClick={() => removeTodo(todo.id)} title="Delete task">
							🗑️
						</button>
					</div>
				)}
			</div>
		);
	}

	const activeTodos = todos.filter((t) => !t.is_completed || animatingId === t.id);
	const completedTodos = todos.filter((t) => t.is_completed && animatingId !== t.id);

	return (
		<div className="todo-page">
			<div className="card todo-intro">
				<h1>📝 Your little to-do garden</h1>
				<p>Plant a task, water it with focus, and watch it bloom into "done."</p>
			</div>

			<div className="card todo-form-card">
				<form onSubmit={handleAdd}>
					<div className="field">
						<label>What needs doing?</label>
						<input
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="e.g. Water the plants 🌿"
							required
						/>
					</div>

					{!showDescField ? (
						<button
							type="button"
							className="btn btn-ghost"
							style={{ marginBottom: 14 }}
							onClick={() => setShowDescField(true)}
						>
							+ Add a little description (optional)
						</button>
					) : (
						<div className="field">
							<label>Any details?</label>
							<textarea
								rows="2"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Optional notes to your future self..."
							/>
						</div>
					)}

					<button className="btn" disabled={busy}>
						{busy ? "Planting…" : "🌱 Add task"}
					</button>
				</form>
			</div>

			{motivation && (
				<div className="todo-motivation card">
					<span>{motivation}</span>
					<button className="todo-msg-close" onClick={() => setMotivation(null)}>
						✕
					</button>
				</div>
			)}

			<div className="todo-list">
				{activeTodos.length === 0 && completedTodos.length === 0 && (
					<div className="empty-state card">
						<h3>Nothing here yet!</h3>
						<p>Add your first little task above 🌷</p>
					</div>
				)}

				{activeTodos.map(renderTodo)}
			</div>

			{completedTodos.length > 0 && (
				<div className="completed-section">
					<h3 className="completed-section-heading">✅ Done ({completedTodos.length})</h3>
					<div className="todo-list">
						<CollapsibleList items={completedTodos} threshold={5} renderItem={renderTodo} />
					</div>
				</div>
			)}

			{congrats && (
				<div className="todo-congrats-overlay">
					<div className="todo-congrats-modal">
						<p className="todo-eyebrow">🎉 Task complete!</p>
						<h2>{congrats}</h2>
						<button className="btn" onClick={closeCongrats}>
							Yay, thank you! 💖
						</button>
					</div>
				</div>
			)}

			{pendingUncheck && (
				<UncheckConfirm
					onConfirm={() => uncheckTodo(pendingUncheck)}
					onClose={() => setPendingUncheck(null)}
				/>
			)}
		</div>
	);
}
