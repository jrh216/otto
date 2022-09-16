import { type Client, type ClientEvents } from "discord.js";
import { readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { commands, type default as Command } from "../structures/Command.js";
import type Event from "../structures/Event.js";
import * as logger from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const getFiles = async (dir: string): Promise<readonly [string, string[]]> => {
    const files = await readdir(dir);

    return [
        dir,
        files
    ];
}

export const registerEvents = async (client: Client<false>): Promise<void> => {
    const [dir, files] = await getFiles(resolve(__dirname, "../events"));

    await Promise.allSettled(
        files.map(async (file) => {
            const event: Event<keyof ClientEvents> = (await import(resolve(__dirname, dir, file))).default;
            event.once ?
                client.once(event.name, event.execute) :
                client.on(event.name, event.execute);
        })
    );
}

export const registerCommands = async (): Promise<void> => {
    const [dir, files] = await getFiles(resolve(__dirname, "../commands"));

    const results = await Promise.allSettled(
        files.map(async (file) => {
            const command: Command = (await import(resolve(__dirname, dir, file))).default;
            commands.set(command.data.name, command);
        })
    );

    results.forEach((result) => {
        if (result.status === "rejected")
            logger.error(result.reason);
    });
}
