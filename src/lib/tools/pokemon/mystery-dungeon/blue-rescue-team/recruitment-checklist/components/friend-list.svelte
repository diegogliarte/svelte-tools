<script lang="ts">
	import type { Pokemon } from '$lib/utils/pmd-blue.utils';

	interface Props {
		pokemons: Pokemon[];
	}

	let { pokemons }: Props = $props();

	const pageSize = 10;
	let page = $state(0);

	const friendList = $derived([...pokemons].sort((a, b) => a.game_id - b.game_id || a.id - b.id));

	const pageCount = $derived(Math.max(1, Math.ceil(friendList.length / pageSize)));

	const pageEntries = $derived(friendList.slice(page * pageSize, page * pageSize + pageSize));

	// Always provides ten rows, even when the last page is incomplete.
	const pageSlots = $derived(Array.from({ length: pageSize }, (_, index) => pageEntries[index]));

	$effect(() => {
		if (page >= pageCount) {
			page = pageCount - 1;
		}
	});

	function previousPage() {
		page = (page - 1 + pageCount) % pageCount;
	}

	function nextPage() {
		page = (page + 1) % pageCount;
	}

	function handleKeydown(event: KeyboardEvent) {
		const key = event.key.toLowerCase();

		if (key === 'arrowleft' || key === 'a') {
			event.preventDefault();
			previousPage();
		}

		if (key === 'arrowright' || key === 'd') {
			event.preventDefault();
			nextPage();
		}
	}

	function formatPokemonName(name: string) {
		return name.replaceAll('-', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500&display=swap" rel="stylesheet" />
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<section
	class="mx-auto w-full max-w-sm border-2 border-[#dcecff] bg-[#6578f8] p-1 font-['Pixelify_Sans',monospace]"
	aria-label="Friend list"
>
	<div class="bg-[#244f70] p-5">
		<header class="mb-4 flex items-center text-3xl leading-none">
			<div class="relative">
				<span aria-hidden="true" class="absolute translate-x-0.5 translate-y-0.5 text-[#000000]"> Friends </span>

				<span class="relative text-[#f8f8f8]">Friends</span>
			</div>

			<div class="ml-auto flex items-center gap-3">
				<div class="relative">
					<span aria-hidden="true" class="absolute translate-x-0.5 translate-y-0.5 text-[#000000]">
						{page + 1}
					</span>

					<span class="relative text-[#f8f8f8]">
						{page + 1}
					</span>
				</div>

				<nav class="flex w-14 items-center justify-end" aria-label="Friend list pages">
					<div class="flex w-7 justify-center">
						{#if page > 0 && pageCount > 1}
							<button
								type="button"
								class="relative cursor-pointer text-2xl leading-none focus-visible:outline-2 focus-visible:outline-[#f8f8f8]"
								aria-label="Previous page"
								onclick={previousPage}
							>
								<span aria-hidden="true" class="absolute translate-x-0.5 translate-y-0.5 text-[#000000]"> ◀ </span>

								<span class="relative text-[#f8f8f8]">◀</span>
							</button>
						{/if}
					</div>

					<div class="flex w-7 justify-center">
						{#if page < pageCount - 1}
							<button
								type="button"
								class="relative cursor-pointer text-2xl leading-none focus-visible:outline-2 focus-visible:outline-[#f8f8f8]"
								aria-label="Next page"
								onclick={nextPage}
							>
								<span aria-hidden="true" class="absolute translate-x-0.5 translate-y-0.5 text-[#000000]"> ▶ </span>

								<span class="relative text-[#f8f8f8]">▶</span>
							</button>
						{/if}
					</div>
				</nav>
			</div>
		</header>

		<ol class="m-0 list-none space-y-1 p-0" aria-label={`Friends, page ${page + 1} of ${pageCount}`}>
			{#each pageSlots as pokemon, index (pokemon ? `${pokemon.name}-${index}` : `empty-${index}`)}
				<li class="relative h-8 text-3xl leading-none">
					{#if pokemon}
						<span aria-hidden="true" class="absolute translate-x-0.5 translate-y-0.5 text-[#000000]">
							{formatPokemonName(pokemon.name)}
						</span>

						<span class="relative text-[#58f058]">
							{formatPokemonName(pokemon.name)}
						</span>
					{/if}
				</li>
			{/each}
		</ol>

		<span class="sr-only" aria-live="polite">
			Page {page + 1} of {pageCount}
		</span>
	</div>
</section>
