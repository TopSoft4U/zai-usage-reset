# z.ai Quota Reset Timer

Browser extension for the z.ai API subscription page.

## Why

The z.ai subscription page at `https://z.ai/manage-apikey/subscription` shows quota usage percentages but doesn't display when the quota resets in your local timezone. You're left guessing when you can use the API again.

This extension intercepts the quota API response and adds a countdown bar to each quota card showing the exact reset time in your local time.

## What it does

- Adds a reset countdown bar inside each quota card (5h quota and monthly web search quota)
- Shows the reset time in your local timezone
- Color coded progress: red = long wait, yellow = halfway, green = almost reset
- Auto-clicks the "Usage" tab when you navigate to the subscription page

## Compatibility

This was only tested on the legacy pro plan with 5-hour and monthly reset cycles. Plans with weekly resets or different quota structures have not been tested and may not display correctly.

## Install

**Firefox (signed):**

Install from [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/zai-quota-reset-timer/) or download the `.xpi` from [Releases](https://github.com/TopSoft4U/zai-usage-reset/releases).

**Chrome:**
1. Download the `.zip` from [Releases](https://github.com/TopSoft4U/zai-usage-reset/releases)
2. Extract the zip
3. Go to `chrome://extensions`
4. Enable "Developer mode"
5. Click "Load unpacked" and select the extracted folder

## Build

Tag a version and push to trigger the GitHub Actions workflow:

```
git tag v1.0.0
git push --tags
```

The workflow packages the extension files into a zip, signs the `.xpi` via AMO, and attaches both to a GitHub Release.
