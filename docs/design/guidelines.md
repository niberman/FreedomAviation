# Design Guidelines

Design system and principles for Freedom Aviation.

## Design Approach

**Hybrid Strategy**: Premium aviation aesthetic for marketing pages + clean utility design for dashboard interfaces.

**Marketing Inspiration**: Airbnb's premium feel + Linear's typography precision + aviation industry sophistication  
**Dashboard System**: Material Design principles with aviation-specific refinements for data-heavy interfaces

## Core Design Principles

1. **Professional Trust**: Aviation demands precision - design reflects safety and expertise
2. **Effortless Clarity**: Complex operations feel simple through clear hierarchy
3. **Premium Service**: Visual language matches high-end aircraft management
4. **Responsive Efficiency**: Desktop-optimized workflows, mobile-friendly monitoring

---

## Color Palette

### Light Mode - Marketing

- **Primary**: 215 85% 25% (Deep Aviation Blue) - headers, CTAs
- **Secondary**: 210 15% 35% (Slate Gray) - supporting text
- **Accent**: 200 95% 45% (Sky Blue) - interactive elements, sparingly
- **Surface**: 0 0% 100% (Pure White)
- **Background**: 210 20% 98% (Off-White)

### Dark Mode - Dashboard

- **Primary**: 215 80% 55% (Brighter Aviation Blue)
- **Secondary**: 210 10% 70% (Light Slate)
- **Accent**: 200 90% 50% (Bright Sky)
- **Surface**: 215 25% 12% (Dark Navy Card)
- **Background**: 215 30% 8% (Deep Navy Base)

### Semantic Colors

- **Success**: 145 65% 45% (Aviation Green)
- **Warning**: 40 95% 55% (Alert Amber)
- **Error**: 0 75% 55% (Critical Red)
- **Info**: 200 85% 50% (Sky Blue)

---

## Typography

### Font Families

Primary: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Geist Sans', 'Inter', system-ui, sans-serif`  
Monospace: `'JetBrains Mono', monospace` (tail numbers, technical data)

### Type Scale

- **Hero**: text-6xl/7xl font-bold tracking-tight
- **H1**: text-4xl/5xl font-semibold
- **H2**: text-3xl font-semibold
- **H3**: text-2xl font-semibold
- **Body Large**: text-lg font-normal
- **Body**: text-base font-normal
- **Small**: text-sm font-normal
- **Micro**: text-xs font-normal

### Font Weights

- **Normal**: 400 (body text)
- **Medium**: 500 (emphasized text)
- **Semibold**: 600 (headings, buttons)
- **Bold**: 700 (hero text, important callouts)

### Letter Spacing

- **Tight**: -0.02em (large headings)
- **Normal**: 0 (body text)
- **Wide**: 0.05em (uppercase labels)

---

## Spacing

Using 8px base unit:

```
0.5  = 4px
1    = 8px
2    = 16px
3    = 24px
4    = 32px
6    = 48px
8    = 64px
12   = 96px
16   = 128px
```

### Component Spacing

- **Cards**: p-6 (24px padding)
- **Sections**: py-12 md:py-16 (96px/128px vertical)
- **Buttons**: px-4 py-2 (16px/8px)
- **Form fields**: mb-4 (16px between fields)

---

## Border Radius

- **Default**: 0.42rem (6.72px) - slightly tighter for precision feel
- **Small**: 0.25rem (4px) - badges, tags
- **Large**: 0.75rem (12px) - cards, modals
- **Full**: 9999px - pills, avatars

---

## Shadows

### Light Mode

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.035);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.07);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.09);
```

### Dark Mode

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.35);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.4);
```

---

## Components

### Buttons

**Primary Button**:
- Background: Primary color
- Text: White
- Hover: Slightly lighter
- Focus: Ring with primary color

**Secondary Button**:
- Background: Transparent
- Border: 1px solid
- Hover: Light background
- Focus: Ring

**Ghost Button**:
- Background: Transparent
- No border
- Hover: Light background

**Sizes**:
- Small: px-3 py-1.5 text-sm
- Default: px-4 py-2 text-base
- Large: px-6 py-3 text-lg

### Cards

```css
.card {
  background: surface;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: shadow-md;
}
```

**Hover State**:
- Slight elevation increase
- Subtle scale (1.01)
- Transition: 200ms

### Forms

**Input Fields**:
```css
.input {
  border: 1px solid border-color;
  border-radius: 0.42rem;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
}
```

**Focus State**:
- Border: Primary color
- Ring: 2px primary with opacity

**Error State**:
- Border: Error color
- Helper text: Error color
- Icon: Error indicator

### Tables

**Header**:
- Background: Muted
- Font: Semibold, text-sm
- Padding: py-3 px-4

**Rows**:
- Border: Bottom border only
- Hover: Background change
- Padding: py-3 px-4

**Alternating Rows** (optional):
- Even rows: Slightly different background

---

## Iconography

### Icon Library

Using **Lucide React** icons

### Icon Sizes

- Small: 16px (w-4 h-4)
- Default: 20px (w-5 h-5)
- Large: 24px (w-6 h-6)
- XLarge: 32px (w-8 h-8)

### Icon Usage

- **Buttons**: Left or right of text
- **Navigation**: Left of text
- **Status**: Leading position
- **Actions**: Trailing position

---

## Layout

### Containers

```css
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}
```

### Grid System

Using CSS Grid or Tailwind grid:

```css
/* 12-column grid */
.grid-12 {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1.5rem;
}
```

### Responsive Breakpoints

- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

---

## Animation

### Timing Functions

- **Ease-out**: Default for entering elements
- **Ease-in**: For exiting elements
- **Ease-in-out**: For state changes

### Durations

- **Fast**: 150ms (micro-interactions)
- **Normal**: 200ms (most transitions)
- **Slow**: 300ms (page transitions)

### Common Animations

```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale */
@keyframes scale {
  from { transform: scale(0.95); }
  to { transform: scale(1); }
}
```

---

## Accessibility

### Color Contrast

- **Normal text**: Minimum 4.5:1
- **Large text**: Minimum 3:1
- **UI components**: Minimum 3:1

### Focus Indicators

All interactive elements must have visible focus indicators:

```css
:focus-visible {
  outline: 2px solid primary;
  outline-offset: 2px;
}
```

### Keyboard Navigation

- Tab order follows visual order
- All interactive elements reachable by keyboard
- Escape closes modals/dropdowns
- Arrow keys navigate menus

### Screen Readers

- Use semantic HTML
- Provide alt text for images
- Use ARIA labels when needed
- Announce dynamic content changes

---

## Best Practices

### Do's

✅ Use consistent spacing throughout  
✅ Maintain clear visual hierarchy  
✅ Keep text readable (line-height, contrast)  
✅ Test on multiple screen sizes  
✅ Provide feedback for user actions  
✅ Use loading states for async operations  

### Don'ts

❌ Don't use more than 3 font sizes per component  
❌ Don't mix different border radius styles  
❌ Don't use bright colors excessively  
❌ Don't forget hover/focus states  
❌ Don't sacrifice accessibility for aesthetics  
❌ Don't use animations longer than 300ms  

---

## Component Library

### Using shadcn/ui

We use [shadcn/ui](https://ui.shadcn.com) for base components:

- Button
- Card
- Input
- Select
- Dialog
- Table
- Badge
- Avatar
- And more...

### Customization

Components are customized in:
- `client/src/components/ui/` - Component files
- `client/src/index.css` - Global styles
- `tailwind.config.ts` - Theme configuration

---

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Lucide Icons](https://lucide.dev)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

**Last Updated**: November 2025  
**Maintained By**: Design Team

