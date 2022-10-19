import { SlashCommandBuilder } from "discord.js";
import Error from "../embeds/Error.js";
import NowPlaying from "../embeds/NowPlaying.js";
import type Command from "../structs/Command.js";
import Player from "../structs/Player.js";

const nowPlaying: Command = {
    data: new SlashCommandBuilder()
        .setName("nowplaying")
        .setDescription("Shows what's currently playing.")
        .setDMPermission(false),
    execute: async (interaction) => {
        if (!interaction.inGuild())
            return;

        const player = Player.connect(interaction.guildId);
        if (player) {
            const resource = player.getCurrentResource();
            if (resource) {
                await interaction.reply({
                    ephemeral: true,
                    embeds: [NowPlaying(resource.metadata, resource.playbackDuration, true)]
                });

                return;
            }
        }

        await interaction.reply({
            ephemeral: true,
            embeds: [Error("Bruh, I'm not playing anything. 🙄")]
        });
    }
}

export default nowPlaying;