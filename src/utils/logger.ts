import { bold, green, red, yellow } from "colorette";

export const info = (...message: any[]) => console.log(bold(green("INFO")), ...message);
export const warn = (...message: any[]) => console.warn(bold(yellow("WARN")), ...message);
export const error = (...message: any[]) => console.error(bold(red("ERROR")), ...message);
