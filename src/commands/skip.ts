import { AudioPlayerStatus } from "@discordjs/voice";
import { type ChatInputCommandInteraction } from "discord.js";
import Command from "../structs/Command";
import Player from "../structs/Player";
import { TrackEmbed } from "../utils/embed";

export default class SkipCommand extends Command {
    public constructor() {
        super((builder) =>
            builder
                .setName("skip")
                .setDescription("Skips the current track.")
        );
    }

    public async execute(interaction: ChatInputCommandInteraction<"cached">): Promise<unknown> {
        const player = await Player.connect(interaction.client, interaction.guildId);
        if (!player || player.getAudioStatus() === AudioPlayerStatus.Idle)
            return interaction.reply({
                content: "Nothing is currently playing.",
                ephemeral: true
            });

        const resource = player.getCurrentResource()!;

        player.skip();

        return interaction.reply({
            embeds: [
                TrackEmbed(resource.metadata, "Skipped", resource.playbackDuration)
            ]
        });
    }
}
