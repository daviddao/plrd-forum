# Security and local configuration

## Keep credentials out of Git

Use `.env.local` for development and your hosting provider's secret store for production. The tracked `.env.example` contains no credentials.

Never commit:

- Populated environment files, OAuth tokens, cookies, or authorization callback URLs.
- App passwords, Vercel tokens, private signing keys, or service-account files.
- SQLite files. Besides public records, the index can contain feedback and other local data.
- `.vercel/`, which contains a checkout's deployment link and may contain downloaded environment settings.

The `.gitignore` covers these common paths. It does not replace reviewing the files you stage. Do not use `git add -f` to bypass those protections.

## Session encryption

`SESSION_SECRET` is required and must be at least 32 characters. Generate a separate random value for each installation:

```bash
openssl rand -hex 32
```

Store the output privately. There is no built-in fallback password. Changing the secret invalidates existing encrypted session and OAuth cookies, so users will need to sign in again.

`NEXT_PUBLIC_*` variables are bundled for browsers. They must never contain secrets.

## Check before publishing

With [Gitleaks](https://github.com/gitleaks/gitleaks) installed:

```bash
gitleaks git --redact --log-opts="--all" .
git diff --cached --check
git status --short
```

The history scan does not cover uncommitted files. Review and scan the staged contents too. Automated scans can miss credentials and can flag public identifiers; investigate findings without copying secret values into logs or issues.

If a real secret was committed, revoke or rotate it first. Removing it from the latest file does not remove it from Git history. Coordinate any history cleanup with everyone using the repository.

## Login testing

The supplied login checks stop at OAuth redirects. An ePDS provider may automatically send a verification email when its authorization page runs in a browser. Do not run a full OTP flow against someone else's address without permission.

## Reporting a vulnerability

Use the repository's private vulnerability-reporting feature when available, or contact the maintainer privately. Do not post credentials, session data, or a working exploit against production in a public issue.

Secret scanning and the included tests are not a comprehensive security audit. Review provider configuration, authorization rules, public ingestion endpoints, remote URL fetching, and storage durability before deploying for a larger community.
