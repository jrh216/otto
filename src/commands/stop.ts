import { AudioPlayerStatus } from "@discordjs/voice";
import { SlashCommandBuilder } from "discord.js";
import Error from "../embeds/Error.js";
import type Command from "../structs/Command.js";
import Player from "../structs/Player.js";

const stop: Command = {
    data: new SlashCommandBuilder()
        .setName("stop")
        .setDescription("Stops audio playback.")
        .setDMPermission(false),
    execute: async (interaction) => {
        if (!interaction.inGuild())
            return;

        const player = Player.connect(interaction.guildId);
        if (player && player.getStatus() !== AudioPlayerStatus.Idle) {
            if (player.stop()) {
                await interaction.reply("I'm out of here. Bye!");
            } else {
                await interaction.reply({
                    ephemeral: true,
                    embeds: [Error("Damn, I couldn't stop it. 😞")]
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

export default stop;