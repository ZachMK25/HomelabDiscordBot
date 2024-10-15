const { get } = require('axios');
const { config } = require('dotenv');
const { Agent } = require('https');
const { SlashCommandBuilder } = require('discord.js');

config();

const PVE_TOKEN_ID = process.env.PVE_TOKEN_ID;
const PVE_SECRET = process.env.PVE_SECRET;
const PVE_URL = process.env.PVE_URL;

function getHardwareStats(nodes) {
    
    let maxCPU = 0, maxRAM = 0, maxDisk = 0;
    let usedCPU = 0, usedRAM = 0, usedDisk = 0;

    nodes.forEach(node => {
        maxCPU += node.maxcpu;
        maxRAM += node.maxmem;
        maxDisk += node.maxdisk;
        usedCPU += node.cpu;
        usedRAM += node.mem;
        usedDisk += node.disk;
    });

    return {
        maxcpu: maxCPU,
        cpu: usedCPU,
        maxmem: maxRAM,
        mem: usedRAM,
        maxdisk: maxDisk,
        disk: usedDisk
    };
}

// Function to format bytes
function formatBytes(size) {
    const power = 1024;
    // Note: prefer Kibibytes over Kilobytes, etc. to match terms used within Proxmox
    const powerLabels = ['', 'Ki', 'Mi', 'Gi', 'Ti'];
    let n = 0;

    while (size > power) {
        size /= power;
        n += 1;
    }

    return `${size.toFixed(2)} ${powerLabels[n]}B`;
}

// Function to get Proxmox statistics
async function getProxmoxStats() {
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
            const nodes = clusterResources.filter(item => item.type === 'node' && item.status === 'online');

            const hardwareStats = getHardwareStats(nodes);

            let stats = "==========================================";
            
            stats += 'Hardware Stats:', hardwareStats + "\n";
            stats += 'CPU Usage:', (hardwareStats.cpu / hardwareStats.maxcpu * 100).toFixed(2) + '%' + '\n';
            stats += 'vCPUs:', hardwareStats.maxcpu + '\n';
            stats += 'Max RAM:', formatBytes(hardwareStats.maxmem) + '\n';
            stats += 'Used Disk:', formatBytes(hardwareStats.disk) + '\n';

            stats += "==========================================";
            
            return stats;

        } else {
            console.error('Failed response:', response);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('proxmoxstats')
		.setDescription('Replies with the status of the target Proxmox cluster!'),
	async execute(interaction) {
        const status = await getProxmoxStats();
		await interaction.reply(status);
	},
};