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

## Install

Download the latest `.zip` from [Releases](https://github.com/TopSoft4U/zai-usage-reset/releases).

**Firefox:**
1. Go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select any file from the extracted zip

**Chrome:**
1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the extracted folder

## Build

Tag a version and push to trigger the GitHub Actions workflow:

```
git tag v1.0.0
git push --tags
```

The workflow packages the extension files into a zip and attaches it to a GitHub Release.
