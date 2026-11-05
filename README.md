# Complete Sub2API console

This is the complete replacement frontend for `api.chixiaotao.cn`, adapted
from the exact deployed backend source commit `dece261` (Sub2API 0.2.19).
It preserves the original 60 page components and canonical administrator,
user, authentication, payment, public and nested routes. It replaces the
earlier partial project in `D:\code\sub2api-ui`.

## Development and release

- `pnpm install --frozen-lockfile`
- `pnpm typecheck`
- `pnpm test:run`
- `pnpm build` produces the `/v2/` candidate in `dist`.
- `pnpm build:root` produces the root application in `dist-root`.

On this workstation, `node_modules` currently reuses the already installed
exact original frontend dependencies via a directory junction. Source files
and build output are independent of the original project.

`VITE_PUBLIC_BASE` and `VITE_BUILD_OUT` can override staging defaults.
Management API calls remain `/api/v1`; inference base remains the live
configured public endpoint, normally `https://api.chixiaotao.cn/v1`.

## Localization

Ten complete interface languages are available: Simplified/Traditional
Chinese, English, Japanese, Korean, Spanish, Russian, French, German and
Portuguese. `check:i18n` checks all language key sets and message syntax.
The translation report is `tools/translation-validation.json`.
User-authored site content, model names, API paths, credentials and protocol
examples must not be rewritten as translated interface text.

## Operational evidence

Release scripts, route inventories, API/browser reports and screenshots live
in `D:\code\sub2api-ui-audit-20261104`. Production deployment is static:
the backend container is not rebuilt or restarted. The root publisher backs
up nginx, uploads content-addressed assets, checks all hashes and swaps a
release symlink. Keep old hashed assets for cached browser sessions.

The isolated test lab uses synthetic users and data with the exact production
image. Its HTML session injection is test-only and must never be published.
Publishing scripts reject such injection in the release index.
