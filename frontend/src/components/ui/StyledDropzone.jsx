import { useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import { CloudUploadIcon } from './icons';

// An area to drop files on (or click / press Enter to choose them). onFiles(files) gets an array of the chosen files.
// busy: files are being uploaded (shows progress, ignores new files); progress: 0-100 while busy, or undefined for a
// moving bar; multiple: more files at once
export const StyledDropzone = ({ onFiles, busy = false, progress, multiple = true, label = 'Přetáhněte soubory sem', hint = 'nebo klikněte a vyberte je' }) => {
    const input = useRef(null);
    const [dragging, setDragging] = useState(false);
    // dragenter/dragleave fire for every child too: count them so the highlight doesn't flicker
    const depth = useRef(0);

    const hand = (fileList) => {
        const files = Array.from(fileList ?? []);
        if (busy || files.length === 0) return;
        onFiles(multiple ? files : files.slice(0, 1));
    };

    const hasFiles = (event) => Array.from(event.dataTransfer?.types ?? []).includes('Files');

    return (
        <Box
            role='button'
            tabIndex={busy ? -1 : 0}
            aria-disabled={busy}
            aria-label={`${label} ${hint}`}
            onClick={() => !busy && input.current?.click()}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    if (!busy) input.current?.click();
                }
            }}
            onDragEnter={(event) => {
                if (!hasFiles(event)) return;
                event.preventDefault();
                depth.current += 1;
                setDragging(true);
            }}
            onDragOver={(event) => {
                if (!hasFiles(event)) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = busy ? 'none' : 'copy';
            }}
            onDragLeave={() => {
                depth.current = Math.max(0, depth.current - 1);
                if (depth.current === 0) setDragging(false);
            }}
            onDrop={(event) => {
                event.preventDefault();
                depth.current = 0;
                setDragging(false);
                hand(event.dataTransfer.files);
            }}
            sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                minHeight: '8.5rem',
                p: 3,
                textAlign: 'center',
                cursor: busy ? 'progress' : 'pointer',
                border: '2px dashed',
                borderColor: dragging ? 'primary.main' : 'divider',
                backgroundColor: dragging ? 'color-mix(in srgb, var(--mui-palette-primary-main) 8%, transparent)' : 'transparent',
                transition: 'border-color 150ms, background-color 150ms',
                outline: 'none',
                '&:hover': { borderColor: busy ? 'divider' : 'text.secondary' },
                '&:focus-visible': { borderColor: 'primary.main', borderStyle: 'solid' },
            }}
        >
            <CloudUploadIcon sx={{ fontSize: '2.5rem', color: dragging ? 'primary.main' : 'text.secondary', transition: 'color 150ms' }} />
            <Typography sx={{ fontWeight: 600 }}>{busy ? 'Nahrávání…' : dragging ? 'Pusťte soubory pro nahrání' : label}</Typography>
            {!busy && !dragging ? (
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                    {hint}
                </Typography>
            ) : null}
            {busy ? (
                <LinearProgress
                    variant={progress === undefined ? 'indeterminate' : 'determinate'}
                    value={progress}
                    sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '0.25rem' }}
                />
            ) : null}
            <input
                ref={input}
                hidden
                type='file'
                multiple={multiple}
                // (a click on the hidden input bubbles up to the box, which would open the file picker again)
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => {
                    hand(event.target.files);
                    event.target.value = '';
                }}
            />
        </Box>
    );
};
