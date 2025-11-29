<script lang="ts">
	import NumberInput from "$lib/components/ui/number-input.svelte";
	import CheckboxInput from "$lib/components/ui/checkbox-input.svelte";
	import LabeledRow from "$lib/components/ui/labeled-row.svelte";
	import Icon from "@iconify/svelte";

	let length = $state(16);
	let useLower = $state(true);
	let useUpper = $state(true);
	let useNumbers = $state(true);
	let useSymbols = $state(false);


	let password = $derived.by(generate);
	let spinning = $state(false);

	function regenerate() {
		password = generate();
	}

	function generate(): string {
		let chars = "";

		if (useLower) chars += "abcdefghijklmnopqrstuvwxyz";
		if (useUpper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		if (useNumbers) chars += "0123456789";
		if (useSymbols) chars += "!@#$%^&*()-_=+[]{};:,.<>?";

		if (chars.length === 0) return "";

		let result = "";
		for (let i = 0; i < length; i++) {
			result += chars[Math.floor(Math.random() * chars.length)];
		}
		return result;
	}
</script>

<NumberInput bind:value={length} label="Length" min={1}/>

<div class="grid grid-cols-2 gap-2">
	<CheckboxInput label="Lowercase (a–z)" bind:checked={useLower} />
	<CheckboxInput label="Uppercase (A–Z)" bind:checked={useUpper} />
	<CheckboxInput label="Numbers (0–9)" bind:checked={useNumbers} />
	<CheckboxInput label="Symbols (!@#$)" bind:checked={useSymbols} />
</div>

<div class="flex items-center gap-2">
	<LabeledRow value={password ? password : "-"} />
	<button
		class={`cursor-pointer transition hover:text-accent ${spinning ? 'spin' : ''}`}
		onclick={() => {regenerate(); spinning = true} }
		onanimationend={() => spinning = false}
	>
		<Icon icon="mdi:refresh" />
	</button>
</div>

<style>
    .spin {
        animation: spin 0.2s linear;
    }
    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
</style>
