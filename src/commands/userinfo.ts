import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
  codeBlock,
} from "discord.js";
import { PterodactylClient } from "../lib/pterodactyl";
import { COLOURS } from "../lib/embeds";
import { logger } from "../lib/logger";

export const data = new SlashCommandBuilder()
  .setName("userinfo")
  .setDescription("(Admin) Lookup a Pterodactyl userby email")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption((o) => 
    o
      .setName("email")
      .setDescription("The user's email address")
      .setRequired(true)
  );


export async function execute(
  interaction: ChatInputCommandInteraction,
  ptero: PterodactylClient
): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const email = interaction.options.getString("email", true);

  try {
    const [user, allServers] = await Promise.all([
      ptero.getUserByEmail(email),
      ptero.getAllServers(),
    ]);

    if (!user) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOURS.offline)
            .setTitle("User Not Found")
            .setDescription(`No panel user found with email \`${email}\``),
        ],
      });
      return;
    }

    const a = user.attributes;
    const servers = allServers.filter((s) => s.attributes.owner_id === a.id);
    const created = new Date(a.created_at);

    const embed = new EmbedBuilder()
      .setColor(a.root_admin ? COLOURS.admin : COLOURS.info)
      .setTitle(`${a.username} (${a.email})`)
      .addFields(
        { name: "Username", value: `\`${a.username}\``, inline: true },
        { name: "Email", value: `\`${a.email}\``, inline: true },
        { name: "Internal ID", value: `\`${a.id}\``, inline: true },
        { name: "Admin", value: a.root_admin ? "✅ Yes" : "❌ No", inline: true },
        { name: "2FA", value: a["2fa"] ? "✅ Enabled" : "❌ Disabled", inline: true },
        { name: "Servers", value: `${servers.length}`, inline: true },
        {
          name: "Server List",
          value: servers.length > 0
            ? servers.map((s) => `\`${s.attributes.identifier}\` ${s.attributes.name}`).join("\n")
            : "None",
        },
        { name: "Created", value: `<t:${Math.floor(created.getTime() / 1000)}:R>` }
      );

    await interaction.editReply({ embeds: [embed] });
    logger.bot(`[UserInfo] ${interaction.user.tag} looked up ${email}`);
  } catch (error) {
    logger.error("Error fetching user info:", error);
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOURS.offline)
          .setTitle("Error")
          .setDescription(`An error occurred while fetching user information.\n\n${codeBlock(error instanceof Error ? error.message : String(error))}`),
      ],
    });
  }
}