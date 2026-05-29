# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

```bash
npm run dev      # 开发服务器 (代理 /api 到 roco.gptvip.chat)
npm run build   # 类型检查 + Vite 构建
npm run build:github  # GitHub Pages 构建 (base: /roco/)
npm run lint    # ESLint 检查
npm run preview # 预览构建结果
```

## 项目架构

**技术栈**: React 19 + TypeScript + Vite + React Router 7
**定位**: 洛克王国游戏的生蛋查询工具

### 路由 (HashRouter)

| 路径 | 页面 | 功能 |
|------|------|------|
| `/` | `PokemonLibrary` | 蛋组库 |
| `/pets` | `CompletePokemonLibrary` | 完整精灵库 |
| `/shiny` | `ShinyLibrary` | 异色精灵库 |
| `/pokemon/:baseId` | `PokemonDetail` | 精灵详情页 |
| `/my-pokemon` | `MyPokemon` | 我的精灵 |
| `/breeding` | `Breeding` | 生蛋推荐 |

### 核心数据源

- `src/data/egg-groups.json` - 本地蛋组库与代表精灵
- `public/rocom/data/Pets.json` - 完整精灵索引
- `public/rocom/data/pets/<id>.json` - 单精灵详情和进化树
- `src/hooks/useEggGroups`, `useRocomPets`, `useRocomPetDetail`, `useMyPokemon` - 标准数据入口

### 测试约定

项目没有独立测试框架，`src/**/*.spec.ts` 是轻量断言脚本，参与 `npm run build` 类型检查。新增共享逻辑时优先补对应 `*.spec.ts`。

### 本地存储

`src/hooks/useMyPokemon.ts` 使用 `localStorage` 的 `roco_my_pokemon` 键。调试"我的精灵"时先确认当前浏览器 origin 与 `localStorage` 数据。

### Git 规则

默认只做编码修改，不主动 `git add/commit`；只有用户明确要求时才提交。保持改动集中在请求相关文件，避免顺手重构。