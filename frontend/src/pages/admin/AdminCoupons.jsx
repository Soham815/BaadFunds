import React, { useEffect, useState } from "react";
import { api } from "../../api.js";

export default function AdminCoupons() {
	const [coupons, setCoupons] = useState([]);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [imageDataUrl, setImageDataUrl] = useState("");
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		load();
	}, []);

	function load() {
		api.getAllCoupons().then(setCoupons);
	}

	function handleImageChange(e) {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => setImageDataUrl(reader.result);
		reader.readAsDataURL(file);
	}

	async function handleSubmit(e) {
		e.preventDefault();
		setBusy(true);
		try {
			await api.createCoupon({ title, description, image_url: imageDataUrl || undefined });
			setTitle("");
			setDescription("");
			setImageDataUrl("");
			e.target.reset();
			load();
		} catch (err) {
			alert(err.message);
		}
		setBusy(false);
	}

	async function remove(id) {
		if (!confirm("Remove this coupon?")) return;
		await api.deleteCoupon(id);
		load();
	}

	return (
		<div>
			<div className="card">
				<h2>🎁 Drop a new surprise coupon</h2>
				<p>She'll get a scratch card popup the next time she opens BaadFunds.</p>
				<form onSubmit={handleSubmit}>
					<div className="admin-form-grid">
						<div className="field">
							<label>Title</label>
							<input value={title} onChange={(e) => setTitle(e.target.value)} required />
						</div>
						<div className="field">
							<label>Upload an image (optional)</label>
							<input type="file" accept="image/*" onChange={handleImageChange} />
						</div>
					</div>
					<div className="field">
						<label>Description</label>
						<textarea rows="2" value={description} onChange={(e) => setDescription(e.target.value)} required />
					</div>
					{imageDataUrl && (
						<img src={imageDataUrl} alt="preview" style={{ maxHeight: 100, borderRadius: 12, marginBottom: 12 }} />
					)}
					<button className="btn" disabled={busy}>
						{busy ? "Dropping…" : "🎁 Create coupon"}
					</button>
				</form>
			</div>

			<div className="admin-list" style={{ marginTop: 20 }}>
				{coupons.map((c) => (
					<div key={c.id} className="card admin-row">
						<div>
							<strong>{c.title}</strong>
							<p style={{ margin: "4px 0 0", fontSize: 13 }}>{c.description}</p>
							<span className={`badge ${c.is_revealed ? "ok" : "warn"}`}>
								{c.is_revealed ? "already scratched" : "waiting to be scratched"}
							</span>
						</div>
						<button className="btn btn-ghost" onClick={() => remove(c.id)}>
							Remove
						</button>
					</div>
				))}
			</div>
		</div>
	);
}
