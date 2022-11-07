import { EmbedBuilder } from "discord.js";

const EmbedLogger = (message: string, level: "info" | "warn" | "error") =>
    new EmbedBuilder()
        .setColor(0xfc5f58)
        .setTitle(
            level === "info" ? "Hmm. Here's some info." :
                level === "warn" ? "You should read this..." :
                    level === "error" ? "Uh-oh! There's been a problem." :
                        "You really messed up, bucko!"
        )
        .setDescription(message)
        .setTimestamp();

export default EmbedLogger;
