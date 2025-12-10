import type { Action } from 'svelte/action';

interface TooltipParams {
	text: string;
	delay?: number;
	position?: 'top' | 'bottom' | 'left' | 'right';
	trigger?: 'hover' | 'click' | 'both';
}

export const tooltipAction: Action<HTMLElement, TooltipParams> = (node, params) => {
	let { text, delay = 0, position = 'top', trigger = 'hover' } = params ?? {};
	let timer: ReturnType<typeof setTimeout>;
	let el: HTMLDivElement | null = null;
	let isVisible = false;

	const posClass = {
		top: 'bottom-full left-1/2 -translate-x-1/2 -mb-2',
		bottom: 'top-full left-1/2 -translate-x-1/2 -mt-2',
		left: 'right-full top-1/2 -translate-y-1/2 -mr-2',
		right: 'left-full top-1/2 -translate-y-1/2 -ml-2'
	}[position];

	function show() {
		if (isVisible) return;
		isVisible = true;

		el = document.createElement('div');
		el.textContent = text;

		el.className = `
            absolute z-50
            px-2 py-1
            border bg-bg
            text-small
            whitespace-nowrap
            ${posClass}
            pointer-events-none
        `;

		el.style.position = 'absolute';
		node.classList.add('relative');
		node.appendChild(el);
	}

	function hide() {
		if (!isVisible) return;
		isVisible = false;

		if (el) el.remove();
		el = null;
	}

	function handleEnter() {
		if (trigger === 'hover' || trigger === 'both') {
			timer = setTimeout(show, delay);
		}
	}

	function handleLeave() {
		clearTimeout(timer);
		hide();
	}

	function handleClick() {
		if (trigger === 'click' || trigger === 'both') {
			isVisible ? hide() : show();
		}
	}

	node.addEventListener('mouseenter', handleEnter);
	node.addEventListener('mouseleave', handleLeave);
	node.addEventListener('click', handleClick);

	return {
		update(newParams) {
			text = newParams?.text;
			delay = newParams?.delay ?? delay;
			position = newParams?.position ?? position;
			trigger = newParams?.trigger ?? trigger;
		},

		destroy() {
			node.removeEventListener('mouseenter', handleEnter);
			node.removeEventListener('mouseleave', handleLeave);
			node.removeEventListener('click', handleClick);
			hide();
		}
	};
};
