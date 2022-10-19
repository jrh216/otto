import { type Awaitable, type ClientEvents } from "discord.js";

export default interface Event<K extends keyof ClientEvents> {
    name: K;
    listener: (...args: ClientEvents[K]) => Awaitable<void>;
    once?: boolean;
}
