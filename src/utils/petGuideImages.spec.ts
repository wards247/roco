import { getPetGuideImageById, getPetGuideImages, hasPetGuideImage } from './petGuideImages';

if (getPetGuideImages().length !== 160) {
  throw new Error('pet guide image catalog should include all 160 TapTap guide images');
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

// S2 season (348~375) new guide entries
if (getPetGuideImageById(3735)?.sourceUrl !== 'https://www.taptap.cn/moment/806569507060449995') {
  throw new Error('机幕方舟 should resolve to the S2 season TapTap guide');
}

if (getPetGuideImageById(3733)?.guideId !== 3735) {
  throw new Error('初机号 should resolve to the 机幕方舟 family guide image');
}

if (getPetGuideImageById(3620)?.guideId !== 3620) {
  throw new Error('学院呱呱 should have its own guide image');
}

if (getPetGuideImageById(3235)?.sourceName !== '帅帅魔偶') {
  throw new Error('帅帅魔偶 should resolve correctly');
}
