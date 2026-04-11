import { 
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { PterodactylClient } from "../lib/pterodactyl";
import { COLOURS } from "../lib/embeds";

export const data = new SlashCommandBuilder()
  .setName("power")
  .setDescription("Control a server's power state")
  .addStringOption((o) =>
    o
      .setName("server")
      .setDescription("Server identifier (short ID)")
      .setRequired(true)
  )
  .addStringOption((o) =>
    o
      .setName("action")
      .setDescription("Power action to perform")
      .setRequired(true)
      .addChoices(
        { name: "▶ Start", value: "start" },
        { name: "⏹ Stop", value: "stop" },
        { name: "🔄 Restart", value: "restart" },
        { name: "💀 Kill", value: "kill" }
      )
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  ptero: PterodactylClient
): Promise<void> {
  const serverId = interaction.options.getString("server", true);
  const action = interaction.options.getString("action", true) as
    | "start"
    | "stop"
    | "restart"
    | "kill";

  await interaction.deferReply();

  try {
    await ptero.powerAction(serverId, action);

    const actionLabels: Record<string, string> = {
      start: "▶ Start signal sent",
      stop: "⏹ Stop signal sent",
      restart: "🔄 Restart signal sent",
      kill: "💀 Kill signal sent",
    };

    const embed = new EmbedBuilder()
      .setColor(COLOURS.info)
      .setTitle(actionLabels[action])
      .setDescription(`Server \`${serverId}\` has received the ${action} signal.`)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (err: unknown) {
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