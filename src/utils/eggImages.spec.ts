import { getEggImage, getEggUrl, getShinyEggUrl, hasEggImage } from './eggImages';
import eggImagesData from '../data/egg-images.json';

const totalEggEntries = Object.keys(eggImagesData.byPetId).length;

if (totalEggEntries !== 703) {
  throw new Error(`egg image catalog should include 703 pet entries, got ${totalEggEntries}`);
}

// Known egg: 迪莫 (3004) -> egg_dimo.webp
if (!hasEggImage(3004)) {
  throw new Error('迪莫 should have an egg image');
}

if (!getEggUrl(3004)?.includes('egg_dimo.webp')) {
  throw new Error('迪莫 egg URL should contain egg_dimo.webp');
}

if (getShinyEggUrl(3004) !== undefined) {
  throw new Error('迪莫 should not have a shiny egg image');
}

if (hasEggImage(999999)) {
  throw new Error('unknown ids should not have an egg image');
}

// 月牙雪熊 (3457) has both normal and shiny eggs
const eggEntry = getEggImage(3457);
if (!eggEntry?.shiny) {
  throw new Error('月牙雪熊 should have a shiny egg image');
}

if (!eggEntry.normal?.includes('egg_yueyaxuexiong.webp')) {
  throw new Error('月牙雪熊 egg URL mismatch');
}

// Evolution chain inheritance: 咔咔鸟 (3177) should inherit egg from 咔咔羽毛 (3175)
if (!getEggUrl(3177)?.includes('egg_kakayumao.webp')) {
  throw new Error('咔咔鸟 should inherit egg from base form 咔咔羽毛');
}

// 火花 (3003) should have its own egg
if (!getEggUrl(3003)?.includes('egg_huohua.webp')) {
  throw new Error('火花 should have its own egg');
}

// 岚鸟 (3037) and its seasonal forms should have eggs
if (!getEggUrl(3037)?.includes('egg_lanniao.webp')) {
  throw new Error('岚鸟 should have an egg image');
}
if (!getEggUrl(3285)?.includes('egg_lanniao_chun.webp')) {
  throw new Error('岚鸟春天 should have an egg image');
}

// Pre-evolution inheritance: 嘟嘟煲 and 大耳帽兜 should inherit from evolved forms
if (!getEggUrl(3367)?.includes('egg_duudguo.webp')) {
  throw new Error('嘟嘟煲 should inherit egg from evolved form 嘟嘟锅');
}
if (!getEggUrl(3121)?.includes('egg_xueyingwawa.webp')) {
  throw new Error('大耳帽兜 should inherit egg from evolved form 雪影娃娃');
}
