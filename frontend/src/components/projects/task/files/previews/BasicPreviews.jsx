import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { useObjectUrl } from './useObjectUrl';

// The previews the browser can do by itself. Images are shown with <img> (an SVG can't run scripts there), a PDF in
// the browser's own viewer.

const frame = {
    border: '1px solid',
    borderColor: 'divider',
    width: '100%',
    display: 'block',
};

export const ImagePreview = ({ blob, name }) => {
    const url = useObjectUrl(blob);
    if (!url) return null;
    return (
        <Box
            sx={{
                ...frame,
                p: 1,
                // a checkerboard, so transparent parts of an image are visible
                backgroundImage: 'repeating-conic-gradient(rgba(128,128,128,0.18) 0% 25%, transparent 0% 50%)',
                backgroundSize: '16px 16px',
            }}
        >
            <Box
                component='img'
                src={url}
                alt={name}
                sx={{
                    display: 'block',
                    maxWidth: '100%',
                    maxHeight: '65vh',
                    mx: 'auto',
                }}
            />
        </Box>
    );
};

export const PdfPreview = ({ blob, name }) => {
    const url = useObjectUrl(blob, 'application/pdf');
    if (!url) return null;
    return <Box component='iframe' title={name} src={url} sx={{ ...frame, height: '70vh', backgroundColor: 'background.paper' }} />;
};

// at most this much of a text file is shown
const textLimit = 256 * 1024;

export const TextPreview = ({ blob }) => {
    const [text, setText] = useState('');
    useEffect(() => {
        blob.slice(0, textLimit)
            .text()
            .then((content) => setText(blob.size > textLimit ? `${content}\n…` : content));
    }, [blob]);
    return (
        <Box
            component='pre'
            sx={{
                ...frame,
                m: 0,
                p: 1.5,
                maxHeight: '65vh',
                overflow: 'auto',
                fontSize: '0.85rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
            }}
        >
            {text}
        </Box>
    );
};

export const VideoPreview = ({ blob }) => {
    const url = useObjectUrl(blob);
    if (!url) return null;
    return <Box component='video' src={url} controls sx={{ ...frame, maxHeight: '65vh', backgroundColor: 'black' }} />;
};

export const AudioPreview = ({ blob }) => {
    const url = useObjectUrl(blob);
    if (!url) return null;
    return <Box component='audio' src={url} controls sx={{ width: '100%' }} />;
};
