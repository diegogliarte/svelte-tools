<script lang="ts">
	import PlayerStats from "./components/player-stats.svelte";
	import PlayerTiers from './components/player-tiers.svelte';
	import HissatsuStats from './components/hissatsu-stats.svelte';
	import EquipmentStats from './components/equipment-stats.svelte';
	import EquipmentTiers from './components/equipment-tiers.svelte';
	import Button from "$lib/components/ui/button.svelte";

	let displayMode = $state<"player-stats" | "player-tiers" | "hissatsu-stats" | "equipment-stats" | "equipment-tiers">("player-stats");
</script>

<div class="flex gap-2 mb-4">
	<Button active={displayMode === 'player-stats'} onClick={() => displayMode = 'player-stats'}>
		Player Stats
	</Button>

	<Button active={displayMode === 'player-tiers'} onClick={() => displayMode = 'player-tiers'}>
		Player Tiers
	</Button>

	<Button active={displayMode === 'hissatsu-stats'} onClick={() => displayMode = 'hissatsu-stats'}>
		Hissatsu Stats
	</Button>

	<Button active={displayMode === 'equipment-stats'} onClick={() => displayMode = 'equipment-stats'}>
		Equipment Stats
	</Button>

	<Button active={displayMode === 'equipment-tiers'} onClick={() => displayMode = 'equipment-tiers'}>
		Equipment Tiers
	</Button>
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
