# Connection tester
> Warning: This project deliberately ignores all security best practice. It shows internal information about your network to visitors and it reflects error messages. Do *not* leave it running in a production environment.

This is designed to test connectivity to various Azure services. I created it to help when setting up virtual networks to test access, name resolution and access restrictions. 

At the moment it can:
- Test access to Azure SQL. It will return the name of the SQL server it is talking to. This is helpful when testing fail-over as this will be the name of the server you are actually talking to.
- Return the IP address(es) of a given hostname. Useful when using privatelink as the DNS part can be really thorny.
- Storage coming next...

# Usage
The homepage shows a list of tests and which configuration option you need to set to test it.  
You'll need to restart the website between config change. This is a pain, but allowing you to just enter connection strings etc into an input box was too much for security mentality to cope with.