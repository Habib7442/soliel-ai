# Loading Component Documentation

## Overview

The Loading component is a reusable UI component that provides a consistent loading experience throughout the application. It can be used for inline loading states, full-page loading overlays, or any other loading scenario.

## Component Location

- `components/ui/loading.tsx` - The base Loading component
- `components/layout/global-loading.tsx` - Full-page loading overlay
- `app/loading.tsx` - Next.js route transition loading state

## Usage Examples

### Basic Usage

```tsx
import { Loading } from "@/components/ui/loading"

// Simple spinner
<Loading />

// With custom text
<Loading text="Loading..." />

// Different sizes
<Loading size="sm" />
<Loading size="md" />
<Loading size="lg" />

// Different variants
<Loading variant="default" />
<Loading variant="primary" />
<Loading variant="secondary" />
```

### Full-page Loading Overlay

```tsx
import GlobalLoading from "@/components/layout/global-loading"

<GlobalLoading text="Loading page..." />
```

### Using with Buttons

```tsx
import { Loading } from "@/components/ui/loading"
import { Button } from "@/components/ui/button"

<Button disabled={loading}>
  {loading ? (
    <>
      <Loading size="sm" className="mr-2" />
      Processing...
    </>
  ) : "Submit"}
</Button>
```

### Route Transition Loading

The `app/loading.tsx` file automatically handles loading states during route transitions in Next.js App Router.

## Props

### Loading Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| text | string | undefined | Optional text to display below the spinner |
| size | "sm" \| "md" \| "lg" | "md" | Size of the spinner |
| variant | "default" \| "primary" \| "secondary" | "default" | Color variant of the spinner |
| className | string | undefined | Additional CSS classes to apply |

### GlobalLoading Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| text | string | "Loading..." | Text to display below the spinner |

## Customization

The Loading component uses Tailwind CSS classes for styling and can be customized through the className prop or by modifying the component directly.

## Best Practices

1. Use the Loading component consistently throughout the application
2. Choose appropriate sizes for different contexts (sm for buttons, md for forms, lg for page transitions)
3. Always provide meaningful text for accessibility
4. Use GlobalLoading for full-page loading states during route transitions
5. Wrap components in Suspense with GlobalLoading for better user experience