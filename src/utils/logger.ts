import { bold, green, red, yellow } from "colorette";

export const info = (...message: unknown[]) => console.log(bold(green("INFO")), ...message);
export const warn = (...message: unknown[]) => console.log(bold(yellow("INFO")), ...message);
export const error = (...message: unknown[]) => console.log(bold(red("INFO")), ...message);
