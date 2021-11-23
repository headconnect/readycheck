import got, { Response } from 'got'
import * as fs from 'fs'
import * as promclient from 'prom-client'

import *  as http from 'http'
const cron = require('node-cron')



const sourceRegion = process.env.SOURCE_REGION || "local"
const cronSchedule = process.env.CRON_SCHEDULE || '*/15 * * * * *'

const collectDefaultMetrics = promclient.collectDefaultMetrics;
collectDefaultMetrics({ labels: {
    source: sourceRegion,
    app: 'readycheck'
}})

const responseCodes = new promclient.Gauge({
    name: 'readycheck_status',
    help: 'Response status codes of environments checked',
    labelNames: ["customer", "deployment", "mode", "region", "source"]    
})

const responseTimes = new promclient.Gauge({
    // aware that this is contrary to typical recommendations in terms of naming, but backwards compatible.. O_o.
    name: 'readycheck_duration',
    help: 'Response times in milliseconds for environments checked',
    labelNames: ["customer", "deployment", "mode", "region", "source"]    
})

const responseTimingTotal = new promclient.Gauge({
    // This is the desired future response time thing.
    name: 'readycheck_response_time_total_milliseconds',
    help: 'Response times in milliseconds for environments checked',
    labelNames: ["customer", "deployment", "mode", "region", "source"]    
})

const responseTimingwait = new promclient.Gauge({
    // This is the desired future response time thing.
    name: 'readycheck_wait_time_milliseconds',
    help: 'wait times in milliseconds for environments checked',
    labelNames: ["customer", "deployment", "mode", "region", "source"]    
})
/**
 * Not yet emitted as they would vary between connection types.
 */

/* 
const responseTimingdns = new promclient.Gauge({
    // This is the desired future response time thing.
    name: 'readycheck_dns_time_milliseconds',
    help: 'dns times in milliseconds for environments checked',
    labelNames: ["customer", "deployment", "mode", "region", "source"]    
})

const responseTimingtcp = new promclient.Gauge({
    // This is the desired future response time thing.
    name: 'readycheck_tcp_time_milliseconds',
    help: 'tcp times in milliseconds for environments checked',
    labelNames: ["customer", "deployment", "mode", "region", "source"]    
})

const responseTimingtls = new promclient.Gauge({
    // This is the desired future response time thing.
    name: 'readycheck_tls_time_milliseconds',
    help: 'tls times in milliseconds for environments checked',
    labelNames: ["customer", "deployment", "mode", "region", "source"]    
})

const responseTimingrequest = new promclient.Gauge({
    // This is the desired future response time thing.
    name: 'readycheck_request_time_milliseconds',
    help: 'request times in milliseconds for environments checked',
    labelNames: ["customer", "deployment", "mode", "region", "source"]    
})
*/
const responseTimingfirstbyte = new promclient.Gauge({
    // This is the desired future response time thing.
    name: 'readycheck_firstbyte_time_milliseconds',
    help: 'firstbyte times in milliseconds for environments checked',
    labelNames: ["customer", "deployment", "mode", "region", "source"]    
})

const responseTimingdownload = new promclient.Gauge({
    // This is the desired future response time thing.
    name: 'readycheck_download_time_milliseconds',
    help: 'download times in milliseconds for environments checked',
    labelNames: ["customer", "deployment", "mode", "region", "source"]    
})

const responseTimingtotal = new promclient.Gauge({
    // This is the desired future response time thing.
    name: 'readycheck_total_time_milliseconds',
    help: 'total times in milliseconds for environments checked',
    labelNames: ["customer", "deployment", "mode", "region", "source"]    
})

interface Targets {
    Customer?: string;
    Deployment?: string;
    Mode?: string;
    Region?: string;
    URL?: string;
}

let targets : Targets[] = JSON.parse(fs.readFileSync('./destination/targets.json').toString())
const loadTargets = () => {
    console.info("Updating targets list:")
    targets = JSON.parse(fs.readFileSync('./destination/targets.json').toString())    
    console.info(targets)
    console.info(":Target list updated")
}

fs.watchFile('./destination/targets.json', loadTargets)


cron.schedule(cronSchedule, async () => {
    //var outputs = []
    for (const target of targets) {
        // setting "if no response" target response
        let targetHit: Partial<Response<string>> = {
            statusCode: 666,
            timings: {
                start: 0,
                end: 0,
                phases: {
                    wait: 0,
                    dns: 0,
                    tcp: 0,
                    tls: 0,
                    request: 0,
                    firstByte: 0,
                    download: 0,
                    total: 0
                }
            }
        } 
        try {
            targetHit = await got.get(target.URL,{timeout: {request: 9000}, http2: true})
        } catch (e) {
            //console.log(e)
            console.error(`issue retrieving ${target.URL}`)
        }
        
        let response : any = {};

        response = target;
        response.duration = targetHit.timings.end-targetHit.timings.start
        response.timings = targetHit.timings.phases
        response.code = targetHit.statusCode
        response.source = sourceRegion

        console.info(`${response.Mode}: ${response.Customer} - ${response.Deployment} - ${response.Region}: RespCode: ${response.code}, in ${response.duration}ms`)
        responseCodes.labels(response.Customer, response.Deployment, response.Mode, response.Region, response.source).set(response.code)
        responseTimes.labels(response.Customer, response.Deployment, response.Mode, response.Region, response.source).set(response.duration)  
        responseTimingTotal.labels(response.Customer, response.Deployment, response.Mode, response.Region, response.source).set(response.duration)
        
        
        responseTimingwait.labels(response.Customer, response.Deployment, response.Mode, response.Region, response.source).set(targetHit.timings.phases.wait)
        // Not yet emitted as they vary between connection types.
        /*
        responseTimingdns.labels(response.Customer, response.Deployment, response.Mode, response.Region, response.source).set(targetHit.timings.phases.dns)
        responseTimingtcp.labels(response.Customer, response.Deployment, response.Mode, response.Region, response.source).set(targetHit.timings.phases.tcp)
        responseTimingtls.labels(response.Customer, response.Deployment, response.Mode, response.Region, response.source).set(targetHit.timings.phases.tls)
        responseTimingrequest.labels(response.Customer, response.Deployment, response.Mode, response.Region, response.source).set(targetHit.timings.phases.request)
        */
        responseTimingfirstbyte.labels(response.Customer, response.Deployment, response.Mode, response.Region, response.source).set(targetHit.timings.phases.firstByte)
        responseTimingdownload.labels(response.Customer, response.Deployment, response.Mode, response.Region, response.source).set(targetHit.timings.phases.download)
        responseTimingtotal.labels(response.Customer, response.Deployment, response.Mode, response.Region, response.source).set(targetHit.timings.phases.total)

    }

    
    
})

const metricsListener = async (req, res) => {
    res.writeHead(200)
    res.end(await promclient.register.metrics())
}

const metricsServer = http.createServer(metricsListener);
metricsServer.listen(9090, () => {
    console.info('Readycheck Server up and running')
})