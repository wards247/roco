import { getShinyPetById, shinyPets } from './shinyPets';

if (shinyPets.length !== 19) {
  throw new Error('S1 shiny pet catalog should contain 19 pets');
}

const moonBear = getShinyPetById(3457);

if (!moonBear || moonBear.displayName !== '月牙雪熊') {
  throw new Error('shiny catalog should include moon bear by pet id');
}

if (moonBear.normalEggUrl !== '/shiny-eggs/yueyaxuexiong-normal.webp') {
  throw new Error('normal egg image should use local shiny egg assets');
}

if (moonBear.shinyEggUrl !== '/shiny-eggs/yueyaxuexiong-shiny.webp') {
  throw new Error('shiny egg image should use local shiny egg assets');
}

if (!moonBear.shinyImageUrl.endsWith('/JL_yueyaxuexiong_yise.webp')) {
  throw new Error('shiny pet image should use rocom yise friend asset when available');
}
