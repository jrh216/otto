import { EmbedBuilder } from "discord.js";
import { type Track } from "../structs/Track";

const formatDuration = (time: number): string => {
    const pad = (time: number): string =>
        String(time).padStart(2, "0");

    const seconds = Math.floor(time / 1000 % 60);
    const minutes = Math.floor(time / (1000 * 60) % 60);
    const hours = Math.floor(time / (1000 * 60 * 60) % 24);
    const days = Math.floor(time / (1000 * 60 * 60 * 24));

    return `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
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
        .setFooter({ text: `${formatDuration(duration)} / ${formatDuration(track.duration)}` });

export default EmbedTrack;
