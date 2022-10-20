import { type Client, type ClientEvents } from "discord.js";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { commands, type default as Command } from "../structs/Command";
import type Event from "../structs/Event";

const register = async (dir: string, registrar: (file: string) => Promise<void>): Promise<void> => {
    const path = resolve(__dirname, dir);
    const files = await readdir(path);

    await Promise.all(
        files.map(async (file) =>
            registrar(resolve(path, file))
        )
    );
}

export const registerEvents = async (client: Client<false>): Promise<void> =>
    register("../events", async (file) => {
        const event: Event<keyof ClientEvents> = (await import(file)).default;
        event.once ?
            client.once(event.name, event.listener) :
            client.on(event.name, event.listener);
    });

export const registerCommands = async (): Promise<void> =>
    register("../commands", async (file) => {
        const command: Command = (await import(file)).default;
        commands.set(command.data.name, command);
    });
