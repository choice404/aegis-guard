import { AegisConfig } from "./types";

const GLOBAL_KEY = "__next_aegis_config__";

export const initAegis = (config: AegisConfig) => {
  (globalThis as unknown as Record<string, AegisConfig>)[GLOBAL_KEY] = config;
};

export const getAegisConfig = (): AegisConfig => {
  const config = (globalThis as unknown as Record<string, AegisConfig | undefined>)[GLOBAL_KEY];
  if (!config) {
    throw new Error(
      "Aegis not initialized. Call initAegis() in your setup file.",
    );
  }
  return config;
};
