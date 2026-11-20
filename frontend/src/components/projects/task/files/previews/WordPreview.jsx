import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { renderAsync } from 'docx-preview';
import { PreviewMessage } from '../PreviewMessage';

// A .docx rendered as pages (docx-preview), on white like paper also in the dark look
export const WordPreview = ({ blob }) => {
    const body = useRef(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        const container = body.current;
        container.innerHTML = '';
        renderAsync(blob, container, undefined, {
            inWrapper: true,
            ignoreLastRenderedPageBreak: true,
            breakPages: true,
        }).catch(() => setFailed(true));
        return () => {
            container.innerHTML = '';
        };
    }, [blob]);

    return (
        <>
            {failed ? <PreviewMessage>Dokument se nepodařilo zobrazit.</PreviewMessage> : null}
            <Box
                ref={body}
                sx={{
                    display: failed ? 'none' : 'block',
                    border: '1px solid',
                    borderColor: 'divider',
                    maxHeight: '70vh',
                    overflow: 'auto',
                    color: '#000',
                    // the grey around the pages and the pages' shadow come from docx-preview
                    '& .docx-wrapper': {
                        padding: '1rem',
                        background: 'var(--page-background)',
                    },
                    '& .docx-wrapper > section.docx': {
                        boxShadow: 'var(--shadow-small)',
                        marginBottom: '1rem',
                    },
                }}
            />
        </>
    );
};
