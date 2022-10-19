import { EmbedBuilder } from "discord.js";
import { type Track } from "../structs/Track";
import { formatDuration } from "../utils/duration";

const NowPlaying = (track: Track, duration?: number, thumbnail?: boolean) =>
    new EmbedBuilder()
        .setColor(0xfc5f58)
        .setAuthor(track.author ? {
            url: track.author.url,
            name: track.author.name,
            iconURL: track.author.image ?? undefined
        } : null)
        .setTitle("Now Playing")
        .setDescription(`[${track.title}](${track.url})`)
        .setThumbnail(thumbnail ? (track.image ?? null) : null)
        .setImage(!thumbnail ? (track.image ?? null) : null)
        .setFooter({
            text: track.duration === "live" ?
                "🔴 Live" :
                `${formatDuration(duration ?? 0, "milliseconds")} / ${track.duration}`
        });

export default NowPlaying;
