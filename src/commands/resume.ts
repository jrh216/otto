import { AudioPlayerStatus } from "@discordjs/voice";
import { SlashCommandBuilder } from "discord.js";
import type Command from "../structures/Command.js";
import Player from "../structures/Player.js";
import { trackEmbed } from "../utils/embeds.js";

const resume: Command = {
    data: new SlashCommandBuilder()
        .setName("resume")
        .setDescription("Resumes the current song.")
        .setDMPermission(false),
    execute: async (interaction) => {
        if (!interaction.inGuild())
            return;

        const player = Player.connect(interaction.guildId);
        if (player) {
            if (player.getStatus() === AudioPlayerStatus.Paused) {
                const track = player.getCurrentTrack()!;
                const duration = player.getDuration()!;
                if (player.unpause()) {
                    await interaction.reply({
                        embeds: [
                            trackEmbed("Resumed", track, duration, "thumbnail")
                        ]
                    });
                } else {
                    await interaction.reply("Oops! I couldn't resume it.");
                }

                return;
            }
        }

        await interaction.reply({
            content: "Nothing's paused, silly.",
            ephemeral: true
        });
    }
}

export default resume;
