import { type Client, type ClientEvents } from "discord.js";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import type Command from "../structs/Command";
import type Listener from "../structs/Listener";

const register = async (dir: string, registrar: (file: string) => Promise<unknown>): Promise<unknown> => {
    const path = resolve(__dirname, dir);
    const files = await readdir(path);

    return Promise.all(
        files.map((file) => registrar(resolve(path, file)))
    );
}

export const registerListeners = async (client: Client<false>): Promise<unknown> =>
    register("../listeners", async (file) => {
        const _listener: new () => Listener<keyof ClientEvents> = (await import(file)).default;
        const listener = new _listener();
        listener.once ?
            client.once(listener.event, listener.run) :
            client.on(listener.event, listener.run);
    });

export const registerCommands = async (client: Client<false>): Promise<unknown> =>
    register("../commands", async (file) => {
        const _command: new () => Command = (await import(file)).default;
        const command = new _command();
        client.commands.set(command.data.name, command);
    });
