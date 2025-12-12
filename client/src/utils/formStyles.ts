// Centralized form styles using CSS variables
// DRY principle: avoid repeating these patterns in components

export const inputStyles = {
  background: 'var(--bg-tertiary)',
  borderColor: 'var(--border-color)',
  color: 'var(--text-primary)',
};

export const inputClassName = 'w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-accent/50';

export const labelClassName = 'block text-sm font-medium mb-2';

export const buttonPrimaryClassName = 'btn btn-primary px-6 py-2 rounded-lg font-medium';

export const buttonSecondaryClassName = 'btn px-4 py-2 rounded-lg font-medium';

// Disabled state styles
export const disabledClassName = 'opacity-50 cursor-not-allowed';

// Form group wrapper
export const formGroupClassName = 'space-y-1';
