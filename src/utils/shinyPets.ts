import { getRocomFriendImageUrl } from './rocomPets';

export interface ShinyPet {
  id: number;
  displayName: string;
  season: 'S1' | 'S2';
  assetName: string;
  shinyAssetName: string | null;
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
  assetName: string;
  eggAssetName: string;
  shinyAssetName?: string;
  shinyImageUrl?: string;
  normalImageUrl?: string;
  hasNormalImage?: boolean;
  hasEggImages?: boolean;
}

const s2ShinyPetDefinitions: ShinyPetDefinition[] = [
  { id: 3532, displayName: '雪怪', season: 'S2', assetName: 'xueguai', eggAssetName: 'xueguai', shinyAssetName: 'xueguai_yise', hasEggImages: false },
  { id: 3573, displayName: '爆焰喷喷', season: 'S2', assetName: 'baoyanpengpeng', eggAssetName: 'baoyanpengpeng', shinyAssetName: 'baoyanpenpen_yise', hasEggImages: false },
  { id: 3708, displayName: '小鼓象', season: 'S2', assetName: 'xiaoguxiang', eggAssetName: 'xiaoguxiang', shinyAssetName: 'xiaoguxiang_yise', hasEggImages: false },
  { id: 3729, displayName: '猴麦仔', season: 'S2', assetName: 'houmaizai', eggAssetName: 'houmaizai', shinyAssetName: 'houmaizai_yise', hasEggImages: false },
  { id: 3736, displayName: '炫光迪迪', season: 'S2', assetName: 'xuanguangdidi', eggAssetName: 'xuanguangdidi', shinyAssetName: 'xuanguangdidi_yise', hasEggImages: false },
  { id: 3677, displayName: '烟花团', season: 'S2', assetName: 'yanhuatuan', eggAssetName: 'yanhuatuan', shinyAssetName: 'yanhuatuan_yise', hasEggImages: false },
  { id: 3683, displayName: '咕咕帽', season: 'S2', assetName: 'gugumao', eggAssetName: 'gugumao', shinyAssetName: 'gugumao_yise', hasEggImages: false },
  { id: 3234, displayName: '牵线木偶', season: 'S2', assetName: 'qianxianmuou', eggAssetName: 'qianxianmuou', shinyAssetName: 'qianxianmuou_yise', hasEggImages: false },
  { id: 3487, displayName: '小丑豆豆', season: 'S2', assetName: 'xiaochoudoudou', eggAssetName: 'xiaochoudoudou', shinyAssetName: 'xiaochoudoudou_yise', hasEggImages: false },
  { id: 3659, displayName: '加油海葵', season: 'S2', assetName: 'jiayouhaikui', eggAssetName: 'jiayouhaikui', shinyAssetName: 'jiayouhaikui_yise', hasEggImages: false },
  { id: 3499, displayName: '公平鸽', season: 'S2', assetName: 'gongpingge', eggAssetName: 'gongpingge', shinyAssetName: 'gongpingge_yise', hasEggImages: false },
  { id: 3075, displayName: '灵狐', season: 'S2', assetName: 'linghu', eggAssetName: 'linghu', shinyAssetName: 'linghu_yise', hasEggImages: false },
  { id: 3062, displayName: '小独角兽', season: 'S2', assetName: 'xiaodujiaoshou', eggAssetName: 'xiaodujiaoshou', shinyAssetName: 'xiaodujiaoshou_yise', hasEggImages: false },
  { id: 3367, displayName: '嘟嘟煲', season: 'S2', assetName: 'duudbao', eggAssetName: 'duudbao', shinyAssetName: 'duudbao_yise', hasEggImages: false },
  { id: 3227, displayName: '菊花梨', season: 'S2', assetName: 'juhuali', eggAssetName: 'juhuali', shinyAssetName: 'juhuali_yise', hasEggImages: false },
  { id: 3064, displayName: '幽影树', season: 'S2', assetName: 'youlingshu', eggAssetName: 'youlingshu', shinyAssetName: 'youlingshu_yise', hasEggImages: false },
  { id: 3142, displayName: '小夜', season: 'S2', assetName: 'xiaoye', eggAssetName: 'xiaoye', shinyAssetName: 'xiaoye_yise', hasEggImages: false },
  { id: 3010, displayName: '恶魔叮', season: 'S2', assetName: 'emoding', eggAssetName: 'emoding', shinyAssetName: 'emoding_yise', hasEggImages: false },
];

const s1ShinyPetDefinitions: ShinyPetDefinition[] = [
  { id: 3350, displayName: '红绒十字', season: 'S1', assetName: 'huoguangxiunv', eggAssetName: 'hongrongshizi', shinyAssetName: 'hongrongshizi_yise' },
  { id: 3205, displayName: '贝古斯', season: 'S1', assetName: 'beigusi', eggAssetName: 'beigusi', shinyAssetName: 'beigusi_yise' },
  { id: 3148, displayName: '空空颅', season: 'S1', assetName: 'anyekulou', eggAssetName: 'anyekulou', shinyAssetName: 'anyekulou_yise' },
  { id: 3457, displayName: '月牙雪熊', season: 'S1', assetName: 'yueyaxuexiong', eggAssetName: 'yueyaxuexiong', shinyAssetName: 'yueyaxuexiong_yise' },
  { id: 3074, displayName: '格兰球', season: 'S1', assetName: 'gelanqiu', eggAssetName: 'gelanqiu', shinyAssetName: 'gelanqiu_yise' },
  { id: 3262, displayName: '呼呼猪', season: 'S1', assetName: 'huhuzhu', eggAssetName: 'huhuzhu', shinyAssetName: 'huhuzhu_yise' },
  { id: 3198, displayName: '粉粉星', season: 'S1', assetName: 'fenfenxing', eggAssetName: 'fenfenxing', shinyAssetName: 'fenfenxing_yise' },
  { id: 3319, displayName: '粉星仔', season: 'S1', assetName: 'fenxingzai', eggAssetName: 'fenxingzai', shinyAssetName: 'fenxingzai_yise' },
  { id: 3121, displayName: '大耳帽兜', season: 'S1', assetName: 'daermaodou', eggAssetName: 'daermaodou', shinyAssetName: 'daermaodou_yise' },
  { id: 3188, displayName: '拉特', season: 'S1', assetName: 'late', eggAssetName: 'late', shinyAssetName: 'late_yise' },
  { id: 3744, displayName: '火红尾', season: 'S1', assetName: 'huohongwei', eggAssetName: 'huohongwei', shinyAssetName: 'huohongwei_yise' },
  { id: 3200, displayName: '机械方方', season: 'S1', assetName: 'jixiefangfang', eggAssetName: 'jixiefangfang', shinyAssetName: 'jixiefangfang_gai' },
  { id: 3614, displayName: '嗜光嗡嗡', season: 'S1', assetName: 'shiguangwengweng', eggAssetName: 'shiguangwengweng', shinyAssetName: 'shiguangwengweng_yise' },
  { id: 3011, displayName: '恶魔狼', season: 'S1', assetName: 'emolang', eggAssetName: 'emolang', shinyAssetName: 'emolang_yise' },
  { id: 3029, displayName: '奇丽草', season: 'S1', assetName: 'qilicao', eggAssetName: 'qilicao', shinyAssetName: 'qilicao_yise' },
  { id: 3244, displayName: '绒绒', season: 'S1', assetName: 'rongrong', eggAssetName: 'rongrong', shinyAssetName: 'rongrong_yise' },
  { id: 3309, displayName: '犀角鸟', season: 'S1', assetName: 'xijiaoniao', eggAssetName: 'xijiaoniao', shinyImageUrl: '/shiny-pets/xijiaoniao-shiny.webp' },
  { id: 3382, displayName: '双灯鱼', season: 'S1', assetName: 'shungdengyu', eggAssetName: 'shungdengyu', shinyAssetName: 'shungdengyu_yise' },
  { id: 3436, displayName: '柴渣虫', season: 'S1', assetName: 'chaizhachong', eggAssetName: 'chaizhachong', shinyAssetName: 'chaizhachong_yise' },
];

const toShinyPet = (pet: ShinyPetDefinition): ShinyPet => {
  const shinyAssetName = pet.shinyAssetName ?? null;
  const normalImageUrl = pet.normalImageUrl ?? getRocomFriendImageUrl(pet.assetName);
  const hasNormalImage = pet.hasNormalImage ?? true;

  return {
    id: pet.id,
    displayName: pet.displayName,
    season: pet.season,
    assetName: pet.assetName,
    shinyAssetName,
    normalImageUrl,
    hasNormalImage,
    shinyImageUrl: pet.shinyImageUrl ?? (shinyAssetName ? getRocomFriendImageUrl(shinyAssetName) : normalImageUrl),
    normalEggUrl: `/shiny-eggs/${pet.eggAssetName}-normal.webp`,
    shinyEggUrl: `/shiny-eggs/${pet.eggAssetName}-shiny.webp`,
    hasShinyImage: !!shinyAssetName || !!pet.shinyImageUrl,
    hasEggImages: pet.hasEggImages ?? true,
  };
};

export const shinyPetSeasons = [
  { season: 'S2' as const, label: 'S2 赛季', pets: s2ShinyPetDefinitions.map(toShinyPet) },
  { season: 'S1' as const, label: 'S1 赛季', pets: s1ShinyPetDefinitions.map(toShinyPet) },
];

export const shinyPets: ShinyPet[] = shinyPetSeasons.flatMap((season) => season.pets);

const shinyPetById = new Map(shinyPets.map((pet) => [pet.id, pet]));

export const getShinyPetById = (id: number) => shinyPetById.get(id) ?? null;
