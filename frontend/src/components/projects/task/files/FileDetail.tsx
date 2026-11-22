import { lazy, Suspense, useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import axios from 'axios';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { notificationsAtom } from '../../../../state/atoms';
import { getAuthHeader } from '../../../../Auth';
import { handleAxiosError } from '../../../../errorHandler';
import dayjs from '../../../../dayjs';
import { PreviewMessage } from './PreviewMessage';
import { CloseIcon, DownloadIcon, StyledButton, fileType, formatBytes } from '../../../ui';
import type { ReactNode } from 'react';
import type { FileEntry } from '../../../../types';

// the viewers load only when a file of their kind is opened (Word, Excel and 3D bring their own libraries)
const viewers = {
    image: lazy(() =>
        import('./previews/BasicPreviews').then((module) => ({
            default: module.ImagePreview,
        })),
    ),
    pdf: lazy(() =>
        import('./previews/BasicPreviews').then((module) => ({
            default: module.PdfPreview,
        })),
    ),
    text: lazy(() =>
        import('./previews/BasicPreviews').then((module) => ({
            default: module.TextPreview,
        })),
    ),
    csv: lazy(() =>
        import('./previews/SheetPreview').then((module) => ({
            default: module.CsvPreview,
        })),
    ),
    video: lazy(() =>
        import('./previews/BasicPreviews').then((module) => ({
            default: module.VideoPreview,
        })),
    ),
    audio: lazy(() =>
        import('./previews/BasicPreviews').then((module) => ({
            default: module.AudioPreview,
        })),
    ),
    word: lazy(() =>
        import('./previews/WordPreview').then((module) => ({
            default: module.WordPreview,
        })),
    ),
    excel: lazy(() =>
        import('./previews/SheetPreview').then((module) => ({
            default: module.ExcelPreview,
        })),
    ),
    model: lazy(() =>
        import('./previews/ModelPreview').then((module) => ({
            default: module.ModelPreview,
        })),
    ),
};

// bigger files are not downloaded just to preview them
const previewLimit = 100 * 1024 * 1024;

const saveBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
};

const Fact = ({ label, children }: { label: ReactNode; children?: ReactNode }) => (
    <>
        <Typography component='dt' variant='body2' sx={{ color: 'text.secondary' }}>
            {label}
        </Typography>
        <Typography component='dd' variant='body2' sx={{ m: 0, fontWeight: 500, overflowWrap: 'anywhere' }}>
            {children}
        </Typography>
    </>
);

// The panel next to a task's file list: what the file is, who uploaded it and when, a download button and a preview.
// address: the file's download address; file: the row from the list
export const FileDetail = ({ file, address, onClose }: { file: FileEntry; address: string; onClose: () => void }) => {
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const [blob, setBlob] = useState<Blob | null>(null);
    const [failed, setFailed] = useState(false);
    const type = fileType(file.file);
    const Icon = type.icon;
    const Viewer = type.preview ? viewers[type.preview] : null;
    const tooBig = file.Bytes > previewLimit;

    useEffect(() => {
        // (the panel is keyed by the file, so each file starts with empty state)
        if (!Viewer || tooBig) return undefined;
        const controller = new AbortController();
        axios
            .get(address, {
                ...getAuthHeader(),
                responseType: 'blob',
                signal: controller.signal,
            })
            .then((response) => setBlob(response.data))
            .catch((error) => {
                if (axios.isCancel(error)) return;
                setFailed(true);
            });
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [address]);

    const handleDownload = () => {
        if (blob) {
            saveBlob(blob, file.file);
            return;
        }
        axios
            .get(address, { ...getAuthHeader(), responseType: 'blob' })
            .then((response) => saveBlob(response.data, file.file))
            .catch((error) => handleAxiosError(error, [notifications, setNotifications]));
    };

    let preview;
    if (!Viewer) {
        preview = <PreviewMessage>Tento typ souboru nelze v prohlížeči zobrazit. Stáhněte si ho.</PreviewMessage>;
    } else if (tooBig) {
        preview = <PreviewMessage>Soubor je na náhled příliš velký ({formatBytes(file.Bytes)}). Stáhněte si ho.</PreviewMessage>;
    } else if (failed) {
        preview = <PreviewMessage>Soubor se nepodařilo načíst.</PreviewMessage>;
    } else if (!blob) {
        preview = <LinearProgress aria-label='Načítání náhledu' />;
    } else {
        preview = (
            <Suspense fallback={<LinearProgress aria-label='Načítání náhledu' />}>
                <Viewer blob={blob} name={file.file} />
            </Suspense>
        );
    }

    return (
        <Box component='aside' aria-label={`Soubor ${file.file}`} sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Icon sx={{ fontSize: '2.25rem', color: 'text.secondary', mt: 0.25 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        component='h2'
                        sx={{
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            lineHeight: 1.3,
                            overflowWrap: 'anywhere',
                        }}
                    >
                        {file.file}
                    </Typography>
                    <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                        {type.label}
                    </Typography>
                </Box>
                <Tooltip title='Zavřít'>
                    <IconButton aria-label='Zavřít detail souboru' onClick={onClose} size='small'>
                        <CloseIcon fontSize='small' />
                    </IconButton>
                </Tooltip>
            </Box>
            <Box
                component='dl'
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'max-content 1fr',
                    columnGap: 2,
                    rowGap: 0.75,
                    m: 0,
                }}
            >
                <Fact label='Velikost'>{file.Bytes !== undefined ? formatBytes(file.Bytes) : `${file.size} MB`}</Fact>
                <Fact label='Nahráno'>{dayjs(file.details).format('LLL')}</Fact>
                <Fact label='Nahrál(a)'>{file.UploadedBy ? `${file.UploadedBy.FirstName} ${file.UploadedBy.LastName}` : 'neznámo'}</Fact>
            </Box>
            <StyledButton onClick={handleDownload} startIcon={<DownloadIcon />} sx={{ alignSelf: 'flex-start' }}>
                Stáhnout
            </StyledButton>
            <Box sx={{ minWidth: 0 }}>{preview}</Box>
        </Box>
    );
};
