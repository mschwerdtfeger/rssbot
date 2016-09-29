# RSS Bot

#### Step 1: Download Source

```
git clone TODO
```

#### Step 2: Requirements
- node 4.3.2
- npm 2.*
- serverless 1.0.0-rc.1
- aws-cli 1.10.66

#### Step 2a: Configure AWS credentials
```
aws configure
```
#### Step 2b: Install Serverless 
```
npm install serverless@1.0.0-rc.1 -g
```

#### Step 3: Install Node Modules
```
cd rss_bot/src
npm install
```

#### Step 4: Deploy Serverless Stack
```
serverless deploy
```

Copy Slack Hook Endpoint URL for Slackbot configuration from the terminal
looks like: https://{XZY}.execute-api.eu-west-1.amazonaws.com/dev/hook/slack/out


#### Step 5: Add a Slack Outgoing Webhook to your Slack (news) channel 
- Open: https://my.slack.com/services/new/outgoing-webhook
- Select 'Add Outgoing WebHooks integration
- Select your slack channel
- leave trigger words empty
- Paste the copied endpoint url in the URL(s) field
- copy your token
- Customize your bot name: e.g. RSSBot

#### Step 6: optional but recommended: update your slack token
copy the slack token from the settings and save it under:
```
    rss_bot/src/utils/constants.js
    Line 27: Constants.SLACK.TOKEN = "PASTE_YOUR_TOKEN_HERE";
```
if you updated the token, re-deploy your stack
```
serverless deploy
```

#### Ready 2 Go
The bot was added to your channel
type **help** to get some tips
type **rss** to get the URL of you RSS feed
paste a link to add it to your RSS feed