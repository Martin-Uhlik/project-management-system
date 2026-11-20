// A length of time in minutes as hours and minutes, e.g. 135 -> '2 h 15 min', 0 -> '0 h'
export const formatMinutes = (minutes) => {
    const total = Math.round(Math.abs(minutes ?? 0));
    const hours = Math.floor(total / 60);
    const rest = total % 60;
    const sign = minutes < 0 && total > 0 ? '−' : '';
    if (hours && rest) return `${sign}${hours} h ${rest} min`;
    if (rest) return `${sign}${rest} min`;
    return `${sign}${hours} h`;
};
