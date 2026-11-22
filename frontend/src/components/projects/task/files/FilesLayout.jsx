import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { FileIcon } from '../../../ui';

// A list of files (list) and next to it the detail of the open file (detail, or an empty box asking to pick one), so the
// layout doesn't move when a file is opened. On a wide screen both boxes fill the page's height and scroll on their
// own; on a narrow one they stack.
export const FilesLayout = ({ list, detail }) => {
    const box = { height: { xs: 'auto', lg: '100%' }, minHeight: 0 };
    return (
        <Box
            sx={{
                display: 'grid',
                gap: 2,
                height: { lg: '100%' },
                gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) minmax(0, 1.25fr)' },
                gridTemplateRows: { lg: 'minmax(0, 1fr)' },
            }}
        >
            <Box className='content-box' sx={box}>
                <div className='content-box_content'>{list}</div>
            </Box>
            <Box className='content-box' sx={box}>
                <div className='content-box_content'>
                    {detail ?? (
                        <Box
                            sx={{
                                height: '100%',
                                minHeight: '12rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1,
                                color: 'text.secondary',
                                textAlign: 'center',
                            }}
                        >
                            <FileIcon sx={{ fontSize: '3rem', opacity: 0.5 }} />
                            <Typography>Vyberte soubor ze seznamu, zobrazí se tady jeho náhled.</Typography>
                        </Box>
                    )}
                </div>
            </Box>
        </Box>
    );
};
