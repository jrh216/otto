import { AudioPlayerStatus } from "@discordjs/voice";
import { type ChatInputCommandInteraction, type GuildMember } from "discord.js";
import EmbedLogger from "../embeds/EmbedLogger";
import Command from "../structs/Command";
import Player from "../structs/Player";

export default class StopCommand extends Command {
    public constructor() {
        super((builder) =>
            builder
                .setName("stop")
                .setDescription("Stops audio playback.")
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

        player.stop();

        return interaction.reply({
            embeds: [
                EmbedLogger("Stopped audio playback and left the voice channel.", "info")
            ]
        });
    }
}
