"use strict";

var LambdaUtils = require('../utils/utils');
var SlackHookRequestModel = require('../model/slackHookRequestModel');
var ArticleModel = require('../model/articleModel');

var Constants = require('../utils/constants');

var AWS = require("aws-sdk");
var lambda = new AWS.Lambda();

/**
 * onPostRequest
 *
 * handle a slack outgoing webhook
 *
 * @param request
 * @param context
 * @param cb
 * @returns {*}
 */
module.exports.onPostRequest = function (request, context,cb) {

    var slackRequest = new SlackHookRequestModel(request.body);

    // ignore bot's own (echo) messages to avoid recursive loops.
    if(slackRequest.user_id === Constants.SLACK.BOT_ID)
        return cb(null, {code: Constants.SLACK.CODE_SLACKBOT_ECHO});

    // missing or wrong slack token
    // I added the default example token "PASTE_YOUR_TOKEN_HERE" to make the demo setup process easier
    // I highly recommend to remove this option and paste your slack code in the constants!
    if (slackRequest.token != Constants.SLACK.TOKEN &&
        Constants.SLACK.TOKEN != "PASTE_YOUR_TOKEN_HERE" ) // TODO remove this line for production!
        return cb("#"+Constants.SLACK.CODE_INVALID_TOKEN+" Not authorized request");

    // we got no message to parse
    if (slackRequest.text === undefined)
        return cb("#"+Constants.SLACK.CODE_BAD_REQUEST+" missing message");


    // parse the message for a valid command and handle it
    var commandList = [];
    commandList.push({regex: Constants.REGEX_URL_PATTERN, handler: handleWebsite});
    commandList.push({regex: Constants.REGEX_RSS_LINK, handler: handleGetRssLink});
    commandList.push({regex: Constants.REGEX_HELP, handler: handleHelp});

    parseCommands(commandList,slackRequest,context,request);

} // endFunc

/**
 * parseCommands
 * parse available commands and execute a handler function
 * @param commandList
 * @param slackRequest
 * @param context
 * @param request
 * @returns {*}
 */
function parseCommands (commandList,slackRequest,context,request)
{
    for (var i = 0; i < commandList.length; i++) {
        var item = commandList[i];
        var command = slackRequest.text.match(item.regex);

        if (command) {
            return item.handler.call(this, command, slackRequest, context,request);
        } // endIf
    } // endFor

    // we found no command in the slack message
    return cb(null, {text: "", code: Constants.SLACK.CODE_NO_COMMAND});
}

/**
 * handle a website link command
 *
 * @param command
 * @param slackRequest
 * @param context
 * @param request
 */

function handleWebsite (command,slackRequest,context,request)
{
    // we found a valid url in th message
    // parse the tags committed via #TAG_NAME e.g. #ux #news
    var tags = slackRequest.text.match(Constants.REGEX_HASHTAG_PATTERN);

    // parse the article
    var websiteUrl = command[0]; // we parse only one website at a time
    var article = new ArticleModel(websiteUrl,slackRequest.channel_id);
    article.addTags(tags);

    var contextParams = LambdaUtils.parameters(context,request);
    var params = {
        FunctionName: Constants.SERVICE_NAME+"-"+contextParams.stage+"-createArticle",
        Payload: JSON.stringify({
            body: article
        })
    };
    lambda.invoke(params).promise()
        .then(function (result) {

            console.log("Added article: ",article.url,"Tags: "+article.getTagString());

            if(tags == null) tags = "none";
            else tags = article.getTagString();

            return context.done(null, {
                code: Constants.STATUS_SUCCESS,
                text: "Link successfully added! Tags: "+ tags
            })
        },function (err) {
            return context.done(err);
        })
}


/**
 * handle command "help"
 *
 * @param command
 * @param slackRequest
 * @param context
 * @param request
 * @returns {*}
 */
function handleHelp (command,slackRequest,context,request)
{
    return context.done(null, {
        code: 200,
        text: "The bot will generate an RSS feed of your posted links.",
        attachments: [
            {
                "title": "Type: rss",
                "text": "type _rss_ to get the URL of your channel's RSS feed",
                "color": "#7ED660",
                "mrkdwn_in": [
                    "text",
                    "title"
                ]
            },
            {
                "title": "Type: www.example.com",
                "text": "Add a link by simply posting the URL. Example: \nhttp://www.theverge.com/2016/9/28/13086980/spacex-elon-musk-mars-plan-problems-breathing-radiation-death #spacex #musk #news \n#tags are optional",
                "color": "#30AAD1",
                "mrkdwn_in": [
                    "text",
                    "title"
                ]
            }
        ]
    })
}


/**
 * handle command "rss"
 * @param command
 * @param slackRequest
 * @param context
 * @param request
 * @returns {*}
 */
function handleGetRssLink (command,slackRequest,context,request)
{
    var contextParams = LambdaUtils.parameters(context,request);
    var rssUrl = "http://"+contextParams.gatewayUrl+"/"+contextParams.stage+"/rss/"+slackRequest.channel_id;

    return context.done(null, {
        code: Constants.STATUS_SUCCESS,
        attachments: [
            {
                "author_name": "Your RSS Feed URL",
                "author_link": rssUrl,
                "title": rssUrl,
                "title_url": rssUrl,
                "text": "Use this URL to read your shared articles with your favorite RSS reader",
                "color": "#36a64f"
            }
        ]
    })
}
