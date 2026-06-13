import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  BRIGHT_DATA_API_KEY: z.string().optional(),
  BRIGHT_DATA_ZONE: z.string().optional(),
  BRIGHT_DATA_MCP_ENABLED: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  EMBEDDING_PROVIDER: z.string().optional(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  BRIGHT_DATA_API_KEY: process.env.BRIGHT_DATA_API_KEY,
  BRIGHT_DATA_ZONE: process.env.BRIGHT_DATA_ZONE,
  BRIGHT_DATA_MCP_ENABLED: process.env.BRIGHT_DATA_MCP_ENABLED,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  EMBEDDING_PROVIDER: process.env.EMBEDDING_PROVIDER,
});

export const hasDatabase = Boolean(env.DATABASE_URL);
export const hasBrightData = Boolean(env.BRIGHT_DATA_API_KEY && env.BRIGHT_DATA_ZONE);
