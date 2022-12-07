import { EmbedBuilder } from "discord.js";
import { type Playlist, type Track } from "../structs/Queue";

const PeruvianPink = 0xfc5f58;

const duration = (time: number): string => {
    const pad = (time: number): string =>
        String(time).padStart(2, "0");

    const seconds = Math.floor(time / 1000 % 60);
    const minutes = Math.floor(time / (1000 * 60) % 60);
    const hours = Math.floor(time / (1000 * 60 * 60) % 24);
    const days = Math.floor(time / (1000 * 60 * 60 * 24));

    return `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
        .replace(/^[0:]+(?=\d[\d:]{3})/, "") // Remove leading zeros
}

const template = <T extends Track | Playlist>(data: T, elapsed: T extends Track ? number : never) =>
    new EmbedBuilder()
        .setColor(PeruvianPink)
        .setAuthor(data.author ? {
            name: data.author.name,
            url: data.author.url,
            iconURL: data.author.image
        } : null)
        .setDescription(`[${data.title}](${data.url})`)
        .setImage(data.image ?? null)
        .setThumbnail(data.image ?? null)
        .setFooter(data.type === "track" ?
            { text: `${duration(elapsed)} / ${duration(data.duration)}` } :
            { text: `${data.tracks.length} tracks queued.` }
        )

export const QueuedEmbed = (data: Track | Playlist): EmbedBuilder =>
    template(data, 0)
        .setTitle("Queued")
        .setImage(null);

export const SkippedEmbed = (data: Track, elapsed: number): EmbedBuilder =>
    template(data, elapsed)
        .setTitle("Skipped")
        .setImage(null);

export const NowPlayingEmbed = (data: Track, elapsed: number): EmbedBuilder =>
    template(data, elapsed)
        .setTitle("Now Playing")
        .setThumbnail(null);
