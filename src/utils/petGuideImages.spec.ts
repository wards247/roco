import { getPetGuideImageById, getPetGuideImages, hasPetGuideImage } from './petGuideImages';

if (getPetGuideImages().length !== 148) {
  throw new Error('pet guide image catalog should include all 148 TapTap guide images');
}

const fireGodGuide = getPetGuideImageById(3006);

if (!fireGodGuide || fireGodGuide.guideId !== 3006) {
  throw new Error('火神 should resolve to its own guide image');
}

if (getPetGuideImageById(3003)?.guideId !== 3006) {
  throw new Error('火花 should resolve to the 火神 family guide image');
}

if (getPetGuideImageById(3032)?.guideId !== 3006) {
  throw new Error('焰火 should resolve to the 火神 family guide image');
}

if (getPetGuideImageById(3579)?.guideId !== 3579) {
  throw new Error('branch evolution ids should prefer their direct guide image');
}

if (getPetGuideImageById(3120)?.sourceName !== '玻璃水母') {
  throw new Error('TapTap typo 玻璃水母 should resolve to local 琉璃水母 id');
}

if (!hasPetGuideImage(3003)) {
  throw new Error('related evolution ids should report a guide image for list badges');
}

if (hasPetGuideImage(999999)) {
  throw new Error('unknown ids should not report a guide image');
}

if (getPetGuideImageById(3473)?.guideId !== 3474) {
  throw new Error('布瓜蝌 should resolve to the 上岸蛙 family guide image');
}

if (getPetGuideImageById(3744)?.guideId !== 3745) {
  throw new Error('火红尾 should resolve to the 雅丹鬃 family guide image');
}

if (getPetGuideImageById(3371)?.sourceUrl !== 'https://www.taptap.cn/moment/800786233297995334') {
  throw new Error('暮星辰 should resolve to the newly added TapTap guide');
}
