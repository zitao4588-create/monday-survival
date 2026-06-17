# WeChat Share Card Spec

This document defines the preferred WeChat share-card content for `monday-survival`.

Do not implement WeChat JS-SDK yet. This is a content and asset specification for the later custom-domain stage.

## Current Behavior

Without WeChat JS-SDK, the game shares as a normal H5 link. WeChat controls most of the chat-card preview.

Inside the result screen, the app already supports:

- generating a result poster PNG,
- long-press saving in WeChat,
- downloading the PNG in normal browsers,
- sharing or copying result text.

## Future JS-SDK Goal

Only after the custom domain is ready, use WeChat JS-SDK if we need controlled share cards:

- custom title,
- custom description,
- custom thumbnail image,
- separate copy for chat and timeline.

JS-SDK requires a signature service. That means adding backend or CloudBase Function work, so it is intentionally deferred.

## Default Share Title

Primary:

```txt
今天你能活过周一吗？
```

Alternatives:

```txt
测测你能不能体面下班
周一生存测试：撑到下班算你赢
```

## Default Share Description

Primary:

```txt
2 分钟职场黑色幽默小游戏，管理能量、心情和得分，看看你会以什么姿势活过周一。
```

Shorter option:

```txt
2 分钟周一生存测试，看看你能不能撑到下班。
```

## Timeline Copy

```txt
我的周一求生结果出炉了，你也来试试。
```

## Result Text Pattern

The current in-game result text should stay dynamic:

```txt
我的周一求生结果：<结局标题>
<人格标签>：<人格文案>
得分 <score>/100 · 能量 <energy>/100 · 心情 <mood>/100
来试试你能不能活过周一。
```

Keep this format short. It should fit in WeChat chat messages without feeling like a report.

## Share Thumbnail Direction

The share thumbnail should not be a full page screenshot. It should be a small, readable visual cue from the existing Claude fable5 style:

- warm paper report card,
- dark green stamp,
- simple Chinese title,
- no dense result stats,
- no fake UI controls,
- no unreadable tiny text.

Recommended size:

```txt
300 x 300 PNG or JPG
```

Recommended visible text:

```txt
活过周一
```

Asset path once created:

```txt
public/wechat-share-cover.png
```

Do not add the asset until the final share card design is approved.

## Implementation Notes For Later

When custom domain and JS-SDK are ready:

1. Add a small share config module.
2. Load JS-SDK only on supported WeChat WebView.
3. Request signature data from a backend or CloudBase Function.
4. Configure share title, description, link, and image URL.
5. Keep fallback behavior for non-WeChat browsers.

Do not put app secrets in frontend code.

## Acceptance Checklist

- [ ] Final domain confirmed.
- [ ] HTTPS confirmed.
- [ ] Share cover hosted at an HTTPS URL.
- [ ] Chat share title and description confirmed.
- [ ] Timeline title confirmed.
- [ ] JS-SDK signature service decision confirmed.
- [ ] iOS WeChat share preview checked.
- [ ] Android WeChat share preview checked.
