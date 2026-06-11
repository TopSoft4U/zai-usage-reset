# z.ai Quota Reset Timer

Browser extension for the z.ai API usage page.

## Why

The z.ai usage page at `https://z.ai/manage-apikey/coding-plan/personal/usage` shows quota usage percentages, but the API quota reset timing is easier to track with a local countdown. This extension adds separate reset countdown bars to the quota cards.

## What it does

- Adds a reset countdown bar inside each quota card (5h quota and monthly web search / reader / zread quota)
- Shows the exact reset time in your local timezone with a thin blue countdown progress bar
- Displays the current quota multiplier badge (peak 3x / off-peak) with local peak hours on hover
- Shows a message when the 5h quota hasn't started yet

## Compatibility

Only tested on the coding plan usage page with 5-hour and monthly reset cycles. Plans with weekly resets or different quota structures have not been tested and may not display correctly.

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
git tag v1.3.0
git push --tags
```

The workflow packages the extension files into a zip, signs the `.xpi` via AMO, and attaches both to a GitHub Release.
