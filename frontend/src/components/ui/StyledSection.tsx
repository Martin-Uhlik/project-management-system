import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

// A box of a statistics page: a heading, an optional quiet line under it, then its content (charts, tables). It is as
// tall as its content, so several stack in a scrolling page.
export const StyledSection = ({ title, caption, actions, children }: { title: ReactNode; caption?: ReactNode; actions?: ReactNode; children?: ReactNode }) => (
    <div className='content-box' style={{ height: 'auto', flexBasis: 'auto', flexGrow: 0 }}>
        <div className='content-box_content' style={{ overflow: 'visible' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h2 style={{ margin: 0 }}>{title}</h2>
                    {caption ? (
                        <Typography variant='body2' sx={{ color: 'text.secondary', mt: 0.5 }}>
                            {caption}
                        </Typography>
                    ) : null}
                </div>
                {actions}
            </div>
            {children}
        </div>
    </div>
);
