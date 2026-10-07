// Runs before the router loads any screen. In a release build the router loads every screen up front, so code
// that must come first has to start here, not in src/app/_layout.tsx.
// Shows a startup error on screen instead of closing the app.
import "./src/startupErrors";
// Stellar's libraries need this Buffer before they load (see the file).
import "./src/polyfills";
import "expo-router/entry";
