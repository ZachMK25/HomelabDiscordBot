const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { config } = require('dotenv');
const { pollProxmox } = require('./monitoring/proxmoxCluster.js');

config();
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DEBUG_LOGGING = process.env.DEBUG_LOGGING === "true" || process.env.DEBUG_LOGGING === "True";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

// Log in to Discord with your client's token
client.login(DISCORD_TOKEN);

async function monitorProxmox(){
	const statuses = await pollProxmox();

	if (statuses.error){
		console.log(statuses.error);
		return;
	}

	const log_all = process.env.ALERT_ALL_NODE_STATUSES === "true" || process.env.ALERT_ALL_NODE_STATUSES === "True";
	const channel = client.channels.cache.find(channel => channel.name === 'general');

	let message = "";

	if (log_all) {
		for (const [node, status] of statuses){
			message += node + ": " + status + "\n";
		}

		if (DEBUG_LOGGING){
			console.log("STATUSES:" , statuses);
			console.log("Does message exist? " + (!(!message)));
		}

		if (message){
			channel.send(message);
		}
		
	}
	else{
		for (const [node, status] of statuses){
			if (status === "offline"){
				message += node + ": " + status + "\n";
			}
		}

		if (DEBUG_LOGGING){
			console.log("STATUSES:" , statuses);
			console.log("Does message exist? " + (!(!message)));
		}

		if (message){
			channel.send(message);
		}
		
	}
}

const proxmoxPollInterval = process.env.PROXMOX_POLL_INTERVAL || 300000;

setInterval(monitorProxmox, proxmoxPollInterval);