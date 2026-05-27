# Roco Shiny Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local shiny-pet catalog, route, and detail-page shiny display.

**Architecture:** Keep the shiny list as a small typed utility module so the list page and detail page share one source of truth. Store TapTap egg crops under `public/shiny-eggs` and use rocom friend assets for pet artwork.

**Tech Stack:** React, TypeScript, Vite, static public assets.

---

### Task 1: Shiny Data Module

**Files:**

- Create: `src/utils/shinyPets.ts`
- Create: `src/utils/shinyPets.spec.ts`

- [x] Add a failing TypeScript spec that expects 19 S1 shiny entries and validates月牙雪熊 image paths.
- [x] Implement `shinyPets` and `getShinyPetById`.
- [x] Run `npm run build` and confirm the spec passes through `tsc -b`.

### Task 2: Local Egg Assets

**Files:**

- Create: `public/shiny-eggs/*.webp`

- [x] Download the five TapTap source images.
- [x] Crop each normal egg and shiny egg into local webp assets, remove the light background, and center the egg in a fixed canvas.
- [x] Re-crop the easy-to-break egg images with conservative background removal so light-colored eggs keep their edges.
- [x] Add a local shiny image for 犀角鸟 at `public/shiny-pets/xijiaoniao-shiny.webp`.
- [x] Name each crop with the data module's `eggAssetName`.

### Task 3: Shiny Route

**Files:**

- Create: `src/pages/ShinyLibrary.tsx`
- Create: `src/pages/ShinyLibrary.css`
- Modify: `src/App.tsx`
- Modify: `src/components/Header.tsx`

- [x] Add `/shiny`.
- [x] Add navigation label「异色」.
- [x] Render 19 cards with normal pet, shiny pet, normal egg, shiny egg, and click-through to detail.

### Task 4: Detail Integration

**Files:**

- Modify: `src/pages/PokemonDetail.tsx`
- Modify: `src/pages/PokemonDetail.css`

- [x] Remove the old local-rule hint text.
- [x] Read `getShinyPetById(parsedBaseId)`.
- [x] Render original artwork and shiny artwork side by side in the left side of `detail-hero` when data exists.
- [x] Render normal egg and shiny egg below the breeding candidate fact in the right side of `detail-hero`.

### Task 5: Verification

**Files:**

- No production changes.

- [x] Run `npm run build`.
- [x] Run `npm run lint`.
- [x] Re-run `npm run build` after lint fixes.
