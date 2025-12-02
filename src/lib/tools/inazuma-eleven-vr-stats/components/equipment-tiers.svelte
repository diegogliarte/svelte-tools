<script lang="ts">
	import boots from "$lib/data/inazuma-eleven-vr/boots.json";
	import pendants from "$lib/data/inazuma-eleven-vr/pendants.json";
	import bracelets from "$lib/data/inazuma-eleven-vr/bracelets.json";
	import misc from "$lib/data/inazuma-eleven-vr/miscs.json";

	/* ------------------------------------------------
	   MERGE AND CLEAN
	------------------------------------------------ */
	function cleanItems(list: any[]) {
		return list.map(r => {
			const c: any = { ...r };
			for (const k of Object.keys(c)) {
				if (c[k] === "") c[k] = 0;
			}
			return c;
		});
	}

	const gear = {
		Boots: cleanItems(boots),
		Pendants: cleanItems(pendants),
		Bracelets: cleanItems(bracelets),
		Misc: cleanItems(misc)
	} satisfies Record<string, any[]>;

	const roleStat = {
		FW: "Shoot AT",
		MF: "Focus AT",
		DF: "Focus DF",
		GK: "KP"
	} as const;

	type Role = keyof typeof roleStat;

	function computeTopItems(role: Role, type: keyof typeof gear) {
		const stat = roleStat[role];

		return gear[type]
			.map(item => ({
				item,
				value: Number(item[stat] || 0)
			}))
			.filter(x => x.value > 0)
			.sort((a, b) => b.value - a.value)
			.slice(0, 5);
	}
</script>

<div class="flex flex-col gap-12">
	{#each Object.keys(roleStat) as role (role)}
		<section>
			<h2 class="text-large">{role}</h2>

			<!-- Four gear categories -->
			<div class="grid grid-cols-4 gap-6">

				{#each Object.keys(gear) as type (type)}
					<div>
						<h3>{type}</h3>

						{#each computeTopItems(role, type) as entry (entry.item.Item)}
							<div
								class="mb-2 p-2 border hover:border-accent transition cursor-pointer flex flex-col gap-0.5"
							>
								<div class="font-bold text-sm">{entry.item.Item}</div>
								<div class="text-xs opacity-70">
									{roleStat[role]}: {entry.value}
								</div>

								<div class="text-xs opacity-50">
									{#if entry.item.Shop1}{entry.item.Shop1}{/if}
									{#if entry.item.Shop2} • {entry.item.Shop2}{/if}
									{#if entry.item.Shop3} • {entry.item.Shop3}{/if}
								</div>
							</div>
						{/each}

						{#if computeTopItems(role, type).length === 0}
							<div class="opacity-50 text-xs italic">No items boost this stat.</div>
						{/if}
					</div>
				{/each}

			</div>
		</section>
	{/each}
</div>
