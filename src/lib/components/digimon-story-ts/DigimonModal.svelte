<script lang="ts">
	import Modal from '$lib/components/ui/modal.svelte';
	import DigimonIcon from '$lib/components/digimon-story-ts/DigimonIcon.svelte';
	import digimonRaw from '$lib/data/digimon-story-ts/digimon.json';
	import skillsRaw from '$lib/data/digimon-story-ts/skills.json';

	import { type Digimon, getSkillIcon } from '$lib/utils/digimon-story-ts.utils';

	interface Skill {
		slug: string;
		category: 'special' | 'attachment';
		type: string;
		name: string;
		damage_type: string;
		sp_cost: number;
		accuracy: number;
		crit_rate: number;
		power: number;
		hit_count: number;
		description: string;
	}

	interface Props {
		digimon: Digimon;
		showModal: boolean;
	}

	let { digimon, showModal = $bindable() }: Props = $props();

	const digimonById = new Map<number, Digimon>(
		(digimonRaw as Digimon[]).map(d => [d.id, d])
	);

	const preEvolutions = $derived(
		digimon.pre_evolutions
			?.map(id => digimonById.get(id))
			.filter(Boolean) as Digimon[]
	);

	const evolutions = $derived(
		digimon.evolutions
			?.map(id => digimonById.get(id))
			.filter(Boolean) as Digimon[]
	);

	const skillBySlug = new Map<string, Skill>(
		(skillsRaw as Skill[]).map(s => [s.slug, s])
	);

	const specialSkills = $derived(
		digimon.skills.special
			.map(slug => skillBySlug.get(slug))
			.filter(Boolean) as Skill[]
	);

	const attachmentSkills = $derived(
		digimon.skills.attachment
			.map(slug => skillBySlug.get(slug))
			.filter(Boolean) as Skill[]
	);
</script>

{#snippet SkillCard(skill)}
	<div class="border p-2 flex flex-col gap-2">
		<div class="flex justify-between items-center">
			<div class="flex items-center gap-2">
				<img
					src={getSkillIcon(skill.type)}
					alt={skill.type}
					class="h-[1.25em] w-[1.25em] shrink-0"
				/>

				<span class="font-bold">{skill.name}</span>
			</div>

			{#if skill.sp_cost !== undefined}
				<span>
					SP {skill.sp_cost}
				</span>
			{/if}
		</div>

		<div>
			{skill.type}
				· {skill.damage_type}
				· Power {skill.power}{#if skill.hit_count && skill.hit_count > 1}×{skill.hit_count}
			{/if}
		</div>

		<div>
			{skill.description}
		</div>
	</div>
{/snippet}




<Modal bind:showModal title={digimon?.name}>
	{#if digimon}
		<!-- Header -->
		<div class="flex gap-4 mb-4">
			<div class="w-26 h-26">
				<DigimonIcon digimon={digimon} openModal={false} />
			</div>

			<div class="flex flex-col justify-between text-xs">
				<div class="font-bold">{digimon.name}</div>
				<div>{digimon.generation}</div>
				<div class="flex items-center gap-1 leading-none">
					<img
						class="h-[1.5em] w-[1.5em]"
						src="/digimon-story-ts/{digimon.attribute.toLowerCase().replace(' ', '-')}.png"
						alt="Attribute {digimon.attribute}"
					/>
					<span>{digimon.attribute} · {digimon.type}</span>
				</div>
				<div>Base Personality: {digimon.base_personality}</div>
				{#if digimon.ridable}
					<div class="text-accent">Ridable</div>
				{/if}
			</div>
		</div>

		<!-- Stats -->
		<h3 class="font-bold mb-1">Base Stats</h3>
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-1 mb-4 text-xs">
			<div>HP: <span class="font-bold">{digimon.base_stats.lv99.HP}</span></div>
			<div>SP: <span class="font-bold">{digimon.base_stats.lv99.SP}</span></div>
			<div>ATK: <span class="font-bold">{digimon.base_stats.lv99.ATK}</span></div>
			<div>DEF: <span class="font-bold">{digimon.base_stats.lv99.DEF}</span></div>
			<div>INT: <span class="font-bold">{digimon.base_stats.lv99.INT}</span></div>
			<div>SPI: <span class="font-bold">{digimon.base_stats.lv99.SPI}</span></div>
			<div>SPD: <span class="font-bold">{digimon.base_stats.lv99.SPD}</span></div>
		</div>

		<!-- Evolution Conditions -->
		{#if digimon.evolution_conditions?.length}
			<h3 class="font-bold mb-2">Evolution Conditions</h3>

			<div class="flex flex-col gap-2 mb-4 text-xs">
				{#each digimon.evolution_conditions as evo (evo)}
					<div class="border p-2">
						<div class="font-semibold mb-1 capitalize">{evo.type}</div>
						<ul class="list-disc list-inside">
							{#each Object.entries(evo.requirements) as [key, value]}
								<li>{key}: {value}</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Skills -->
		{#if specialSkills.length || attachmentSkills.length}
			<h3 class="font-bold mb-2">Skills</h3>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-xs">
				{#if specialSkills.length}
					<div>
						<div class="font-semibold mb-1">Special</div>

						<div class="flex flex-col gap-2">
							{#each specialSkills as s (s.slug)}
								{@render SkillCard(s)}
							{/each}
						</div>
					</div>
				{/if}

				{#if attachmentSkills.length}
					<div>
						<div class="font-semibold mb-1">Attachments</div>

						<div class="flex flex-col gap-2">
							{#each attachmentSkills as s (s.slug)}
								{@render SkillCard(s)}
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Personalities -->
		{#if digimon.possible_personalities}
			<h3 class="font-bold mb-2">Possible Personalities</h3>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-xs">
				{#each Object.entries(digimon.possible_personalities) as [group, entries]}
					<div class="border p-2">
						<div class="font-semibold mb-1">{group}</div>
						<ul class="list-disc list-inside">
							{#each entries as p (p.name)}
								<li>
									{p.name}
									<span>({p.chance}%)</span>
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Evolutions -->
		{#if preEvolutions.length || evolutions.length}
			<h3 class="font-bold mb-2">Evolution Tree</h3>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
				{#if preEvolutions.length}
					<div>
						<div class="font-semibold mb-1">Pre-evolutions</div>
						<div class="flex flex-wrap gap-2">
							{#each preEvolutions as d (d.id)}
								<div class="flex flex-col items-center w-16">
									<DigimonIcon digimon={d} />
									<div class="text-center mt-1">{d.name}</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				{#if evolutions.length}
					<div>
						<div class="font-semibold mb-1">Evolutions</div>
						<div class="flex flex-wrap gap-2">
							{#each evolutions as d (d.id)}
								<div class="flex flex-col items-center w-16">
									<DigimonIcon digimon={d} />
									<div class="text-center text-xs mt-1 truncate w-full">{d.name}</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}

	{/if}
</Modal>
