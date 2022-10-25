import { type AudioResource } from "@discordjs/voice";
import { SlashCommandBuilder, type ChatInputCommandInteraction, type GuildMember } from "discord.js";
import EmbedError from "../embeds/EmbedError";
import EmbedPlaylist from "../embeds/EmbedPlaylist";
import EmbedTrack from "../embeds/EmbedTrack";
import type Command from "../structs/Command";
import Player from "../structs/Player";
import { type Track } from "../structs/Track";
import search from "../utils/youtube";

const announce = async (resource: AudioResource<Track>, interaction: ChatInputCommandInteraction): Promise<void> => {
    const track = resource.metadata;
    await interaction.followUp({
        embeds: [
            EmbedTrack(track, "Now Playing", resource.playbackDuration)
                .setThumbnail(null)
                .setImage(track.image ?? null)
        ]
    });
}

const play: Command = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Plays a song or video.")
        .setDMPermission(false)
        .addStringOption(option =>
            option
                .setName("query")
                .setDescription("a query or url.")
                .setRequired(true)
        ),
    async execute(interaction) {
        if (!interaction.inGuild())
            return;

        const player = Player.connect(interaction.member as GuildMember);
        if (player) {
            await interaction.deferReply();

            const query = interaction.options.getString("query", true);
            const media = await search(query); // A track or playlist
            if (!media) {
                await interaction.editReply({
                    embeds: [
                        EmbedError("There are no results for that query.")
                    ]
                });

                return;
            }

            media.type === "track" ?
                media.announce = (resource) => announce(resource, interaction) :
                media.tracks.forEach(track =>
                    track.announce = (resource) => announce(resource, interaction)
                );

            player.play(media); // Queue the track or playlist

            await interaction.editReply({
                embeds: [
                    media.type === "track" ?
                        EmbedTrack(media, "Queued") :
                        EmbedPlaylist(media, "Queued")
                ]
            });
        } else {
            await interaction.reply({
                ephemeral: true,
                embeds: [
                    EmbedError("You must be in a voice channel.")
                ]
            });
        }
    }
};

export default play;
