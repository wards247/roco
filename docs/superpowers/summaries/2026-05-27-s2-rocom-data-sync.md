# S2 Rocom 数据同步总结

日期：2026-05-27

## 源项目

- `rocom.aoe.top` 指本机源项目 `/Users/zxm/Documents/code/rocom.aoe.top`，不是优先访问线上页面。
- 这条规则已补到 `AGENTS.md`。
- 已检查的源项目历史提交：
  - `c5c54e91 更新S2赛季数据`
  - `fcd1781a 更新部分 S2 赛季数据(还有部分没解包出来`
  - `e69b94fa 完整更新 S2 数据`

## 已同步到 Roco 的数据

- 已复制 `/Users/zxm/Documents/code/rocom.aoe.top/public/data/Pets.json` 到 `public/rocom/data/Pets.json`。
- 已复制 `/Users/zxm/Documents/code/rocom.aoe.top/public/data/pets/*.json` 到 `public/rocom/data/pets/`。
- 已复制 `/Users/zxm/Documents/code/rocom.aoe.top/public/assets/webp/friends/*.webp` 到 `public/rocom/assets/webp/friends/`。
- 同步后的数量：
  - `Pets.json`：1065 条。
  - `public/rocom/data/pets`：1065 个详情 JSON。
  - `public/rocom/assets/webp/friends`：621 个 `.webp` 文件。

## S2 名称修正

- `机墓方舟` 已按源数据修正为 `机幕方舟`。
- `猴唛仔` 已按源数据修正为 `猴麦仔`。
- `烟花团` 名称保持为 `烟花团`。

## 蛋组更新

`src/data/egg-groups.json` 已按同步后的源数据更新。当前 S2 预期蛋组如下：

- `机幕方舟`：`1` 无法孵蛋
- `雪怪`：`1` 无法孵蛋
- `爆焰喷喷`：`1` 无法孵蛋
- `小鼓象`：`6,15` 动物组、机械组
- `猴麦仔`：`6,15` 动物组、机械组
- `炫光迪迪`：`6,11` 动物组、大地组
- `烟花团`：`12,15` 魔力组、机械组
- `咕咕帽`：`7` 妖精组
- `牵线木偶`：`7,9` 妖精组、拟人组
- `小丑豆豆`：`7,9` 妖精组、拟人组
- `加油海葵`：`3,7` 两栖组、妖精组

蛋组的 `member_count` 和 `hatchable_member_count` 保持原有语义：表示总成员数，不是代表卡片数量。

## 异色更新

- `src/utils/shinyPets.ts` 已更新，S2 使用源项目里的资源名。
- `猴麦仔` 现在使用 `assetName: 'houmaizai'` 和 `shinyAssetName: 'houmaizai_yise'`。
- S2 原色立绘和异色立绘已存在于 `public/rocom/assets/webp/friends`。
- `爆焰喷喷` 存在源数据命名不一致：原色图是 `JL_baoyanpengpeng.webp`，异色图是 `JL_baoyanpenpen_yise.webp`。代码已按实际文件名指向。

## 仍然缺的内容

- S2 异色蛋图仍缺，目录是 `public/shiny-eggs`。
- 缺少以下精灵的 `*-normal.webp` 和 `*-shiny.webp`：
  - `雪怪`
  - `爆焰喷喷`
  - `小鼓象`
  - `猴麦仔`
  - `炫光迪迪`
  - `烟花团`
  - `咕咕帽`
  - `牵线木偶`
  - `小丑豆豆`
  - `加油海葵`
  - `公平鸽`
  - `灵狐`
  - `小独角兽`
  - `嘟嘟煲`
  - `菊花梨`
  - `幽影树`
  - `小夜`
  - `恶魔叮`

## 已执行验证

- S2 蛋组精准 JSON 断言：通过。
- `npm run build`：通过。Vite 仍会输出 `vite:prepare-out-dir` 的 plugin timing warning。
- `npm run lint`：通过。

## 后续接力注意

- 不要优先在线抓取 `rocom.aoe.top`；先检查 `/Users/zxm/Documents/code/rocom.aoe.top`。
- 当前这个应用真正会读取、需要搬运的数据主要是：
  - `public/data/Pets.json`
  - `public/data/pets/*.json`
  - `public/assets/webp/friends/*.webp`
- 源项目还有 `public/assets/webp/items/egg_*.webp`；目前尚未接入 `public/shiny-eggs`，因为 S2 蛋图的原色/异色配对和命名还需要明确映射。
