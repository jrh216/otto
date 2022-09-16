import { AudioPlayerStatus } from "@discordjs/voice";
import { SlashCommandBuilder } from "discord.js";
import type Command from "../structures/Command.js";
import Player from "../structures/Player.js";
import { trackEmbed } from "../utils/embeds.js";

const pause: Command = {
    data: new SlashCommandBuilder()
        .setName("pause")
        .setDescription("Pauses the current song.")
        .setDMPermission(false),
    execute: async (interaction) => {
        if (!interaction.inGuild())
            return;

        const player = Player.connect(interaction.guildId);
        if (player) {
            if (player.getStatus() === AudioPlayerStatus.Playing) {
                const track = player.getCurrentTrack()!;
                const duration = player.getDuration()!;
                if (player.pause()) {
                    await interaction.reply({
                        embeds: [
                            trackEmbed("Paused", track, duration, "thumbnail")
                        ]
                    });
                } else {
                    await interaction.reply("Oops! I couldn't pause it.");
                }

                return;
            }
        }

        await interaction.reply({
            content: "I'm not playing anything, silly.",
            ephemeral: true
        });
    }
}

export default pause;