import discord
import requests
import httpx

from dotenv import dotenv_values

config = dotenv_values(".env")

DISCORD_TOKEN = config["DISCORD_TOKEN"]

PVE_TOKEN_ID = config["PVE_TOKEN_ID"]
PVE_SECRET = config["PVE_SECRET"]

# services = [
#     {"name": "Proxmox", "url": "http://10.0.0.251:8006/api2/json/cluster/resources"}
# ]

headers = {
    'Authorization': f'PVEAPIToken={PVE_TOKEN_ID}={PVE_SECRET}'  # Depending on how the API expects the key
}
try:
    response = httpx.get("https://10.0.0.251:8006/api2/json/cluster/resources", headers=headers, verify=False)
    if response.status_code == 200:
        data = response.json()
        # Extract and format the relevant data
        resources = data['data']
        for resource in resources:
            print(resource)
    else:
        print("failed res",response)
except Exception as e:
    print("ERROR",e)



# GET /api2/json/cluster/resources
