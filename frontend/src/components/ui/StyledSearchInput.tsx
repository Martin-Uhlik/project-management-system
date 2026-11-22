import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField, { type TextFieldProps } from '@mui/material/TextField';

import { CloseIcon, SearchIcon } from './icons';

// The search field above a table. Filters as you type: onChange gets the new text (not the event).
// The cross at the end shows only when something is typed, and empties the field.
export const StyledSearchInput = ({
    value,
    onChange,
    placeholder = 'Hledat…',
    sx,
    ...props
}: Omit<TextFieldProps, 'onChange' | 'value'> & { value: string; onChange: (value: string) => void }) => {
    return (
        <TextField
            type='search'
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            sx={{
                // the browser's own clear button would duplicate ours
                '& input::-webkit-search-cancel-button': { display: 'none' },
                ...(sx as object),
            }}
            slotProps={{
                htmlInput: { 'aria-label': placeholder },
                input: {
                    startAdornment: (
                        <InputAdornment position='start'>
                            <SearchIcon fontSize='small' color='action' />
                        </InputAdornment>
                    ),
                    endAdornment: value ? (
                        <InputAdornment position='end'>
                            <IconButton size='small' edge='end' aria-label='Vymazat hledání' onClick={() => onChange('')}>
                                <CloseIcon fontSize='small' />
                            </IconButton>
                        </InputAdornment>
                    ) : null,
                },
            }}
            {...props}
        />
    );
};
