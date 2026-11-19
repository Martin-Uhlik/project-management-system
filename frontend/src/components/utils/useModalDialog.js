import { useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Accessibility for the app's modal dialogs: put on the element with role="dialog".
// Moves focus into the dialog when it opens (first form field, else first button), keeps Tab inside it,
// closes it with Escape and gives focus back to whatever had it before the dialog opened.
export const useModalDialog = (onCancel) => {
    const dialogRef = useRef(null);
    const onCancelRef = useRef(onCancel);

    useEffect(() => {
        onCancelRef.current = onCancel;
    });

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return undefined;
        const previouslyFocused = document.activeElement;
        const focusables = () => [...dialog.querySelectorAll(FOCUSABLE)];
        const first = dialog.querySelector('input:not([disabled]), select:not([disabled]), textarea:not([disabled])') ?? focusables()[0];
        first?.focus();

        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && onCancelRef.current) {
                onCancelRef.current(event);
            } else if (event.key === 'Tab') {
                const items = focusables();
                if (items.length === 0) return;
                const [head, tail] = [items[0], items[items.length - 1]];
                if (event.shiftKey && document.activeElement === head) {
                    event.preventDefault();
                    tail.focus();
                } else if (!event.shiftKey && document.activeElement === tail) {
                    event.preventDefault();
                    head.focus();
                }
            }
        };
        dialog.addEventListener('keydown', handleKeyDown);
        return () => {
            dialog.removeEventListener('keydown', handleKeyDown);
            if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) previouslyFocused.focus();
        };
    }, []);

    return dialogRef;
};
