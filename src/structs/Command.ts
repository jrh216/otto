import { SlashCommandBuilder, type ChatInputCommandInteraction, type Client, type RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

export const registerCommands = async (client: Client): Promise<unknown> => {
    const path = resolve(__dirname, "../commands");
    const files = await readdir(path);

    return Promise.all(
        files.map(async (file) => {
            const filepath = resolve(path, file);
            const _command: new () => Command = (await import(filepath)).default;
            const command = new _command();

            client.commands.set(command.data.name, command);
        })
    );
}

export default abstract class Command {
    public readonly data: RESTPostAPIChatInputApplicationCommandsJSONBody;

    public constructor(builder: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">) {
        this.data = builder.toJSON();
    }

    public abstract execute(interaction: ChatInputCommandInteraction<"cached" | "raw">): Promise<unknown>;
}
