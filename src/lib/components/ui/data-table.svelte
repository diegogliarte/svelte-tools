<script lang="ts">
	import TextInput from '$lib/components/ui/text-input.svelte';
	import MdiChevronUp from '~icons/mdi/chevron-up';
	import MdiChevronDown from '~icons/mdi/chevron-down';
	import MdiChevronUpDown from "~icons/mdi/chevron-up-down";

	export interface Column<RowType = any> {
		key: string;
		label: string;
		width?: string;
		render?: (row: RowType) => string;
		searchValue?: (row: RowType) => string;
		sortValue?: (row: RowType) => number | string;
	}

	interface Props<RowType = any> {
		columns: Column<RowType>[];
		rows: RowType[];
		pageSize?: number;
	}

	let { columns, rows, pageSize = 50 }: Props = $props();

	let search = $state("");
	let sortKey = $state<keyof any | null>(null);
	let sortDir = $state<"asc" | "desc" | null>(null);

	let processed = $derived.by(() => {
		let filtered = rows;

		// --- filtering ---
		if (search.trim()) {
			const q = search.toLowerCase();

			filtered = rows.filter((r) =>
				columns.some((c) => {
					let value = "";

					// 1) If column defines a custom search extractor
					if (c.searchValue) {
						value = c.searchValue(r).toLowerCase();
					}

					// 2) Else if column uses a renderer → extract text from HTML
					else if (c.render) {
						const html = c.render(r);
						value = html
							.replace(/<[^>]+>/g, " ")     // strip tags
							.replace(/\s+/g, " ")         // normalize spaces
							.trim()
							.toLowerCase();
					}

					// 3) Else fallback to raw cell value
					else {
						const raw = r[c.key];
						value = typeof raw === "string"
							? raw.toLowerCase()
							: String(raw ?? "").toLowerCase();
					}

					return value.includes(q);
				})
			);
		}

		// --- sorting (unchanged) ---
		if (sortKey) {
			filtered = [...filtered].sort((a, b) => {
				const col = columns.find(c => c.key === sortKey);

				const av = col?.sortValue ? col.sortValue(a) : a[sortKey];
				const bv = col?.sortValue ? col.sortValue(b) : b[sortKey];

				if (av < bv) return sortDir === "asc" ? -1 : 1;
				if (av > bv) return sortDir === "asc" ? 1 : -1;
				return 0;
			});
		}

		return filtered;
	});

	// ---------------------------
	// INFINITE SCROLL BASED ON processed rows
	// ---------------------------

	let page = $state(1);
	let visibleRows = $derived.by(() => processed.slice(0, page * pageSize));

	function onScroll() {
		const bottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 50;
		if (bottom && visibleRows.length < processed.length) {
			page += 1;
		}
	}

	$effect(() => {
		window.addEventListener("scroll", onScroll);
		return () => window.removeEventListener("scroll", onScroll);
	});

	// ---------------------------
	// SORT TOGGLER
	// ---------------------------
	function toggleSort(key: keyof any) {
		if (sortKey !== key) {
			sortKey = key;
			sortDir = "desc";
		} else if (sortDir === "desc") {
			sortDir = "asc";
		} else {
			sortKey = null;
			sortDir = null;
		}
	}
</script>

<!-- Search + Counter -->
<div class="flex items-center justify-between gap-2">
	<div class="w-48">
		<TextInput
			placeholder="Search..."
			bind:value={search}
		/>
	</div>


	<div class="opacity-70 text-small">
		Showing {processed.length} of {rows.length}
	</div>
</div>

<div>
	<table class="w-full border-collapse text-sm">
		<thead>
		<tr class="border-b border-text/50">
			{#each columns as col (col)}
				<th
					class="text-left p-1 font-medium cursor-pointer select-none transition"
					style={col.width ? `width:${col.width}` : ""}
					onclick={() => toggleSort(col.key)}
				>
					<div class="flex items-center gap-1 transition hover:text-accent {sortKey === col.key ? 'text-accent' : ''}">
						<span>{col.label}</span>

						<span class="inline-flex items-center justify-center opacity-60">
							{#if sortKey === col.key}
								{#if sortDir === "asc"}
									<MdiChevronUp />
								{:else if sortDir === "desc"}
									<MdiChevronDown />
								{/if}
							{:else}
								<MdiChevronUpDown class="opacity-30" />
							{/if}
						</span>
					</div>
				</th>

			{/each}
		</tr>
		</thead>

		<tbody>
		{#if visibleRows.length === 0}
			<tr>
				<td colspan={columns.length} class="py-4 text-center opacity-70">
					No results
				</td>
			</tr>
		{:else}
			{#each visibleRows as row (row)}
				<tr class="border-b border-text/25 hover:bg-accent-dark/20 transition">
					{#each columns as col (col)}
						<td class="p-1">
							{#if col.render}
								{@html col.render(row)}
							{:else}
								{row[col.key]}
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		{/if}
		</tbody>
	</table>
</div>
