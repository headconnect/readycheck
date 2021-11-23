# ReadyCheck

Used to check each instance of each deployment of service.

Accepts an array of json object as file-mounted configmap:

```json
{
    "Customer": "CustomerName",
    "Deployment": "DeploymentName",
    "Mode": "Prod|Stage|Dev",
    "Region": "Location",
    "URL": "https://customer-deployment-region.service.com/api/ready"
}
```
and outputs statistics to be scraped by prometheus

# Versions

## 0.2.0 

Rewrite as a persistent deployment with prometheus scraping for simplicity. Just runs permanently on the cluster with node running a cron. 

## 0.1.0

Initial version