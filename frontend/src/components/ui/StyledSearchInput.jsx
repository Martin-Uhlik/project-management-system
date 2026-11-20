import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import SvgIcon from '@mui/material/SvgIcon';
import TextField from '@mui/material/TextField';

// Material Design icons (magnify, close), the same set as public/icons
const SearchIcon = () => (
    <SvgIcon fontSize='small' color='action'>
        <path d='M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z' />
    </SvgIcon>
);
const ClearIcon = () => (
    <SvgIcon fontSize='small'>
        <path d='M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z' />
    </SvgIcon>
);

// The search field above a table. Filters as you type: onChange gets the new text (not the event).
// The cross at the end shows only when something is typed, and empties the field.
export const StyledSearchInput = ({ value, onChange, placeholder = 'Hledat…', sx, ...props }) => {
    return (
        <TextField
            type='search'
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            sx={{
                // the browser's own clear button would duplicate ours
                '& input::-webkit-search-cancel-button': { display: 'none' },
                ...sx,
            }}
            slotProps={{
                htmlInput: { 'aria-label': placeholder },
                input: {
                    startAdornment: (
                        <InputAdornment position='start'>
                            <SearchIcon />
                        </InputAdornment>
                    ),
                    endAdornment: value ? (
                        <InputAdornment position='end'>
                            <IconButton size='small' edge='end' aria-label='Vymazat hledání' onClick={() => onChange('')}>
                                <ClearIcon />
                            </IconButton>
                        </InputAdornment>
                    ) : null,
                },
            }}
            {...props}
        />
    );
};
