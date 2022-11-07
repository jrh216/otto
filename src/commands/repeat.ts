import { bold, type ChatInputCommandInteraction, type GuildMember } from "discord.js";
import EmbedLogger from "../embeds/EmbedLogger";
import Command from "../structs/Command";
import Player from "../structs/Player";

export default class RepeatCommand extends Command {
    public constructor() {
        super((builder) =>
            builder
                .setName("repeat")
                .setDescription("Repeats all tracks in the queue.")
                .setDMPermission(false)
        );
    }

    public async execute(interaction: ChatInputCommandInteraction): Promise<unknown> {
        const player = Player.get(interaction.member as GuildMember);
        if (!player)
            return interaction.reply({
                embeds: [
                    EmbedLogger("You need to be in a voice channel.", "error")
                ],
                ephemeral: true
            });

        const repeat = player.repeat = !player.repeat;
        return interaction.reply({
            embeds: [
                EmbedLogger(
                    `Repeat is now ${bold(repeat ? "on" : "off")}.`,
                    "info"
                )
            ]
        });
    }
}
