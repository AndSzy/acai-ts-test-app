# acai-test-app

Test application for the `@acoustic/ac-ai-ts` library.

## Prerequisites

- Node.js 18+
- AWS credentials configured (profile: `UAT_InfraDeployer`)
- `.env` file with required variables (see `.env` for reference)

## Running

```bash
npm run dev
```

### Self-signed certificates

Internal services (e.g., `commonsrv-subscription-id`) use self-signed certificates that Node.js rejects by default. To bypass this during local testing:

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npm run dev
```

Do not set this in `.env` or `package.json` — it disables TLS verification globally and should only be used as an explicit local override.
