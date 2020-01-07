# node-cron-scheduler

A REST API that accepts cron expression schedule, which executes a javascript code or http request based on the parameters givenn.

Example:

Cron schedule that runs every 10 seconds that fetch the content of http://icanhazip.com

```

curl -X POST \
  http://localhost:8080/add \
  -H 'Content-Type: application/json' \
  -d '{
    "cron": "*/10 * * * * *",
    "handler": {
        
        "http": {
        	"url" : "http://icanhazip.com",
        	"method" : "get"
        }
    },
    "name": "Get Public IP Address"
}'

```