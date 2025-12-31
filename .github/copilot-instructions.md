# AI Coding Guidelines for agente-pedagogico

## Project Overview
This is a Vue 3 application built with Vite, focused on creating a pedagogical agent. The project uses the Composition API with `<script setup>` syntax for Vue components.

## Architecture
- **Framework**: Vue 3 with Composition API
- **Build Tool**: Vite (overridden with rolldown-vite@7.2.5)
- **Entry Point**: `src/main.js` creates and mounts the Vue app
- **Main Component**: `src/App.vue` serves as the root component
- **Component Structure**: Components are placed in `src/components/`
- **Assets**: Static assets go in `src/assets/`, public files in `public/`

## Development Workflow
- **Start Development Server**: `npm run dev` (runs Vite dev server)
- **Build for Production**: `npm run build` (outputs to `dist/`)
- **Preview Production Build**: `npm run preview`
- **Hot Module Replacement**: Enabled by default in dev mode for fast updates

## Coding Conventions
- **Component Syntax**: Use `<script setup>` for all Vue components (see `src/components/HelloWorld.vue` example)
- **Props Definition**: Use `defineProps()` with object syntax for type safety
- **Reactive Data**: Use `ref()` for reactive variables (e.g., `const count = ref(0)`)
- **Styling**: Scoped styles in `<style scoped>` blocks
- **File Naming**: PascalCase for Vue components (e.g., `HelloWorld.vue`)

## Key Files
- `src/App.vue`: Root component importing and rendering child components
- `src/main.js`: App initialization and mounting
- `vite.config.js`: Minimal Vite config with Vue plugin
- `package.json`: Scripts and dependencies (Vue 3.5.24, @vitejs/plugin-vue 6.0.1)

## Dependencies
- Core: Vue 3
- Dev: Vite with Vue plugin, using rolldown for faster builds

Follow Vue 3 best practices and maintain the existing project structure for consistency.