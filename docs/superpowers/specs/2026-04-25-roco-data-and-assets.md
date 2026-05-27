# 洛克王国生蛋系统数据与图片实现

## 数据来源

蛋组和生蛋推荐数据来源于 `src/data/egg-groups.json`，由远程蛋组接口和蛋组成员接口抓取后整理而成。数据结构保留了蛋组信息、精灵基础信息、族链信息、孵化状态和蛋组归属。

完整精灵库和详情页增强数据来源于本地化的 rocom 数据：

- `public/rocom/data/Pets.json`
- `public/rocom/data/pets/{id}.json`
- `public/rocom/assets/webp/friends/JL_${name}.webp`

## 本地图片

页面图片已经完全改为本地静态资源：

- 头像放在 `public/pets/head/`
- 身体图放在 `public/pets/body/`

卡片和详情页都直接引用本地路径，例如：

- `/pets/head/{base_id}.webp`
- `/pets/body/{base_id}.webp`

这样不会再依赖带签名的 CDN URL，也不会因为签名过期导致图片失效。

## 身体图命名规则

远程单精灵 JSON 里的身体图来源可以按 `name` 字段拼接得到，格式是：

- `https://rocom.aoe.top/assets/webp/friends/JL_${name}.webp`

例如：

- `name = emolangzhu`
- 对应图片地址 = `https://rocom.aoe.top/assets/webp/friends/JL_emolangzhu.webp`

这次缺失的本地 `body` 图已经按这个规则补齐。

同名但不同形态的精灵也按各自 `base_id` 对应的远程 `name` 重新拉取过 body 图。展示名优先使用能区分形态的名称；当 `page_name` 本身不带形态时，使用 `family_chain` 最后一段作为展示名，例如 `岚鸟（春天的样子）`。

## 图片落地结果

- `public/rocom` 当前约 69MB，包含完整精灵索引、1015 个详情 JSON 和 friends 详情图
- `public/pets/head` 当前有 732 张缩略图
- 缺失缩略图时，优先用 friends 详情图生成 128x128 的 `/pets/head/{id}.webp`
- 仍有部分精灵没有 friends 图源，因此保留普通图片兜底

## 数据消费方式

蛋组数据加载逻辑不再访问远程 JSON 文件，而是直接在前端读取本地 `egg-groups.json`：

- `useEggGroups()` 负责读取蛋组和精灵列表
- `PokemonLibrary` 是蛋组库，使用本地蛋组数据进行搜索、分页和筛选
- `CompletePokemonLibrary` 使用 `/rocom/data/Pets.json` 展示完整精灵库
- `PokemonDetail` 优先读取 `/rocom/data/pets/{id}.json` 展示详情，并继续用本地蛋组数据计算候选列表
- `Breeding` 使用本地数据补全我的精灵的蛋组与孵化状态
