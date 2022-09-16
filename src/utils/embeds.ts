import { EmbedBuilder } from "discord.js";
import { type Playlist, type Track } from "../structures/Track.js";
import { trackDuration } from "./duration.js";

const color = 0xfc5f58;

export const trackEmbed = (title: string, track: Track, duration: number, imageType: "full" | "thumbnail"): EmbedBuilder =>
    new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setAuthor(track.artist ? {
            url: track.artist.url,
            name: track.artist.name,
            iconURL: track.artist.image
        } : null)
        .setDescription(`[${track.title}](${track.url})`)
        .setThumbnail(imageType === "thumbnail" ? (track.image ?? null) : null)
        .setImage(imageType === "full" ? (track.image ?? null) : null)
        .setFooter({
            text: track.duration ?
                `${trackDuration(duration, "seconds")} / ${trackDuration(track.duration, "seconds")}` :
                "🔴 Live"
        });

export const playlistEmbed = (title: string, playlist: Playlist): EmbedBuilder =>
    new EmbedBuilder()
        .setColor(0xfc5f58)
        .setTitle(title)
        .setAuthor(playlist.owner ? {
            url: playlist.owner.url,
            name: playlist.owner.name,
            iconURL: playlist.owner.image
        } : null)
        .setDescription(`[${playlist.name}](${playlist.url})`)
        .setThumbnail(playlist.image ?? null)
        .setFooter({
            text: `${playlist.tracks.length} tracks queued.`
        });
