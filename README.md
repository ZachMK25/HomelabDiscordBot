# HomelabDiscordBot

## A simple\*, self-hosted way to get updates on your Homelab while on the go!

I started this project because I wanted to monitor my Homelab services while outside of my home network without necessarily having to tunnel into my home network with a VPN or expose sensitive dashboards to the internet.

Currently supports monitoring Proxmox cluster status via a discord app command, with more functionality to come!

\* not actually that simple to setup at the moment


### Creating your bot
1. [elaborate on steps to create Discord bot later]


### Adding Proxmox to your bot

1. Create an API token on your Proxmox instance with the `PVEAuditor` privilege and the `/` scope
2. Copy the API Key name and secret to your .env file