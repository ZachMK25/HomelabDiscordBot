const { get } = require('axios');
const { Agent } = require('https');

// Function to get Proxmox status
async function pollProxmox() {

    const PVE_TOKEN_ID = process.env.PVE_TOKEN_ID;
    const PVE_SECRET = process.env.PVE_SECRET;
    const PVE_URL = process.env.PVE_URL;

    const headers = {
        'Authorization': `PVEAPIToken=${PVE_TOKEN_ID}=${PVE_SECRET}`
    };

    const out = get(`https://${PVE_URL}/api2/json/cluster/resources`, {
        headers: headers,
        // Reject unauthorized cert since proxmox instance does not provide one on its management interface by default
        httpsAgent: new Agent({ rejectUnauthorized: false })
    }).then((response) => {
        if (response.status === 200) {

            const clusterResources = response.data.data;

            const nodes = clusterResources.filter((item) => item.type == 'node');

            const statuses = nodes.reduce((map, node) => {
                map.set(node.node, node.status);
                return map;
            }, new Map());

            return statuses;
        }
        else {
            console.error('Failed response:', response);
            return {"error": `Proxmox instance returned code ${response.status}`};
        }
    }).catch((error) => {
        console.error('Error:', error);
        return {"error": `Error Occurred When Retrieving Proxmox API Data:\n${error}`};
    });

    return out;
}

exports.pollProxmox = pollProxmox;