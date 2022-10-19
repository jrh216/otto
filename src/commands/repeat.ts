import { AudioPlayerStatus } from "@discordjs/voice";
import { bold, SlashCommandBuilder } from "discord.js";
import Error from "../embeds/Error.js";
import type Command from "../structs/Command.js";
import Player from "../structs/Player.js";

const repeat: Command = {
    data: new SlashCommandBuilder()
        .setName("repeat")
        .setDescription("Repeats the tracks in the queue.")
        .setDMPermission(false),
    execute: async (interaction) => {
        if (!interaction.inGuild())
            return;

        const player = Player.connect(interaction.guildId);
        if (player && player.getStatus() === AudioPlayerStatus.Playing) {
            const repeat = player.repeat = true;
            await interaction.reply(`Repeat is now ${bold(repeat ? "on" : "off")}.`);
            return;
        }

        await interaction.reply({
            ephemeral: true,
            embeds: [Error("Bruh, I'm not playing anything. 🙄")]
        });
    }
}

export default repeat;