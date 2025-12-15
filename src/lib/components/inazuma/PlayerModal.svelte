<script lang="ts">
	import Modal from '$lib/components/ui/modal.svelte';
	import PlayerIcon from '$lib/components/inazuma/PlayerIcon.svelte';
	import players from '$lib/data/inazuma-eleven-vr/players.json';

	import { calculateATDFStats, type Player } from '$lib/utils/inazuma-eleven-vr';
	import { computePlayerTier } from '$lib/utils/inazuma-eleven-vr';


	interface Props {
		player: Player;
		showModal: boolean;
	}

	let { player, showModal = $bindable() }: Props = $props();

	let tierInfo = $derived(computePlayerTier(player, players as Player[]))

	let atdf = $derived(calculateATDFStats({
		kick: player.Kick,
		control: player.Control,
		technique: player.Technique,
		pressure: player.Pressure,
		physical: player.Physical,
		agility: player.Agility,
		intelligence: player.Intelligence,
		total: player.Total
	}));
</script>

<Modal bind:showModal title={player?.Name}>
	{#if player}
		<!-- Header row -->
		<div class="flex gap-4 mb-4">
			<div class="w-26 h-26">
				<PlayerIcon
					player={player}
				/>
			</div>

			<div class="flex flex-col justify-between text-small">
				<div>{player.Name}</div>
				<div>{player.RomajiName}</div>
				<div>{player.Position} · {player.Element}</div>
				<div>Archetype: {player.Archetype}</div>
				<div>Tier {tierInfo.tier} ({tierInfo.value})</div>
			</div>
		</div>

		<h3 class="font-bold mb-1">Stats</h3>
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-1 mb-4 text-small">
			<div>Kick: <span class="font-bold">{player.Kick}</span></div>
			<div>Control: <span class="font-bold">{player.Control}</span></div>
			<div>Technique: <span class="font-bold">{player.Technique}</span></div>
			<div>Pressure: <span class="font-bold">{player.Pressure}</span></div>
			<div>Physical: <span class="font-bold">{player.Physical}</span></div>
			<div>Agility: <span class="font-bold">{player.Agility}</span></div>
			<div>Intelligence: <span class="font-bold">{player.Intelligence}</span></div>
			<div>Total: <span class="font-bold">{player.Total}</span></div>
		</div>

		<h3 class="font-bold mb-1">ATDF Stats</h3>
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-1 mb-4 text-small">
			<div>Shoot AT: <span class="font-bold">{atdf.shootAT}</span></div>
			<div>Focus AT: <span class="font-bold">{atdf.focusAT}</span></div>
			<div>Focus DF: <span class="font-bold">{atdf.focusDF}</span></div>
			<div>Scramble AT: <span class="font-bold">{atdf.scrambleAT}</span></div>
			<div>Scramble DF: <span class="font-bold">{atdf.scrambleDF}</span></div>
			<div>Wall DF: <span class="font-bold">{atdf.wallDF}</span></div>
			<div>KP: <span class="font-bold">{atdf.kp}</span></div>
		</div>

		<h3 class="font-bold mb-1">Profile</h3>
		<div class="grid grid-cols-2 gap-2 mb-4 text-small">
			<div>Age Group: {player.AgeGroup}</div>
			<div>School Year: {player.Year}</div>
			<div>Gender: {player.Gender}</div>
			<div>Role: {player.Role}</div>
		</div>

		<!-- Teams -->
		{#if player.Teams?.length}
			<h3 class="font-bold mb-1">Teams</h3>
			<ul class="list-disc list-inside mb-4">
				{#each player.Teams as t (t)}
					<li>{t}</li>
				{/each}
			</ul>
		{/if}

		<!-- How to Obtain -->
		{#if player.HowToObtain?.length}
			<h3 class="font-bold mb-2">How to Obtain</h3>

			<div class="flex flex-col gap-3 mb-4">
				{#each player.HowToObtain as obtain (obtain)}
					<div class="border p-2">
						<div class="font-bold mb-1">{obtain.title}</div>

						<!-- Direct entries -->
						{#if obtain.entries.length}
							<ul class="list-disc list-inside  mb-2">
								{#each obtain.entries as e (e)}
									<li>{e}</li>
								{/each}
							</ul>
						{/if}

						<!-- Subsections -->
						{#each obtain.subsections as s (s)}
							<div class="mb-2 pl-2 border-l">
								<div class="font-semibold  mb-1">{s.title}</div>

								<ul class="list-disc list-inside ">
									{#each s.entries as e (e)}
										<li>{e}</li>
									{/each}
								</ul>
							</div>
						{/each}
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</Modal>
