export const pokemonTypeColors: Record<string, string> = {
	Normal: 'bg-neutral-500',
	Fire: 'bg-red-700',
	Water: 'bg-blue-700',
	Electric: 'bg-yellow-500',
	Grass: 'bg-green-700',
	Ice: 'bg-cyan-500',
	Fighting: 'bg-orange-700',
	Poison: 'bg-purple-700',
	Ground: 'bg-amber-700',
	Flying: 'bg-sky-600',
	Psychic: 'bg-pink-700',
	Bug: 'bg-lime-700',
	Rock: 'bg-yellow-800',
	Ghost: 'bg-indigo-800',
	Dragon: 'bg-violet-800',
	Dark: 'bg-neutral-900',
	Steel: 'bg-slate-500',
	Fairy: 'bg-pink-500',
	Typeless: 'bg-neutral-400'
};

export function getPokemonTypeColor(type: string) {
	return pokemonTypeColors[type] ?? 'bg-neutral-600';
}
