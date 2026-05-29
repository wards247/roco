# 生蛋推荐页配窝助手设计

## 背景

当前 `src/pages/Breeding.tsx` 只展示“我的精灵”的雌雄兼容性排名和系统高兼容排行。参考项目 `/Users/zxm/Documents/code/rocokingdom_egg` 已实现配窝助手：选择雌性和雄性后，按兼容关系生成推荐雄性、7x7 位置图，并用曼哈顿距离展示配对连线。

本次目标是在本项目的生蛋推荐页新增配窝助手模块，复用参考项目的核心算法思路，但改成 React + TypeScript 的纯函数和组件实现。

## 已确认需求

- 配窝助手放在生蛋推荐页顶部，作为主流程模块；原有兼容性排名和系统排行下移保留。
- 模块顶部列出“我的精灵”中已拥有的可生蛋精灵。
- 用户可以通过复选框决定某只精灵是否参与本次配窝。
- 配窝模块需要自己的长期存储配置，不改现有 `roco_my_pokemon` 拥有状态结构。
- 配置中保存每个 `base_id + gender` 的启用状态和数量。
- 不区分普通和异色。
- 窝位数可配置并长期保存，范围为 `1-10`。
- 雌性启用总数必须小于窝位数，至少留 1 个雄性窝。
- 至少启用 1 个雄性数量，才能生成配窝方案。
- 生成推荐配对方案和 7x7 配对图。
- 配对图旁边列出每个雌性被配对了多少次，用于直观看最优解。

## 非目标

- 不改“我的精灵”页面的数据结构和增删逻辑。
- 不支持异色数量拆分。
- 不迁移参考项目里的导出图片、拖拽调位、弹窗搜索等 DOM 交互。
- 不新增 UI 框架。

## 数据模型

新增 hook：`src/hooks/useBreedingPlannerConfig.ts`。

长期存储 key：

```ts
const STORAGE_KEY = 'roco_breeding_planner_config';
```

配置结构：

```ts
type PlannerPokemonKey = `${number}:${'male' | 'female'}`;

interface BreedingPlannerConfig {
  nestCount: number;
  entries: Record<PlannerPokemonKey, {
    enabled: boolean;
    count: number;
  }>;
}
```

规则：

- `nestCount` 读取失败或越界时回退到 `10`，写入时限制在 `1-10`。
- `count` 读取失败或小于 `0` 时按 `0` 处理，输入框只允许非负整数。
- 新出现的拥有精灵默认 `enabled: true`、`count: 1`。
- 从“我的精灵”移除的条目可以留在配置 JSON 中，但不显示、不参与计算。
- `unknown` 性别不显示、不参与计算。

## 算法模块

新增纯函数模块：`src/utils/breedingPlanner.ts`。

输入：

- 已用本地蛋组库补全后的 `MyPokemon[]`。
- `BreedingPlannerConfig`。

核心类型：

```ts
interface PlannerParticipant {
  key: string;
  baseId: number;
  gender: 'male' | 'female';
  displayName: string;
  avatarUrl?: string;
  eggGroupIds: number[];
  count: number;
}

interface BreedingPlanResult {
  error?: string;
  femaleInstances: PlannerInstance[];
  maleSlots: PlannerMaleSlot[];
  uncoveredFemales: PlannerInstance[];
  maleCoverDetails: PlannerMaleCoverDetail[];
  placement?: PlannerPlacement;
  femalePairStats: PlannerFemalePairStat[];
}
```

兼容规则：

- 两只精灵任意共享一个蛋组即兼容。
- 同 `base_id` 的雌雄不互配，沿用当前 `useBreeding` 中的排除规则。
- 只统计 `can_hatch !== false` 且性别为 `male` / `female` 的条目。

方案生成：

1. 按配置展开雌性实例和雄性库存。
2. `requiredMales = nestCount - femaleInstanceCount`。
3. 若 `requiredMales <= 0`，返回“至少留 1 个雄性窝”错误。
4. 若雄性库存为空，返回“请至少启用 1 个雄性”错误。
5. 预留唯一依赖雄性：某雌性只有一种可用雄性，且该雄性库存为 1 时优先占用。
6. 剩余雄性用贪心策略选择：优先覆盖当前未覆盖雌性最多的雄性；并避免选择超过自身可覆盖雌性数的重复雄性。
7. 用参考项目的 Hall 条件修剪无效雄性槽，保留更容易形成有效覆盖的组合。
8. 输出未覆盖雌性和每个雄性覆盖详情。

位置图生成：

- 固定 7x7 网格。
- 只对已覆盖雌性生成坐标；全部未覆盖时不生成图。
- 参考项目 `solvePlacement` 的思路：
  - 先随机放置雄性。
  - 再回溯放置雌性。
  - 雌性与兼容雄性的约束优先使用曼哈顿距离 `1-2`。
  - 对唯一依赖和高覆盖雄性的放宽策略可以保留，但最终连线只画距离 `<= 2` 的兼容关系。
  - 多次尝试后选择占用面积更小的布局，并居中显示。
- 为了断言稳定性，纯函数接受可选随机源；默认使用 `Math.random`，测试中传固定随机序列。

雌性配对次数：

- 对每个雌性实例，统计配对图中距离 `<= 2` 且兼容的雄性连线数量。
- 按次数降序展示；次数相同按名称排序。
- 0 次突出显示，帮助识别未获得有效位置覆盖的雌性。

## 页面和组件

新增组件：`src/components/BreedingPlanner.tsx` 和样式 `src/components/BreedingPlanner.css`。

页面结构采用已确认的 A 方案：

1. 页面标题和已有统计。
2. 配窝助手模块：
   - 窝位数输入。
   - 拥有精灵选择区，按雌性、雄性分组。
   - 每行展示头像、名称、性别、蛋组、启用复选框、数量输入。
   - 操作按钮：全选、清空、生成方案。
   - 校验提示和未覆盖提示。
   - 配对图和雌性次数统计并排展示；小屏幕上下排列。
   - 雄性覆盖明细列表。
3. 原有兼容性排名区域。
4. 原有系统高兼容排行。

集成点：

- `src/pages/Breeding.tsx` 继续负责从 `useMyPokemon` 和 `useEggGroups` 得到补全后的 `enrichedMyPokemon`。
- `BreedingPlanner` 接收 `enrichedMyPokemon`，内部读取和写入配窝配置。
- 原 `useBreeding(enrichedMyPokemon)` 和 `getSystemBreedingRecommendations(allPokemon)` 保持不变。

## UI 细节

- 跟随现有白底卡片和 `Breeding.css` 命名风格，不引入新框架。
- 图使用 SVG 渲染：
  - 7x7 网格。
  - 雌性方格使用浅粉色，雄性方格使用浅蓝色。
  - 连线使用绿色或灰色，未覆盖提示使用红色文本。
  - 名称过长时在 SVG 方格内截断显示，完整名称放在 `title`。
- 数量输入使用数字输入框，最小值 `0`，最大值可以限制到 `10` 以避免超过窝位数造成无效配置。
- 当未生成方案时显示空状态，不自动报错。
- 修改配置后不自动生成，以避免每次输入都触发位置求解；点击“生成方案”后更新结果。

## 测试和验证

新增轻量断言脚本，纳入 `npm run build` 的类型检查和执行路径：

- `src/utils/breedingPlanner.spec.ts`

覆盖：

- 同蛋组雌雄能生成方案。
- `unknown` 性别和不可生蛋条目不参与。
- 雌性数量大于等于窝位数时报错。
- 没有启用雄性时报错。
- 配对图连线只包含曼哈顿距离 `<= 2` 的兼容关系。
- 雌性配对次数统计正确。
- 固定随机源下布局结果稳定。

验证命令：

```bash
npm run build
npm run lint
```

浏览器验证只覆盖最小关键路径：

- 打开 `http://localhost:5173/breeding`。
- 确认配窝助手位于兼容性排名上方。
- 修改窝位数和数量后刷新页面，配置仍保留。
- 生成方案后能看到 SVG 配对图和雌性配对次数列表。

## 实施顺序

1. 新增 `breedingPlanner` 纯算法和对应断言。
2. 新增 `useBreedingPlannerConfig` 长期配置 hook 和断言。
3. 新增 `BreedingPlanner` 组件和样式。
4. 集成到 `Breeding.tsx`。
5. 运行 `npm run build` 和 `npm run lint`。
6. 如本地 5173 已运行，再用浏览器 eval 验证关键页面状态。
