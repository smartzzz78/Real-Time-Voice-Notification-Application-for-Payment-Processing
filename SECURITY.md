# Security

- Do not commit API keys, notification tokens, signing keys, signing passwords, APKs, or environment files.
- Runtime secrets belong in Google Apps Script Properties or another server-side secret store.
- Android signing material and private Android source/configuration are maintained outside this public repository.
- If a secret is exposed, revoke or rotate it before publishing a fix.
