import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";

type CommandData =
    | SlashCommandBuilder
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;

export default abstract class Command {
    public readonly data: CommandData;

    public constructor(data: (builder: SlashCommandBuilder) => CommandData) {
        this.data = data(new SlashCommandBuilder());
    }

    public abstract execute(interaction: ChatInputCommandInteraction): Promise<unknown>;
}
