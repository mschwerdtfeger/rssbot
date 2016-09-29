Add a Slack Outgoing Webhook: https://my.slack.com/services/new/outgoing-webhook
Copy the webhook token from the settings page an paste it here:
niwi/utils/constants.js
Line 27: Constants.SLACK.TOKEN = "PASTE_YOUR_TOKEN_HERE";

outgoing webhook integration
More infos  here: https://api.slack.com/outgoing-webhooks



run terminal commands

install serverless:
npm install serverless@1.0.0-rc.1 -g

cd niwi
npm install


configure aws cli
```aws configure```

deploy microservices
```serverless deploy```




