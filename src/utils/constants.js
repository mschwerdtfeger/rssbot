"use strict";


function Constants() {};

Constants.SERVICE_NAME = "rssbot";

// REGEX
Constants.REGEX_URL_PATTERN = /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig;
Constants.REGEX_HASHTAG_PATTERN = /#\w+/ig;
Constants.REGEX_RSS_LINK = /(rss|feed|url)/ig;
Constants.REGEX_HELP = /(help)/ig;
Constants.REGEX_OPEN_GRAPH_INVALID_URL_PATTERN = /\/openGraph/ig;

// SLACK
Constants.SLACK = {};
Constants.SLACK.BOT_ID = "USLACKBOT"; // this is fixed by Slack to identify a bot
Constants.SLACK.CODE_INVALID_TOKEN = 410;
Constants.SLACK.CODE_SLACKBOT_ECHO = 215;
Constants.SLACK.CODE_BAD_REQUEST = 401;
Constants.SLACK.CODE_NO_COMMAND = 205;


/**
 * Copy this token from your Slack outgoing webhook settings page.
 * For demo purposes I ignore the security check if you don't change the code.
 * I highly recommend to remove this option and paste your slack token here!
 */
Constants.SLACK.TOKEN = "PASTE_YOUR_TOKEN_HERE";


// General Status Codes
Constants.STATUS_SUCCESS = 200;
Constants.STATUS_ERROR_FETCHING_OTHER_SERVICE = 498;

// Open Graph
Constants.STATUS_OG = {};
Constants.STATUS_OG.UNABLE_LOAD_WEBSITE = 460;
Constants.STATUS_OG. NO_OG_DATA = 465;
Constants.STATUS_OG.REQ_META_DATA_MISSING = 470;
Constants.STATUS_OG.INVALID_URL = 480;
Constants.STATUS_OG.RECURSIVE_URL = 481;


module.exports = Constants;