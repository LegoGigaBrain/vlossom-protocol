# Frontend React Component Standards

Goal: **clean, composable React components** that are easy to reason about and style.

## 1. Component types

- Prefer **function components** with hooks.
- Separate:
  - **presentational components** (styling & layout; minimal logic)
  - **container components** (data fetching & state).

## 2. Props & state

- Keep components **pure** where possible:
  - receive data and callbacks via props.
- Avoid bloated props with many boolean flags—consider splitting into smaller components.
- Local UI state lives in the component; cross-cutting state uses a state manager or React context.

## 3. Hooks

- Custom hooks are for:
  - shared stateful logic (`useBookings`, `useAuth`).
  - encapsulating API calls or derived state.
- Follow naming `useXxx`.

## 4. JSX & layout

- Keep JSX readable:
  - avoid deeply nested markup; extract sub-components.
  - limit inline function definitions inside JSX where it hurts readability.
- Use semantic HTML elements (`button`, `nav`, `main`, `header`, etc.) for accessibility.

## 5. Styling

- Use a consistent styling approach:
  - e.g., Tailwind, CSS modules, or a design system.
- Avoid inline styles except for dynamic one-offs.
- Prefer shared components for buttons, inputs, form controls.

## 6. Accessibility

- Every interactive element must be reachable by keyboard.
- Use appropriate ARIA attributes where necessary.
- Provide alt text for images that convey meaning.
- Ensure contrast ratios meet accessibility standards.

## 7. Error & loading states

- For every data-fetching component, handle:
  - loading state
  - error state
  - empty state
- Don’t leave the user staring at a blank screen.

## 8. Testing

- Use component tests (e.g., React Testing Library) for:
  - critical flows
  - complex components
- Prefer testing behaviour and visible output, not implementation details.

A great component is small, focused, and boring—in a good way.
