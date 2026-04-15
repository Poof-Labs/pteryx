import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  Collection,
  ChatInputCommandInteraction,
  Interaction,
  AutocompleteInteraction,
  ActivityType,
} from "discord.js";
import { logger } from "./lib/logger";
import { PterodactylClient } from "./lib/pterodactyl";

import * as status from "./commands/status";
import * as power from "./commands/power";
import * as console_ from "./commands/console";
import * as suspend from "./commands/suspend";
import * as userinfo from "./commands/userinfo";
import * as info from "./commands/info";
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
  autocomplete?: (i: AutocompleteInteraction, p: PterodactylClient) => Promise<void>;
}

const commands = new Collection<string, Command>();
for (const cmd of [power, status, console_, suspend, userinfo, info]) {
  commands.set(cmd.data.name, cmd as Command);
  logger.startup(`Registered command: /${cmd.data.name}`);
}
// - EVENT HANDLERS -
discord.once("clientReady", async (c) => {
  logger.bot(`Logged in as ${c.user.tag}`);

  const updatePresence = async () => {
    const servers = await ptero.getAllServers();
    // logger.bot(`Fetched ${servers.length} servers from Pterodactyl API.`);

    c.user.setPresence({
      activities: [{
        name: `Watching ${servers.length} servers`,
        type: ActivityType.Custom
      }],
      status: "idle",
    });
  }

  await updatePresence();
  setInterval(updatePresence, 60_000);

  // * Start node status live embed
  logger.nodestatus("Starting node status loop...");
  await startNodeStatusLoop(
    discord,
    ptero,
    process.env.NODE_STATUS_CHANNEL_ID!,
    process.env.NODE_STATUS_MESSAGE_ID ?? null
  );
});

discord.on("interactionCreate", async (interaction: Interaction) => {

  if (interaction.isAutocomplete()) {
    const command = commands.get(interaction.commandName);
    if (!command) return;
    try {
      await (command as any).autocomplete?.(interaction, ptero);
    } catch (err) {
      logger.error(`[Autocomplete:${interaction.commandName}] Error:`, err);
    }
    return;
  }

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