import { type AudioResource } from "@discordjs/voice";
import { SlashCommandBuilder, type ChatInputCommandInteraction, type GuildMember } from "discord.js";
import Error from "../embeds/Error";
import NowPlaying from "../embeds/NowPlaying";
import Preview from "../embeds/Preview";
import type Command from "../structs/Command";
import Player from "../structs/Player";
import { getTrackOrPlaylist, type Track } from "../structs/Track";

const announce = (interaction: ChatInputCommandInteraction, resource: AudioResource<Track>): void => {
    interaction.channel?.send({
        embeds: [NowPlaying(resource.metadata, resource.playbackDuration)]
    })
}

const play: Command = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Plays a song or video.")
        .setDMPermission(false)
        .addStringOption(option =>
            option
                .setName("query")
                .setDescription("A title or url.")
                .setRequired(true)
        ),
    execute: async (interaction) => {
        if (!interaction.inGuild())
            return;

        const channel = (interaction.member as GuildMember).voice.channel;
        const player = Player.connect(interaction.guildId, channel);
        if (player) {
            await interaction.deferReply();

            const query = interaction.options.getString("query", true);
            const track = await getTrackOrPlaylist(query);

            if (track) {
                // Add announce function
                track.type === "track" ?
                    track.announce = (resource) => announce(interaction, resource) :
                    track.tracks.forEach(track => track.announce = (resource) => announce(interaction, resource));

                player.play(track); // Add track or playlist to queue

                await interaction.editReply({
                    embeds: [Preview(track, "Queued")]
                });
            } else {
                await interaction.editReply({
                    embeds: [Error("Failed to find a result for that query.")]
                });
            }
        } else {
            interaction.reply({
                ephemeral: true,
                embeds: [Error("You're not in a voice channel, silly.")]
            });
        }
    }
};

export default play;
