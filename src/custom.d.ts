import { type Collection, type Snowflake } from "discord.js";
import type Command from "./structs/Command";

declare module "discord.js" {
    export interface Client {
        commands: Collection<string, Command>;
        queues: Collection<Snowflake, Collection>;
    }
}
