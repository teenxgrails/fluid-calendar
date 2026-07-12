# UI conventions (the "house format")

This is the canonical style for popups, pickers, toggles, and modals in this
app. **Reuse these patterns — do not invent new ones.** They match the Motion
reference (see `design-refs/motion-ui-spec.md` and `screens/`). Both Codex and
Claude should follow this.

## Color tokens (never hardcode hex)

Use the CSS variables from `globals.css`, which flip for light/dark:

| Token | Use |
|---|---|
| `--app-bg` | page / sidebar background (darkest) |
| `--raised` | cards, inputs, dropdown/select triggers, popover panels |
| `--raised-2` | select/menu popover surface (one step lighter than `--raised`) |
| `--active` | hover / selected row highlight |
| `--line-strong` | borders / dividers |
| `--text-hi` | primary text |
| `--text-lo` | secondary/muted text, icons |
| `--accent` | indigo accent (today pill, primary buttons) |
| `--acc-blue` | toggle "on" color |

**No glows.** Don't add `box-shadow` glows or bright `focus:border-[var(--accent)]`
rings to pickers/toggles. Focus is handled with `focus:outline-none` + a subtle
border only.

## Popup / options panel (e.g. Calendar options — screen 3/4)

Radix **Popover** (`@/components/ui/popover`), not DropdownMenu, when the panel
has rich content (selects, toggles, links):

- `PopoverContent` → `className="w-72 bg-[var(--raised)] p-4 text-[var(--text-hi)]"`
- Bold section heading: `text-[15px] font-semibold`, `mb-3`.
- Each option is a row: `flex items-center justify-between gap-3`, label in
  `text-[13px] text-[var(--text-lo)]`, control on the right.
- Divider between groups: `<div className="my-3 h-px bg-[var(--line-strong)]" />`.
- Footer links are centered rows with a trailing settings gear:
  `flex items-center justify-center gap-2 rounded-md py-1.5 text-[13px]
  text-[var(--text-lo)] hover:bg-[var(--active)] hover:text-[var(--text-hi)]`.

Reference implementation: the Calendar options panel in
`src/components/calendar/Calendar.tsx`.

## Picker / dropdown (Select — screen 4)

Always use the shared `@/components/ui/select`. It is already styled: dark
rounded trigger on `--raised` with a neutral border and a `--text-lo` chevron
(no accent glow), a rounded `--raised-2` popover with `shadow-lg`, and items
that round-highlight with `--active` on hover/selected (no checkmark).

- Trigger: `<SelectTrigger className="h-8 w-[120px]">` (size as needed).
- Do **not** build ad-hoc `<select>` elements or custom dropdowns — reuse this.

## Toggle (Switch)

Shared `@/components/ui/switch`. Flat white thumb (`shadow-sm`, **no glow**),
`--acc-blue` when checked, no focus ring. Use for boolean options.

## Modal / dialog (screen 5)

Shared `@/components/ui/dialog`:

- Overlay is `bg-black/55` with **no backdrop blur**.
- Content animates in with **fade + subtle slide-up** (`slide-in-from-bottom-2`),
  never a zoom.
- Header pattern: title (`text-base`/`text-lg`), optional description in
  `--text-lo`, optional bottom-bordered header (`border-b border-[var(--line-strong)]`).
- Footer actions: `Cancel` = `variant="outline"`, primary = default (accent).

## Status toast

For "working…" status (e.g. Refresh all tasks), use a sonner `toast.loading`
with `className: "recalc-toast"` — an inverse-of-theme pill (white on dark,
dark on light). See `.recalc-toast` in `globals.css`.
