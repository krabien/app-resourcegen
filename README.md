# app-resourcegen

Usage: execute `npx github:krabien/app-resourcegen` in your app project's root directory.

The resource generator is meant as a quick way to overwrite existing icon and splash screen 
resources for native Android, iOS, PWA, or web applications.

It runs in two steps: icon and splash screen.

For each step,, it will attempt to discover likely source material (e.g. `resources/icon1024.png`), 
then a list of likely targets (e.g. `assets/icons/icon-128@2x.png`, `assets/icons/icon-128@3x.png`).

Then it will generate copies of `resources/icon1024.png` 
under `app-resourcegen-out/assets/icons/icon-128@2x.png` 
at the targets' respective sizes (e.g. 256x256 for `icon-128@2x.png`).


Example output, if all goes well:

```
$ npx github:krabien/app-resourcegen
✅  using icon source     >>> resources/icon.png
targets:
 >  src/assets/icons/android-icon-192x192.png
 >  src/assets/icons/apple-icon-180.png
 >  src/assets/icons/favicon-16x16.png
 >  src/assets/icons/favicon-256x256.png
 >  src/assets/icons/favicon-32x32.png
 >  src/assets/icons/favicon-96x96.png
 >  src/assets/icons/icon-128x128.png
 >  src/assets/icons/icon-144x144.png
 >  src/assets/icons/icon-152x152.png
 >  src/assets/icons/icon-192x192.png
 >  src/assets/icons/icon-384x384.png
 >  src/assets/icons/icon-512x512.png
 >  src/assets/icons/icon-72x72.png
 >  src/assets/icons/icon-96x96.png
💦 using splash source   >>> resources/splash.png
targets:
 >  src/assets/splash-screens/apple-splash-1125-2436.jpg
 >  src/assets/splash-screens/apple-splash-1170-2532.jpg
 >  src/assets/splash-screens/apple-splash-1242-2208.jpg
 >  src/assets/splash-screens/apple-splash-1242-2688.jpg
 >  src/assets/splash-screens/apple-splash-1284-2778.jpg
 >  src/assets/splash-screens/apple-splash-1536-2048.jpg
 >  src/assets/splash-screens/apple-splash-1620-2160.jpg
 >  src/assets/splash-screens/apple-splash-1668-2224.jpg
 >  src/assets/splash-screens/apple-splash-1668-2388.jpg
 >  src/assets/splash-screens/apple-splash-2048-2732.jpg
 >  src/assets/splash-screens/apple-splash-640-1136.jpg
 >  src/assets/splash-screens/apple-splash-750-1334.jpg
 >  src/assets/splash-screens/apple-splash-828-1792.jpg
 
