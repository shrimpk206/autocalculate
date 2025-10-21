# Design Guidelines: Mitheim Auto Estimator

## Design Approach: Utility-First Design System

**Selected Approach**: Design System (inspired by Linear + Material Design)
**Rationale**: This is a professional calculation tool requiring clarity, efficiency, and data accuracy. Visual aesthetics serve functionality, not vice versa.

**Core Principles**:
- Clarity over decoration
- Immediate functionality visibility
- Trustworthy, professional presentation
- Print-optimized layouts

---

## Color Palette

**Light Mode**:
- Background: 0 0% 100% (white)
- Surface: 220 13% 97% (light gray)
- Primary: 220 90% 56% (professional blue)
- Border: 220 13% 91%
- Text Primary: 222 47% 11%
- Text Secondary: 215 16% 47%

**Dark Mode**:
- Background: 222 47% 11%
- Surface: 217 33% 17%
- Primary: 217 91% 60%
- Border: 217 33% 23%
- Text Primary: 210 40% 98%
- Text Secondary: 215 20% 65%

**Semantic Colors**:
- Success: 142 76% 36%
- Warning: 38 92% 50%
- Error: 0 72% 51%

---

## Typography

**Font Stack**: 
- Primary: 'Inter', -apple-system, sans-serif (via Google Fonts)
- Monospace: 'JetBrains Mono' for numerical displays

**Hierarchy**:
- Page Title: text-2xl font-semibold
- Section Headers: text-lg font-medium
- Body Text: text-base
- Labels: text-sm font-medium
- Captions/Helper: text-xs text-secondary
- Numbers/Calculations: font-mono text-base

---

## Layout System

**Spacing Units**: Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4 to p-6
- Section spacing: space-y-6 to space-y-8
- Grid gaps: gap-4 to gap-6

**Container Strategy**:
- Max width: max-w-6xl mx-auto
- Page padding: px-4 md:px-8
- Card spacing: p-6

---

## Component Library

**A. Input Components**
- Number inputs with clear units (m²)
- Radio button groups for system selection (4 large, clearly labeled cards)
- Select dropdowns for thickness options
- Toggle switches for VAT inclusion
- Segmented controls for rounding units

**B. Data Display**
- Material list table: striped rows, fixed column widths
- Summary cards: large, readable numbers with labels
- Price breakdown: hierarchical list with clear totals
- Calculation results: highlighted panel with monospace numbers

**C. Navigation**
- Top navigation bar with app title
- Tab-based switching between Estimator and Settings
- Breadcrumb for multi-step processes

**D. Action Elements**
- Primary button (Calculate): Large, prominent blue
- Secondary button (Print/PDF): Outlined style
- Reset/Clear: Ghost button, less prominent
- Settings toggle: Icon button in header

**E. Configuration Panel**
- Editable table for prices (inline editing)
- Section grouping: RC Prices, Track Prices, Material Costs, Labor
- Save confirmation: Toast notification

**F. Print Layout**
- Clean, black-and-white optimized
- Company branding area at top
- Calculation summary table
- Footer with date/reference number
- Hide interactive elements when printing

---

## Interaction Patterns

**Form Flow**:
1. System selection (prominent cards)
2. Area input (auto-focus)
3. Optional parameters (thickness, if applicable)
4. Calculate button (disabled until valid)
5. Results display with print option

**Validation**:
- Inline validation with red borders
- Helper text below inputs
- Positive feedback (green checkmark) on valid input

**Animations**: Minimal
- Smooth transitions on tab switches (duration-200)
- Subtle hover states on interactive elements
- No decorative animations

---

## Specific UI Sections

**Main Estimator View**:
- Two-column layout (lg breakpoint): Input form left, results right
- Single column on mobile with sticky Calculate button
- System cards: 2x2 grid with icons and labels
- Results panel: Expandable material breakdown + summary

**Settings/Configuration View**:
- Tabbed sections for each price category
- Editable table with inline number inputs
- Visual distinction between editable/calculated fields
- Save button fixed at bottom

**Print View**:
- Single column, full width
- Header: Company name, date, estimate number
- Body: Input parameters + material table
- Footer: Total, VAT details, notes section
- Page breaks handled automatically

---

## Accessibility & UX

- Focus indicators on all interactive elements
- Keyboard navigation throughout
- Error messages associated with inputs (aria-describedby)
- Number inputs with step increments
- Clear labeling in both Korean and units
- High contrast text (WCAG AA minimum)
- Consistent dark mode throughout, including form inputs