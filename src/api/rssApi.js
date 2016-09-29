"use strict";


var _ = require("lodash");
var RSS = require('rss');
var ArticleModel = require("../model/articleModel");
var LambdaUtils = require('../utils/utils');
var Constants = require('../utils/constants');

var AWS = require("aws-sdk");
var lambda = new AWS.Lambda();


/**
 * getRssFeed
 *
 * generates a RSS feed of articles
 *
 * @param request
 * @param context
 * @param cb
 */
module.exports.getRssFeed = function (request, context,cb) {

    var contextParams = LambdaUtils.parameters(context,request);
    var params = {
        FunctionName: Constants.SERVICE_NAME+"-"+contextParams.stage+"-getArticlesByOwner",
        Payload: JSON.stringify({
            path: {
                ownerId: request.path.ownerId
            }
        })
    };

    // fetch all user articles from DB
    lambda.invoke(params).promise()
        .then(function(data) {

            var result =  JSON.parse(data.Payload);
            var feedItems = createFeedItems(result.Items);

            // configure the RSS feed
            var feedOptions = {
                title: "Slack RSS News Stream",
                description: "Stream of the team",
                pubDate : feedItems.length > 0 ? _.first(feedItems).date : undefined,
                link : "www.dmotion.de"
            };

            var feed = new RSS(feedOptions);

            // add the feed items to the RSS feed
            _.map(feedItems, function (feedItem) {
                feed.item(feedItem); // push feed item
            });

            cb(null, {result:feed.xml({indent: false})});
        },function (err) {
            return cb("#" + Constants.STATUS_ERROR_FETCHING_OTHER_SERVICE + " error while using other micro service");
        });

};

var createFeedItems = function (articles) {

    var feedItems = [];

    // sort the articles
    articles = _.orderBy(articles, ['creationTimestamp'], ['desc']);

    

    _.forEach(articles, function (item) {

        var article = ArticleModel.parseObject(item);
        var feedItem = {};

        if (article.ogMetaFetched === true && typeof article.ogMeta === "object") {

            try {

                feedItem.title = article.ogMeta.ogTitle;
                feedItem.description = article.ogMeta.ogDescription;
                feedItem.date = new Date(article.creationTimestamp);

                feedItem.url = article.ogMeta.ogUrl;
                feedItem.type = article.ogMeta.ogType;

                if (article.ogMeta.ogImage && article.ogMeta.ogImage.url) {
                    feedItem.enclosure = {
                        url: article.ogMeta.ogImage.url
                    }
                } // endIf

                // we add only items with a title and a description
                feedItems.push(feedItem);
            } catch (e) {
                console.warn("Error while adding article (" + article.id + ") to RSS feed");
            } // endTry

        } // endIf


    }) // endFunc


    return feedItems;
}