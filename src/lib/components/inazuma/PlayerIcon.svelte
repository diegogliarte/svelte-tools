<script lang="ts">
	import { tooltipAction } from "$lib/actions/tooltip";

	interface Props {
		img: string;
		name: string;
		element: string;
		tooltip?: boolean;
		click?: () => void;
		variant?: "default" | "viewer";
	}

	let {
		img,
		name,
		element,
		tooltip = true,
		click = undefined,
		variant = "default"
	}: Props = $props();

	const elementColor: Record<string, string> = {
		Mountain: "bg-yellow-800/75",
		Fire: "bg-red-800/75",
		Forest: "bg-green-800/75",
		Wind: "bg-sky-800/75"
	};

	function handleClick() {
		if (click) click();
	}
</script>

<button
	type="button"
	class="
		w-full cursor-pointer p-0
		hover:border-accent"

	onclick={handleClick}
	use:tooltipAction={{
		text: tooltip ? name : "",
		position: variant === "viewer" ? "top" : "bottom",
		trigger: variant === "viewer" ? "click" : "hover"
	}}
>
	<img
		src={img}
		alt={name}
		loading="lazy"
		class=" w-full h-full object-cover aspect-square pointer-events-none border
		{elementColor[element] ?? 'bg-neutral-700'}
		{variant === 'viewer' ? 'group-hover:scale-300 group-hover:z-50 transition transform' : ''}
		"
	/>
</button>
