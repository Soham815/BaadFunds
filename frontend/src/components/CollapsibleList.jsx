import React, { useState } from "react";
import "../styles/CollapsibleList.css";

/**
 * Renders `items` via `renderItem`, but if there are more than `threshold`,
 * only shows the first `threshold` by default with a "show more" toggle.
 * Keeps long completed/trophy lists from feeling like clutter.
 */
export default function CollapsibleList({ items, threshold = 5, renderItem, emptyMessage }) {
	const [expanded, setExpanded] = useState(false);

	if (!items || items.length === 0) {
		return emptyMessage ? <p className="empty-state">{emptyMessage}</p> : null;
	}

	const shouldCollapse = items.length > threshold;
	const visible = shouldCollapse && !expanded ? items.slice(0, threshold) : items;

	return (
		<>
			{visible.map(renderItem)}
			{shouldCollapse && (
				<button type="button" className="collapsible-toggle" onClick={() => setExpanded((v) => !v)}>
					{expanded ? "▲ Show less" : `▼ Show ${items.length - threshold} more`}
				</button>
			)}
		</>
	);
}
