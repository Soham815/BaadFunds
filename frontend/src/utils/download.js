/** Triggers a browser download for a data URL (e.g. from canvas.toDataURL()). */
export function downloadDataUrl(dataUrl, filename) {
	const a = document.createElement("a");
	a.href = dataUrl;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
}

/** Turns arbitrary text into a safe filename fragment. */
export function slugify(text) {
	return (text || "download").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
