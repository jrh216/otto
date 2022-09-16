import { bold, SlashCommandBuilder } from "discord.js";
import type Command from "../structures/Command.js";
import Player from "../structures/Player.js";

const skip: Command = {
    data: new SlashCommandBuilder()
        .setName("repeat")
        .setDescription("Repeats the queue.")
        .setDMPermission(false),
    execute: async (interaction) => {
        if (!interaction.inGuild())
            return;

        const player = Player.connect(interaction.guildId);
        if (player) {
            player.repeat = !player.repeat; // Toggle repeat
            await interaction.reply(`Repeat is now ${bold(player.repeat ? "on" : "off")}.`);
        } else {
            await interaction.reply({
                content: "Yeah, I can't do that...",
                ephemeral: true
            });
        }
    }
}

export default skip;
