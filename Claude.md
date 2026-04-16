## Code Review Standards
After completing any implementation, review the code for:
- Functions longer than 30 lines (likely doing too much)
- Logic duplicated more than twice (extract to utility)
- Any `any` type usage in TypeScript (replace with real types)
- Components with more than 3 props that could be grouped into an object
- Missing error handling on async operations

Run /simplify before presenting code to the user.

## Code Review Standards

## 1. Core Principles

1. **Astro is the foundation**

   * Server-side rendering (SSR) is the default
   * React is used only where interactivity is required

2. **Islands architecture**

   * React components must be isolated (“islands”)
   * Do NOT turn the app into a full SPA

3. **Centralization**

   * API → `src/lib/api.ts`
   * Styles → `global.css` + Tailwind system

4. **Incremental evolution**

   * Extend existing patterns
   * Avoid rewrites

---

## 2. Astro + React Rules

### 2.1 When to Use React

✅ Use React for:

* Interactive UI (forms, modals, dropdowns)
* Client-side state
* Complex user interactions

❌ Do NOT use React for:

* Static content
* Layout structure
* Simple rendering

---

### 2.2 Hydration Rules

React components MUST use Astro client directives:

* `client:load` → immediate interaction needed
* `client:idle` → non-critical UI
* `client:visible` → lazy UI (preferred)

✅ Example:

```astro
---
import MyComponent from '../components/MyComponent.tsx';
---

<MyComponent client:visible />
```

❌ Forbidden:

* Hydrating entire pages
* Wrapping whole layout in React

---

### 2.3 Component Placement

* React components → `src/components/`
* Astro layouts remain in `layouts/`

---

## 3. API & Data Layer

### 3.1 API Access (STRICT)

ONLY use:

```ts
import apiClient from '@/lib/api';
```

NEVER:

```ts
fetch(...)
axios.create(...)
```

---

### 3.2 Authentication

* Managed centrally via interceptors
* Do NOT:

  * Manually attach tokens
  * Reimplement refresh logic

---

### 3.3 Data Fetching Strategy

* SSR data → fetch in Astro frontmatter
* Client data → fetch inside React (via `apiClient`)

---

## 4. State Management

Current rule:

❗ No global state library

Use:

* React `useState`
* React `useEffect`
* Props

Avoid:

* Redux / Zustand / Context overuse

If state becomes complex → propose solution first

---

## 5. Security Rules

### 5.1 Tokens

* Stored in `localStorage` (access token)
* Refresh via cookies

DO NOT:

* Expose tokens
* Log tokens
* Store additional sensitive data

---

### 5.2 XSS Protection

* Never use `dangerouslySetInnerHTML`
* Never render untrusted HTML

---

### 5.3 Env Variables

Only:

```ts
import.meta.env.PUBLIC_*
```

---

## 6. Styling System

### 6.1 Tailwind Usage

Use:

* Utility classes
* Existing component classes (`.btn`, `.card`, etc.)

Do NOT:

* Inline styles
* Random custom classes

---

### 6.2 Design Tokens

Always use defined tokens.

❌ Forbidden:

```css
color: #000;
```

---

### 6.3 React Styling

React components MUST follow the same Tailwind system.

No separate styling systems allowed.

---

## 7. TypeScript Rules

* Strict mode enforced
* Avoid `any`
* Always type:

  * Props
  * API responses

---

## 8. Performance Rules

* Prefer SSR over client rendering
* Minimize hydration
* Use `client:visible` whenever possible
* Avoid large React dependencies

---

## 9. File Structure

```
src/
  components/      # React components
  layouts/         # Astro layouts
  pages/           # Routes
  lib/             # API + utilities
  styles/          # Global styling
```

---

## 10. Naming Conventions

| Item             | Convention |
| ---------------- | ---------- |
| React components | PascalCase |
| Astro pages      | kebab-case |
| Variables        | camelCase  |

---

## 11. Adding Features

Before coding:

1. Can this be SSR only?
2. If not → isolate React usage
3. Reuse API client
4. Reuse styling system

---

## 12. Forbidden Practices

* Turning app into SPA
* Hydrating entire pages
* Direct API calls outside `api.ts`
* Multiple styling systems
* Bypassing auth logic
* Introducing global state libs without approval

---

## 13. Allowed Improvements

* ESLint / Prettier
* Testing (Vitest, Playwright)
* Form libraries (React Hook Form + Zod)
* Component abstraction layer

---

## 14. Decision Rule

If unsure:

> Use Astro (SSR) first. Add React only if necessary.

---

## 15. Summary

This app is:

* Astro SSR-first
* React islands for interactivity
* Centralized API layer
* Tailwind + token-based design
* Minimal and controlled

Goal:

→ **Scalable without becoming a React SPA**

---

**Violating these rules introduces architectural drift and technical debt.**
