import { AudioPlayerStatus } from "@discordjs/voice";
import { SlashCommandBuilder } from "discord.js";
import Error from "../embeds/Error.js";
import Preview from "../embeds/Preview.js";
import type Command from "../structs/Command.js";
import Player from "../structs/Player.js";

const resume: Command = {
    data: new SlashCommandBuilder()
        .setName("resume")
        .setDescription("Resumes the current track.")
        .setDMPermission(false),
    execute: async (interaction) => {
        if (!interaction.inGuild())
            return;

        const player = Player.connect(interaction.guildId);
        if (player && player.getStatus() === AudioPlayerStatus.Paused) {
            const resource = player.getCurrentResource()!;
            if (player.unpause()) {
                await interaction.reply({
                    embeds: [Preview(resource.metadata, "Resumed", resource.playbackDuration)]
                });
            } else {
                await interaction.reply({
                    ephemeral: true,
                    embeds: [Error("Damn, I couldn't resume it. 😞")]
                });
            }

            return;
        }


        await interaction.reply({
            ephemeral: true,
            embeds: [Error("Bruh, nothing's paused. 🙄")]
        });
    }
}

export default resume;