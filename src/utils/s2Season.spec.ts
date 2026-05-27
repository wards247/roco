import eggGroupsData from '../data/egg-groups.json';
import { shinyPetSeasons } from './shinyPets';

const expectedS2EggGroups = new Map<string, number[]>([
  ['机幕方舟', [1]],
  ['雪怪', [1]],
  ['爆焰喷喷', [1]],
  ['小鼓象', [6, 15]],
  ['猴麦仔', [6, 15]],
  ['炫光迪迪', [6, 11]],
  ['烟花团', [12, 15]],
  ['咕咕帽', [7]],
  ['牵线木偶', [7, 9]],
  ['小丑豆豆', [7, 9]],
  ['加油海葵', [3, 7]],
]);

const getPokemonGroupsByName = (displayName: string) =>
  Object.entries(eggGroupsData.pokemonByGroup)
    .filter(([, pokemonList]) => pokemonList.some((pokemon) => pokemon.display_name === displayName))
    .map(([groupId]) => Number(groupId))
    .sort((left, right) => left - right);

for (const [displayName, expectedGroupIds] of expectedS2EggGroups) {
  const groupIds = getPokemonGroupsByName(displayName);

  if (groupIds.join(',') !== expectedGroupIds.join(',')) {
    throw new Error(`${displayName} should be collected under egg groups ${expectedGroupIds.join(',')}`);
  }
}

if (shinyPetSeasons.length !== 2) {
  throw new Error('shiny catalog should be grouped into S2 and S1 seasons');
}

if (shinyPetSeasons[0].season !== 'S2' || shinyPetSeasons[1].season !== 'S1') {
  throw new Error('S2 shiny season should render before S1');
}

if (shinyPetSeasons[0].pets.length !== 18) {
  throw new Error('S2 shiny season should contain the 18 listed pets');
}
