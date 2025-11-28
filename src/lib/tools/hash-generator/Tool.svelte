<script lang="ts">
	import TextInput from '$lib/components/ui/text-input.svelte';
	import LabeledRow from '$lib/components/ui/labeled-row.svelte';
	import CryptoJS from "crypto-js";

	const {
		MD5, SHA1, SHA256, SHA224, SHA512, SHA384, SHA3, RIPEMD160,
		enc
	} = CryptoJS;
	let text = $state("");

	const algorithms = [
		{ name: "MD5", fn: MD5 },
		{ name: "SHA1", fn: SHA1 },
		{ name: "SHA256", fn: SHA256 },
		{ name: "SHA512", fn: SHA512 },
		{ name: "SHA384", fn: SHA384 },
		{ name: "SHA224", fn: SHA224 },
		{ name: "SHA3", fn: SHA3 },
		{ name: "RIPEMD160", fn: RIPEMD160 },
	];
</script>

<TextInput bind:value={text} label="Text to hash" placeholder="Enter text..." />


<div class="flex flex-col gap-1">
	{#each algorithms as algo (algo.name)}
		<LabeledRow
			label={algo.name}
			value={algo.fn(text).toString(enc.Hex)}
			group="hash-generator"
		/>
	{/each}
</div>