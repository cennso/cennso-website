/**
 * Curated stand-in for lucide-react's full icon barrel.
 *
 * `@cennso/ui`'s <Icon name="..."> resolves icons through
 * `import { icons } from 'lucide-react'`, and that `icons` export is a
 * namespace object over every one of lucide's ~1845 icons. A namespace object
 * cannot be tree-shaken, so any page touching a component that renders an
 * Icon - Menu and ThemeToggle (in Navigation, so every page), plus Select and
 * Pagination on /success-stories - pulled the whole set in: 648KB parsed,
 * 179KB over the wire, the single largest asset on the site, for the handful
 * of glyphs actually drawn. That alone put every mobile Lighthouse run at
 * 0.88-0.91 against a 0.95 gate.
 *
 * next.config.js swaps lucide's own `icons/index.mjs` for this module via
 * NormalModuleReplacementPlugin, so `icons` becomes a namespace over just
 * the icons `@cennso/ui` can actually ask for. The list is every lucide
 * export name that appears as a string literal anywhere in
 * `@cennso/ui`'s dist - deliberately over-inclusive (it sweeps up component
 * names like `Table` and `Sheet` that happen to match an icon), because
 * over-including costs a few hundred bytes and under-including renders
 * nothing.
 *
 * Regenerating: this file is mechanical. next.config.js recomputes the same
 * set on every build and fails the build naming any icon this module is
 * missing, so an `@cennso/ui` upgrade that reaches for a new glyph is caught
 * at build time rather than as a blank space in the UI.
 *
 * Known limit: three `@cennso/ui` components take an icon name as a runtime
 * prop rather than a literal - ActionBar (`icon`), Alert (`icon`) and
 * ImageZoom (`icons.zoom`/`icons.unzoom`). A static scan cannot see a name
 * that only exists at runtime. None of them are used in this app; if one is
 * adopted, add the glyph it names below.
 */

export { default as ArrowDown } from 'lucide-react/dist/esm/icons/arrow-down.mjs'
export { default as ArrowLeft } from 'lucide-react/dist/esm/icons/arrow-left.mjs'
export { default as ArrowLeftToLine } from 'lucide-react/dist/esm/icons/arrow-left-to-line.mjs'
export { default as ArrowRight } from 'lucide-react/dist/esm/icons/arrow-right.mjs'
export { default as ArrowRightToLine } from 'lucide-react/dist/esm/icons/arrow-right-to-line.mjs'
export { default as ArrowUp } from 'lucide-react/dist/esm/icons/arrow-up.mjs'
export { default as Badge } from 'lucide-react/dist/esm/icons/badge.mjs'
export { default as Brain } from 'lucide-react/dist/esm/icons/brain.mjs'
export { default as Check } from 'lucide-react/dist/esm/icons/check.mjs'
export { default as ChevronDown } from 'lucide-react/dist/esm/icons/chevron-down.mjs'
export { default as ChevronLeft } from 'lucide-react/dist/esm/icons/chevron-left.mjs'
export { default as ChevronRight } from 'lucide-react/dist/esm/icons/chevron-right.mjs'
export { default as ChevronUp } from 'lucide-react/dist/esm/icons/chevron-up.mjs'
export { default as ChevronsLeft } from 'lucide-react/dist/esm/icons/chevrons-left.mjs'
export { default as ChevronsRight } from 'lucide-react/dist/esm/icons/chevrons-right.mjs'
export { default as ChevronsUpDown } from 'lucide-react/dist/esm/icons/chevrons-up-down.mjs'
export { default as Circle } from 'lucide-react/dist/esm/icons/circle.mjs'
export { default as CirclePlus } from 'lucide-react/dist/esm/icons/circle-plus.mjs'
export { default as Code } from 'lucide-react/dist/esm/icons/code.mjs'
export { default as Columns } from 'lucide-react/dist/esm/icons/columns-2.mjs'
export { default as Columns3 } from 'lucide-react/dist/esm/icons/columns-3.mjs'
export { default as Copy } from 'lucide-react/dist/esm/icons/copy.mjs'
export { default as Delete } from 'lucide-react/dist/esm/icons/delete.mjs'
export { default as Download } from 'lucide-react/dist/esm/icons/download.mjs'
export { default as Ellipsis } from 'lucide-react/dist/esm/icons/ellipsis.mjs'
export { default as Expand } from 'lucide-react/dist/esm/icons/expand.mjs'
export { default as ExternalLink } from 'lucide-react/dist/esm/icons/external-link.mjs'
export { default as Eye } from 'lucide-react/dist/esm/icons/eye.mjs'
export { default as EyeOff } from 'lucide-react/dist/esm/icons/eye-off.mjs'
export { default as File } from 'lucide-react/dist/esm/icons/file.mjs'
export { default as FileArchive } from 'lucide-react/dist/esm/icons/file-archive.mjs'
export { default as FileCode } from 'lucide-react/dist/esm/icons/file-code.mjs'
export { default as FileImage } from 'lucide-react/dist/esm/icons/file-image.mjs'
export { default as FileMusic } from 'lucide-react/dist/esm/icons/file-music.mjs'
export { default as FilePlay } from 'lucide-react/dist/esm/icons/file-play.mjs'
export { default as FileSpreadsheet } from 'lucide-react/dist/esm/icons/file-spreadsheet.mjs'
export { default as FileText } from 'lucide-react/dist/esm/icons/file-text.mjs'
export { default as FileType } from 'lucide-react/dist/esm/icons/file-type.mjs'
export { default as Frame } from 'lucide-react/dist/esm/icons/frame.mjs'
export { default as Ghost } from 'lucide-react/dist/esm/icons/ghost.mjs'
export { default as Globe } from 'lucide-react/dist/esm/icons/globe.mjs'
export { default as GripVertical } from 'lucide-react/dist/esm/icons/grip-vertical.mjs'
export { default as Hash } from 'lucide-react/dist/esm/icons/hash.mjs'
export { default as Heading } from 'lucide-react/dist/esm/icons/heading.mjs'
export { default as Home } from 'lucide-react/dist/esm/icons/house.mjs'
export { default as Image } from 'lucide-react/dist/esm/icons/image.mjs'
export { default as ImageOff } from 'lucide-react/dist/esm/icons/image-off.mjs'
export { default as Info } from 'lucide-react/dist/esm/icons/info.mjs'
export { default as Lightbulb } from 'lucide-react/dist/esm/icons/lightbulb.mjs'
export { default as Link } from 'lucide-react/dist/esm/icons/link.mjs'
export { default as List } from 'lucide-react/dist/esm/icons/list.mjs'
export { default as Loader } from 'lucide-react/dist/esm/icons/loader.mjs'
export { default as Maximize2 } from 'lucide-react/dist/esm/icons/maximize-2.mjs'
export { default as Megaphone } from 'lucide-react/dist/esm/icons/megaphone.mjs'
export { default as Menu } from 'lucide-react/dist/esm/icons/menu.mjs'
export { default as Minimize2 } from 'lucide-react/dist/esm/icons/minimize-2.mjs'
export { default as Minus } from 'lucide-react/dist/esm/icons/minus.mjs'
export { default as Monitor } from 'lucide-react/dist/esm/icons/monitor.mjs'
export { default as Moon } from 'lucide-react/dist/esm/icons/moon.mjs'
export { default as OctagonAlert } from 'lucide-react/dist/esm/icons/octagon-alert.mjs'
export { default as PanelLeft } from 'lucide-react/dist/esm/icons/panel-left.mjs'
export { default as Pin } from 'lucide-react/dist/esm/icons/pin.mjs'
export { default as PinOff } from 'lucide-react/dist/esm/icons/pin-off.mjs'
export { default as Plus } from 'lucide-react/dist/esm/icons/plus.mjs'
export { default as Presentation } from 'lucide-react/dist/esm/icons/presentation.mjs'
export { default as Radio } from 'lucide-react/dist/esm/icons/radio.mjs'
export { default as RotateCw } from 'lucide-react/dist/esm/icons/rotate-cw.mjs'
export { default as Search } from 'lucide-react/dist/esm/icons/search.mjs'
export { default as Sheet } from 'lucide-react/dist/esm/icons/sheet.mjs'
export { default as Sidebar } from 'lucide-react/dist/esm/icons/panel-left.mjs'
export { default as Sun } from 'lucide-react/dist/esm/icons/sun.mjs'
export { default as Table } from 'lucide-react/dist/esm/icons/table.mjs'
export { default as TableOfContents } from 'lucide-react/dist/esm/icons/table-of-contents.mjs'
export { default as Tag } from 'lucide-react/dist/esm/icons/tag.mjs'
export { default as TextWrap } from 'lucide-react/dist/esm/icons/text-wrap.mjs'
export { default as TriangleAlert } from 'lucide-react/dist/esm/icons/triangle-alert.mjs'
export { default as View } from 'lucide-react/dist/esm/icons/view.mjs'
