import type { SyntheticEvent } from 'react';

// The value of a field of the submitted form, by its name (the forms that read their fields on submit)
export const fieldValue = (event: SyntheticEvent, name: string) =>
    ((event.currentTarget as HTMLFormElement).elements.namedItem(name) as HTMLInputElement | null)?.value ?? '';

// Whether a checkbox of the submitted form is ticked, by its name
export const fieldChecked = (event: SyntheticEvent, name: string) =>
    ((event.currentTarget as HTMLFormElement).elements.namedItem(name) as HTMLInputElement | null)?.checked ?? false;
