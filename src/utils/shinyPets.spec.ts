import { getShinyPetById, shinyPets } from './shinyPets';

if (shinyPets.length !== 19) {
  throw new Error('S1 shiny pet catalog should contain 19 pets');
}

const moonBear = getShinyPetById(3457);

if (!moonBear || moonBear.displayName !== '月牙雪熊') {
  throw new Error('shiny catalog should include moon bear by pet id');
}

if (!moonBear.normalEggUrl?.includes('egg_yueyaxuexiong.webp')) {
  throw new Error('normal egg image should use eggs/ directory');
}

if (!moonBear.shinyEggUrl?.includes('yueyaxuexiong_yise.png')) {
  throw new Error('shiny egg image should use shiny-eggs/ directory');
}

if (!moonBear.shinyImageUrl.endsWith('/JL_yueyaxuexiong_yise.webp')) {
  throw new Error('shiny pet image should use rocom yise friend asset when available');
}
