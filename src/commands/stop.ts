import { type ChatInputCommandInteraction } from "discord.js";
import Command from "../structs/Command";
import Player from "../structs/Player";

export default class StopCommand extends Command {
    public constructor() {
        super((builder) =>
            builder
                .setName("stop")
                .setDescription("Stops audio playback.")
        );
    }

    public async execute(interaction: ChatInputCommandInteraction<"cached">): Promise<unknown> {
        const player = await Player.connect(interaction.client, interaction.guildId);
        if (!player)
            return interaction.reply({
                content: "Nothing is currently playing.",
                ephemeral: true
            });

        player.stop();

        return interaction.reply({
            content: "Stopped audio playback."
        });
    }
}
