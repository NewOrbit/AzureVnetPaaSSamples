import * as azure from "@pulumi/azure-native";
import * as pulumi from "@pulumi/pulumi";

const location = "northeurope";
const tags = {
    "Environment": "Experiment",
    "Scale": "Normal"
};

// NOTE: Never do this!!
const administratorLogin = "fltest";
const administratorLoginPassword = "not!verySecret"; // Upgrade pulumi and replace with RandomPassword

// Create an Azure Resource Group
const resourceGroup = new azure.resources.ResourceGroup("fl-vnettest", {
    location,
    resourceGroupName: "fl-vnettest",
    tags: {
        "Owner": "flytzen"
    }
})

// NOTE: This network has way too many subnets, don't do it like this. It is only to be able to test various settings
const vnet = new azure.network.VirtualNetwork("fl-vnettest-vn", {
    resourceGroupName: resourceGroup.name,
    virtualNetworkName: "fl-vnettest-vn",
    addressSpace: { addressPrefixes: ["10.0.0.0/16"] },
    tags,
    location
});

const frontEndSubnet = new azure.network.Subnet("front-end", {
    subnetName: "front-end",
    addressPrefix: "10.0.1.0/24",
    virtualNetworkName: vnet.name,
    resourceGroupName: resourceGroup.name,
    delegations: [
        {
            serviceName: "Microsoft.Web/serverfarms",
            name: "front-end-delegation"
        }
    ],
    serviceEndpoints: [{ service: "Microsoft.Web"}] // Allow access to a web app from *this* subnet *without* private endpoints. To allow web apps to talk to each other (if possible)
});

const backendVmSubnet = new azure.network.Subnet("backend-vms", {
    subnetName: "backend-vms",
    addressPrefix: "10.0.2.0/24",
    virtualNetworkName: vnet.name,
    resourceGroupName: resourceGroup.name,
    serviceEndpoints: [{ service: "Microsoft.Web"}] // Allow access to a web app from *this* subnet *without* private endpoints. PEP is problematic on web apps/functions.
});

// This is relevant only if we use Private End Points; Service End Points do not place the resources directly in the vnet
// const backendFunctionsSubnet = new azure.network.Subnet("backend-functions", {
//     subnetName: "backend-functions", 
//     addressPrefix: "10.0.3.0/24",
//     virtualNetworkName: vnet.name,
//     resourceGroupName: resourceGroup.name,
// });

const azureSqlSubnet = new azure.network.Subnet("azure-sql", {
    subnetName: "azure-sql", 
    addressPrefix: "10.0.4.0/24",
    virtualNetworkName: vnet.name,
    resourceGroupName: resourceGroup.name,
    privateEndpointNetworkPolicies: "Disabled"
});

// const bastionSubnet = new azure.network.Subnet("AzureBastionSubnet", {
//     subnetName: "AzureBastionSubnet", 
//     addressPrefix: "10.0.5.0/24",
//     virtualNetworkName: vnet.name,
//     resourceGroupName: resourceGroup.name
// });

// const managedSqlSubnetNSG = new azure.network.NetworkSecurityGroup("managed-sql-nsg",
//     {
//         networkSecurityGroupName: "managed-sql-nsg",
//         resourceGroupName: resourceGroup.name,
//         location // BUG: Required
//     });
// const managedSqlSubnetRT = new azure.network.RouteTable("managed-sql-rt",
//     {
//         routeTableName: "managed-sql-rt",
//         resourceGroupName: resourceGroup.name,
//         location
//     });

// const managedSqlSubnet = new azure.network.Subnet("managed-sql", {
//     subnetName: "managed-sql",
//     addressPrefix: "10.0.6.0/24",
//     virtualNetworkName: vnet.name,
//     resourceGroupName: resourceGroup.name,
//     delegations: [{
//         name:"managed-sql-del", //BUG: Required
//         serviceName: "Microsoft.Sql/managedInstances"
//     }],
//     networkSecurityGroup: {
//         id: managedSqlSubnetNSG.id
//     },
//     routeTable: {
//         id: managedSqlSubnetRT.id
//     }
// });

// const cosmosSubnet = new azure.network.Subnet("cosmos", {
//     subnetName: "cosmos",
//     addressPrefix: "10.0.7.0/24",
//     virtualNetworkName: vnet.name,
//     resourceGroupName: resourceGroup.name
// });

// const storageSubnet = new azure.network.Subnet("storage", {
//     subnetName: "storage",
//     addressPrefix: "10.0.8.0/24",
//     virtualNetworkName: vnet.name,
//     resourceGroupName: resourceGroup.name
// });



// const managedSqlInstance = new azure.sql.ManagedInstance("fl-vnettest-sm", {
//     resourceGroupName: resourceGroup.name,
//     managedInstanceName: "fl-vnettest-sm",
//     location,
//     administratorLogin,
//     administratorLoginPassword,
//     publicDataEndpointEnabled: false,
//     sku: {
//         capacity: 4,
//         family: "Gen5",
//         name: "GP_Gen5",
//         tier: "GeneralPurpose"
//     },
//     storageAccountType: "LRS",
//     storageSizeInGB: 32,
//     vCores: 4,
//     subnetId: managedSqlSubnet.id,
//     tags,
//     // The following are only here to satisfy an import, they are not normally required
//     collation: "SQL_Latin1_General_CP1_CI_AS",
//     licenseType: "LicenseIncluded",
//     timezoneId: "UTC"

//     }, { protect: false });

// const managedSqlDb = new azure.sql.ManagedDatabase("fl-vnettest-mdb",
//     {
//         databaseName: "fl-vnettest-mdb",
//         managedInstanceName: managedSqlInstance.name,
//         location,
//         resourceGroupName: resourceGroup.name
//     });

// Sets up a private DNS Zone for SQL private link entries
// const sqlPrivateDns = new azure.network.PrivateZone("fl-vnettest-sqldns", {
//     privateZoneName: "privatelink.database.windows.net",
//     resourceGroupName: resourceGroup.name,
//     location: "global" //https://github.com/Azure/azure-cli/issues/6052
// })

// // Links the private DNS Zone to the vnet
// const dnsVnetLink = new azure.network.VirtualNetworkLink("fl-vnettest-vnl", {
//     privateZoneName: sqlPrivateDns.name,
//     resourceGroupName: resourceGroup.name,
//     virtualNetworkLinkName: "fl-vnettest-vnl",
//     registrationEnabled: true,
//     virtualNetwork: { id: vnet.id },
//     location: "global"
// })



// const passSqlServer = new azure.sql.Server("fl-vnettest-ss",
//     {
//         serverName: "fl-vnettest-ss",
//         administratorLogin,
//         administratorLoginPassword,
//         location,
//         resourceGroupName: resourceGroup.name,
//         tags,
//         minimalTlsVersion: "1.2",
//     });

// Create the private end point for the SQL Server
// const sqlPrivateEndPoint = new azure.network.PrivateEndpoint("fl-vnettest-sqlpep", {
    
//     privateEndpointName: "fl-vnettest-sqlpep",
//     resourceGroupName: resourceGroup.name,
//     location,
//     subnet: { id: azureSqlSubnet.id },
//     privateLinkServiceConnections: [
//         {
//             name: "sql",
//             privateLinkServiceId: passSqlServer.id,
//             groupIds: ["sqlServer"], 
//             privateLinkServiceConnectionState: {
//                 actionsRequired: "None",
//                 description: "Auto-approved",
//                 status: "Approved"
//             }
//         }
//     ]
// })

// // Connects the private DNS Zone and the private end point (I think)
// const sqlPrivateDnsZoneGroup = new azure.network.PrivateDnsZoneGroup("fl-vnettest-sqldnsgroup", {
//     privateDnsZoneGroupName: "fl-vnettest-sqldnsgroup",
//     privateEndpointName: sqlPrivateEndPoint.name,
//     resourceGroupName: resourceGroup.name,
//     name: "fl-vnettest-sqldns",
//     privateDnsZoneConfigs: [{
//         name: sqlPrivateDns.name,
//         privateDnsZoneId: sqlPrivateDns.id
//     }]
// })

// // Adding a second SQL Server and setting up a private endpoint

// const passSqlServer2 = new azure.sql.Server("fl-vnettest-ss2",
//     {
//         serverName: "fl-vnettest-ss2",
//         administratorLogin,
//         administratorLoginPassword,
//         location,
//         resourceGroupName: resourceGroup.name,
//         tags,
//         minimalTlsVersion: "1.2",
//     });

// const sqlPrivateEndPoint2 = new azure.network.PrivateEndpoint("fl-vnettest-sqlpep2", {
    
//     privateEndpointName: "fl-vnettest-sqlpep2",
//     resourceGroupName: resourceGroup.name,
//     location,
//     subnet: { id: azureSqlSubnet.id },
//     privateLinkServiceConnections: [
//         {
//             name: "sql2",
//             privateLinkServiceId: passSqlServer2.id,
//             groupIds: ["sqlServer"], 
//             privateLinkServiceConnectionState: {
//                 actionsRequired: "None",
//                 description: "Auto-approved",
//                 status: "Approved"
//             }
//         }
//     ]
// })

// const sqlPrivateDnsZoneGroup2 = new azure.network.PrivateDnsZoneGroup("fl-vnettest-sqldnsgroup2", {
//     privateDnsZoneGroupName: "fl-vnettest-sqldnsgroup2",
//     privateEndpointName: sqlPrivateEndPoint2.name,
//     resourceGroupName: resourceGroup.name,
//     name: "fl-vnettest-sqldns2",
//     privateDnsZoneConfigs: [{
//         name: sqlPrivateDns.name,
//         privateDnsZoneId: sqlPrivateDns.id
//     }]
// })

// // Adding things so I can test stuff

// const passSqlDb = new azure.sql.Database("fl-vnettest-db", {
//     databaseName: "fl-vnettest-db",
//     serverName: passSqlServer.name,
//     location,
//     resourceGroupName: resourceGroup.name,
//     tags
// });

// const passSqlDb2 = new azure.sql.Database("fl-vnettest-db2", {
//     databaseName: "fl-vnettest-db2",
//     serverName: passSqlServer2.name,
//     location,
//     resourceGroupName: resourceGroup.name,
//     tags
// });


createAppService();
createVm();

function createAppService() {

    const appServicePlan = new azure.web.AppServicePlan("fl-vnettest-as", {
        name: "fl-vnettest-as",
        location,
        resourceGroupName: resourceGroup.name,
        sku: {
            family: "S",
            capacity: 1,
            size: "S1",
            name: "S1"
        }
    });
    
    const appService = new azure.web.WebApp("fl-vnettest-wa",
        {
            name: "fl-vnettest-wa",
            location,
            resourceGroupName: resourceGroup.name,
            clientAffinityEnabled: false,
            httpsOnly: true,
            serverFarmId: appServicePlan.id,
            tags,
            siteConfig: {
                appSettings: [
                    // This is critical to make DNS lookups return the internal IP Address. 
                    // Without it, your web app will get the public IP address of the SQL Server and will be denied access. 
                    // 168.63.129.16 is a magic constant provided by Microsoft and works with the setup above. 
                    // You will only need something different if you use your own DNS servers.
                    // See https://feedback.azure.com/forums/169385-web-apps/suggestions/38383642-web-app-and-private-dns-zone-support
                    { name: "WEBSITE_DNS_SERVER", value: "168.63.129.16" },
                    { name: "WEBSITE_VNET_ROUTE_ALL", value: "1" },
                    { name: "webaddress", value: "fl-vnettest-wa2.azurewebsites.net" }
                    // { name: "hostname", value: passSqlServer.name.apply(n => n + ".database.windows.net") },
                    // {
                    //     name: "sql",
                    //     value: "Server=tcp:fl-vnettest-ss.database.windows.net,1433;Initial Catalog=fl-vnettest-db;Persist Security Info=False;User ID=" + administratorLogin + ";Password=" + administratorLoginPassword + ";MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
                    //     // Note: This isn't ideal for many reasons, but I haven't got the brain power to nest apply calls :)
                    // }    
                ],
                // Using Service End Point to allow access from the "vm" subnet only. PEP has its issues
                ipSecurityRestrictions: [
                    {
                        name: "backendvnet",
                        action: "Allow",
                        priority: 100,
                        vnetSubnetResourceId: backendVmSubnet.id
                    },
                    {
                        name: "frontendvnet",
                        action: "Allow",
                        priority: 101,
                        vnetSubnetResourceId: frontEndSubnet.id
                    }
                ],
                scmIpSecurityRestrictionsUseMain: false,
                scmIpSecurityRestrictions: []
                // Allow deploy access from Azure DevOps
                // Service tags are coming, but are in preview at this time. Use the Azure Cloud service tag from the portal.
            },
        });

        
    // Give the web app access *to* the vnet so this webapp can call resources on the vnet.
    // Note that "Swift" is the "modern" way of doing this. Don't do what I do and spend ours trying to make WebAppVnetConnection work - it won't.
    const webAppVNetConnection = new azure.web.WebAppSwiftVirtualNetworkConnection("fl-vnettest-wa-vc", {
        name: appService.name,
        resourceGroupName: resourceGroup.name,
        subnetResourceId: frontEndSubnet.id
    });

    const appService2 = new azure.web.WebApp("fl-vnettest-wa2",
        {
            name: "fl-vnettest-wa2",
            location,
            resourceGroupName: resourceGroup.name,
            clientAffinityEnabled: false,
            httpsOnly: true,
            serverFarmId: appServicePlan.id,
            tags,
            siteConfig: {
                appSettings: [
                    // This is critical to make DNS lookups return the internal IP Address. 
                    // Without it, your web app will get the public IP address of the SQL Server and will be denied access. 
                    // 168.63.129.16 is a magic constant provided by Microsoft and works with the setup above. 
                    // You will only need something different if you use your own DNS servers.
                    // See https://feedback.azure.com/forums/169385-web-apps/suggestions/38383642-web-app-and-private-dns-zone-support
                    { name: "WEBSITE_DNS_SERVER", value: "168.63.129.16" },
                    { name: "WEBSITE_VNET_ROUTE_ALL", value: "1" }
                    // { name: "hostname", value: passSqlServer.name.apply(n => n + ".database.windows.net") },
                    // {
                    //     name: "sql",
                    //     value: "Server=tcp:fl-vnettest-ss.database.windows.net,1433;Initial Catalog=fl-vnettest-db;Persist Security Info=False;User ID=" + administratorLogin + ";Password=" + administratorLoginPassword + ";MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
                    //     // Note: This isn't ideal for many reasons, but I haven't got the brain power to nest apply calls :)
                    // }    
                ],
                // Using Service End Point to allow access from the "vm" subnet only. PEP has its issues
                ipSecurityRestrictions: [
                    {
                        name: "backendvnet",
                        action: "Allow",
                        priority: 100,
                        vnetSubnetResourceId: backendVmSubnet.id
                    },
                    {
                        name: "frontendvnet",
                        action: "Allow",
                        priority: 101,
                        vnetSubnetResourceId: frontEndSubnet.id
                    }
                ],
                scmIpSecurityRestrictionsUseMain: false,
                scmIpSecurityRestrictions: []
                // Allow deploy access from Azure DevOps
                // Service tags are coming, but are in preview at this time. Use the Azure Cloud service tag from the portal.
            },
        });
    
        const webAppVNetConnection2 = new azure.web.WebAppSwiftVirtualNetworkConnection("fl-vnettest-wa-vc2", {
            name: appService2.name,
            resourceGroupName: resourceGroup.name,
            subnetResourceId: frontEndSubnet.id
        });


    // Limiting access *TO* the app service to the vnet. This is more for functions, so should move it...
    
    // This is using Prive Endpoints. That has severe limitations, primarily that it requires P1 and that you can't access
    // it at all from a public IP, so you can't deploy to it! https://feedback.azure.com/forums/34192--general-feedback/suggestions/42821667-app-service-with-private-end-point-should-also-all

    // Sets up a private DNS Zone for App Services
    // const appservicePrivateDns = new azure.network.PrivateZone("fl-vnettest-appdns", {
    //     privateZoneName: "privatelink.azurewebsites.net",
    //     resourceGroupName: resourceGroup.name,
    //     location: "global" //https://github.com/Azure/azure-cli/issues/6052
    // })

    // // Links the private App Service DNS Zone to the vnet
    // const dnsVnetLink = new azure.network.VirtualNetworkLink("fl-vnettest-vnl", {
    //     privateZoneName: appservicePrivateDns.name,
    //     resourceGroupName: resourceGroup.name,
    //     virtualNetworkLinkName: "fl-vnettest-vnlapp",
    //     registrationEnabled: true,
    //     virtualNetwork: { id: vnet.id },
    //     location: "global"
    // })
    
    // End of private link stuff. NOTE: Not finished, need to actually create the private link like for SQL
}



// TODO: Add gateway and DNS forwarder for DNS resolution through VPN

function createVm()
{
    const vmPublicIP = new azure.network.PublicIPAddress("fl-vnettest-vm-ip", {
        resourceGroupName: resourceGroup.name,
        publicIpAddressName: "fl-vnettest-vm-ip",
        sku: {
            name: "Basic",
        },
        publicIPAllocationMethod: "Dynamic"
    });

    const vmnsg = new azure.network.NetworkSecurityGroup("fl-vnettest-vm-nsg", {
        resourceGroupName: resourceGroup.name,
        networkSecurityGroupName: "fl-vnettest-vm-nsg",
        securityRules: [
            {
                name: "SSH",
                access: "Allow",
                direction: "Inbound",
                protocol: "Tcp",
                description: "SSH - DANGEROUS!",
                destinationPortRange: "22",
                sourcePortRange: "*",
                priority: 100,
                sourceAddressPrefix: "Internet",
                destinationAddressPrefix: "*"
            }
        ]
    });

    const vmnic = new azure.network.NetworkInterface("fl-vnettest-vmnic", {
        enableAcceleratedNetworking: false,
        resourceGroupName: resourceGroup.name,
        ipConfigurations: [{
            name: "ipconfig1",
            publicIPAddress: {
                id: vmPublicIP.id
            },
            subnet: {
                id: backendVmSubnet.id
            }
        }],
        networkSecurityGroup: {
            id: vmnsg.id
        }
    })

    const vm = new azure.compute.VirtualMachine("fl-vnettest-vm", {
        resourceGroupName: resourceGroup.name,
        hardwareProfile: {
            vmSize: "Standard_B1s"
        },
        osProfile: {
            adminUsername: administratorLogin,
            adminPassword: administratorLoginPassword,
            computerName: "fl-vnettest-vm",
            linuxConfiguration: {
                // patchSettings: { patchMode: "AutomaticByPlatform" },
                provisionVMAgent: true
            },
        },
        networkProfile: {
            networkInterfaces: [{
                id: vmnic.id,
                primary: true
            }]
        },
        storageProfile: {
            imageReference: {
                offer: "UbuntuServer",
                publisher: "Canonical",
                sku: "18.04-LTS",
                version: "latest"
            },
            osDisk: {
                caching: "ReadWrite",
                createOption: "FromImage",
                managedDisk: {
                    storageAccountType: "Standard_LRS",
                },
                name: "myVMosdisk",
            },
        }
    });

    // BASTION setup NOT WORKING!!
    // Not sure if one bastion host can serve multiple VMs?
    // const bastionIP = new azure.network.PublicIPAddress("bastion-ip", {
    //     resourceGroupName: resourceGroup.name,
    //     publicIpAddressName: "bastion-ip",
    //     sku: {
    //         name: "Standard",
    //         tier: "Global",
    //     },
    //     publicIPAllocationMethod: "Static"
    // });

    // const bastionForVm = new azure.network.BastionHost("vm-bastion", {
    //     bastionHostName: "vm-bastion",
    //     resourceGroupName: resourceGroup.name,
    //     id: vm.id,
    //     ipConfigurations: [{
    //         name: "bastionipconfig",
    //         publicIPAddress: { id: bastionIP.id }, 
    //         subnet: { id: bastionSubnet.id }
    //         }]
    // });
}



// TODO: Check access *between* functions/webapps
// DONE: Check access via VPN (won't work)
// DONE: Check deploy access 
  