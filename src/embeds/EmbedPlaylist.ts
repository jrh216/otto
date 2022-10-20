import { EmbedBuilder } from "discord.js";
import { type Playlist } from "../structs/Track";

const EmbedPlaylist = (playlist: Playlist, title: string) =>
    new EmbedBuilder()
        .setColor(0xfc5f58)
        .setAuthor(playlist.author ? {
            url: playlist.author.url,
            name: playlist.author.name,
            iconURL: playlist.author.image
        } : null)
        .setTitle(title)
        .setDescription(`[${playlist.title}](${playlist.url})`)
        .setThumbnail(playlist.image ?? null)
        .setFooter({
            text: `${playlist.tracks.length} tracks queued.`
        });

export default EmbedPlaylist;
