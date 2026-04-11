import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  EmbedBuilder,
  codeBlock,
} from "discord.js";
import { PterodactylClient } from "../lib/pterodactyl";
import { COLOURS, serverStatusEmbed } from "../lib/embeds";
import { logger } from "../lib/logger";
import axios from "axios";

export const data = new SlashCommandBuilder()
  .setName("status")
  .setDescription("View a server's resource usage and status")
  .addStringOption((o) =>
    o
      .setName("server")
      .setDescription("Server identifier (short ID)")
      .setRequired(true)
      .setAutocomplete(true)
  );

export async function autocomplete(
  interaction: AutocompleteInteraction,
  ptero: PterodactylClient
): Promise<void> {
  const focused = interaction.options.getFocused().toLowerCase();
  const servers = await ptero.getAllServers();

  const choices = servers
    .map((s) => ({
      name: `${s.attributes.identifier} | ${s.attributes.name}`,
      value: s.attributes.identifier,
    }))
    .filter((c) => c.name.toLowerCase().includes(focused))
    .slice(0, 25); // * Discord allows max 25 choices

  await interaction.respond(choices);
}

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
    const internalId = server?.attributes.id;

    const embed = serverStatusEmbed(name, resources, 0, 0, internalId);
    await interaction.editReply({ embeds: [embed] });
    logger.info(`[Status] Reply sent for ${serverId}`);
  } catch (err: unknown) {
    ////logger.error(`[Status] Error:`, err);

    const isAxiosError = axios.isAxiosError(err);

    if (isAxiosError && err.response?.status === 409) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOURS.offline)
            .setTitle("🔒 Server Suspended")
            .setDescription(`Server \`${serverId}\` is currently suspended and cannot be queried.`)
            .setTimestamp()
        ],
      });
      return;
    }

    const msg = err instanceof Error ? err.message : String(err);
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOURS.offline)
          .setTitle("Error")
          .setDescription(`${codeBlock(msg)}`),
      ],
    });
  }
}