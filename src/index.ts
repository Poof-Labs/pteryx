import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  Collection,
  ChatInputCommandInteraction,
  Interaction,
} from "discord.js";
import { logger } from "./lib/logger";
import { PterodactylClient } from "./lib/pterodactyl";

import * as status from "./commands/status";
import * as power from "./commands/power";
import * as console_ from "./commands/console";
import * as suspend from "./commands/suspend";
import { startNodeStatusLoop } from "./lib/nodeStatus";

// - ENV VALIDATION -
const required = [
  "DISCORD_TOKEN",
  "PANEL_URL",
  "PTERODACTYL_CLIENT_KEY",
  "PTERODACTYL_APP_KEY",
  "NODE_STATUS_CHANNEL_ID",
];

for (const key of required) {
  if (!process.env[key]) {
    logger.startup(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

// - CLIENTS -
const discord = new Client({ intents: [GatewayIntentBits.Guilds] });

const ptero = new PterodactylClient(
  process.env.PANEL_URL!,
  process.env.PTERODACTYL_CLIENT_KEY!,
  process.env.PTERODACTYL_APP_KEY!
)

// - COMMAND REGISTRY -
type Command = {
  data: { name: string; toJSON(): object };
  execute: (i: ChatInputCommandInteraction, p: PterodactylClient) => Promise<void>;
}

const commands = new Collection<string, Command>();
for (const cmd of [power, status, console_, suspend]) {
  commands.set(cmd.data.name, cmd as Command);
}
// - EVENT HANDLERS -
discord.once("clientReady", async (c) => {
  logger.bot(`Logged in as ${c.user.tag}`);

  // Start node status live embed
  logger.nodestatus("Starting node status loop...");
  await startNodeStatusLoop(
    discord,
    ptero,
    process.env.NODE_STATUS_CHANNEL_ID!,
    process.env.NODE_STATUS_MESSAGE_ID ?? null
  );
});

discord.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  logger.bot(`[Command] Received: /${interaction.commandName}`);

  const command = commands.get(interaction.commandName);
  if (!command) {
    logger.warn(`No command found for ${interaction.commandName}`);
    logger.debug(`Registered commands:`, [...commands.keys()])
    return;
  }

  try {
    await command.execute(interaction, ptero);
  } catch (err) {
    logger.error(`[Command:${interaction.commandName}] Error:`, err);
    const msg = { content: "An error occurred while executing this command." };
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(msg);
    } else {
      await interaction.reply(msg);
    }
  }
});

discord.login(process.env.DISCORD_TOKEN);