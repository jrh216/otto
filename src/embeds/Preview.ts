import { EmbedBuilder } from "discord.js";
import { type Playlist, type Track } from "../structs/Track";
import { formatDuration } from "../utils/duration";

const Preview = (track: Track | Playlist, title: string, duration: number = 0) =>
    new EmbedBuilder()
        .setColor(0xfc5f58)
        .setAuthor(track.author ? {
            url: track.author.url,
            name: track.author.name,
            iconURL: track.author.image ?? undefined
        } : null)
        .setTitle(title)
        .setDescription(`[${track.title}](${track.url})`)
        .setThumbnail(track.image ?? null)
        .setFooter({
            text: track.type === "track" ?
                track.duration === "live" ?
                    "🔴 Live" :
                    `${formatDuration(duration, "milliseconds")} / ${track.duration}` :
                `${track.tracks.length} tracks queued.`
        });

export default Preview;
