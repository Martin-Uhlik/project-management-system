import { Link } from 'react-router';
import { StyledIconButton } from './StyledIconButton';
import { ArrowRightIcon } from './icons';

// The red arrow at the top right of a preview that opens the item's own page. label: where it goes ('Přejít na stroj')
export const StyledOpenButton = ({ label, to }) => (
    <StyledIconButton label={label} component={Link} to={to} sx={{ bgcolor: 'primary.main', color: '#ffffff', p: 1, '&:hover': { bgcolor: 'primary.dark' } }}>
        <ArrowRightIcon sx={{ fontSize: '2rem' }} />
    </StyledIconButton>
);
