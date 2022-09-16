import { type Awaitable, type ClientEvents } from "discord.js";

export default interface Event<K extends keyof ClientEvents> {
    name: K;
    once?: boolean;
    execute: (...args: ClientEvents[K]) => Awaitable<void>;
}
