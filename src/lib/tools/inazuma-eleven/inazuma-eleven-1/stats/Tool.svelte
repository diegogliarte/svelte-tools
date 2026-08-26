<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import SelectInput from '$lib/components/ui/select-input.svelte';
	import { gameOptions, loadGame, type GameData } from '$lib/data/inazuma-eleven/original-series/data';
	import EquipmentStats from './components/equipment-stats.svelte';
	import MoveStats from './components/move-stats.svelte';
	import PlayerStats from './components/player-stats.svelte';

	let displayMode = $state<'players' | 'moves' | 'equipment'>('players');
	let game = $state('ie-1');
	let data = $state<GameData | null>(null);

	$effect(() => {
		const selected = game;
		data = null;
		loadGame(selected).then((value) => {
			if (game === selected) data = value;
		});
	});
</script>

<div class="mb-4 flex flex-wrap items-end gap-4">
	<SelectInput label="Game" bind:value={game} allowEmpty={false} persist={false} options={gameOptions} />
	<div class="flex flex-wrap gap-2">
		<Button active={displayMode === 'players'} onClick={() => (displayMode = 'players')}>Player Stats</Button>
		<Button active={displayMode === 'moves'} onClick={() => (displayMode = 'moves')}>Hissatsu Stats</Button>
		<Button active={displayMode === 'equipment'} onClick={() => (displayMode = 'equipment')}>Equipment Stats</Button>
	</div>
</div>

{#if data}
	{#if displayMode === 'players'}
		<PlayerStats players={data.players} />
	{:else if displayMode === 'moves'}
		<MoveStats moves={data.moves} players={data.players} />
	{:else}
		<EquipmentStats equipment={data.equipment} />
	{/if}
{:else}
	<p class="text-center opacity-60">Loading game data...</p>
{/if}
