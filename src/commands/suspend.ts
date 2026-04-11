import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
} from "discord.js";
import { PterodactylClient } from "../lib/pterodactyl";
import { COLOURS } from "../lib/embeds";

export const data = new SlashCommandBuilder()
  .setName("suspend")
  .setDescription("(Admin) Suspend or unsuspend a server")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption((o) =>
    o
      .setName("action")
      .setDescription("Suspend or unsuspend")
      .setRequired(true)
      .addChoices(
        { name: "🔒 Suspend", value: "suspend" },
        { name: "🔓 Unsuspend", value: "unsuspend" }
      )
  )
  .addIntegerOption((o) =>
    o
      .setName("server_id")
      .setDescription("The numeric internal server ID (from your panel)")
      .setRequired(true)
  )
  .addStringOption((o) =>
    o
      .setName("reason")
      .setDescription("Reason (logged in the audit message)")
      .setRequired(false)
  );

  export async function execute(
  interaction: ChatInputCommandInteraction,
  ptero: PterodactylClient
): Promise<void> {
  const action = interaction.options.getString("action", true) as
    | "suspend"
    | "unsuspend";
  const serverId = interaction.options.getInteger("server_id", true);
  const reason =
    interaction.options.getString("reason") ?? "No reason provided";

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    if (action === "suspend") {
      await ptero.suspendServer(serverId);
    } else {
      await ptero.unsuspendServer(serverId);
    }

    const isSuspend = action === "suspend";
    const embed = new EmbedBuilder()
      .setColor(isSuspend ? COLOURS.offline : COLOURS.running)
      .setTitle(isSuspend ? "🔒 Server Suspended" : "🔓 Server Unsuspended")
      .addFields(
        { name: "Server ID", value: `\`${serverId}\``, inline: true },
        { name: "Action", value: action.toUpperCase(), inline: true },
        { name: "Reason", value: reason }
      )
      .setTimestamp()
      .setFooter({ text: `Admin: ${interaction.user.tag}` });

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
