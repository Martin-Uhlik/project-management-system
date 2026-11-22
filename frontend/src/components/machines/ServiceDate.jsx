import Box from '@mui/material/Box';
import dayjs from '../../dayjs';

// How a planned service stands: 'overdue' (its date has passed), 'soon' (within two weeks) or 'planned'
export const serviceState = (service) => {
    if (!service || service.Done) return null;
    const date = dayjs(service.Date);
    if (date.isBefore(dayjs(), 'day')) return 'overdue';
    if (date.isBefore(dayjs().add(14, 'day'), 'day')) return 'soon';
    return 'planned';
};

const colors = { overdue: 'error.main', soon: 'warning.main' };

// The date of a machine's service ('–' without one); a planned one red once overdue, orange when it's due within two
// weeks. long: the date written out ("13. prosinec 2026")
export const ServiceDate = ({ service, long = false }) => {
    if (!service) return '–';
    const state = serviceState(service);
    const date = dayjs(service.Date);
    return (
        <Box component='span' sx={{ color: colors[state], fontWeight: colors[state] ? 600 : undefined, whiteSpace: 'nowrap' }}>
            {long ? date.format('LL') : date.format('L')}
            {state === 'overdue' ? ' (po termínu)' : null}
        </Box>
    );
};
