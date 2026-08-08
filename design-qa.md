# Landing page design QA

Date: 2026-08-04
Branch: `milestone/23-landing-page`

## Visual source and captures

- Selected source: Product Design option 3, “Editoriale locale”, generated at `C:\Users\silvestrig\.codex\generated_images\019fcb6f-c807-7920-bf72-b49ee871ab47\exec-054db7a2-b9ef-4ce7-8ca5-9361da14827f.png` (`725 × 2167`). It is a design reference only and is not published or committed.
- Desktop implementation: `output/playwright/landing-en-light-1536.png`, Chromium viewport `1536 × 1024`, device scale factor 1, English, light theme, reveal transitions settled before capture.
- Full implementation: `output/playwright/landing-en-light-full.png`, Chromium viewport `1440 × 900`, full page `1440 × 10150`, device scale factor 1, English, light theme, reduced motion.
- Dark implementation: `output/playwright/landing-it-dark-1536.png`, Chromium viewport `1536 × 1024`, device scale factor 1, Italian, dark theme.
- Mobile implementation: `output/playwright/landing-it-mobile-reduced.png`, Chromium viewport `390 × 844`, full page, device scale factor 1, Italian, light theme, reduced motion.

The captures and comparison composites are local QA artifacts under ignored `output/playwright/`; they contain only the synthetic landing media.

## Comparisons

- Focused hero comparison: `output/playwright/compare-hero.png`. The source crop and implementation above-the-fold view were placed in the same `1536 × 512` comparison image.
- Full-page comparison: `output/playwright/compare-full.png`. The complete source and implementation were placed side by side at equal 725 px column width in the same `1450 × 5110` comparison image; the shorter source column is padded without stretching.
- Result: brand hierarchy, compact header, large editorial heading, two-column hero, mint/navy/amber palette, trust principles, feature rhythm, technical summary, download band and compact footer remain visibly aligned with the selected direction.
- Intentional differences: the implementation uses authentic ContaMì screenshots rather than the concept’s fabricated UI; it expands nine feature areas into individual chapters with localized video demonstrations. This makes the page longer than the compact concept while satisfying the approved content scope.

## Responsive, themes and interaction

- Desktop light and dark captures show readable contrast, localized screenshots and stable hero proportions.
- The site crops the uniform Windows title/menu strip from every poster and video at render time, preserving the original media files. The hero adds no macOS controls: its application-only crop aligns with the main headline, expands on wide screens and uses CSS perspective, depth edge and shadow without converting the PNG to another format.
- At `390 × 844`, content stacks into one column with no horizontal overflow; screenshots and controls remain inside the viewport.
- System language selects Italian only for locales starting with `it`; every other locale starts in English. IT/EN manual selection persists locally.
- Header anchors, release, repository and localized manual links, skip link and language buttons are keyboard-usable.
- Local MP4 demonstrations load on demand; starting a second demo pauses the previous one.
- `prefers-reduced-motion` removes reveal transitions and leaves every section visible.

## Automated evidence

`npm run test:landing:e2e` passed 7/7 Chromium checks covering EN fallback, Italian detection, light/dark localized media, persisted manual language selection, direct-file preview, platform-neutral media cropping, local video playback, single-video behavior, keyboard focus, mobile overflow, console errors and remote requests. Console errors: 0. Remote runtime requests: 0.

All 36 localized/theme PNG posters and representative frames from all 18 optimized MP4 demonstrations were reviewed together in local contact sheets. They show only the app’s synthetic demonstration dataset; no personal names, private workbook paths or user financial data were found. The contact sheets remain ignored local QA artifacts.

## Localized manual-link patch

Date: 2026-08-08
Branch: `patch/landing-v1.0.2-manual-links`

- Hero and final download band now expose a third CTA alongside release and repository.
- English resolves to `INSTRUCTIONS.md`; Italian resolves to `ISTRUZIONI.md` immediately on language selection and after persisted reload.
- Playwright CLI verified the localized links and final download band in EN/light and IT/dark at `1080 × 900`.
- Local QA captures are stored under ignored `output/playwright/` as `landing-manual-en-light-1080.png`, `landing-manual-it-dark-1080.png` and `landing-manual-it-dark-download-1080.png`.
- The hero places price, platforms and license beside a single desktop CTA row ordered Download, Instructions and GitHub; below 981 px the footer becomes a responsive single-column region. The revised geometry was checked in IT/light at `1080 × 900`, EN/dark at `1080 × 900` and `1536 × 1024`, and mobile at `390 × 844`, with zero horizontal overflow and zero console errors/warnings.
- Static landing validation, 7/7 landing E2E tests, the complete project preflight, documentation hygiene and `npm audit` all passed. No private media or workbook data was used.

final result: passed
