import { EmbedBuilder } from "discord.js";
import { ServerStatus } from "./pterodactyl";

export const COLOURS = {
  running: 0x57f287, // green
  offline: 0xed4245, // red
  starting: 0xfee75c, // yellow
  stopping: 0xeb459e, // pink
  info: 0x5865f2,    // blurple
  admin: 0xeb459e,
};

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function formatUptime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

export function statusEmoji(status: string): string {
  const map: Record<string, string> = {
    running: "🟢",
    offline: "🔴",
    starting: "🟡",
    stopping: "🟠"
  };
  return map[status] ?? "⚪";
}

export function serverStatusEmbed(
  name: string,
  status: ServerStatus,
  memLimit: number,
  diskLimit: number
): EmbedBuilder {
  const colour = 
    COLOURS[status.status as keyof typeof COLOURS] ?? COLOURS.info;

  const memPct =
    memLimit > 0
      ? `${((status.memory_bytes / memLimit) * 100).toFixed(1)}%`
      : "∞";
  const diskPct =
    diskLimit > 0
      ? `${((status.disk_bytes / diskLimit) * 100).toFixed(1)}%`
      : "∞";
  
  
  return new EmbedBuilder()
    .setTitle(`${statusEmoji(status.status)} ${name}`)
    .setColor(colour)
    .addFields(
      { name: "Status", value: status.status.toUpperCase(), inline: true },
      {
        name: "Uptime",
        value: status.uptime > 0 ? formatUptime(status.uptime) : "—",
        inline: true,
      },
      { name: "\u200b", value: "\u200b", inline: true },
      {
        name: "CPU",
        value: `${status.cpu_absolute.toFixed(2)}%`,
        inline: true,
      },
      {
        name: "Memory",
        value: `${formatBytes(status.memory_bytes)} / ${
          memLimit > 0 ? formatBytes(memLimit) : "∞"
        } (${memPct})`,
        inline: true,
      },
      {
        name: "Disk",
        value: `${formatBytes(status.disk_bytes)} / ${
          diskLimit > 0 ? formatBytes(diskLimit) : "∞"
        } (${diskPct})`,
        inline: true,
      },
      {
        name: "Network ↓",
        value: formatBytes(status.network_rx_bytes),
        inline: true,
      },
      {
        name: "Network ↑",
        value: formatBytes(status.network_tx_bytes),
        inline: true,
      }
    )
    .setTimestamp()
    .setFooter({ text: `ID: ${status.identifier}` });
}