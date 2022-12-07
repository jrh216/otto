import { AudioPlayerStatus } from "@discordjs/voice";
import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import Command from "../structs/Command";
import Queue from "../structs/Queue";
import { SkippedEmbed } from "../utils/embeds";

export default class SkipCommand extends Command {
    constructor() {
        super(
            new SlashCommandBuilder()
                .setName("skip")
                .setDescription("Skips the current track.")
                .setDMPermission(false)
        )
    }

    public async execute(interaction: ChatInputCommandInteraction<"cached" | "raw">): Promise<unknown> {
        const queue = Queue.get(interaction.client, interaction.guildId);
        if (!queue || queue.getStatus() === AudioPlayerStatus.Idle)
            return interaction.reply({
                content: "Oops! Nothing's currently playing.",
                ephemeral: true
            });

        const track = queue.getCurrentTrack()!;

        if (queue.stop())
            return interaction.reply({
                embeds: [
                    SkippedEmbed(track.metadata, track.playbackDuration)
                ]
            });

        return interaction.reply({
            content: "Oops! Something really bad happened...",
            ephemeral: true
        });
    }
}
