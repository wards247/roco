import { getRocomFriendImageUrl } from './rocomPets';
import { toPublicAssetUrl } from './publicAssets';

export interface ShinyPet {
  id: number;
  displayName: string;
  season: 'S1' | 'S2';
  name: string;
  normalImageUrl: string;
  shinyImageUrl: string;
  hasNormalImage: boolean;
  normalEggUrl: string;
  shinyEggUrl: string;
  hasShinyImage: boolean;
  hasEggImages: boolean;
}

interface ShinyPetDefinition {
  id: number;
  displayName: string;
  season: 'S1' | 'S2';
  name: string;
  shinyImageUrl?: string;
  normalImageUrl?: string;
  hasNormalImage?: boolean;
}

const s2ShinyPetDefinitions: ShinyPetDefinition[] = [
  { id: 3532, displayName: '雪怪', season: 'S2', name: 'xueguai' },
  { id: 3573, displayName: '爆焰喷喷', season: 'S2', name: 'baoyanpengpeng' },
  { id: 3708, displayName: '小鼓象', season: 'S2', name: 'xiaoguxiang' },
  { id: 3729, displayName: '猴麦仔', season: 'S2', name: 'houmaizai' },
  { id: 3736, displayName: '炫光迪迪', season: 'S2', name: 'xuanguangdidi' },
  { id: 3677, displayName: '烟花团', season: 'S2', name: 'yanhuatuan' },
  { id: 3683, displayName: '咕咕帽', season: 'S2', name: 'gugumao' },
  { id: 3234, displayName: '牵线木偶', season: 'S2', name: 'qianxianmuou' },
  { id: 3487, displayName: '小丑豆豆', season: 'S2', name: 'xiaochoudoudou' },
  { id: 3659, displayName: '加油海葵', season: 'S2', name: 'jiayouhaikui' },
  { id: 3499, displayName: '公平鸽', season: 'S2', name: 'gongpingge' },
  { id: 3075, displayName: '灵狐', season: 'S2', name: 'linghu' },
  { id: 3062, displayName: '小独角兽', season: 'S2', name: 'xiaodujiaoshou' },
  { id: 3367, displayName: '嘟嘟煲', season: 'S2', name: 'duudbao' },
  { id: 3227, displayName: '菊花梨', season: 'S2', name: 'juhuali' },
  { id: 3064, displayName: '幽影树', season: 'S2', name: 'youlingshu' },
  { id: 3142, displayName: '小夜', season: 'S2', name: 'xiaoye' },
  { id: 3010, displayName: '恶魔叮', season: 'S2', name: 'emoding' },
];

const s1ShinyPetDefinitions: ShinyPetDefinition[] = [
  { id: 3350, displayName: '红绒十字', season: 'S1', name: 'huoguangxiunv' },
  { id: 3205, displayName: '贝古斯', season: 'S1', name: 'beigusi' },
  { id: 3148, displayName: '空空颅', season: 'S1', name: 'anyekulou' },
  { id: 3457, displayName: '月牙雪熊', season: 'S1', name: 'yueyaxuexiong' },
  { id: 3074, displayName: '格兰球', season: 'S1', name: 'gelanqiu' },
  { id: 3262, displayName: '呼呼猪', season: 'S1', name: 'huhuzhu' },
  { id: 3198, displayName: '粉粉星', season: 'S1', name: 'fenfenxing' },
  { id: 3319, displayName: '粉星仔', season: 'S1', name: 'fenxingzai' },
  { id: 3121, displayName: '大耳帽兜', season: 'S1', name: 'daermaodou' },
  { id: 3188, displayName: '拉特', season: 'S1', name: 'late' },
  { id: 3744, displayName: '火红尾', season: 'S1', name: 'huohongwei' },
  { id: 3200, displayName: '机械方方', season: 'S1', name: 'jixiefangfang' },
  { id: 3614, displayName: '嗜光嗡嗡', season: 'S1', name: 'shiguangwengweng' },
  { id: 3011, displayName: '恶魔狼', season: 'S1', name: 'emolang' },
  { id: 3029, displayName: '奇丽草', season: 'S1', name: 'qilicao' },
  { id: 3244, displayName: '绒绒', season: 'S1', name: 'rongrong' },
  { id: 3309, displayName: '犀角鸟', season: 'S1', name: 'xijiaoniao', shinyImageUrl: '/shiny-pets/xijiaoniao-shiny.webp' },
  { id: 3382, displayName: '双灯鱼', season: 'S1', name: 'shungdengyu' },
  { id: 3436, displayName: '柴渣虫', season: 'S1', name: 'chaizhachong' },
];

const toShinyPet = (pet: ShinyPetDefinition): ShinyPet => {
  const name = pet.name;
  const shinyName = `${name}_yise`;
  const normalImageUrl = toPublicAssetUrl(pet.normalImageUrl ?? getRocomFriendImageUrl(name));
  const hasNormalImage = pet.hasNormalImage ?? true;

  const hasLocalEggFile = name.length > 0;
  const localEggUrl = hasLocalEggFile
    ? toPublicAssetUrl(`/shiny-eggs/${name}.png`)
    : '';
  const localShinyEggUrl = hasLocalEggFile
    ? toPublicAssetUrl(`/shiny-eggs/${name}_yise.png`)
    : '';

  const shinyImageUrlProvided = pet.shinyImageUrl !== undefined;
  const hasShinyImage = shinyImageUrlProvided
    ? pet.shinyImageUrl !== ''
    : true;
  const shinyImageUrl = toPublicAssetUrl(
    shinyImageUrlProvided
      ? pet.shinyImageUrl!
      : getRocomFriendImageUrl(shinyName)
  );

  return {
    id: pet.id,
    displayName: pet.displayName,
    season: pet.season,
    name,
    normalImageUrl,
    shinyImageUrl,
    hasNormalImage,
    normalEggUrl: localEggUrl,
    shinyEggUrl: localShinyEggUrl || localEggUrl,
    hasShinyImage,
    hasEggImages: hasLocalEggFile,
  };
};

export const shinyPetSeasons = [
  { season: 'S2' as const, label: 'S2 赛季', pets: s2ShinyPetDefinitions.map(toShinyPet) },
  { season: 'S1' as const, label: 'S1 赛季', pets: s1ShinyPetDefinitions.map(toShinyPet) },
];

export const shinyPets: ShinyPet[] = shinyPetSeasons.flatMap((season) => season.pets);

const shinyPetById = new Map(shinyPets.map((pet) => [pet.id, pet]));

export const getShinyPetById = (id: number) => shinyPetById.get(id) ?? null;
