// One place to set up dayjs for the whole app: the plugins it uses and Czech date formats
import dayjs from 'dayjs';
import 'dayjs/locale/cs';
import isoWeek from 'dayjs/plugin/isoWeek';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import minMax from 'dayjs/plugin/minMax';
import updateLocale from 'dayjs/plugin/updateLocale';
import utc from 'dayjs/plugin/utc';

dayjs.extend(isoWeek);
dayjs.extend(localizedFormat);
dayjs.extend(minMax);
dayjs.extend(utc);
dayjs.extend(updateLocale);

// after a day the month is in the genitive ('2. listopadu 2026'), on its own in the nominative ('listopad 2026'); the
// Czech locale of dayjs only has the nominative
const monthNames = 'leden_únor_březen_duben_květen_červen_červenec_srpen_září_říjen_listopad_prosinec'.split('_');
const monthNamesAfterDay = 'ledna_února_března_dubna_května_června_července_srpna_září_října_listopadu_prosince'.split('_');
const months = (date: dayjs.Dayjs, format: string) => (/D\.?\s+MMMM/.test(format) ? monthNamesAfterDay : monthNames)[date.month()];
// dayjs calls a function given as the months with the date and the format (its types only know the list)
dayjs.updateLocale('cs', { months: months as unknown as string[] });
dayjs.locale('cs');

export default dayjs;
