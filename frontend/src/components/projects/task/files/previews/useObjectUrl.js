import { useEffect, useState } from 'react';

// An object URL for the blob (optionally as another type), revoked when the blob changes or the preview closes
export const useObjectUrl = (blob, type) => {
    const [url, setUrl] = useState(null);
    useEffect(() => {
        const next = URL.createObjectURL(type ? new Blob([blob], { type }) : blob);
        // the URL must be made and revoked by the effect (StrictMode runs it twice), so it is stored from here
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUrl(next);
        return () => URL.revokeObjectURL(next);
    }, [blob, type]);
    return url;
};
