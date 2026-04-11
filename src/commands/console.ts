import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  EmbedBuilder,
} from "discord.js";
import { PterodactylClient } from "../lib/pterodactyl";
import { COLOURS } from "../lib/embeds";

export const data = new SlashCommandBuilder()
  .setName("console")
  .setDescription("Send a console command to a server")
  .addStringOption((o) => 
  o 
    .setName("server")
    .setDescription("Server identifier (short ID)")
    .setRequired(true)
    .setAutocomplete(true)
  )
  .addStringOption((o) =>
    o
      .setName("command")
      .setDescription("The command to send")
      .setRequired(true)
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
  const serverId = interaction.options.getString("server", true);
  const command = interaction.options.getString("command", true);

  await interaction.deferReply();

  try {
    await ptero.sendCommand(serverId, command);

    const embed = new EmbedBuilder()
      .setColor(COLOURS.info)
      .setTitle("Command sent")
      .addFields(
        { name: "Server", value: `\`${serverId}\``, inline: true },
        { name: "Command", value: `\`${command}\``, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: `Sent by ${interaction.user.tag}` });
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
