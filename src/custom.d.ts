import { type Collection, type Snowflake } from "discord.js";
import type Command from "./structs/Command";
import type Player from "./structs/Player";

declare module "discord.js" {
    export interface Client {
        commands: Collection<string, Command>;
        players: Collection<Snowflake, Player>;
    }
}
