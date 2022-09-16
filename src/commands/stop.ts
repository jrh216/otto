import { AudioPlayerStatus } from "@discordjs/voice";
import { SlashCommandBuilder } from "discord.js";
import type Command from "../structures/Command.js";
import Player from "../structures/Player.js";

const stop: Command = {
    data: new SlashCommandBuilder()
        .setName("stop")
        .setDescription("Stops music playback.")
        .setDMPermission(false),
    execute: async (interaction) => {
        if (!interaction.inGuild())
            return;

        const player = Player.connect(interaction.guildId);
        if (player) {
            if (player.getStatus() !== AudioPlayerStatus.Idle) {
                if (player.stop()) {
                    await interaction.reply("I'm out of here. Bye!");
                } else {
                    await interaction.reply("Oops! I couldn't stop the music.");
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

export default stop;
