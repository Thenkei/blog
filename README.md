# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Post image workflow

When adding a new blog visual, place the source image under `src/assets/images/posts/` and generate responsive variants:

```bash
npm run optimize:image -- --input src/assets/images/posts/my-post-hero.png --widths 960,1600 --remove-source
```

The optimizer generates:
- `-960.avif`
- `-1600.avif`
- `-960.webp`
- `-1600.webp`
- `-1600.jpg` (fallback)

Use these in MDX with `<picture>` and `srcSet` so browsers download the smallest viable asset.
