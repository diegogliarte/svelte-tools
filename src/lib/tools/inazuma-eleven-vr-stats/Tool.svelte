<script lang="ts">
	import PlayerStats from "./components/player-stats.svelte";
	import PlayerTiers from './components/player-tiers.svelte';
	import HissatsuStats from './components/hissatsu-stats.svelte';
	import EquipmentStats from './components/equipment-stats.svelte';
	import EquipmentTiers from './components/equipment-tiers.svelte';

	let displayMode = $state<"player-stats" | "player-tiers" | "hissatsu-stats" | "equipment-stats" | "equipment-tiers">("player-stats");
</script>

<div class="flex gap-2 mb-4">
	<button
		class="px-3 py-1 border hover:border-accent {displayMode === 'player-stats' ? 'bg-accent text-white border-accent' : ''} transition cursor-pointer"
		onclick={() => displayMode = "player-stats"}
	>
		Player Stats
	</button>

	<button
		class="px-3 py-1 border hover:border-accent {displayMode === 'player-tiers' ? 'bg-accent text-white border-accent' : 'tiers'} transition cursor-pointer"
		onclick={() => displayMode = "player-tiers"}
	>
		Player Tiers
	</button>

	<button
		class="px-3 py-1 border hover:border-accent {displayMode === 'hissatsu-stats' ? 'bg-accent text-white border-accent' : 'hissatsu'} transition cursor-pointer"
		onclick={() => displayMode = "hissatsu-stats"}
	>
		Hissatsu Stats
	</button>

	<button
		class="px-3 py-1 border hover:border-accent {displayMode === 'equipment-stats' ? 'bg-accent text-white border-accent' : 'hissatsu'} transition cursor-pointer"
		onclick={() => displayMode = "equipment-stats"}
	>
		Equipment Stats
	</button>

	<button
		class="px-3 py-1 border hover:border-accent {displayMode === 'equipment-tiers' ? 'bg-accent text-white border-accent' : 'hissatsu'} transition cursor-pointer"
		onclick={() => displayMode = "equipment-tiers"}
	>
		Equipment Tiers
	</button>
</div>

{#if displayMode === "player-stats"}
	<PlayerStats />
{:else if displayMode === "player-tiers"}
	<PlayerTiers />
{:else if displayMode === "hissatsu-stats"}
	<HissatsuStats />
{:else if displayMode === "equipment-stats"}
	<EquipmentStats />
{:else if displayMode === "equipment-tiers"}
	<EquipmentTiers />
{/if}
