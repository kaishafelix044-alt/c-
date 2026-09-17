# Calc Studio

A Windows Calculator-inspired desktop application for basic arithmetic, scientific calculations and symbolic algebra. Built with Electron and a bundled math.js engine. Runs in its own Windows window, without a browser, local server, account or calculation API. The browser development version remains available.

## Install on Windows

After building, open `release/Calc-Studio-Setup-1.0.1.exe` and follow the installer. It installs for the current user and can create Start menu and desktop shortcuts. Alternatively, open `release/Calc-Studio-Portable-1.0.1.exe` without installing.

These builds target 64-bit Windows 10/11. Node.js is only needed to develop or build the app, not to run either executable. The local build is unsigned; Windows may show an unknown-publisher or SmartScreen notice. Public distribution should use a code-signing certificate.

The desktop app stores its own history and theme under Electron's application data directory, separate from browser storage. Neither installer is automatically uploaded to GitHub.

## Run

Requires Node.js 22.12+ (Node.js 24 LTS recommended).

```powershell
npm.cmd install
npm.cmd run desktop
```

For browser development, run `npm.cmd run dev` and open http://127.0.0.1:5173. For a browser production build, run `npm.cmd run build`, then `npm.cmd run preview`.

## Build the Windows executables

```powershell
npm.cmd run package:windows
```

Creates an installer, portable executable, and unpacked application in `release/`. The first build downloads the Electron runtime and NSIS packaging tools. Generated binaries are ignored by Git; share them as GitHub Release assets instead of committing them. Packaging is configured with `--publish never`.

The icon is committed in `build/icon.ico`. To regenerate it from its source, run `node build/create-icon.mjs`.

## Features

- Standard arithmetic, percentages, parentheses, powers, roots and factorials.
- Scientific mode with degree/radian units, inverse and hyperbolic trigonometry, logarithms, constants and answer reuse.
- Algebra workspace with symbolic simplification, polynomial/rational expansion, derivatives and variable substitution.
- Complex numbers, matrices, statistics and unit conversions through the expression editor.
- Real-number memory controls, reusable local history, keyboard input, light/dark themes and responsive layouts.
- Calculations run in a Web Worker with an eight-second timeout.

## Examples

| Task | Expression |
| --- | --- |
| Degrees | `sin(30)` → `0.5` |
| Complex multiplication | `(2 + 3i) * (1 - i)` → `5 + i` |
| Determinant | `det([1, 2; 3, 4])` → `-2` |
| Simplification | `2x + 3x` → `5 * x` |
| Derivative in x | `x^3` → `3 * x ^ 2` |
| Statistics | `mean([2,4,6])` → `4` |
| Unit conversion | `5 cm to inch` |

Enter evaluates the expression; Escape clears it. Select an example to insert it, then calculate. History entries restore the expression, operation, angle units and substitution settings.

New history entries also retain the original `ans` value, so recalculating a restored expression reproduces its original answer even after restarting. Editing the expression returns `ans` to the latest calculation result. Older entries without a saved answer context use `0` for replay; their original displayed results remain available.

## Mathematical scope

Powered by [math.js](https://mathjs.org/docs/). Numeric calculations use IEEE-754 floating-point arithmetic; results display 14 significant digits and retain up to 17 digits internally. Symbolic calculus and variable substitution use radians. Percentage means division by 100. Polynomial expansion uses math.js rationalization; this is not a general equation solver, symbolic integration engine or arbitrary-precision system.

History retains the latest 50 calculations in browser storage. Memory resets on reload. Once installed, the local app does not need internet access to calculate.

## Verification

```powershell
npm.cmd test
npm.cmd run build
npx.cmd playwright test
npm.cmd run test:desktop
```

Browser tests use an installed Microsoft Edge. Change `channel` in `playwright.config.js` to use another Playwright-supported browser.

The desktop smoke test launches a hidden Electron window with a separate disposable profile. It checks numerical and symbolic operations, history across reloads, blocked remote requests, and renderer isolation. Desktop windows disable Node integration, enable Chromium sandboxing and context isolation, and prevent external navigation.
