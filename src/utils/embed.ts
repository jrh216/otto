import { EmbedBuilder } from "discord.js";
import { Playlist, type Track } from "../structs/Track";

const COLOR = 0xfc5f58;

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

export const TrackEmbed = (track: Track, message: string, duration: number = 0): EmbedBuilder =>
    new EmbedBuilder()
        .setColor(COLOR)
        .setAuthor(track.author ? {
            url: track.author.url ?? undefined,
            name: track.author.name,
            iconURL: track.author.image
        } : null)
        .setTitle(message)
        .setDescription(`[${track.title}](${track.url})`)
        .setThumbnail(track.image ?? null)
        .setFooter({
            text: `${formatDuration(duration)} / ${formatDuration(track.duration)}`
        });

export const PlaylistEmbed = (playlist: Playlist, message: string) =>
    new EmbedBuilder()
        .setColor(COLOR)
        .setAuthor(playlist.author ? {
            url: playlist.author.url ?? undefined,
            name: playlist.author.name,
            iconURL: playlist.author.image
        } : null)
        .setTitle(message)
        .setDescription(`[${playlist.title}](${playlist.url})`)
        .setThumbnail(playlist.image ?? null)
        .setFooter({
            text: `${playlist.tracks.length} tracks queued.`
        });
