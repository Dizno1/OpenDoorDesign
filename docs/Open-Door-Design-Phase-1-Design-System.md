# Open Door Design Phase 1 Design System

This folder establishes the first shared CSS foundation for Open Door Design projects.

## Files

- `css/odd-theme.css` defines design tokens, global colors, typography, links, focus indicators, motion preferences, and compatibility variables for older page styles.
- `css/odd-layout.css` defines shared page structure, navigation, banners, grids, sections, footers, and reflow behavior.
- `css/odd-components.css` defines buttons, forms, cards, callouts, status panels, carousel patterns, and accessible video player baseline styles.
- `css/odd-utilities.css` defines screen-reader-only utilities, print handling, forced-colors support, and small helper classes.

## Open Door Design internal targets

- Normal text should target at least 7:1 contrast whenever practical.
- Large text should target at least 4.5:1 contrast.
- User interface components, focus indicators, borders, icons, and control states should target at least 4.5:1 contrast.
- Pages should reflow without horizontal scrolling at 320 CSS pixels and should remain usable below that width whenever practical.
- Touch and pointer targets should prefer 48 CSS pixels and should not fall below 44 CSS pixels for core controls.
- Links should remain underlined by default.
- Focus indicators should be visible, high contrast, and consistent across all pages and applications.
- Native HTML controls should be preferred before custom widgets.

## Palette contrast checks

The core palette was selected to exceed minimum contrast targets:

- Body text `#111111` on background `#F7FBF8`: approximately 18:1.
- Heading `#102A43` on background `#F7FBF8`: approximately 14:1.
- Link `#004B8D` on background `#F7FBF8`: approximately 8.4:1.
- Visited link `#5A2A82` on background `#F7FBF8`: approximately 9.6:1.
- White text on primary green `#0B5D3B`: approximately 8:1.
- White text on deep navy `#17324D`: approximately 13:1.

## Implementation status

All HTML and HTM pages in this website now reference the shared CSS files. Inline page style blocks were removed so the site uses one shared visual foundation.
