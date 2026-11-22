import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import { StyledSegmentedSelect } from './StyledSegmentedSelect';
import { useFontSize, type FontSize } from './useFontSize';
import type { SxProps, Theme } from '@mui/material/styles';

// a letter A in three sizes stands for the three options
const letter = (size: string) => (
    <Box component='span' aria-hidden='true' sx={{ fontSize: size, fontWeight: 'bold', lineHeight: '20px', width: '20px', textAlign: 'center' }}>
        A
    </Box>
);

const fontSizeOptions: { value: FontSize; label: string; icon: ReactNode }[] = [
    { value: 'small', label: 'Menší', icon: letter('0.8rem') },
    { value: 'medium', label: 'Střední', icon: letter('1.05rem') },
    { value: 'large', label: 'Větší', icon: letter('1.3rem') },
];

// Choosing the text size of the app: smaller, medium (the default), larger. showLabels: names next to the letters
export const StyledFontSizeSelect = ({ showLabels, sx }: { showLabels?: boolean; sx?: SxProps<Theme> }) => {
    const { fontSize, setFontSize } = useFontSize();
    return <StyledSegmentedSelect label='Velikost písma' options={fontSizeOptions} value={fontSize} onChange={setFontSize} showLabels={showLabels} sx={sx} />;
};
