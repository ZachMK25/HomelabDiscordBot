// Import required modules
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const dotenv = require('dotenv');
const https = require('https');


// Load environment variables
dotenv.config();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const PVE_TOKEN_ID = process.env.PVE_TOKEN_ID;
const PVE_SECRET = process.env.PVE_SECRET;

// Initialize Discord client
// const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// client.once('ready', () => {
//     console.log('Discord bot is online!');
// });

// Function to calculate hardware statistics
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
    const powerLabels = ['', 'Ki', 'Mi', 'Gi', 'Ti'];
    let n = 0;

    while (size > power) {
        size /= power;
        n += 1;
    }

    return `${size.toFixed(2)} ${powerLabels[n]}B`;
}

// Function to get Proxmox statistics
async function getProxmox() {
    const headers = {
        'Authorization': `PVEAPIToken=${PVE_TOKEN_ID}=${PVE_SECRET}`
    };

    try {
        const response = await axios.get('https://10.0.0.251:8006/api2/json/cluster/resources', {
            headers: headers,
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        });

        if (response.status === 200) {
            const clusterResources = response.data.data;
            const nodes = clusterResources.filter(item => item.type === 'node' && item.status === 'online');

            const hardwareStats = getHardwareStats(nodes);
            
            console.log('Hardware Stats:', hardwareStats);
            console.log('CPU Usage:', (hardwareStats.cpu / hardwareStats.maxcpu * 100).toFixed(2) + '%');
            console.log('vCPUs:', hardwareStats.maxcpu);
            console.log('Max RAM:', formatBytes(hardwareStats.maxmem));
            console.log('Used Disk:', formatBytes(hardwareStats.disk));
        } else {
            console.error('Failed response:', response);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Example usage
getProxmox();
