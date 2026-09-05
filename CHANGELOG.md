# Changelog

## 0.1.0-alpha.2 - 2026-09-05

- Refresh the root dependency lock to fast-uri 3.1.7, addressing the published URI normalization advisories.
- Keep protocol document versions, storage schemas, and existing lifecycle semantics unchanged.
- Pin the tested maintenance dependency chain: house-runtime v0.3.0-rc.3, house-toolkit v0.3.0-rc.4.
- Refresh affected development dependencies within their existing major-version ranges; retain the current React, Vite, and Vitest major lines.

The repository lockfile protects root installs with `npm ci`. It is not inherited by consuming projects. Consumers must refresh their own lockfiles and verify a patched fast-uri version (3.1.6 or newer in the 3.x line). Existing tags are not changed.

This is maintenance of the public package only. It does not deploy an instance, change model providers, or promote an experimental/candidate API to stable.

