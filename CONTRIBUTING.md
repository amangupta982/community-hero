# Contributing to Community Hero

Thank you for your interest in contributing! Community Hero is a civic-tech project aiming to make public infrastructure issue reporting faster and smarter for Indian municipalities. Every contribution matters.

## Ways to Contribute

- **Bug fixes** — spotted a problem? Fix it and open a PR.
- **Documentation** — improve docs, fix typos, add examples.
- **Tests** — increase coverage of utility functions and middleware.
- **Feature requests** — describe the civic use case you want to support.
- **Translations** — help make complaint drafting available in regional Indian languages.

## Before You Start

1. **Check existing issues** — someone may already be working on it.
2. **Open an issue first** for significant changes — discuss the approach before writing code.
3. **Fork the repository** and work on a feature branch.

## Development Setup

```bash
git clone https://github.com/YOUR_USERNAME/community-hero.git
cd community-hero
npm run install:all
cp server/.env.example server/.env   # add your keys
cp client/.env.example client/.env   # add VITE_MAPS_KEY
```

See the [local setup guide](README.md#local-setup) in the README for full details.

## Making Changes

1. Create a branch: `git checkout -b feat/your-feature-name`
2. Make your changes
3. Run linting (zero warnings allowed): `npm run lint`
4. Run tests: `npm test --prefix server`
5. Check formatting: `npm run format:check`
6. Verify the build: `npm run build --prefix client`
7. Commit with a [Conventional Commit](https://www.conventionalcommits.org/) message
8. Push and open a pull request against `main`

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR.
- Write or update tests for any changed logic.
- Update documentation if your change affects user-facing behaviour or API contracts.
- Do **not** commit secrets, API keys, or `.env` files.
- Use the [PR template](.github/PULL_REQUEST_TEMPLATE.md) to describe your changes.

## Code Style

- **Formatter:** Prettier (run `npx prettier --write .`)
- **Linter:** ESLint (run `npx eslint .`)
- **Modules:** ES modules only — use `import`/`export`, not `require()`
- **File extensions:** Include `.js` in all import paths

See [docs/Contributing.md](docs/Contributing.md) for detailed technical guidance including how to add agents, endpoints, and tests.

## Commit Convention

```
feat(scope): add new thing
fix(scope): correct broken behaviour
docs(scope): update documentation
test(scope): add or fix tests
chore(scope): dependency updates, config changes
```

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By contributing you agree to abide by its terms.

## Questions?

Open a [GitHub Discussion](https://github.com/YOUR_USERNAME/community-hero/discussions) or comment on an existing issue.
