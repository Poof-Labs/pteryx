import { 
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  AttachmentBuilder
} from "discord.js";
import { COLOURS, formatUptime } from "../lib/embeds";
import { PterodactylClient } from "../lib/pterodactyl";
import { logger } from "../lib/logger";

const file = new AttachmentBuilder("src/assets/Logo.webp", { name: "logo.webp" });

export const data = new SlashCommandBuilder()
  .setName("info")
  .setDescription("Get info about the bot");

export async function execute(
  interaction: ChatInputCommandInteraction,
  ptero: PterodactylClient
): Promise<void> {
  try {
    const embed = new EmbedBuilder()
      .setColor(COLOURS.info)
      .setTitle("Pteryx - Manage Pterodactyl servers from Discord")
      .setDescription("A Discord bot for managing Pterodactyl servers")
      .setThumbnail('attachment://logo.webp')
      .addFields(
        { name: "Version", value: `${process.env.npm_package_version}`, inline: true },
        { name: "Author", value: "[Alex Seymour](https://github.com/discowd-nitwo)", inline: true },
        { name: "GitHub", value: "[pteryx](https://github.com/poof-labs/pteryx)", inline: true },
        { name: "Server Count", value: `${await ptero.getAllServers().then(servers => servers.length)}`, inline: true },
        { name: "Node Count", value: `${await ptero.getNodes().then(nodes => nodes.length)}`, inline: true },
        { name: "Uptime", value: `${formatUptime(process.uptime() * 1000)}`, inline: true },
      )
      .setFooter({ text: "Pteryx - Made with ❤️ by Alex Seymour" })
      .setTimestamp();
    await interaction.reply({ embeds: [embed], files: [file] });
  } catch (err) {
    logger.error("Failed to execute /info command:", err);
    // await interaction.reply({ content: "An error occurred whilst fetching bot info, please contact an administrator." });
    await interaction.reply({ embeds: [
      new EmbedBuilder()
        .setColor(COLOURS.offline)
        .setTitle("Error")
        .setDescription("An error occurred whilst fetching bot info, please contact an administrator.")
    ] })
  }
};