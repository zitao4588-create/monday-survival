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

The current deployment target is `cloud1-d3g4v0ms8ee56bd94`, and the public custom domain is `https://monday.playgamelab.cn`. After deployment, run the default-domain diagnostic and the custom-domain three-viewport flow:

```bash
pnpm wechat:check:cloudbase
MS_WECHAT_BASE_URL=https://monday.playgamelab.cn pnpm wechat:check
```

The default CloudBase test domain shows a timed access notice. `pnpm wechat:check:cloudbase` handles that diagnostic path. The custom domain is the production-facing URL and should open without the default-domain notice.

`tcb hosting deploy` uploads or overwrites current files but does not prune old hashed assets. Use `tcb hosting list` after deployment and remove only verified stale project files; preserve CloudBase-managed `__auth/` and `cloud-admin/` paths.

## WeChat Test Checklist

- Open `https://monday.playgamelab.cn` in WeChat on iOS.
- Open the same custom URL in WeChat on Android.
- Share the link to a chat and open it from the chat card.
- Share the link to Moments and open it from Moments.
- Confirm the game starts on the round screen and no horizontal scrolling appears.
- Play through to the result screen.

## Later WeChat Sharing Work

Basic link sharing works as a normal H5 page. The custom domain, ICP filing, and HTTPS are confirmed. Custom WeChat share title, description, and cover image still require a WeChat JS-SDK signing service; do not add that without a separate product decision because it introduces a backend or cloud function.
