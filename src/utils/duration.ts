import dayjs from "dayjs";
import duration, { type DurationUnitType } from "dayjs/plugin/duration.js";

dayjs.extend(duration);

export const trackDuration = (time: number, unit: DurationUnitType): string =>
    dayjs.duration(time, unit)
        .format("D:HH:mm:ss")
        .replace(/^[0:]+(?=\d[\d:]{3})/, "") // Remove leading zeros

export default dayjs.duration;
