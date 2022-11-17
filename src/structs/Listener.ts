import { type Awaitable, type ClientEvents } from "discord.js";

export default abstract class Listener<K extends keyof ClientEvents> {
    public readonly event: K;
    public readonly once?: boolean;

    public constructor(event: K, once?: boolean) {
        this.event = event;
        this.once = once;
    }

    public abstract run(...args: ClientEvents[K]): Awaitable<void>;
}
