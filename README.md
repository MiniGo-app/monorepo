# MiniGo landing page

MiniGo's public landing page. Built with React, TypeScript and Vite.

## Run it

```bash
cd minigo-landing
npm install
npm run dev        # http://localhost:5173
npm run build      # type-checks, then builds the static site in dist/
npm run preview    # serve the built site
```

The build in `dist/` uses relative asset paths and can be served from a subfolder.

## Structure

- `src/App.tsx` assembles the page.
- `src/components/` contains the header, hero, paper roll and dialogs.
- `src/lib/` contains the roll, feed and torn-edge animation code.
- `src/data/apps.ts` holds the apps shown on the paper.
- `src/style.css` holds the layout and motion styles.

The feed updates the paper list directly through a React ref. This keeps the timed row growth and removal in one place. Reduced-motion users see the paper open and static.

## The apps

The first six entries match the app catalogue. Swap and Tickets are examples and the page labels them as such. Edit `src/data/apps.ts` when the catalogue changes.

## Before it goes public

- Replace the testnet instructions with store links when builds are available.
- Point the GitHub link to the app repository after it exists. It currently points to the MiniGo organization.
- Review the backup copy before launch. Cloud sign-in is not built yet; the encrypted backup currently stays on the phone.
