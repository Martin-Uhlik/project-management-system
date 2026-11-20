import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';

// once open, put the cursor in the first field so the user can type right away
const focusFirstField = (node) => {
    node.querySelector('input:not([type="hidden"]):not([disabled]):not([aria-hidden="true"]), textarea:not([disabled])')?.focus();
};

// The frame of every dialog: title, line, content. MUI keeps the focus inside and closes it with Escape (onClose).
export const StyledDialog = ({ title, onClose, children }) => {
    return (
        <Dialog
            open
            onClose={onClose}
            fullWidth
            maxWidth='sm'
            slotProps={{
                transition: { onEntered: focusFirstField },
                // the page behind the dialog is slightly blurred
                backdrop: { sx: { backdropFilter: 'blur(1px)' } },
            }}
        >
            <DialogTitle variant='h4' component='h1'>
                {title}
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: '1.5rem !important' }}>{children}</DialogContent>
        </Dialog>
    );
};
