# Freedom Aviation - Design Guidelines

## Design Approach

**Hybrid Strategy**: Premium aviation aesthetic for marketing pages + clean utility design for dashboard interfaces.

**Marketing Inspiration**: Airbnb's premium feel + Linear's typography precision + aviation industry sophistication
**Dashboard System**: Material Design principles with aviation-specific refinements for data-heavy interfaces

## Core Design Principles

1. **Professional Trust**: Aviation demands precision - design reflects safety and expertise
2. **Effortless Clarity**: Complex operations feel simple through clear hierarchy
3. **Premium Service**: Visual language matches high-end aircraft management
4. **Responsive Efficiency**: Desktop-optimized workflows, mobile-friendly monitoring

## Color Palette

**Light Mode - Marketing**
- Primary: 215 85% 25% (Deep Aviation Blue - headers, CTAs)
- Secondary: 210 15% 35% (Slate Gray - supporting text)
- Accent: 200 95% 45% (Sky Blue - interactive elements, sparingly)
- Surface: 0 0% 100% (Pure White)
- Background: 210 20% 98% (Off-White)

**Dark Mode - Dashboard**
- Primary: 215 80% 55% (Brighter Aviation Blue)
- Secondary: 210 10% 70% (Light Slate)
- Accent: 200 90% 50% (Bright Sky)
- Surface: 215 25% 12% (Dark Navy Card)
- Background: 215 30% 8% (Deep Navy Base)

**Semantic Colors**
- Success: 145 65% 45% (Aviation Green)
- Warning: 40 95% 55% (Alert Amber)
- Error: 0 75% 55% (Critical Red)
- Info: 200 85% 50% (Sky Blue)

## Typography

**Font Families** (Google Fonts CDN)
- Primary: 'Inter' (headings, UI, body)
- Monospace: 'JetBrains Mono' (tail numbers, technical data)

**Type Scale**
- Hero: text-6xl/7xl font-bold tracking-tight
- H1: text-4xl/5xl font-semibold
- H2: text-3xl font-semibold
- H3: text-2xl font-semibold
- Body Large: text-lg font-normal
- Body: text-base font-normal
- Small: text-sm font-medium
- Caption: text-xs font-normal

**Aviation-Specific Styling**
- Tail numbers: font-mono font-bold tracking-wider
- Status badges: text-xs font-semibold uppercase tracking-wide
- Technical data: font-mono text-sm

## Layout System

**Spacing Primitives**: Tailwind units 2, 4, 6, 8, 12, 16, 20, 24 (e.g., p-4, gap-6, mb-8)

**Marketing Page Structure**
- Container: max-w-7xl mx-auto px-6
- Section Padding: py-20 (desktop), py-12 (mobile)
- Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

**Dashboard Layout**
- Container: max-w-screen-2xl mx-auto px-4
- Card Padding: p-6
- Section Gaps: gap-6 (standard), gap-8 (major sections)
- Data Tables: w-full with sticky headers

## Component Library

**Marketing Landing Page**

*Hero Section (80vh minimum)*
- Full-width background: Aviation imagery (aircraft on tarmac at golden hour)
- Overlay: gradient from transparent to background color
- Headline: text-6xl font-bold with tight line-height
- Subheadline: text-xl text-secondary max-w-2xl
- CTA Button: Large primary button with blur background when over image
- Trust Indicator: "KAPA-Based • 1000+ Flights Managed" subtle text below

*Features Grid (3-column on lg)*
- Icon + Title + Description cards
- rounded-2xl border with subtle shadow
- Hover: subtle lift transform
- Icons: Heroicons (outline style)

*Membership Tiers Section (2-column comparison)*
- Side-by-side cards: Class breakdown
- Highlighted "Most Popular" tier
- Pricing calculator integration CTA

*Social Proof Section*
- Testimonial cards: 2-column on desktop
- Pilot photos: rounded-full avatars
- Aircraft type badges below names

*Footer*
- 4-column grid: Services, Resources, Contact, Legal
- Subtle background differentiation
- KAPA location badge prominent

**Dashboard Components**

*"Your Aircraft" Primary Card*
- Full-width hero card with aircraft image header
- Tail number: Large font-mono display
- Two embedded action buttons: Equal width, stacked on mobile
- Membership summary: Badge + benefits list
- Quick stats: Grid of key metrics

*Action Sheets/Drawers*
- Full-height slide-in from right
- Form sections with clear labels
- Service type selector: Radio cards with icons
- Date/time picker: Calendar integration
- Submit button: Fixed at bottom

*Data Tables (Admin)*
- Sticky header with sort indicators
- Row hover states with subtle background
- Action buttons: Icon-only in last column
- Status badges: Color-coded pills
- Filters: Top bar with search + dropdowns

*Kanban Board*
- Three columns: New, In Progress, Done
- Card design: Compact with drag handle
- Aircraft info: Tail number badge
- Service type: Icon + label
- Timestamp: Subtle text-sm

## Animations

**Use Sparingly - Aviation = Precision, Not Flash**

*Permitted Animations*
- CTA hover: Subtle scale (1.02) + shadow increase
- Card hover: Gentle lift transform
- Sheet/Drawer: Slide-in (300ms ease-out)
- Toast notifications: Fade + slide from top
- Kanban drag: Opacity + shadow feedback
- Loading states: Subtle pulse on skeleton screens

*Prohibited*
- Hero section parallax/scroll effects
- Excessive page transitions
- Decorative background animations
- Auto-playing carousels

## Images

**Hero Section**
- Large hero image: Premium aircraft (SR22T) on KAPA ramp at sunset
- Aspect ratio: 21:9 on desktop, 16:9 on mobile
- Image treatment: Subtle gradient overlay (bottom to top)
- Placement: Background covering 80vh
- Quality: High-resolution, professional aviation photography

**Additional Images**
- "Your Aircraft" card header: Specific aircraft photo (landscape 3:2)
- Features section: Icon illustrations (not photos) - use Heroicons
- Testimonials: Pilot headshots (square, rounded-full)
- Footer: Small KAPA location badge/logo if available

## Accessibility & Dark Mode

**Dark Mode Implementation**
- Toggle: Persistent in header, respects system preference
- Consistent across all pages including forms and inputs
- Card borders: Subtle in dark mode (border-white/10)
- Text contrast: WCAG AA minimum
- Form inputs: Proper background colors in dark mode

**Interaction States**
- Focus rings: Prominent blue outline (ring-2 ring-primary)
- Disabled states: Reduced opacity + cursor-not-allowed
- Loading states: Skeleton screens matching component structure
- Error states: Red border + error message below field

## Aviation-Specific Design Elements

- **Status Badges**: Color-coded pills (green=ready, amber=due soon, red=overdue)
- **Tail Number Display**: Monospace, bold, often with small flag icon
- **Class Indicators**: Roman numerals (I, II, III) in circles
- **Hobbs/Tach Meters**: Large numeric displays with unit labels
- **Flight Logs**: Table format with alternating row backgrounds
- **Maintenance Tracking**: Timeline view with due date indicators

## Responsive Breakpoints

- Mobile: < 768px (single column, stacked actions)
- Tablet: 768px - 1024px (2 columns where applicable)
- Desktop: > 1024px (full multi-column layouts)
- Wide: > 1440px (max-width constraints for readability)