# MiniGo brand files

The logo is a ring, a dot and a smile-shaped arc, drawn in one colour. It has no fixed background, so any colour that reads on the surface works.

| File | What it is |
| --- | --- |
| `minigo-logo-dark.svg` | White mark on black (the original artwork). Use on dark surfaces and for the app icon |
| `minigo-logo-light.svg` | Black mark on white. Use on light surfaces |
| `minigo-mark.svg` | The mark alone, black, transparent background. Recolour by changing the `stroke`/`fill` |
| `render.mjs` | Renders the PNGs in `assets/` from the mark (see the top of the file) |

The SVGs were rebuilt from the original image by fitting each shape to it; they match to within anti-aliasing (every differing pixel is on an edge). In 1582-unit artwork space: ring centre (742.16, 723.5), radius 257, stroke 57; dot centre (982.18, 360.95), radius 76.96; arc centre (870.75, 1041.5), radius 169.44, stroke 59.56, from −20.2° to 159.8°.

## Where each version is used

- **In the app** (`src/components/Logo.tsx`): `Logo` draws the mark in any colour; `LogoTile` puts it on a tile that flips with the theme, so it is black-on-white in light mode and white-on-black in dark mode.
- **App icon** (`icon.png`): black tile, white mark. iOS icons can't be transparent, and this reads on both light and dark home screens.
- **Android adaptive icon**: black background colour (`app.json`), white mark in `android-icon-foreground.png` (kept inside the safe zone) and `android-icon-monochrome.png` for themed icons.
- **Splash screen** (`expo-splash-screen` in `app.json`): black mark on white in light mode (`splash-icon.png`), white mark on black in dark mode (`splash-icon-dark.png`). Splash screens only appear in development or production builds; Expo Go shows its own.
- **Favicon** (`favicon.png`): black rounded tile, white mark, which reads on light and dark browser tabs.
