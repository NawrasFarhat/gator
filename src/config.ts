import fs from "fs";
import os from "os";
import path from "path";

export type Config = {
  dbUrl: string;
  currentUserName?: string;
};

function getConfigFilePath(): string {
  return path.join(os.homedir(), ".gatorconfig.json");
}

function writeConfig(cfg: Config): void {
  const rawConfig = {
    db_url: cfg.dbUrl,
    current_user_name: cfg.currentUserName,
  };

  fs.writeFileSync(
    getConfigFilePath(),
    JSON.stringify(rawConfig, null, 2),
    "utf-8"
  );
}

function validateConfig(rawConfig: any): Config {
  if (typeof rawConfig !== "object" || rawConfig === null) {
    throw new Error("Invalid config");
  }

  if (typeof rawConfig.db_url !== "string") {
    throw new Error("Invalid config: db_url must be a string");
  }

  const config: Config = {
    dbUrl: rawConfig.db_url,
  };

  if (rawConfig.current_user_name !== undefined) {
    if (typeof rawConfig.current_user_name !== "string") {
      throw new Error("Invalid config: current_user_name must be a string");
    }

    config.currentUserName = rawConfig.current_user_name;
  }

  return config;
}

export function readConfig(): Config {
  const configPath = getConfigFilePath();

  const fileContents = fs.readFileSync(configPath, "utf-8");
  const rawConfig = JSON.parse(fileContents);

  return validateConfig(rawConfig);
}

export function setUser(username: string): void {
  const config = readConfig();

  config.currentUserName = username;

  writeConfig(config);
}
