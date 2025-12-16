<script lang="ts">
	import DigimonStats from './components/digimon-stats.svelte';
	import SkillStats from './components/skill-stats.svelte';
	import Button from '$lib/components/ui/button.svelte';

	let displayMode = $state<'digimon-stats' | 'skill-stats'>('digimon-stats');
</script>

<div class="flex gap-2 mb-4">
	<Button active={displayMode === 'digimon-stats'} onClick={() => displayMode = 'digimon-stats'}>
		Digimon Stats
	</Button>

	<Button active={displayMode === 'skill-stats'} onClick={() => displayMode = 'skill-stats'}>
		Skill Stats
	</Button>
</div>

{#if displayMode === "digimon-stats"}
	<DigimonStats />
{:else if displayMode === "skill-stats"}
	<SkillStats />
{/if}
