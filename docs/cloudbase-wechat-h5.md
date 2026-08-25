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

Build and upload the complete `dist` directory, including copied `public/` files such as `beian-icon.png`:

```bash
pnpm install --frozen-lockfile
pnpm deploy:cloudbase
```

The current deployment target is `cloud1-d3g4v0ms8ee56bd94`. After deployment, run the live three-viewport flow:

```bash
pnpm wechat:check:cloudbase
```

The default CloudBase test domain shows a timed access notice. The live check confirms that notice, waits for the game, reloads in the confirmed browser context, and then evaluates only the game runtime.

`tcb hosting deploy` uploads or overwrites current files but does not prune old hashed assets. Use `tcb hosting list` after deployment and remove only verified stale project files; preserve CloudBase-managed `__auth/` and `cloud-admin/` paths.

## WeChat Test Checklist

- Open the CloudBase HTTPS URL in WeChat on iOS.
- Open the same URL in WeChat on Android.
- Share the link to a chat and open it from the chat card.
- Share the link to Moments and open it from Moments.
- Confirm the game starts on the round screen and no horizontal scrolling appears.
- Play through to the result screen.

## Later WeChat Sharing Work

Basic link sharing works as a normal H5 page. Custom WeChat share title, description, and cover image require a verified domain and WeChat JS-SDK signing service. Do not add that until the CloudBase URL and custom domain are confirmed.
