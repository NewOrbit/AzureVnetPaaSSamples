import * as azure from "@pulumi/azure-nextgen";

const location = "northeurope";
const tags = {
    "Environment": "Experiment",
    "Scale": "Normal"
};

// NOTE: Never do this!!
const administratorLogin = "fltest";
const administratorLoginPassword = "[put something here]";

// Create an Azure Resource Group
const resourceGroup = new azure.resources.latest.ResourceGroup("fl-vnettest", {
    location,
    resourceGroupName: "fl-vnettest",
    tags: {
        "Owner": "flytzen"
    }
})

// NOTE: This network has way too many subnets, don't do it like this. It is only to be able to test various settings
const vnet = new azure.network.latest.VirtualNetwork("fl-vnettest-vn", {
    resourceGroupName: resourceGroup.name,
    virtualNetworkName: "fl-vnettest-vn",
    addressSpace: { addressPrefixes: ["10.0.0.0/16"] },
    tags,
    location
});

const frontEndSubnet = new azure.network.latest.Subnet("front-end", {
    subnetName: "front-end",
    addressPrefix: "10.0.1.0/24",
    virtualNetworkName: vnet.name,
    resourceGroupName: resourceGroup.name,
    delegations: [
        {
            serviceName: "Microsoft.Web/serverfarms",
            name: "front-end-delegation"
        }
    ]
});

// const backendVmSubnet = new azure.network.latest.Subnet("backend-vms", {
//     subnetName: "backend-vms",
//     addressPrefix: "10.0.2.0/24",
//     virtualNetworkName: vnet.name,
//     resourceGroupName: resourceGroup.name
// });

// const backendFunctionsSubnet = new azure.network.latest.Subnet("backend-functions", {
//     subnetName: "backend-functions", 
//     addressPrefix: "10.0.3.0/24",
//     virtualNetworkName: vnet.name,
//     resourceGroupName: resourceGroup.name
// });

const azureSqlSubnet = new azure.network.latest.Subnet("azure-sql", {
    subnetName: "azure-sql", 
    addressPrefix: "10.0.4.0/24",
    virtualNetworkName: vnet.name,
    resourceGroupName: resourceGroup.name,
    privateEndpointNetworkPolicies: "Disabled"
});

// const managedSqlSubnetNSG = new azure.network.latest.NetworkSecurityGroup("managed-sql-nsg",
//     {
//         networkSecurityGroupName: "managed-sql-nsg",
//         resourceGroupName: resourceGroup.name,
//         location // BUG: Required
//     });
// const managedSqlSubnetRT = new azure.network.latest.RouteTable("managed-sql-rt",
//     {
//         routeTableName: "managed-sql-rt",
//         resourceGroupName: resourceGroup.name,
//         location
//     });

// const managedSqlSubnet = new azure.network.latest.Subnet("managed-sql", {
//     subnetName: "managed-sql",
//     addressPrefix: "10.0.5.0/24",
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

// const cosmosSubnet = new azure.network.latest.Subnet("cosmos", {
//     subnetName: "cosmos",
//     addressPrefix: "10.0.6.0/24",
//     virtualNetworkName: vnet.name,
//     resourceGroupName: resourceGroup.name
// });

// const storageSubnet = new azure.network.latest.Subnet("storage", {
//     subnetName: "storage",
//     addressPrefix: "10.0.7.0/24",
//     virtualNetworkName: vnet.name,
//     resourceGroupName: resourceGroup.name
// });



// const managedSqlInstance = new azure.sql.v20200801preview.ManagedInstance("fl-vnettest-sm", {
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

// const managedSqlDb = new azure.sql.v20200801preview.ManagedDatabase("fl-vnettest-mdb",
//     {
//         databaseName: "fl-vnettest-mdb",
//         managedInstanceName: managedSqlInstance.name,
//         location,
//         resourceGroupName: resourceGroup.name
//     });

// Sets up a private DNS Zone for SQL private link entries
const sqlPrivateDns = new azure.network.latest.PrivateZone("fl-vnettest-sqldns", {
    privateZoneName: "privatelink.database.windows.net",
    resourceGroupName: resourceGroup.name,
    location: "global" //https://github.com/Azure/azure-cli/issues/6052
})

// Links the private DNS Zone to the vnet
const dnsVnetLink = new azure.network.latest.VirtualNetworkLink("fl-vnettest-vnl", {
    privateZoneName: sqlPrivateDns.name,
    resourceGroupName: resourceGroup.name,
    virtualNetworkLinkName: "fl-vnettest-vnl",
    registrationEnabled: true,
    virtualNetwork: { id: vnet.id },
    location: "global"
})

const passSqlServer = new azure.sql.v20200801preview.Server("fl-vnettest-ss",
    {
        serverName: "fl-vnettest-ss",
        administratorLogin,
        administratorLoginPassword,
        location,
        resourceGroupName: resourceGroup.name,
        tags,
        minimalTlsVersion: "1.2",
    });

// Create the private end point for the SQL Server
const sqlPrivateEndPoint = new azure.network.latest.PrivateEndpoint("fl-vnettest-sqlpep", {
    
    privateEndpointName: "fl-vnettest-sqlpep",
    resourceGroupName: resourceGroup.name,
    location,
    subnet: { id: azureSqlSubnet.id },
    privateLinkServiceConnections: [
        {
            name: "sql",
            privateLinkServiceId: passSqlServer.id,
            groupIds: ["sqlServer"], 
            privateLinkServiceConnectionState: {
                actionsRequired: "None",
                description: "Auto-approved",
                status: "Approved"
            }
        }
    ]
})

// Connects the private DNS Zone and the private end point (I think)
const sqlPrivateDnsZoneGroup = new azure.network.latest.PrivateDnsZoneGroup("fl-vnettest-sqldnsgroup", {
    privateDnsZoneGroupName: "fl-vnettest-sqldnsgroup",
    privateEndpointName: sqlPrivateEndPoint.name,
    resourceGroupName: resourceGroup.name,
    name: "fl-vnettest-sqldns",
    privateDnsZoneConfigs: [{
        name: sqlPrivateDns.name,
        privateDnsZoneId: sqlPrivateDns.id
    }]
})

// Adding a second SQL Server and setting up a private endpoint

const passSqlServer2 = new azure.sql.v20200801preview.Server("fl-vnettest-ss2",
    {
        serverName: "fl-vnettest-ss2",
        administratorLogin,
        administratorLoginPassword,
        location,
        resourceGroupName: resourceGroup.name,
        tags,
        minimalTlsVersion: "1.2",
    });

const sqlPrivateEndPoint2 = new azure.network.latest.PrivateEndpoint("fl-vnettest-sqlpep2", {
    
    privateEndpointName: "fl-vnettest-sqlpep2",
    resourceGroupName: resourceGroup.name,
    location,
    subnet: { id: azureSqlSubnet.id },
    privateLinkServiceConnections: [
        {
            name: "sql2",
            privateLinkServiceId: passSqlServer2.id,
            groupIds: ["sqlServer"], 
            privateLinkServiceConnectionState: {
                actionsRequired: "None",
                description: "Auto-approved",
                status: "Approved"
            }
        }
    ]
})

const sqlPrivateDnsZoneGroup2 = new azure.network.latest.PrivateDnsZoneGroup("fl-vnettest-sqldnsgroup2", {
    privateDnsZoneGroupName: "fl-vnettest-sqldnsgroup2",
    privateEndpointName: sqlPrivateEndPoint2.name,
    resourceGroupName: resourceGroup.name,
    name: "fl-vnettest-sqldns2",
    privateDnsZoneConfigs: [{
        name: sqlPrivateDns.name,
        privateDnsZoneId: sqlPrivateDns.id
    }]
})

// Adding things so I can test stuff

const passSqlDb = new azure.sql.v20200801preview.Database("fl-vnettest-db", {
    databaseName: "fl-vnettest-db",
    serverName: passSqlServer.name,
    location,
    resourceGroupName: resourceGroup.name,
    tags
});

const passSqlDb2 = new azure.sql.v20200801preview.Database("fl-vnettest-db2", {
    databaseName: "fl-vnettest-db2",
    serverName: passSqlServer2.name,
    location,
    resourceGroupName: resourceGroup.name,
    tags
});

const appServicePlan = new azure.web.latest.AppServicePlan("fl-vnettest-as", {
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

const appService = new azure.web.latest.WebApp("fl-vnettest-wa",
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
                { name: "WEBSITE_DNS_SERVER", value: "168.63.129.16" },
                { name: "WEBSITE_VNET_ROUTE_ALL", value: "1" },
                { name: "hostname", value: passSqlServer.name.apply(n => n + ".database.windows.net") },
                {
                    name: "sql",
                    value: "Server=tcp:fl-vnettest-ss.database.windows.net,1433;Initial Catalog=fl-vnettest-db;Persist Security Info=False;User ID=" + administratorLogin + ";Password=" + administratorLoginPassword + ";MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
                    // Note: This isn't ideal for many reasons, but I haven't got the brain power to nest apply calls :)
                }    
            ]
        },
    })

    

// Give the web app access to the vnet
const webAppVNetConnection = new azure.web.latest.WebAppSwiftVirtualNetworkConnection("fl-vnettest-wa-vc", {
    name: appService.name,
    resourceGroupName: resourceGroup.name,
    subnetResourceId: frontEndSubnet.id
})


// const vm = new azure.compute.latest.VirtualMachine("fl-vnettest-vm", {
//     vmName: "fl-vnettest-vm",
//     location,
//     resourceGroupName: resourceGroup.name,
//     osProfile: {
//         adminUsername: administratorLogin,
//         adminPassword: administratorLoginPassword,
//         computerName: "fl-vnettest-vm"
//     },
    
// });


// TODO: Add gateway and DNS forwarder for DNS resolution through VPN