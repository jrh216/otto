import { SlashCommandBuilder, type GuildMember } from "discord.js";
import EmbedError from "../embeds/EmbedError";
import EmbedTrack from "../embeds/EmbedTrack";
import type Command from "../structs/Command";
import Player from "../structs/Player";

const skip: Command = {
    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Skips the current track.")
        .setDMPermission(false),
    async execute(interaction) {
        if (!interaction.inGuild())
            return;

        const player = Player.connect(interaction.member as GuildMember);
        if (player) {
            const resource = player.getCurrentResource();
            if (resource) {
                player.skip(); // Skip current track

                await interaction.reply({
                    embeds: [
                        EmbedTrack(
                            resource.metadata,
                            "Skipped",
                            resource.playbackDuration
                        )
                    ]
                });

                return;
            }
        }

        await interaction.reply({
            ephemeral: true,
            embeds: [
                EmbedError("Nothing is currently playing.")
            ]
        });
    }
};

export default skip;
