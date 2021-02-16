# Azure vNets and PaaS services
Setting up vNets on Azure and connecting them to PaaS services has always been a tricky proposition. With Private End Points it is better than ever, but there are still many weird incantations one must utter for everything to work just right. 
When you start adding in VPN Client access and multiple regions, it rapidly gets a lot harder. 
This repository is a work-in-progress to set up a comprehensive example of how to set this up with a wide range of PaaS services using Pulumi (next-gen).

# Connection tester
`src/web/` has a simple C# ASP.Net core project that can deployed to an Azure App Service to test connectivity to other service.

> Warning: This project deliberately ignores all security best practice. It shows internal information about your network to visitors and it reflects error messages. Do *not* leave it running in a production environment.

This is designed to test connectivity to various Azure services. I created it to help when setting up virtual networks to test access, name resolution and access restrictions. 

At the moment it can:
- Test access to Azure SQL. It will return the name of the SQL server it is talking to. This is helpful when testing fail-over as this will be the name of the server you are actually talking to.
- Return the IP address(es) of a given hostname. Useful when using privatelink as the DNS part can be really thorny.
- The code to extract and test the hostname of a SQL Connection string will currently fail if the hostname is specified like `tcp,xxx,1433`. It's no biggie, the other two functions do everything it can do.
- Storage coming next...

# Usage
The homepage shows a list of tests and which configuration option you need to set to test it.  
You'll need to restart the website between config change. This is a pain, but allowing you to just enter connection strings etc into an input box was too much for security mentality to cope with.

# Test environment
See the `Infrastructure` folder for a [Pulumi](https://www.pulumi.com/docs/reference/pkg/azure-nextgen/) script if you want to set up a test environment with some interesting challenges. This also doubles as guidance on how to configure all this using Pulumi as some of this is lightly documented elsewhere and I have spent many hours with trial and error to make it work.

# TODO
Look at the following:
- https://feedback.azure.com/forums/169385-web-apps/suggestions/38383642-web-app-and-private-dns-zone-support
Test the notions in the [linked article]() about how `WEBSITE_VNET_ROUTE_ALL` does not work on Windows (?) and how you can *only have one connection per app service plan*. 
VPN Clients currently need a DNS Forwarder. Add https://github.com/Azure/azure-quickstart-templates/tree/master/301-dns-forwarder (with the minor bugs fixed and in an availability set).
- Note that you need to also add the VPN address range to the "goodclients" in forwarderSetup.sh
- Does a private endpoint allow the app service to talk *to* the vnet?
