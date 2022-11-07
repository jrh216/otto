import { AudioPlayerStatus } from "@discordjs/voice";
import { type ChatInputCommandInteraction, type GuildMember } from "discord.js";
import EmbedLogger from "../embeds/EmbedLogger";
import EmbedTrack from "../embeds/EmbedTrack";
import Command from "../structs/Command";
import Player from "../structs/Player";

export default class SkipCommand extends Command {
    public constructor() {
        super((builder) =>
            builder
                .setName("skip")
                .setDescription("Skips the current track.")
                .setDMPermission(false)
        );
    }

    public async execute(interaction: ChatInputCommandInteraction): Promise<unknown> {
        const player = Player.get(interaction.member as GuildMember, false);
        if (!player || player.getAudioStatus() === AudioPlayerStatus.Idle)
            return interaction.reply({
                embeds: [
                    EmbedLogger("Nothing is currently playing.", "error")
                ],
                ephemeral: true
            });

        const resource = player.getCurrentResource()!;

        player.skip();

        return interaction.reply({
            embeds: [
                EmbedTrack(resource.metadata, "Skipped", resource.playbackDuration)
            ]
        });
    }
}
