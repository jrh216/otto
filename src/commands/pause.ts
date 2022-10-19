import { AudioPlayerStatus } from "@discordjs/voice";
import { SlashCommandBuilder } from "discord.js";
import Error from "../embeds/Error.js";
import Preview from "../embeds/Preview.js";
import type Command from "../structs/Command.js";
import Player from "../structs/Player.js";

const pause: Command = {
    data: new SlashCommandBuilder()
        .setName("pause")
        .setDescription("Pauses the current track.")
        .setDMPermission(false),
    execute: async (interaction) => {
        if (!interaction.inGuild())
            return;

        const player = Player.connect(interaction.guildId);
        if (player && player.getStatus() === AudioPlayerStatus.Playing) {
            const resource = player.getCurrentResource()!;
            if (player.pause()) {
                await interaction.reply({
                    embeds: [Preview(resource.metadata, "Paused", resource.playbackDuration)]
                });
            } else {
                await interaction.reply({
                    ephemeral: true,
                    embeds: [Error("Damn, I couldn't pause it. 😞")]
                });
            }

            return;
        }

        await interaction.reply({
            ephemeral: true,
            embeds: [Error("Bruh, I'm not playing anything. 🙄")]
        });
    }
}

export default pause;