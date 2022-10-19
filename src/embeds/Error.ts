import { EmbedBuilder } from "discord.js";

const Error = (message: string) =>
    new EmbedBuilder()
        .setColor(0xfc5f58)
        .setTitle("Whoops! You encountered and error.")
        .setDescription(message);

export default Error;
