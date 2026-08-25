# Domain, ICP, and HTTPS Status

The public-domain setup for `monday-survival` is complete. This file records the verified state and replaces the earlier action plan.

## Production URL

```txt
https://monday.playgamelab.cn
```

The CloudBase default domain remains available only for deployment diagnostics:

```txt
https://cloud1-d3g4v0ms8ee56bd94-1434679773.tcloudbaseapp.com
```

## Completed Configuration

- [x] Custom domain selected: `monday.playgamelab.cn`.
- [x] ICP filing completed: `陕ICP备2026012759号-2`.
- [x] Public-security filing approved: `陕公网安备61010202000523号`.
- [x] Custom domain bound to CloudBase/COS static hosting and CDN.
- [x] HTTPS certificate issued for `monday.playgamelab.cn`.
- [x] Filing links included in the page footer.

The retained filing evidence identifies the website as `今天你能熬过周一吗` at `https://monday.playgamelab.cn`.

## Verification Snapshot

Verified on 2026-08-25:

- Public DNS returns `monday.playgamelab.cn.cdn.dnsv1.com`, followed by the Tencent CloudBase CDN chain.
- `https://monday.playgamelab.cn` returns HTTP `200` from Tencent COS.
- The custom domain and CloudBase default domain return the same `ETag`, `Last-Modified`, and content length for `index.html`.
- At verification time, the live `ETag` matched the MD5 of the local `dist/index.html` produced for that deployment.
- The TrustAsia certificate is valid for `monday.playgamelab.cn` through 2026-09-20 and was not revoked at verification time.

Certificate dates and DNS answers are time-sensitive; recheck them before a later public campaign.

## Release Checks

After each deployment:

```bash
pnpm deploy:cloudbase
pnpm wechat:check:cloudbase
MS_WECHAT_BASE_URL=https://monday.playgamelab.cn pnpm wechat:check
```

Then test the production URL in real iOS and Android WeChat. Generate QR codes and shared links from the custom domain, not the CloudBase default domain.

## Remaining Separate Decision

Custom WeChat share title, description, and cover image require a JS-SDK signature service. That is a separate backend or cloud-function decision and is not part of the completed domain, ICP, or HTTPS setup.

## References

- CloudBase custom domain documentation: https://docs.cloudbase.net/service/custom-domain
- Tencent Cloud ICP documentation: https://cloud.tencent.com/document/product/243
- MIIT filing lookup: https://beian.miit.gov.cn/
- Public-security filing lookup: https://beian.mps.gov.cn/
