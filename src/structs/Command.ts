import { SlashCommandBuilder, type ChatInputCommandInteraction, type RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";

export default abstract class Command {
    public readonly data: RESTPostAPIChatInputApplicationCommandsJSONBody;

    public constructor(data: (builder: SlashCommandBuilder) => SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">) {
        this.data = data(
            new SlashCommandBuilder()
                .setDMPermission(false)
        ).toJSON();
    }

    public abstract execute(interaction: ChatInputCommandInteraction<"cached">): Promise<unknown>;
}
