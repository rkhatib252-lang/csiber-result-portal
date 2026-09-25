# Security Policy

## Reporting a vulnerability

Please do not disclose security vulnerabilities in a public GitHub issue. Use GitHub private vulnerability reporting/security advisory features when available. Otherwise, contact the repository maintainer privately through GitHub.

Include the affected area, reproduction steps, impact, and suggested mitigation when possible. Do not include real student or other personal data in reports.

## Secret handling

Never commit:

- API keys or access tokens
- Real database credentials
- .env files
- Private certificates or signing keys
- Real student records
- Production database dumps

Use .env.example and synthetic demo data instead.
