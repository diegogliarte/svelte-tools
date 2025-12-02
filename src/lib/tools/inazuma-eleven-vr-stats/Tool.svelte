<script lang="ts">
	import PlayerStats from "./components/player-stats.svelte";
	import PlayerTiers from './components/player-tiers.svelte';
	import HissatsuStats from './components/hissatsu-stats.svelte';

	let displayMode = $state<"stats" | "tiers" | "hissatsu">("stats");
</script>

<div class="flex gap-2 mb-4">
	<button
		class="px-3 py-1 border hover:border-accent {displayMode === 'stats' ? 'bg-accent text-white border-accent' : ''} transition cursor-pointer"
		onclick={() => displayMode = "stats"}
	>
		Stats
	</button>

	<button
		class="px-3 py-1 border hover:border-accent {displayMode === 'tiers' ? 'bg-accent text-white border-accent' : 'tiers'} transition cursor-pointer"
		onclick={() => displayMode = "tiers"}
	>
		Tier Lists
	</button>

	<button
		class="px-3 py-1 border hover:border-accent {displayMode === 'hissatsu' ? 'bg-accent text-white border-accent' : 'hissatsu'} transition cursor-pointer"
		onclick={() => displayMode = "hissatsu"}
	>
		Hissatsu
	</button>
</div>

{#if displayMode === "stats"}
	<PlayerStats />
{:else if displayMode === "tiers"}
	<PlayerTiers />
{:else if displayMode === "hissatsu"}
	<HissatsuStats />
{/if}
