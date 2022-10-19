import express from "express";
import * as logger from "./utils/logger";

const PORT = process.env.PORT || 3000;

export const runServer = () => {
    const app = express();

    app.get("/", (_, res) => {
        res.send("Otto!");
    });

    app.listen(PORT, () =>
        logger.info(`Express server listening on port ${PORT}...`)
    );
}
