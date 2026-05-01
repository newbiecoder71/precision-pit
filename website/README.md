# Precision Pit Website

This folder is a separate marketing website for Precision Pit.

## Why it is in a separate folder

The mobile app and the marketing site should not be mixed together in the same `src/` tree.

- The app stays focused on Expo / React Native.
- The site can be deployed separately later.
- Screenshots, promo images, and videos have one clean place to live.

## Current structure

- `index.html`: homepage
- `styles.css`: site styling
- `media/`: add screenshots, promo posters, and tutorial videos here

## How to preview it

Fastest option:

1. Open [index.html](/c:/Users/manes/precision-pit/website/index.html) in your browser.

Better local-server option:

1. From the repo root, run `npx serve website`
2. Open the local URL it prints

## Recommended media to add next

- `dashboard-screen.png`
- `race-night-screen.png`
- `setups-screen.png`
- `team-members-screen.png`
- `send-team-invite.mp4`
- `add-events.mp4`
- `contact-support.mp4`
- `trackside-hero.mp4` or `trackside-hero-poster.jpg`

## About the race-track promo visual

The site is ready for a hero video or still poster showing:

- a person holding a phone
- Precision Pit visible on the phone screen
- race cars moving in the background
- a real track environment

I did not generate that media asset here because this session does not currently expose the built-in image generation tool. Once you want, I can still help you:

- write the exact prompt for generating it
- create the final site section that uses it
- wire in the finished video or poster once you have it
