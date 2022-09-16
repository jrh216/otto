import { AudioPlayerStatus } from "@discordjs/voice";
import { SlashCommandBuilder } from "discord.js";
import type Command from "../structures/Command.js";
import Player from "../structures/Player.js";
import { trackEmbed } from "../utils/embeds.js";

const nowPlaying: Command = {
    data: new SlashCommandBuilder()
        .setName("nowplaying")
        .setDescription("Shows what song is currently playing.")
        .setDMPermission(false),
    execute: async (interaction) => {
        if (!interaction.inGuild())
            return;

        const player = Player.connect(interaction.guildId);
        if (player) {
            if (player.getStatus() === AudioPlayerStatus.Playing) {
                const track = player.getCurrentTrack()!;
                const duration = player.getDuration()!;

                await interaction.reply({
                    embeds: [
                        trackEmbed("Now Playing", track, duration, "thumbnail")
                    ],
                    ephemeral: true
                });

                return;
            }
        }

        await interaction.reply({
            content: "I'm not playing anything, silly.",
            ephemeral: true
        });
    }
}

export default nowPlaying;
