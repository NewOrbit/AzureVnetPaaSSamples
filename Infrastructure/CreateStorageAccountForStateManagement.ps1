$subscription = "NewOrbit Gold Benefit"
$groupName = "fl-vnettest-pulumi"
$storageAccountName = "flvnettestpulumi"
$containerName = "pulumi-state"
$location = "northeurope"
$owner = "Frans"
$environment = "Live"

# If you happen to have these declared from somewhere else, the container creation will fail
Remove-Item env:AZURE_STORAGE_KEY 
Remove-Item env:AZURE_STORAGE_ACCOUNT

az account set --subscription $subscription
az group create --name $groupName --location $location --tags Owner=$owner Environment=Experiment

az storage account create --resource-group $groupName --name $storageAccountName --sku Standard_LRS --encryption-services blob --access-tier cool --kind BlobStorage --min-tls-version TLS1_2 --tags Environment=$environment Scale=Normal

az storage container create --name $containerName --account-name $storageAccountName

