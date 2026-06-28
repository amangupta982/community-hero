# Contributing Guide (Extended)

This document supplements [CONTRIBUTING.md](../CONTRIBUTING.md) at the repository root with technical details for contributors.

---

## Development Environment

### Required versions

- **Node.js ≥ 20** (the server uses `node --watch`, native ESM, and `node:path`)
- **npm ≥ 10** (workspaces-style `--prefix` usage)
- **gcloud CLI** (for Firestore and GCS access during integration testing)

### Initial setup

```bash
git clone https://github.com/YOUR_USERNAME/community-hero.git
cd community-hero
npm run install:all
cp server/.env.example server/.env   # fill in real keys
cp client/.env.example client/.env   # fill in VITE_MAPS_KEY
```

### Running both processes

```bash
# Terminal 1
npm run dev --prefix server

# Terminal 2
npm run dev --prefix client
```

The Vite dev server proxies `/api/*` to `http://localhost:3001` via `vite.config.js`.

---

## Code Style

### Formatting

All code is formatted with **Prettier** (configuration in `.prettierrc`). Run before committing:

```bash
npx prettier --write .
```

### Linting

**ESLint** is configured at the root (`eslint.config.js`):

```bash
npx eslint .
```

### EditorConfig

`.editorconfig` enforces consistent indentation and line endings across editors. Most editors pick this up automatically.

### Conventions

- **ES modules**: Use `import`/`export`. No `require()`.
- **Async**: Use `async/await`. Avoid raw Promise chains.
- **File extensions**: Always include `.js` in import paths (ESM requirement).
- **Error handling**: All Express routes are wrapped with `asyncHandler`. Throw errors; don't swallow them.
- **Comments**: Comment the *why*, not the *what*. Avoid redundant comments.

---

## Adding a New Agent

1. Create `server/agents/myagent.js` extending `BaseAgent`:

```javascript
import { BaseAgent } from "./base.js";

class MyAgent extends BaseAgent {
  constructor() { super("myagent"); }
  startMessage() { return "Doing something useful..."; }
  publicResult(r) { return { summary: r.key }; }
  async execute(input) {
    // ... your logic
    return result;
  }
}

export const myAgent = new MyAgent();
```

2. Import and call it in `agents/pipeline.js` in the appropriate sequence position.

3. Add the SSE event to the client's `useReports.js` hook and `PipelineProgress.jsx` if the agent should appear in the UI.

4. Add tests in `server/tests/myagent.test.js`.

---

## Adding a New API Endpoint

1. Add the route to `server/routes/api.js`
2. Create the controller in `server/controllers/myController.js`
3. Wrap the handler with `asyncHandler`
4. Add input validation in `server/middleware/validateReport.js` (or create a new middleware)
5. Document the endpoint in [docs/API.md](API.md)
6. Write a test

---

## Testing

### Running tests

```bash
npm test --prefix server           # run all tests once
npm run test:watch --prefix server # watch mode
npm run test:coverage --prefix server # with coverage report
```

### Test structure

Tests live in `server/tests/`. Each file covers one module:

```
server/tests/
  clustering.test.js   — haversineMetres, isWithinClusterRadius, worstSeverity
  parseDataUrl.test.js — parseDataUrl
  validateReport.test.js — validateReport middleware
  asyncHandler.test.js — asyncHandler wrapper
```

### Writing new tests

- Test files must end in `.test.js`
- Use the Vitest API: `describe`, `it`, `expect`, `vi` (for mocking)
- Focus on **pure functions** and **middleware** — avoid testing Firestore/Gemini directly (those are integration tests)
- For middleware tests, use lightweight mock `req`/`res`/`next` objects

```javascript
import { describe, it, expect } from "vitest";
import { myPureFunction } from "../utils/myModule.js";

describe("myPureFunction", () => {
  it("returns expected output for valid input", () => {
    expect(myPureFunction("input")).toBe("expected");
  });
});
```

---

## Pull Request Checklist

Before opening a PR:

- [ ] `npm run lint` passes with no errors
- [ ] `npm run build --prefix client` succeeds
- [ ] `npm test --prefix server` passes
- [ ] New functionality is covered by tests
- [ ] Relevant documentation in `docs/` is updated
- [ ] No secrets or API keys in the diff
- [ ] The PR description explains *why* the change is needed, not just *what* changed

---

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`

Examples:
```
feat(agents): add address validation to geo agent
fix(store): handle missing lat/lng in listClusters pagination
docs(api): document pipeline_complete event shape
test(clustering): add edge case for zero-distance points
```

---

## Reporting Bugs

Use the [Bug Report template](../.github/ISSUE_TEMPLATE/bug_report.yml). Include:
- Steps to reproduce
- Expected vs actual behaviour
- Server logs (remove any API keys before pasting)
- Environment (local / Cloud Run, Node version)

## Requesting Features

Use the [Feature Request template](../.github/ISSUE_TEMPLATE/feature_request.yml). Describe the problem you are solving, not just the solution.

## Security Issues

Do **not** open a public issue for security vulnerabilities. Follow the process in [SECURITY.md](../SECURITY.md).
