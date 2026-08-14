<script module lang="ts">
	export type { Column } from '$lib/components/ui/data-table.types';
</script>

<script lang="ts" generics="RowType extends object">
	import TextInput from '$lib/components/ui/text-input.svelte';
	import MdiChevronUp from '~icons/mdi/chevron-up';
	import MdiChevronDown from '~icons/mdi/chevron-down';
	import MdiChevronUpDown from '~icons/mdi/chevron-up-down';
	import type { CellImage, Column as DataTableColumn, SortValue } from '$lib/components/ui/data-table.types';

	interface Props<RowType extends object> {
		columns: DataTableColumn<RowType>[];
		rows: RowType[];
		pageSize?: number;
		onRowClick?: (row: RowType) => void;
		rowKey?: (row: RowType) => string | number;
		resetPageOnRowsChange?: boolean;
	}

	let {
		columns,
		rows,
		pageSize = 50,
		onRowClick,
		rowKey = undefined,
		resetPageOnRowsChange = true
	}: Props<RowType> = $props();

	let search = $state('');
	let sortKey = $state<(keyof RowType & string) | null>(null);
	let sortDir = $state<'asc' | 'desc' | null>(null);

	const rowClickIgnoreSelector = [
		'a',
		'button',
		'input',
		'select',
		'textarea',
		'label',
		'[role="button"]',
		'[data-row-click-ignore]'
	].join(',');

	function cellText(row: RowType, col: DataTableColumn<RowType>) {
		if (col.searchValue) {
			return col.searchValue(row);
		}

		return String(cellValue(row, col) ?? '');
	}

	function cellValue(row: RowType, col: DataTableColumn<RowType>) {
		return col.value ? col.value(row) : row[col.key];
	}

	function cellClass(row: RowType, col: DataTableColumn<RowType>) {
		return typeof col.class === 'function' ? col.class(row) : col.class;
	}

	function cellImages(row: RowType, col: DataTableColumn<RowType>): CellImage[] {
		const value = typeof col.image === 'function' ? col.image(row) : col.image;
		if (!value) return [];
		return Array.isArray(value) ? value : [value];
	}

	function compareValues(a: SortValue, b: SortValue) {
		if (a == null && b == null) return 0;
		if (a == null) return 1;
		if (b == null) return -1;

		if (typeof a === 'number' && typeof b === 'number') {
			return a - b;
		}

		return String(a).localeCompare(String(b), undefined, {
			numeric: true,
			sensitivity: 'base'
		});
	}

	function normalizeSearch(value: string) {
		return value
			.toLowerCase()
			.normalize('NFKD')
			.replace(/\p{Diacritic}/gu, '')
			.replace(/['’]/g, '')
			.replace(/\s+/g, ' ')
			.trim();
	}

	let processed = $derived.by(() => {
		let filtered = rows;

		if (search.trim()) {
			const terms = normalizeSearch(search).split(' ').filter(Boolean);

			filtered = rows.filter((row) => {
				const searchable = normalizeSearch(columns.map((col) => cellText(row, col)).join(' '));

				return terms.every((term) => searchable.includes(term));
			});
		}

		if (sortKey) {
			const key = sortKey;
			const dir = sortDir ?? 'asc';
			const col = columns.find((column) => column.key === key);

			filtered = [...filtered].sort((a, b) => {
				const av = col?.sortValue ? col.sortValue(a) : a[key];
				const bv = col?.sortValue ? col.sortValue(b) : b[key];

				const result = compareValues(av as SortValue, bv as SortValue);

				return dir === 'asc' ? result : -result;
			});
		}

		return filtered;
	});

	let page = $state(1);
	let visibleRows = $derived.by(() => processed.slice(0, page * pageSize));

	let scrollEl: HTMLElement;

	function onScroll() {
		const el = document.querySelector('main');
		if (!el) return;

		const bottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 50;

		if (bottom && visibleRows.length < processed.length) {
			page += 1;
		}
	}

	$effect(() => {
		const el = document.querySelector('main');
		if (!el) return;

		el.addEventListener('scroll', onScroll);
		return () => el.removeEventListener('scroll', onScroll);
	});

	$effect(() => {
		resetPageOnChange(search, sortKey, sortDir, resetPageOnRowsChange ? rows : undefined);
	});

	function resetPageOnChange(...dependencies: unknown[]) {
		if (!dependencies.length) return;

		page = 1;
	}

	function toggleSort(key: keyof RowType & string) {
		if (sortKey !== key) {
			sortKey = key;
			sortDir = 'desc';
		} else if (sortDir === 'desc') {
			sortDir = 'asc';
		} else {
			sortKey = null;
			sortDir = null;
		}
	}

	function handleRowClick(event: MouseEvent, row: RowType) {
		if (!onRowClick) return;

		const target = event.target as HTMLElement | null;
		if (target?.closest(rowClickIgnoreSelector)) return;

		onRowClick(row);
	}
</script>

<div class="flex items-center justify-between gap-2">
	<div class="w-48">
		<TextInput placeholder="Search..." bind:value={search} />
	</div>

	<div class="text-xs opacity-70">
		Showing {processed.length} of {rows.length}
	</div>
</div>

<div bind:this={scrollEl}>
	<table class="w-full border-collapse text-sm">
		<thead>
			<tr class="border-b border-text/50">
				{#each columns as col (col)}
					<th
						class="cursor-pointer p-1 text-left font-medium transition select-none"
						style={col.width ? `width:${col.width}` : ''}
						onclick={() => toggleSort(col.key)}
					>
						<div
							class="flex items-center gap-1 transition hover:text-accent {sortKey === col.key ? 'text-accent' : ''}"
						>
							<span>{col.label}</span>

							<span class="inline-flex items-center justify-center opacity-60">
								{#if sortKey === col.key}
									{#if sortDir === 'asc'}
										<MdiChevronUp />
									{:else if sortDir === 'desc'}
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
					<td colspan={columns.length} class="py-4 text-center opacity-70">No results</td>
				</tr>
			{:else}
				{#each visibleRows as row (rowKey ? rowKey(row) : row)}
					<tr
						class="border-b border-text/25 transition hover:bg-accent-dark/20 {onRowClick ? 'cursor-pointer' : ''}"
						onclick={(event) => handleRowClick(event, row)}
					>
						{#each columns as col (col)}
							{@const images = cellImages(row, col)}
							<td class="p-1 {cellClass(row, col) ?? ''}">
								{#if col.renderComponent}
									{@const rendered = col.renderComponent(row)}
									{@const Component = rendered.component}
									<Component {...rendered.props} />
								{:else if images.length}
									<div class="flex items-center gap-2">
										{#each images as image, index (`${image.src}-${index}`)}
											<span class="flex items-center gap-1">
												<img src={image.src} alt={image.alt ?? ''} title={image.title} class="size-7 shrink-0" />
												{#if image.text}
													<span>{image.text}</span>
												{/if}
											</span>
										{/each}
										{#if col.value}
											<span>{cellValue(row, col) ?? ''}</span>
										{/if}
									</div>
								{:else}
									{cellValue(row, col) ?? ''}
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>
