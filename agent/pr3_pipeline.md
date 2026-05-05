# PR3 Pipeline — Layout & Navigation (MUI → Tailwind)

## Runtime context

You are running as a scheduled autonomous agent in Claude Code.

Rules:
- Work **fully autonomously** — never ask questions, never pause
- Complete the task end-to-end in a single session
- If something is unclear, make the most reasonable choice and continue
- Create a branch, implement all changes, and open a PR

---

## Project context

Repo: `https://github.com/ydexmier/ftl`  
App: Disney Lorcana tournament companion — Next.js 15, TypeScript, MongoDB, Tailwind v4.

**Migration status:**
- PR1 merged into `epic/tailwind`: Tailwind v4 installed, design tokens (OKLCH), Inter font, `globals.css`, `class="dark"` on `<html>`. MUI still present.
- PR2 merged into `epic/tailwind`: Primitive components (`Button`, `Input`, `Select`, `Badge`, `Alert`, `Spinner`, `Tooltip`, `cn`) created in `components/ui/`.
- **You are implementing PR3**: migrate Layout + Navigation + simplify Providers. No other files.

**Design system (from `app/globals.css` and `@theme inline`):**

Tailwind utilities available:
- `bg-background` — page background `oklch(14.5% 0 0)`
- `bg-card` — card surface `oklch(20.5% 0 0)`
- `text-foreground` — near-white `oklch(98.5% 0 0)`
- `text-muted-foreground` — mid-gray `oklch(70.8% 0 0)`
- `border-border` — white/10 opacity
- `bg-accent` / `hover:bg-accent` — subtle hover fill `oklch(26.9% 0 0)`
- `rounded-lg` = 10px, `rounded-md` = 8px
- Font: Inter Variable via CSS var `--font-inter`

Nav design target (duels.ink style):
- Sticky header, `h-14`, `bg-background/95 backdrop-blur-sm`
- Bottom border: `border-b border-border`
- Logo: `font-bold text-xl tracking-tight`
- Nav links: `text-sm font-medium`, ghost style — no bg at rest, `hover:bg-accent rounded-md px-3 py-1.5 transition-colors`
- Max width: `max-w-7xl mx-auto px-4`
- Admin icon button: right-aligned, ghost style

---

## Step 0 — Setup

```bash
git fetch origin
git checkout epic/tailwind
git pull origin epic/tailwind
git checkout -b feat/pr3-layout-navigation
npm install
```

---

## Step 1 — Migrate `components/ui/Layout.jsx` → `components/ui/Layout.tsx`

**Delete** `components/ui/Layout.jsx` and **create** `components/ui/Layout.tsx`.

Replace all MUI imports (AppBar, Toolbar, Container, Box, Typography, MenuItem, IconButton, Link from @mui, AdbIcon, AdminPanelSettingsIcon) with:
- Next.js `Link` from `next/link`
- `Swords` and `ShieldCheck` icons from `lucide-react`
- Pure Tailwind classes

Target implementation:

```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Swords, ShieldCheck } from 'lucide-react';
import { cn } from '@components/ui/cn';

const navLinks = [
  { href: '/', label: 'Accueil' },
  { href: '/tournaments', label: 'Tournois' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-50 h-14 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground shrink-0"
          >
            <Swords className="h-5 w-5" />
            FTL
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'text-sm font-medium px-3 py-1.5 rounded-md transition-colors',
                  pathname === href
                    ? 'text-foreground bg-accent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Spacer */}
          <div className="ml-auto" />

          {/* Admin */}
          <Link
            href="/admin/dashboard"
            className="text-muted-foreground hover:text-foreground hover:bg-accent p-2 rounded-md transition-colors"
            aria-label="Administration"
          >
            <ShieldCheck className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </>
  );
}
```

**Verify**: `cn` utility is imported from `@components/ui/cn` (created in PR2). If the file does not exist at that path, check `components/ui/cn.ts` — adjust the import path accordingly.

---

## Step 2 — Simplify `app/providers.tsx`

Dark mode is now handled by `class="dark"` on `<html>` in `app/layout.tsx` (set in PR1). The MUI ThemeProvider and CssBaseline are no longer needed.

Replace the file content with a minimal passthrough:

```tsx
export default function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

If `app/providers.tsx` already has other non-MUI providers (React Query, Zustand context, etc.), keep those and only remove the MUI-specific parts.

---

## Step 3 — Verify no regressions

```bash
npm run build
```

Fix any TypeScript errors that appear. Do **not** modify files outside the scope of this PR unless fixing a build error.

---

## Step 4 — Git workflow

```bash
git add components/ui/Layout.tsx components/ui/Layout.jsx app/providers.tsx
git commit -m "feat(pr3): migrate Layout and navigation from MUI to Tailwind

- Replace AppBar/Toolbar/Container/Box/MenuItem/IconButton with Tailwind nav
- Replace MUI icons (AdbIcon, AdminPanelSettingsIcon) with lucide-react (Swords, ShieldCheck)
- Replace MUI Link with next/link
- Add active route highlight via usePathname
- Simplify providers.tsx: remove ThemeProvider/CssBaseline (dark mode via class='dark')

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

git push -u origin feat/pr3-layout-navigation
```

Then open a Pull Request:
- **Base branch**: `epic/tailwind`
- **Title**: `feat(pr3): migrate Layout and navigation from MUI to Tailwind`
- **Body**:

```
## Summary

- Replace `components/ui/Layout.jsx` with a fully typed `Layout.tsx` using Tailwind classes
- Navigation: sticky header with backdrop-blur, active route highlight, lucide-react icons
- Remove MUI ThemeProvider and CssBaseline from `providers.tsx` (dark mode is handled via `class="dark"` on `<html>`)

## MUI removed from this PR
- `@mui/material`: AppBar, Toolbar, Container, Box, Typography, MenuItem, IconButton, Link
- `@mui/icons-material`: AdbIcon, AdminPanelSettingsIcon

## Test plan
- [ ] Navigation renders correctly on all pages
- [ ] Active route link is highlighted
- [ ] Dark mode background/colors are correct
- [ ] Admin icon navigates to /admin/dashboard
- [ ] Build passes with no TypeScript errors

🤖 Generated with Claude Code nightly agent
```

Use `gh pr create` to open the PR.
