// One place to set up dayjs for the whole app: the plugins it uses and Czech date formats
import dayjs from 'dayjs';
import 'dayjs/locale/cs';
import isoWeek from 'dayjs/plugin/isoWeek';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import minMax from 'dayjs/plugin/minMax';
import utc from 'dayjs/plugin/utc';

dayjs.extend(isoWeek);
dayjs.extend(localizedFormat);
dayjs.extend(minMax);
dayjs.extend(utc);
dayjs.locale('cs');

export default dayjs;
