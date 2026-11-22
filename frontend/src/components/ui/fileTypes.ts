import type { AppIcon } from './icons';
import { CubeIcon, FileExcelIcon, FileIcon, FilePdfIcon, FileTextIcon, FileVideoIcon, FileWordIcon, ImageIcon } from './icons';

// What kind of file a name is (by its extension), how the app can preview it, and its icon.
// preview: the viewer in FilePreview, or null when the browser can't show the file (it can still be downloaded)
export type PreviewKind = 'image' | 'pdf' | 'word' | 'excel' | 'csv' | 'text' | 'video' | 'audio' | 'model';

export interface FileKind {
    kind: string;
    label: string;
    icon: AppIcon;
    preview: PreviewKind | null;
    ext?: string[];
}

const kinds: FileKind[] = [
    {
        kind: 'image',
        label: 'Obrázek',
        icon: ImageIcon,
        preview: 'image',
        ext: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif'],
    },
    {
        kind: 'pdf',
        label: 'PDF dokument',
        icon: FilePdfIcon,
        preview: 'pdf',
        ext: ['pdf'],
    },
    {
        kind: 'word',
        label: 'Dokument Word',
        icon: FileWordIcon,
        preview: 'word',
        ext: ['docx'],
    },
    {
        kind: 'word-old',
        label: 'Dokument Word (starý formát)',
        icon: FileWordIcon,
        preview: null,
        ext: ['doc', 'odt', 'rtf'],
    },
    {
        kind: 'excel',
        label: 'Tabulka Excel',
        icon: FileExcelIcon,
        preview: 'excel',
        ext: ['xlsx'],
    },
    {
        kind: 'excel-old',
        label: 'Tabulka (starý formát)',
        icon: FileExcelIcon,
        preview: null,
        ext: ['xls', 'ods'],
    },
    {
        kind: 'csv',
        label: 'Tabulka CSV',
        icon: FileExcelIcon,
        preview: 'csv',
        ext: ['csv'],
    },
    {
        kind: 'text',
        label: 'Text',
        icon: FileTextIcon,
        preview: 'text',
        ext: ['txt', 'md', 'json', 'xml', 'log', 'ini', 'yaml', 'yml', 'nc', 'gcode', 'tap'],
    },
    {
        kind: 'video',
        label: 'Video',
        icon: FileVideoIcon,
        preview: 'video',
        ext: ['mp4', 'webm', 'mov', 'm4v'],
    },
    {
        kind: 'audio',
        label: 'Zvuk',
        icon: FileVideoIcon,
        preview: 'audio',
        ext: ['mp3', 'wav', 'ogg', 'm4a'],
    },
    {
        kind: 'model',
        label: '3D model',
        icon: CubeIcon,
        preview: 'model',
        ext: ['stl', 'obj', 'glb', 'gltf'],
    },
    {
        kind: 'cad',
        label: '3D model (CAD)',
        icon: CubeIcon,
        preview: 'model',
        ext: ['step', 'stp', 'iges', 'igs', 'brep'],
    },
    {
        kind: 'inventor',
        label: 'Inventor (náhled není možný – exportujte do STEP)',
        icon: CubeIcon,
        preview: null,
        ext: ['ipt', 'iam', 'idw', 'ipn'],
    },
];

export const fileExtension = (name: string) => {
    const dot = name.lastIndexOf('.');
    return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
};

export const fileType = (name: string): FileKind => {
    const extension = fileExtension(name);
    const found = kinds.find((kind) => kind.ext?.includes(extension));
    return (
        found ?? {
            kind: 'other',
            label: extension ? `Soubor ${extension.toUpperCase()}` : 'Soubor',
            icon: FileIcon,
            preview: null,
        }
    );
};

// A size in bytes for people: '512 B', '12,3 kB', '4,1 MB'
export const formatBytes = (bytes: number | null | undefined) => {
    if (bytes === undefined || bytes === null) return '';
    const units = ['B', 'kB', 'MB', 'GB'];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit += 1;
    }
    const digits = unit === 0 || value >= 100 ? 0 : 1;
    return `${value.toLocaleString('cs-CZ', { maximumFractionDigits: digits, minimumFractionDigits: digits })} ${units[unit]}`;
};
