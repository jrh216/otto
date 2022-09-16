import { GuildMember, SlashCommandBuilder } from "discord.js";
import type Command from "../structures/Command.js";
import Player from "../structures/Player.js";
import { playlistEmbed, trackEmbed } from "../utils/embeds.js";

const play: Command = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Plays a song.")
        .setDMPermission(false)
        .addStringOption(option =>
            option
                .setName("query")
                .setDescription("A url or query.")
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
            const track = await player.play(query, interaction.channel);
            if (track) {
                await interaction.editReply({
                    embeds: [
                        track.type === "playlist" ?
                            playlistEmbed("Queued", track) :
                            trackEmbed("Queued", track, 0, "thumbnail")
                    ]
                });
            } else {
                await interaction.editReply({
                    content: "Oops! No results found for that query."
                });
            }
        } else {
            await interaction.reply({
                content: "You're not in a voice channel, silly.",
                ephemeral: true
            });
        }
    }
}

export default play;
