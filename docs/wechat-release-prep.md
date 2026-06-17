# WeChat Release Prep

This document tracks what is needed before `monday-survival` moves from an internal CloudBase test link to a more public WeChat H5 sharing link.

## Current State

- The game is a static Vite React H5 app.
- The CloudBase test URL is usable for internal testing:
  - `https://cloud1-d3g4v0ms8ee56bd94-1434679773.tcloudbaseapp.com`
- User device feedback on the current internal test build: experience OK.
- The result screen can generate a `853 x 1844` PNG result poster in the browser.
- `pnpm wechat:check` verifies local mobile flow, no horizontal overflow, poster generation, and share text success state.

## Do Not Change Yet

- Do not add backend logic.
- Do not add database storage.
- Do not add login.
- Do not add payment.
- Do not add Docker.
- Do not replace the Claude fable5 visual system.
- Do not add WeChat JS-SDK until the final domain decision is made.

## Public Sharing Checklist

### P0 Required Before Wider Sharing

- [ ] Choose a custom domain for the game.
- [ ] Complete ICP filing for mainland China access.
- [ ] Bind the custom domain to CloudBase static hosting.
- [ ] Configure HTTPS with an SSL certificate.
- [ ] Confirm the custom domain opens directly in WeChat without the CloudBase default-domain risk warning.
- [ ] Rebuild and deploy the latest `dist/` to CloudBase.
- [ ] Generate a new QR code for the custom domain.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm build`.
- [ ] Run `pnpm wechat:check`.
- [ ] Open the final custom domain on iOS WeChat.
- [ ] Open the final custom domain on Android WeChat.
- [ ] Play through to the result screen on both devices.
- [ ] Confirm long-press save works for the result poster on both devices.
- [ ] Confirm share text copy or system share behavior on both devices.

CloudBase official docs note that mainland China custom domains require ICP filing, and HTTPS requires an SSL certificate.

### P1 Nice To Have

- [ ] Add WeChat JS-SDK sharing only after the custom domain is ready.
- [ ] Define final WeChat share title, description, and cover image.
- [ ] Add a lightweight manual feedback link or QR code outside the game UI.
- [ ] Clean unused historical visual experiment assets from a separate branch or PR after confirming no rollback need.

## WeChat JS-SDK Decision

Basic H5 link sharing works without JS-SDK, but WeChat may use generic title, description, or thumbnail.

Use JS-SDK only if we need:

- custom share title,
- custom share description,
- custom share cover image,
- better control over chat-card presentation.

JS-SDK requires a signature service. That means adding a backend or CloudBase function, so it is intentionally deferred.

## Manual Smoke Test Script

Use this script when testing on real phones:

1. Scan the current QR code in WeChat.
2. Confirm the first screen loads without horizontal scrolling.
3. Complete all five rounds.
4. Confirm the feedback screen appears after each choice.
5. Confirm the result screen appears after the last continue action.
6. Tap the result save button.
7. Confirm the result poster appears.
8. Long-press the poster and try saving it.
9. Tap share text and confirm whether WeChat copies text or opens the system share sheet.
10. Restart and confirm the game returns to round one.

## Release Evidence To Keep

Before wider sharing, keep these in the project or closeout notes:

- latest Git commit hash,
- CloudBase URL,
- QR code path,
- `pnpm test` result,
- `pnpm build` result,
- `pnpm wechat:check` result,
- iOS WeChat manual test result,
- Android WeChat manual test result,
- known limitations.

## Known Limitations

- CloudBase default test domain can show a Tencent CloudBase risk warning page.
- Real WeChat save/share behavior still depends on iOS / Android WebView permissions.
- Custom WeChat share cards require JS-SDK and a signature service, which is intentionally not implemented yet.
