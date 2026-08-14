<script lang="ts">
	import { onMount } from 'svelte';
	import FavouriteFoodCell from '$lib/components/yokai-watch-2/FavouriteFoodCell.svelte';
	import Modal from '$lib/components/ui/modal.svelte';
	import ModalPortrait from '$lib/components/ui/modal-portrait.svelte';
	import { loadBaffleBoards, type BaffleBoard, type Yokai, type YokaiMove } from '$lib/data/yokai-watch-2/data';
	import { getYokaiRankClass, getYokaiTribeClass } from '$lib/utils/yokai-watch-2.utils';

	interface Props {
		yokai: Yokai;
		onClose?: () => void;
	}

	let { yokai, onClose }: Props = $props();
	let baffleBoards = $state<BaffleBoard[]>([]);

	onMount(async () => {
		baffleBoards = await loadBaffleBoards();
	});

	const boards = $derived(baffleBoards.filter((board) => board.yokaiId === yokai.id));
	const moves = $derived(
		[
			{ label: 'Skill', move: yokai.skill },
			{ label: 'Attack', move: yokai.attack },
			{ label: 'Technique', move: yokai.technique },
			{ label: 'Soultimate', move: yokai.soultimate },
			{ label: 'Inspirit', move: yokai.inspirit }
		].filter((entry): entry is { label: string; move: YokaiMove & { name: string } } => Boolean(entry.move.name))
	);
</script>

<Modal title={yokai.name} {onClose}>
	<div class="mb-4 flex gap-4">
		<ModalPortrait src={yokai.image} alt={`${yokai.name} portrait`} backgroundClass={getYokaiTribeClass(yokai.tribe)} />

		<div class="flex min-w-0 flex-1 flex-col gap-2 text-xs">
			<div class="flex flex-wrap gap-1">
				{#if yokai.number}<span class="border px-1">No. {yokai.number}</span>{/if}
				{#if yokai.tribe}
					<span class="border px-1 {getYokaiTribeClass(yokai.tribe)}">{yokai.tribe}</span>
				{/if}
				{#if yokai.rank}
					<span class="border px-1 {getYokaiRankClass(yokai.rank)}">Rank {yokai.rank}</span>
				{/if}
			</div>

			{#if yokai.element}<div>Element: <span class="text-accent">{yokai.element}</span></div>{/if}
			{#if yokai.weakness}<div>Weakness: <span class="text-accent">{yokai.weakness}</span></div>{/if}
			<div class="mt-auto w-fit">
				<FavouriteFoodCell food={yokai.favouriteFood} />
			</div>
		</div>
	</div>

	{#if yokai.description}
		<h3 class="mb-1 font-bold">Description</h3>
		<p class="mb-4 text-xs">{yokai.description}</p>
	{/if}

	{#if Object.keys(yokai.stats).length > 0}
		<h3 class="mb-1 font-bold">Stats</h3>
		<div class="mb-4 grid grid-cols-2 gap-1 text-xs sm:grid-cols-5">
			<div>HP: <b>{yokai.stats.hp ?? '—'}</b></div>
			<div>STR: <b>{yokai.stats.str ?? '—'}</b></div>
			<div>SPR: <b>{yokai.stats.spr ?? '—'}</b></div>
			<div>DEF: <b>{yokai.stats.def ?? '—'}</b></div>
			<div>SPD: <b>{yokai.stats.spd ?? '—'}</b></div>
		</div>
	{/if}

	{#if yokai.locations.length > 0}
		<h3 class="mb-1 font-bold">Locations</h3>
		<ul class="mb-4 list-inside list-disc text-xs">
			{#each yokai.locations as location (location)}
				<li>{location}</li>
			{/each}
		</ul>
	{/if}

	{#if moves.length > 0}
		<h3 class="mb-1 font-bold">Moves</h3>
		<div class="mb-4 grid gap-2 text-xs sm:grid-cols-2">
			{#each moves as entry (entry.label)}
				<div class="border p-2">
					<div class="flex justify-between gap-2">
						<span class="opacity-60">{entry.label}</span>
						{#if entry.move.power}<span>Power {entry.move.power}</span>{/if}
					</div>
					<div class="font-bold text-accent">{entry.move.name}</div>
					{#if entry.move.description}<div class="mt-1">{entry.move.description}</div>{/if}
				</div>
			{/each}
		</div>
	{/if}

	{#if boards.length > 0}
		<h3 class="mb-1 font-bold">Baffle Board</h3>
		<div class="flex flex-col gap-2 text-xs">
			{#each boards as board (board.id)}
				<div class="border p-2">
					<div class="font-bold text-accent">{board.boardLocation}</div>
					<ol class="my-1">
						{#each board.clues as clue, index (clue)}
							<li>{index + 1}. {clue}</li>
						{/each}
					</ol>
					<div>{board.effect}</div>
				</div>
			{/each}
		</div>
	{/if}
</Modal>
