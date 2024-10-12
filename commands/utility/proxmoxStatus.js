const { get } = require('axios');
const { config } = require('dotenv');
const { Agent } = require('https');
const { SlashCommandBuilder } = require('discord.js');

config();

const PVE_TOKEN_ID = process.env.PVE_TOKEN_ID;
const PVE_SECRET = process.env.PVE_SECRET;
const PVE_URL = process.env.PVE_URL;


// Function to get Proxmox statistics
async function getProxmox() {
    const headers = {
        'Authorization': `PVEAPIToken=${PVE_TOKEN_ID}=${PVE_SECRET}`
    };

    try {
        const response = await get(`https://${PVE_URL}/api2/json/cluster/resources`, {
            headers: headers,
            httpsAgent: new Agent({ rejectUnauthorized: false })
        });

        if (response.status === 200) {
            const clusterResources = response.data.data;
            const nodes = clusterResources.filter(item => item.type === 'node');
        
            const status = nodes.array.forEach(node => {
                if (node.status === "online"){
                    return node.name + ": online";
                }
                else{
                    return "!!!!!!!!!" + node.name + ": OFFLINE!!!!!!!!!";
                }
            });
            
            return "\n==========================================" + status + "\n==========================================";


        } else {
            console.error('Failed response:', response);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('proxmox')
		.setDescription('Replies with the status of the target Proxmox cluster!'),
	async execute(interaction) {
        const status = await getProxmox();
		await interaction.reply(status);
	},
};