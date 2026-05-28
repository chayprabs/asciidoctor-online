# Security Policy

Report vulnerabilities to the maintainers via GitHub Security Advisories on this repository.

- Uploads and compile artifacts live only in ephemeral per-job directories.
- Passwords, tokens, and file contents are redacted from worker logs.
- Artifact URLs are private, short-lived paths under `/v1/artifacts/`.
