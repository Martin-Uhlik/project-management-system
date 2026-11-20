import dayjs from '../../dayjs';

// Times in the chat: today only the time, this week the day, earlier the date
export const listTime = (date) => {
    const time = dayjs(date);
    const now = dayjs();
    if (time.isSame(now, 'day')) return time.format('H:mm');
    if (time.isAfter(now.subtract(6, 'day').startOf('day'))) return time.format('dd');
    if (time.isSame(now, 'year')) return time.format('D. M.');
    return time.format('D. M. YYYY');
};

// The line between days in a conversation
export const dayLabel = (date) => {
    const day = dayjs(date);
    const today = dayjs();
    if (day.isSame(today, 'day')) return 'Dnes';
    if (day.isSame(today.subtract(1, 'day'), 'day')) return 'Včera';
    return day.format(day.isSame(today, 'year') ? 'dddd D. MMMM' : 'dddd D. MMMM YYYY');
};

export const messageTime = (date) => dayjs(date).format('D. M. YYYY H:mm');

export const fullName = (user) => (user ? `${user.FirstName} ${user.LastName}` : 'Smazaný uživatel');
