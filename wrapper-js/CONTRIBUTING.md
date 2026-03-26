# Contributing to unDraw CLI

Thank you for your interest in contributing! This project follows the **oss-skill** standards for high-quality open-source development.

## Development Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/stefdevscore/undraw-cli.git
   cd undraw-cli
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Build the project**:

   ```bash
   npm run build
   ```

4. **Run tests**:
   ```bash
   npm run test
   ```

## Workflow

- **Branching**: All development should happen on the `dev` branch or feature branches targeting `dev`.
- **Commits**: We use **Conventional Commits** (e.g., `feat: ...`, `fix: ...`, `chore: ...`). This enables automated versioning and changelog generation via `release-please`.
- **Syncing**: The `undraw-inventory.json` is automatically updated nightly. If you find missing illustrations, you can run `npm run sync` locally and submit a PR.

## Code Standards

- **ESLint**: Run `npm run lint` before submitting a PR.
- **Formatting**: Use `npm run format` (Prettier).
- **TypeScript**: Ensure `npm run typecheck` passes with no errors.

## License

By contributing, you agree that your contributions will be licensed under the MIT License found in the LICENSE file.
