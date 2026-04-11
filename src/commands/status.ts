import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { PterodactylClient } from "../lib/pterodactyl";
import { COLOURS, serverStatusEmbed } from "../lib/embeds";
import { logger } from "../lib/logger";

export const data = new SlashCommandBuilder()
  .setName("status")
  .setDescription("View a server's resource usage and status")
  .addStringOption((o) =>
    o
      .setName("server")
      .setDescription("Server identifier (short ID)")
      .setRequired(true)
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  ptero: PterodactylClient
): Promise<void> {
  await interaction.deferReply();
  const serverId = interaction.options.getString("server", true);
  logger.debug(`[Status] Fetching status for: ${serverId}`);

  try {
    const [resources, servers] = await Promise.all([
      ptero.getServerResources(serverId),
      ptero.getAllServers(),
    ]);
    logger.debug(`[Status] Resources: ${JSON.stringify(resources)}`);
    logger.debug(`[Status] Servers count: ${servers.length}`);

    const server = servers.find((s) => s.attributes.identifier === serverId);
    const name = server?.attributes.name ?? serverId;

    const embed = serverStatusEmbed(name, resources, 0, 0);
    await interaction.editReply({ embeds: [embed] });
    logger.info(`[Status] Reply sent for ${serverId}`);
  } catch (err: unknown) {
    logger.error(`[Status] Error:`, err);
    const msg = err instanceof Error ? err.message : String(err);
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOURS.offline)
          .setTitle("Error")
          .setDescription(`\`\`\`${msg}\`\`\``),
      ],
    });
  }
}