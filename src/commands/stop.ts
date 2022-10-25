import { SlashCommandBuilder, type GuildMember } from "discord.js";
import EmbedError from "../embeds/EmbedError";
import type Command from "../structs/Command";
import Player from "../structs/Player";

const stop: Command = {
    data: new SlashCommandBuilder()
        .setName("stop")
        .setDescription("Stops audio playback.")
        .setDMPermission(false),
    async execute(interaction) {
        if (!interaction.inGuild())
            return;

        const player = Player.connect(interaction.member as GuildMember);
        if (player) {
            player.stop(); // Stop audio playback
            await interaction.reply("Bye! :)");
        } else {
            await interaction.reply({
                ephemeral: true,
                embeds: [
                    EmbedError("Nothing is currently playing.")
                ]
            });
        }
    }
};

export default stop;
