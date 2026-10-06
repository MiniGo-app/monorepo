# MiniGo landing page

MiniGo's landing page, built with React, TypeScript and Vite. It has a seven-slide carousel and two cuts of the pitch video.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-checks, then builds dist/
npm run preview
```

The build uses relative asset paths and can be served from a subfolder.

## Files

- `src/components/Showcase.tsx` controls the carousel.
- `src/illustrations/` contains its line drawings.
- `src/components/VideoDialog.tsx` selects the wide or vertical video.
- `public/video/` contains both video files.
- `src/style.css` contains the layout and animations.
- `privacy.html` is the privacy policy, a static page built alongside `index.html` (see `vite.config.ts`). Update it when the app's data handling changes, for example when cloud backup sign-in ships.

The carousel pauses when hovered, when the video is open or when the tab is hidden. It stays still when reduced motion is enabled.

## Before launch

- Add the Android download when a public APK is available. Add an iPhone link when there is a build to share.
- Point GitHub links to the app repository once it is public. They currently open the organization page.
