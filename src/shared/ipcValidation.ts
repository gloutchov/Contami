import { z } from "zod";
import { financeCommandSchema } from "../domain/commands";
import { importTemplateTypeSchema } from "../domain/importTemplates";
import { appSettingsSchema } from "./contracts";

export const noIpcArgumentsSchema = z.tuple([]);
export const settingsUpdateIpcArgumentsSchema = z.tuple([
  appSettingsSchema.pick({ language: true, theme: true, workbookFormat: true }).partial().strict(),
]);
export const workbookCreateIpcArgumentsSchema = z.tuple([z.enum(["excel", "numbers"])]);
export const financeExecuteIpcArgumentsSchema = z.tuple([financeCommandSchema]);
export const importTemplateGenerateIpcArgumentsSchema = z.tuple([importTemplateTypeSchema, z.enum(["it", "en"])]);

