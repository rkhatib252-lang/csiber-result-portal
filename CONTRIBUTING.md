# Contributing

Thanks for contributing to CSIBER Result Portal.

## Guidelines

- Keep changes focused and easy to review.
- Use synthetic/demo data only.
- Never commit passwords, API keys, .env files, database dumps, private PDFs, or real student records.
- Before a pull request, run `npm run lint` and `npm run build`.
- Describe what changed and how you tested it.

## Development

1. Clone the repository.
2. Run `npm install`.
3. Copy .env.example to .env and configure local PostgreSQL.
4. Run `npm run db:seed` when demo data is needed.
5. Run `npm run dev`.

## Pull Requests

Include a clear problem/solution description and testing details. For UI or PDF changes, include screenshots or sample output when useful.
