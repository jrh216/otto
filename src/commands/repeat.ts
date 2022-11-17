import { bold, type ChatInputCommandInteraction } from "discord.js";
import Command from "../structs/Command";
import Player from "../structs/Player";

export default class RepeatCommand extends Command {
    public constructor() {
        super((builder) =>
            builder
                .setName("repeat")
                .setDescription("Repeats the tracks in the queue.")
        );
    }

    public async execute(interaction: ChatInputCommandInteraction<"cached">): Promise<unknown> {
        const player = await Player.connect(interaction.client, interaction.guildId, interaction.member.voice.channel);
        if (!player)
            return interaction.reply({
                content: "You must be in a voice channel.",
                ephemeral: true
            });

        const repeat = player.repeat = !player.repeat;
        return interaction.reply({
            content: `Repeat is now ${bold(repeat ? "on" : "off")}.`
        });
    }
}
