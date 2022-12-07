import { type Awaitable, type Client, type ClientEvents } from "discord.js";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

export const registerListeners = async (client: Client): Promise<unknown> => {
    const path = resolve(__dirname, "../listeners");
    const files = await readdir(path);

    return Promise.all(
        files.map(async (file) => {
            const filepath = resolve(path, file);
            const _listener: new () => Listener<keyof ClientEvents> = (await import(filepath)).default;
            const listener = new _listener();

            listener.once ?
                client.once(listener.event, listener.run) :
                client.on(listener.event, listener.run);
        })
    );
}

export default abstract class Listener<K extends keyof ClientEvents> {
    public readonly event: K;
    public readonly once?: boolean;

    public constructor(event: K, once?: boolean) {
        this.event = event;
        this.once = once;
    }

    public abstract run(...args: ClientEvents[K]): Awaitable<void>;
}
