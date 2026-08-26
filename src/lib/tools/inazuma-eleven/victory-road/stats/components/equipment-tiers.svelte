<script lang="ts">
	import { onMount } from 'svelte';
	import { loadEquipment, type EquipmentItem } from '$lib/data/inazuma-eleven-vr/data';

	const gearTypes = ['Boots', 'Pendants', 'Bracelets', 'Misc'] as const;
	type GearType = (typeof gearTypes)[number];

	/* ------------------------------------------------
	   MERGE AND CLEAN
	------------------------------------------------ */
	function cleanItems(list: EquipmentItem[]) {
		return list.map((r) => {
			const c: EquipmentItem = { ...r };
			for (const k of Object.keys(c)) {
				if (c[k] === '') c[k] = 0;
			}
			return c;
		});
	}

	let gear = $state<Record<GearType, EquipmentItem[]>>({
		Boots: [],
		Pendants: [],
		Bracelets: [],
		Misc: []
	});

	onMount(async () => {
		const { boots, pendants, bracelets, misc } = await loadEquipment();
		gear = {
			Boots: cleanItems(boots),
			Pendants: cleanItems(pendants),
			Bracelets: cleanItems(bracelets),
			Misc: cleanItems(misc)
		};
	});

	const roleStat = {
		FW: 'Shoot AT',
		MF: 'Focus AT',
		DF: 'Focus DF',
		GK: 'KP'
	} as const;

	type Role = keyof typeof roleStat;

	const roles = Object.keys(roleStat) as Role[];
	const loaded = $derived(gearTypes.some((type) => gear[type].length));

	function computeTopItems(role: Role, type: GearType) {
		const stat = roleStat[role];

		return gear[type]
			.map((item) => ({
				item,
				value: Number(item[stat] || 0)
			}))
			.filter((x) => x.value > 0)
			.sort((a, b) => b.value - a.value)
			.slice(0, 5);
	}
</script>

{#if loaded}
	<div class="flex flex-col gap-12">
		{#each roles as role (role)}
			<section>
				<h2 class="text-large">{role}</h2>

				<!-- Four gear categories -->
				<div class="grid grid-cols-4 gap-6">
					{#each gearTypes as type (type)}
						<div>
							<h3>{type}</h3>

							{#each computeTopItems(role, type) as entry (entry.item.Item)}
								<div class="mb-2 flex cursor-pointer flex-col gap-0.5 border p-2 transition hover:border-accent">
									<div class="text-sm font-bold">{entry.item.Item}</div>
									<div class="text-xs opacity-70">
										{roleStat[role]}: {entry.value}
									</div>

									<div class="text-xs opacity-50">
										{#if entry.item.Shop1}{entry.item.Shop1}{/if}
										{#if entry.item.Shop2}
											• {entry.item.Shop2}{/if}
										{#if entry.item.Shop3}
											• {entry.item.Shop3}{/if}
									</div>
								</div>
							{/each}

							{#if computeTopItems(role, type).length === 0}
								<div class="text-xs italic opacity-50">No items boost this stat.</div>
							{/if}
						</div>
					{/each}
				</div>
			</section>
		{/each}
	</div>
{:else}
	<p class="text-center opacity-60">Loading equipment...</p>
{/if}
