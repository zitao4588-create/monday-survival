# CloudBase WeChat H5 Deployment

This project is a static Vite React H5 game. For WeChat sharing in mainland China, deploy it to Tencent CloudBase Static Hosting instead of Vercel.

## Build Settings

- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm build`
- Output directory: `dist`
- Node.js: 20 or 22

`vite.config.ts` uses `base: "./"` so generated asset paths work when CloudBase deploys the app under a subdirectory or root path.

## Deploy With CloudBase CLI

Install and log in:

```bash
npm i -g @cloudbase/cli
tcb login
```

Build and upload `dist`:

```bash
pnpm install --frozen-lockfile
pnpm build
tcb hosting deploy dist -e <env-id>
```

Alternative one-command app deploy:

```bash
tcb app deploy --framework react --build-command "pnpm build" --output-dir dist -e <env-id>
```

## WeChat Test Checklist

- Open the CloudBase HTTPS URL in WeChat on iOS.
- Open the same URL in WeChat on Android.
- Share the link to a chat and open it from the chat card.
- Share the link to Moments and open it from Moments.
- Confirm the game starts on the round screen and no horizontal scrolling appears.
- Play through to the result screen.

## Later WeChat Sharing Work

Basic link sharing works as a normal H5 page. Custom WeChat share title, description, and cover image require a verified domain and WeChat JS-SDK signing service. Do not add that until the CloudBase URL and custom domain are confirmed.
