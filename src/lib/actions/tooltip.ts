import type { Action } from "svelte/action";

interface TooltipParams {
	text: string;
	delay?: number;
	position?: "top" | "bottom" | "left" | "right";
}

export const tooltipAction: Action<HTMLElement, TooltipParams> = (node, params) => {
	let { text, delay = 0, position = "top" } = params ?? {};
	let timer: ReturnType<typeof setTimeout>;
	let el: HTMLDivElement | null = null;

	const posClass = {
		top:    "bottom-full left-1/2 -translate-x-1/2 -mb-2",
		bottom: "top-full left-1/2 -translate-x-1/2 -mt-2",
		left:   "right-full top-1/2 -translate-y-1/2 -mr-2",
		right:  "left-full top-1/2 -translate-y-1/2 -ml-2",
	}[position];

	function show() {
		// Create tooltip
		el = document.createElement("div");
		el.textContent = text;

		// Style (matches your inputs, labels, table cells, etc.)
		el.className = `
			absolute z-50
			px-2 py-1
			border bg-bg
			text-small
			whitespace-nowrap
			${posClass}
			pointer-events-none
		`;

		el.style.position = "absolute";

		// Make parent a positioning anchor
		node.classList.add("relative");

		node.appendChild(el);
	}

	function hide() {
		if (el) el.remove();
		el = null;
	}

	function handleEnter() {
		timer = setTimeout(show, delay);
	}

	function handleLeave() {
		clearTimeout(timer);
		hide();
	}

	node.addEventListener("mouseenter", handleEnter);
	node.addEventListener("mouseleave", handleLeave);

	return {
		update(newParams) {
			text = newParams?.text;
			delay = newParams?.delay ?? 150;
			position = newParams?.position ?? "top";
		},

		destroy() {
			node.removeEventListener("mouseenter", handleEnter);
			node.removeEventListener("mouseleave", handleLeave);
			hide();
		}
	};
};
