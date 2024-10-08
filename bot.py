import discord
import requests
import httpx
import functools

from dotenv import dotenv_values

config = dotenv_values(".env")

DISCORD_TOKEN = config["DISCORD_TOKEN"]

PVE_TOKEN_ID = config["PVE_TOKEN_ID"]
PVE_SECRET = config["PVE_SECRET"]

# services = [
#     {"name": "Proxmox", "url": "http://10.0.0.251:8006/api2/json/cluster/resources"}
# ]

def getHardwareStats(nodes):
    
    maxCPU = 0
    maxRAM = 0
    maxDisk = 0
    for node in nodes:
        maxCPU += node["maxcpu"]
        maxRAM += node["maxmem"]
        maxDisk += node["maxdisk"]
    
    usedCPU = 0
    usedRAM = 0
    usedDisk = 0
    for node in nodes:
        usedCPU += node["cpu"]
        usedRAM += node["mem"]
        usedDisk += node["disk"]
    
    return ({
        "maxcpu":maxCPU,
        "cpu":usedCPU,
        "maxmem":maxRAM,
        "mem":usedRAM,
        "maxdisk":maxDisk,
        "disk":usedDisk
    })
    
# adapted from https://stackoverflow.com/questions/12523586/python-format-size-application-converting-b-to-kb-mb-gb-tb
def format_bytes(size):
    # 2**10 = 1024
    power = 1024
    n = 0
    power_labels = {0 : '', 1: 'Ki', 2: 'Mi', 3: 'Gi', 4: 'Ti'}
    while size > power:
        size /= power
        n += 1
    return size, power_labels[n]+'B'

def getProxmox():

    headers = {
        'Authorization': f'PVEAPIToken={PVE_TOKEN_ID}={PVE_SECRET}'
    }

    # params = {
    #     "type":["node"]
    # }
    
    try:
        response = httpx.get("https://10.0.0.251:8006/api2/json/cluster/resources", headers=headers, verify=False)
        if response.status_code == 200:
                                    
            data = response.json()
                    
            clusterResources = data['data']
                    
            nodes = list(filter(lambda item: item["type"] == "node" and item["status"] == "online", clusterResources))
                            
            hardwareStats = getHardwareStats(nodes)
            
            # print(hardwareStats)
            # print("CPU USAGE:", format((hardwareStats['cpu']), ".2%"))
            # print("vCPUs",hardwareStats["maxcpu"])
            # print("MaxRAM", format_bytes(hardwareStats["maxmem"]))
            # print("usedDisk", format_bytes(hardwareStats["disk"]))
        else:
            print("failed res",response)
    except Exception as e:
        print("ERROR",e)
