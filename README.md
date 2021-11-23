## Readychecker

The intention of readychecker is simply to check the return code (not content) of multiple http(s) targets, as well as measure the connection timings and expose those metrics to prometheus for scraping.

It will use HTTP2 when available. 

## Configuration

### Targets

Readychecker expects `targets.json` to exist in the `destination` subfolder relative to its execution. 

Its format is as an array of json objects, thus: 

```ts
[{
    "Customer": "Generic", // string, descriptive name. Typically used as top-level indicator for a group of targets
    "Deployment": "Google", // string, descriptive name. Typically used as a second-level indactor for a group of targets
    "Mode": "prod", // enum: "dev"|"stage"|"prod" - indicates the mode of the target. 
    "Region": "global", // string, descriptive name. Typically used to indicate multiple regional instances of a customer+deployment for the selected mode. 
    "URL": "https://google.com" // URL - the target to check.
}]

```

> NOTE: This has not been tested with spaces in the customer/deployment/mode/region fields, so it would be advisable to avoid that for the time being (or test yourself.).

### Operation

Readychecker relies on a cron schedule to execute its checks.  This can be configured by setting the `CRON_SCHEDULE` environment variable according to a cron expression. The default is `*/15 * * * * *` indicating a polling interval of 15 seconds.

Additionally, the "source" region of polling can be set, which is useful if you're running multiple instances of readychecker to verify the targets from different regions. This is set to `local` by default (indicating local execution), but should ideally be set to a region (freetext string) which matches your region settings in the target configuration. It is configurable by setting the `SOURCE_REGION` environment variable. 

### Dockerfile

The included dockerfile is extremely basic, but sufficient for the purpose.

### Kubernetes deployment

The readychecker is intended to be run in a kubernetes cluster as a deployment. It is also sensible to run alongside the `nodechecker` tool which performs "tcp ping" - and would be reading the same target list. 

It is also designed to automatically reload targets if the configmap changes contents. 

As such, the included `deploy` folder contains the Deployment, Service and ConfigMap for the readychecker + target. 

The docker image is not publicly published, so you would need to build and push it to a registry of your choice, and modify the path & name of the image of the container in the deployment spec. 


