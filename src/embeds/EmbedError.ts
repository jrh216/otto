import { EmbedBuilder } from "discord.js";

const EmbedError = (message: string) =>
    new EmbedBuilder()
        .setColor(0xfc5f58)
        .setTitle("Uh-oh! There's been a problem.")
        .setDescription(message)
        .setTimestamp();

export default EmbedError;
