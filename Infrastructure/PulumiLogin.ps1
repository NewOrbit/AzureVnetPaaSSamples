$subscription = "NewOrbit Gold Benefit"
$groupName = "fl-vnettest-pulumi"
$storageAccountName = "flvnettestpulumi"
$containerName = "pulumi-state"

az account set --subscription $subscription

$env:AZURE_STORAGE_KEY = (az storage account keys list -g $groupName --account-name $storageAccountName -o tsv --query [0].value)
$env:AZURE_STORAGE_ACCOUNT = $storageAccountName

pulumi login --cloud-url "azblob://${containerName}"