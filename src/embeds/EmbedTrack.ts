import dayjs from "dayjs";
import duration, { type DurationUnitType } from "dayjs/plugin/duration.js";
import { EmbedBuilder } from "discord.js";
import { type Track } from "../structs/Track";

export const formatDuration = (time: number, unit: DurationUnitType = "seconds"): string => {
    dayjs.extend(duration); // Use `duration` plugin

    return dayjs.duration(time, unit)
        .format("D:HH:mm:ss")
        .replace(/^[0:]+(?=\d[\d:]{3})/, "") // Remove leading zeros
}

const EmbedTrack = (track: Track, title: string, duration: number = 0) =>
    new EmbedBuilder()
        .setColor(0xfc5f58)
        .setAuthor({
            url: track.author.url,
            name: track.author.name,
            iconURL: track.author.image
        })
        .setTitle(title)
        .setDescription(`[${track.title}](${track.url})`)
        .setThumbnail(track.image ?? null)
        .setFooter({
            text: `${formatDuration(duration, "milliseconds")} / ${formatDuration(track.duration)}`
        });

export default EmbedTrack;
