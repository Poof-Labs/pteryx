import "dotenv/config";
import { REST, Routes } from "discord.js";

import * as power from "./commands/power";
import * as status from "./commands/status";
import * as console_ from "./commands/console";
import * as suspend from "./commands/suspend";
import { logger } from "./lib/logger";

const commands = [power, status, console_, suspend].map((c) =>
  c.data.toJSON()
);

const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

(async () => {
  try {
    logger.deploy("Registering slash commands...");

    const clientId = process.env.DISCORD_CLIENT_ID!;
    const guildId = process.env.DISCORD_GUILD_ID; // optional: guild-scoped = instant

    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands,
      });
      logger.deploy(`Commands registered to guild ${guildId}`);
    } else {
      await rest.put(Routes.applicationCommands(clientId), {
        body: commands,
      });
      logger.deploy("Commands registered globally (may take up to 1hr)");
    }
  } catch (err) {
    logger.error("Failed:", err);
  }
})();
