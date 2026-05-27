# 洛克王国生蛋系统已实现内容总览

## 范围

这份文档整理当前已经确认并落地的实现，作为 `docs/superpowers` 下面各主题文档的总入口。

## 主题文档

- [数据与图片](./2026-04-25-roco-data-and-assets.md)
- [精灵库与我的精灵](./2026-04-25-roco-library-and-my-pokemon.md)
- [详情页与生蛋推荐](./2026-04-25-roco-detail-and-breeding.md)
- [异色栏目](./2026-04-29-roco-shiny-library.md)

## 最终状态

项目已经完成以下核心能力：

- 精灵库支持本地化数据展示、搜索、分页和按蛋组筛选
- 原精灵库已明确为蛋组库，新增 `/pets` 完整精灵库
- 精灵卡片支持“标记为我的”，并且同一只精灵可以同时拥有雄性、雌性记录
- 我的精灵页面按精灵聚合显示，并支持按蛋组、名称和性别筛选
- 详情页优先读取 rocom 单精灵详情，展示种族值、图鉴信息、进化路线、所属蛋组和生蛋候选列表
- 生蛋推荐完全基于本地蛋组数据计算，不再依赖远程候选接口
- 生蛋推荐页包含系统高兼容排行，用于判断优先捕捉哪些泛用精灵
- 页面图片资源已经切换为本地静态文件，避免 CDN 签名失效导致挂图
- 缺失的 body 图已经按远程 JSON 的 `name` 命名规则补齐到本地
- rocom 的 `Pets.json`、单精灵详情 JSON 和 friends 详情图已复制到 `public/rocom`
- 新增 `/shiny` 异色栏目，收录 S1 赛季 19 个异色精灵
- 异色详情页在主图区域并排展示原形象和异色形象，并在生蛋候选信息下方展示原色蛋、异色蛋
- TapTap 异色蛋图已裁切成本地资源 `public/shiny-eggs/`，犀角鸟异色形象已本地化到 `public/shiny-pets/`

## 主要实现文件

- `src/data/egg-groups.json`
- `public/pets/head/`
- `public/pets/body/`
- `src/hooks/useEggGroups.ts`
- `src/hooks/useRocomPets.ts`
- `src/hooks/useRocomPetDetail.ts`
- `src/hooks/useMyPokemon.ts`
- `src/utils/breedingCandidates.ts`
- `src/pages/PokemonLibrary.tsx`
- `src/pages/CompletePokemonLibrary.tsx`
- `src/pages/MyPokemon.tsx`
- `src/pages/Breeding.tsx`
- `src/pages/PokemonDetail.tsx`
- `src/pages/ShinyLibrary.tsx`
- `src/components/PokemonCard.tsx`
- `src/components/CompatibilityList.tsx`
- `src/components/SystemCompatibilityRanking.tsx`
- `src/utils/shinyPets.ts`
- `public/shiny-eggs/`
- `public/shiny-pets/`
