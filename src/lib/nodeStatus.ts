import {
  Client,
  TextChannel,
  EmbedBuilder,
  Message,
} from "discord.js";
import { PterodactylClient, Node } from "./pterodactyl";
import { COLOURS, formatBytes } from "./embeds";
import { logger } from "./logger";

function buildNodeEmbed(nodes: Node[], servers: { node: number; count: number }[]): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle("🖥️ Node Status Overview")
    .setColor(COLOURS.info)
    .setTimestamp()
    .setFooter({ text: "Auto-updates every 60s" });

  if (nodes.length === 0) {
    embed.setDescription("No nodes found.");
    return embed;
  }

  for (const node of nodes) {
    const a = node.attributes;
    const memUsed = a.allocated_resources.memory;
    const memTotal = a.memory;
    const diskUsed = a.allocated_resources.disk;
    const diskTotal = a.disk;
    const memPct = memTotal > 0 ? ((memUsed / memTotal) * 100).toFixed(1) : "?";
    const diskPct = diskTotal > 0 ? ((diskUsed / diskTotal) * 100).toFixed(1) : "?";

    const serverEntry = servers.find((s) => s.node === a.id);
    const serverCount = serverEntry?.count ?? 0;

    const statusIcon = a.maintenance_mode ? "🔧" : "🟢";

    embed.addFields({
      name: `${statusIcon} ${a.name}`,
      value: [
        `**FQDN:** \`${a.fqdn}\``,
        `**Maintenance:** ${a.maintenance_mode ? "Yes ⚠️" : "No"}`,
        `**Memory:** ${formatBytes(memUsed * 1024 * 1024)} / ${formatBytes(memTotal * 1024 * 1024)} (${memPct}%)`,
        `**Disk:** ${formatBytes(diskUsed * 1024 * 1024)} / ${formatBytes(diskTotal * 1024 * 1024)} (${diskPct}%)`,
        `**Servers:** ${serverCount}`,
      ].join("\n"),
      inline: false,
    });
  }

  return embed;
}

export async function startNodeStatusLoop(
  client: Client,
  ptero: PterodactylClient,
  channelId: string,
  messageId: string | null
): Promise<void> {
  const channel = await client.channels.fetch(channelId);
  if (!channel || !(channel instanceof TextChannel)) {
    console.error("[NodeStatus] Channel not found or not a text channel.");
    return;
  }

  let liveMessage: Message | null = null;

  // Try to fetch an existing message to edit
  if (messageId) {
    try {
      liveMessage = await channel.messages.fetch(messageId);
    } catch {
      console.log("[NodeStatus] No existing message found, will create one.");
    }
  }

  const update = async () => {
    try {
      const [nodes, allServers] = await Promise.all([
        ptero.getNodes(),
        ptero.getAllServers(),
      ]);

      // Count servers per node (by allocation matching)
      const serverCounts: { node: number; count: number }[] = [];

      for (const node of nodes) {
        const count = allServers.filter((s) => s.attributes.allocation === node.attributes.id).length;
        serverCounts.push({ node: node.attributes.id, count });
      }

      const embed = buildNodeEmbed(nodes, serverCounts);

      if (liveMessage) {
        await liveMessage.edit({ embeds: [embed] });
      } else {
        liveMessage = await channel.send({ embeds: [embed] });
        logger.nodestatus(`Created live message: ${liveMessage.id}`);
        logger.nodestatus(`Set NODE_STATUS_MESSAGE_ID=${liveMessage.id} in your .env to persist across restarts.`);
      }
    } catch (err) {
      logger.error("NodeStatus Update failed:", err);
    }
  };

  // Run immediately then every 60s
  await update();
  setInterval(update, 60_000);
}
