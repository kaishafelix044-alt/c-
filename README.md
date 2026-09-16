# Calc Studio

A Windows Calculator-inspired application for basic arithmetic, scientific calculations and symbolic algebra. Runs locally in a browser, with no account or calculation API required.

## Run

Requires Node.js 20.19+ or 22.12+.

```powershell
npm.cmd install
npm.cmd run dev
```

Open http://127.0.0.1:5173. For a production build, run `npm.cmd run build`, then `npm.cmd run preview`.

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

## Mathematical scope

Powered by [math.js](https://mathjs.org/docs/). Numeric calculations use IEEE-754 floating-point arithmetic; results display 14 significant digits and retain up to 17 digits internally. Symbolic calculus and variable substitution use radians. Percentage means division by 100. Polynomial expansion uses math.js rationalization; this is not a general equation solver, symbolic integration engine or arbitrary-precision system.

History retains the latest 50 calculations in browser storage. Memory resets on reload. Once installed, the local app does not need internet access to calculate.

## Verification

```powershell
npm.cmd test
npm.cmd run build
npx.cmd playwright test
```

Browser tests use an installed Microsoft Edge. Change `channel` in `playwright.config.js` to use another Playwright-supported browser.
