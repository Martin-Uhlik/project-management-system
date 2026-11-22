import { useState } from 'react';
import Typography from '@mui/material/Typography';
import { StyledButton } from './StyledButton';

// Choosing a file to upload: a button plus the chosen file's name. The form reads the file from the field named `name`.
export const StyledFileInput = ({ name, label = 'Vybrat soubor' }: { name: string; label?: string }) => {
    const [fileName, setFileName] = useState('');
    return (
        <>
            <StyledButton component='label' variant='outlined'>
                {label}
                <input hidden type='file' name={name} onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')} />
            </StyledButton>
            <Typography sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} color='text.secondary'>
                {fileName || 'Žádný soubor nevybrán'}
            </Typography>
        </>
    );
};
