# Exclude `.worktrees/` from repo-wide tools

Applied by the app-scaffold brief (fixed build step) or `/adopt`, once the config files exist:

| Tool | Where | Add |
|---|---|---|
| ESLint | `eslint.config.*` | `ignores: ['.worktrees/**']` |
| oxlint | `.oxlintrc.json` / CLI | `ignorePatterns: [".worktrees/**"]` |
| Jest | `jest.config.*` | `testPathIgnorePatterns: ['/.worktrees/']`, `modulePathIgnorePatterns` |
| Vitest | `vitest.config.*` | `exclude: [...configDefaults.exclude, '.worktrees/**']` |
| TypeScript | root `tsconfig.json` | `"exclude": [".worktrees"]` |
| Sonar | `sonar-project.properties` | `sonar.exclusions=.worktrees/**` |
| Turbo / pnpm workspace | `pnpm-workspace.yaml` | make sure globs do not match `.worktrees/**` |
