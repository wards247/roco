# Roco 项目协作规则

## 项目概览

- 这是一个 React + TypeScript + Vite 的洛克王国：世界生蛋查询工具。
- 主要页面：
  - `src/pages/PokemonLibrary.tsx`：蛋组库。
  - `src/pages/CompletePokemonLibrary.tsx`：完整精灵库。
  - `src/pages/PokemonDetail.tsx`：精灵详情页。
  - `src/pages/ShinyLibrary.tsx`：异色精灵页。
  - `src/pages/MyPokemon.tsx`：我的精灵。
  - `src/pages/Breeding.tsx`：生蛋推荐。
- 主要数据：
  - `src/data/egg-groups.json`：本地蛋组库与代表精灵数据。
  - `public/rocom/data/Pets.json`：完整精灵索引。
  - `public/rocom/data/pets/<id>.json`：完整精灵详情和进化树。
  - `src/data/pet-guide-images.json`：一图流攻略映射。
  - `public/pet-guides/<id>.jpg`：一图流攻略图片。

## 常用命令

- 安装依赖：`npm install`
- 启动开发服务：`npm run dev`
- 构建和类型检查：`npm run build`
- Lint：`npm run lint`
- 预览构建结果：`npm run preview`

## 测试约定

- 项目当前没有独立 `npm test` 脚本。
- `src/**/*.spec.ts` 是轻量断言脚本，会被 `tsconfig.app.json` 包含并在 `npm run build` 中参与类型检查。
- 新增共享逻辑或映射规则时，优先补对应 `*.spec.ts` 断言，然后跑 `npm run build`。
- 不要把 `*.spec.ts` 说成完整 Vitest/Jest 单测套件，除非项目后来真的接入测试框架。

## 数据和匹配规则

- 优先复用现有 hooks/utils，不要绕开 `useEggGroups`、`useRocomPets`、`useRocomPetDetail`、`useMyPokemon` 等本地数据入口。
- `rocom.aoe.top` 指本机源项目 `/Users/zxm/Documents/code/rocom.aoe.top`，不是优先访问线上页面；同步完整精灵数据时从该项目的 `public/data` 和 `public/assets/webp/friends` 复制到本项目 `public/rocom` 对应目录。
- 涉及进化链匹配时，不要只用当前精灵 ID 精确匹配；要考虑同族链阶段 ID，例如详情页和列表图标都应能通过 `relatedIds` 命中一图流。
- `src/data/egg-groups.json` 中的代表 ID 可能和完整精灵库或异色库 ID 不一致，改匹配逻辑前先查真实数据。
- 不要把临时派生字段写回蛋组原始 JSON，除非用户明确要求；优先通过 utils 实时匹配或维护独立映射文件。
- 修改蛋组、完整精灵、一图流、异色数据时，要保留现有排序语义，除非用户明确要求重排。

## 一图流攻略流程

- 一图流映射维护在 `src/data/pet-guide-images.json`，图片保存到 `public/pet-guides/<guideId>.jpg`。
- 新增 TapTap 一图流时，按正文中列出的精灵顺序与 `footer_images` 顺序一一对应。
- ID 匹配优先级：
  - 先查 `src/data/egg-groups.json` 的精确 `display_name`。
  - 再查 `public/rocom/data/Pets.json` 的精确中文名。
  - 必要时用 `family_chain` 或少量明确别名修正正文笔误。
- 每条映射要包含当前攻略 ID、展示名、原文名、来源 URL、文章标题、图片序号和 `relatedIds`。
- `relatedIds` 应从 `public/rocom/data/pets/<guideId>.json` 的 `evolution_tree` 生成，并补充同名形态 ID。
- 新增后至少验证：
  - `find public/pet-guides -type f -name '*.jpg' | wc -l`
  - `npm run build`
  - `npm run lint`
  - 用浏览器或精准脚本确认一个早期进化阶段能命中最终攻略图。

## 前端实现规则

- 跟随现有组件和 CSS 命名，不引入新的 UI 框架。
- 列表卡片标题必须稳定单行，超出用省略号，避免卡片高度随换行抖动。
- 分页控件要支持页码跳转和每页数量选择；目前每页最大为 `1000`。
- 路由以 `src/App.tsx` 为准：蛋组库 `/`，完整精灵库 `/pets`，异色 `/shiny`，详情 `/pokemon/:baseId`。
- 可点击卡片需要保留键盘可访问性，沿用现有 `role`、`tabIndex`、`onKeyDown` 模式。
- 列表上的一图流图标只表示“有攻略”，不要把来源说明塞进卡片正文；详情页再展示完整攻略图和来源链接。

## 本地存储规则

- 我的精灵状态来自 `src/hooks/useMyPokemon.ts`，键名是 `roco_my_pokemon`。
- `localStorage` 按 origin 隔离，端口或 URL 变化会导致数据看起来不见。
- 调试“我的精灵”“异色拥有状态”时，先确认当前浏览器 origin 和 `localStorage.getItem('roco_my_pokemon')`。

## 浏览器验证规则

- 用户已经运行 `5173` 前端时，优先验证 `http://localhost:5173` 的真实页面。
- 默认用 `agent-browser eval` 精准读取 DOM 状态，例如标题、计数、图片 `src`、图片 `naturalWidth`。
- 只有需要找元素、看可访问树或调试交互路径时才用 `agent-browser snapshot`。
- 只有需要视觉确认布局时才截图；普通 DOM 文本验证不要截图或做图像分析。
- 普通 CSS/布局小改默认不跑 `agent-browser`；除非用户明确要求、需要确认真实浏览器渲染，或改动涉及交互/路由/localStorage 等运行态行为。
- 浏览器验证要覆盖最小关键路径，不要为了一个改动打开过多页面。

## 省 Token 规则

- 大任务做完一个阶段后，优先建议开启新会话继续；新会话只带最小上下文摘要，例如当前改动点、关键文件和下一步目标。
- 搜索和读取文件时限制范围，优先查 `src` 或目标文件；避免对整个仓库或大型 JSON 做宽泛 `rg`、`sed`、`cat` 输出。
- 对 `src/data/egg-groups.json`、`public/rocom/data/Pets.json`、`src/data/pet-guide-images.json` 这类大数据文件，优先用 `node -e` 精准查询目标字段，只输出必要结果。
- 浏览器验证默认使用 `agent-browser eval` 精准读取 DOM 状态；除非需要检查可访问树或找元素，不使用 `agent-browser snapshot`。
- 截图只在需要视觉确认时使用；不要为了普通 DOM 文本验证而截图或做图像分析。
- 一图流攻略新增、ID 匹配、图片下载这类重复流程，优先沉淀成脚本或复用已有脚本思路，避免每次重新探索流程。
- 验证范围按需求最小化：默认先跑 `npm run build` 和 `npm run lint`；浏览器验证只检查关键页面和关键选择器。
- 纯样式小调整优先只做代码检查和必要的 build/lint，不主动启动开发服务或跑 `agent-browser`。
- 如果用户明确说“只跑 build + lint”或“只用 eval 验证”，必须遵守，不额外 snapshot 或截图。

## Git 和编辑规则

- 当前工作区可能已有用户改动；不要重置、删除或回滚未明确要求的改动。
- 默认只做编码和文件修改，不主动执行 `git add` / `git commit`；只有用户明确要求提交时才提交 git。
- 手工编辑文件优先使用 `apply_patch`。
- 不要用脚本大范围重写格式，除非改动本身需要。
- 保持改动集中在请求相关文件，避免顺手重构。
