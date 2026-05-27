# 洛克王国异色栏目设计与实现

## 目标

新增「异色」栏目，收录 TapTap 资料帖中 S1 赛季 19 个异色精灵，并在精灵详情页展示原形象、异色形象、原色蛋和异色蛋。

资料来源：

- TapTap：`https://www.taptap.cn/moment/790372033811712905`
- 参考项目资源：`/Users/zxm/Documents/code/rocom.aoe.top/public/assets/webp/friends`
- 参考项目数据：`ACTIVITY_SHINY_WEEKEND_CONF.json`、`PET_EGG_CONF.json`

## 数据规则

异色栏目以 TapTap 图片中的 19 个精灵作为主名单：

- 红绒十字
- 贝古斯
- 空空颅
- 月牙雪熊
- 格兰球
- 呼呼猪
- 粉粉星
- 粉星仔
- 大耳帽兜
- 拉特
- 火红尾
- 机械方方
- 嗜光嗡嗡
- 恶魔狼
- 奇丽草
- 绒绒
- 犀角鸟
- 双灯鱼
- 柴渣虫

精灵形象优先使用 `JL_*_yise.webp` 异色详情图。没有精确异色图时使用可用替代图或正常详情图，并在页面显示缺图提示。

犀角鸟没有 rocom `friends` 异色图，已从 TapTap 原图中裁切异色形象，去除浅色背景并放大锐化后保存为：

- `public/shiny-pets/xijiaoniao-shiny.webp`

`src/utils/shinyPets.ts` 对犀角鸟使用本地 `shinyImageUrl`，不再回退普通形象。

蛋图从 TapTap 5 张原图裁切为本地资源，放在 `public/shiny-eggs`。当前共有 38 张蛋图，每个异色精灵对应原色蛋和异色蛋。裁切策略经过几轮调整：

- 先按蛋的大致位置取局部区域
- 对浅黄背景做透明化处理
- 对浅色蛋降低抠图强度，避免把蛋身误抠除
- 对贝古斯、空空颅、粉粉星、拉特、火红尾、嗜光嗡嗡、恶魔狼、双灯鱼等容易缺角的蛋重新单独裁切
- 最终统一居中到 `180x180` 画布

命名为：

- `{assetName}-normal.webp`
- `{assetName}-shiny.webp`

## 页面行为

导航新增「异色」，路由为 `/shiny`。页面以卡片展示正常形象、异色形象、原色蛋、异色蛋，点击卡片进入对应精灵详情页。

详情页读取同一份异色数据。如果当前精灵在异色名单中，则在 `detail-hero` 内展示：

- 左侧主图区域：原形象和异色形象同规格并排展示
- 右侧摘要区域：蛋组、生蛋候选等基础信息
- 生蛋候选下方：原色蛋和异色蛋

原有详情页中的「本地规则」说明已移除。

## 主要实现文件

- `src/utils/shinyPets.ts`
- `src/utils/shinyPets.spec.ts`
- `src/pages/ShinyLibrary.tsx`
- `src/pages/ShinyLibrary.css`
- `src/pages/PokemonDetail.tsx`
- `src/pages/PokemonDetail.css`
- `public/shiny-eggs/`
- `public/shiny-pets/xijiaoniao-shiny.webp`

## 验证

新增 `src/utils/shinyPets.spec.ts`，随 `tsc -b` 执行，验证：

- S1 异色目录为 19 条
- 可按精灵 ID 找到月牙雪熊
- 蛋图路径指向本地 `public/shiny-eggs`
- 有异色详情图时使用 rocom 的异色 friend 资源
