<script lang="ts">
	import DigimonIcon from '$lib/components/digimon-story-ts/DigimonIcon.svelte';
	import type { Digimon } from '$lib/utils/digimon-story-ts.utils';

	interface Props {
		digimon: Digimon;
	}

	let { digimon }: Props = $props();
</script>

<div class="flex items-center gap-2">
	<div class="w-14 h-14 aspect-square">
		<DigimonIcon digimon={digimon} />
	</div>
	<div>{digimon.name}</div>
</div>
