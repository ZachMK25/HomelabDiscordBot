const { get } = require('axios');
const { config } = require('dotenv');
const { Agent } = require('https');
const { SlashCommandBuilder } = require('discord.js');

config();

const PVE_TOKEN_ID = process.env.PVE_TOKEN_ID;
const PVE_SECRET = process.env.PVE_SECRET;
const PVE_URL = process.env.PVE_URL;

// Function to get Proxmox status
function getProxmox() {
    const headers = {
        'Authorization': `PVEAPIToken=${PVE_TOKEN_ID}=${PVE_SECRET}`
    };

    const out = get(`https://${PVE_URL}/api2/json/cluster/resources`, {
        headers: headers,
        httpsAgent: new Agent({ rejectUnauthorized: false })
    }).then((response) => {
        if (response.status === 200) {

            const clusterResources = response.data.data;

            const nodes = clusterResources.filter((item) => item.type == 'node');

            console.log("NODES",nodes);

            const status = nodes.reduce((acc, node) => {

                if (node.status == "online") {
                    acc += node.node + ": online\n";
                }
                else {
                    acc += "!!!!!!!!!" + node.node + ": OFFLINE!!!!!!!!!\n";
                }
                return acc;

            }, "");

            console.log("STATUS", status);

            return "==========================================\n" + status + "==========================================";
        }
        else {
            console.error('Failed response:', response);
            return "Proxmox instance returned code " + response.status;
        }
    }).catch((error) => {
        console.error('Error:', error);
        return "Error Connecting to Proxmox Cluster";
    })

    return out;
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