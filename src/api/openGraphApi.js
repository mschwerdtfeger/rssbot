"use strict";

var ResponseModel = require('../model/responseModel');
var openGraph = require('open-graph-scraper');
var Constants = require('../utils/constants');

module.exports.getOpenGraph = function (request, context, cb) {

    var taskRequest = request.body || request; // use the request if it's a direct lambda invocation

    if(!taskRequest.url)
    {
        return cb(new ResponseModel(Constants.STATUS_OG.INVALID_URL,"no URL provided"))
    } // endIf


    // avoid recursive invokes that lambda function parses itself
    if(taskRequest.url.search(Constants.REGEX_OPEN_GRAPH_INVALID_URL_PATTERN) >= 0)
    {
        return cb("#"+Constants.STATUS_OG.RECURSIVE_URL +" getOpenGraph error url: "+taskRequest.url);
    } // endIf


    openGraph({url: taskRequest.url}, function (err, result) {

        if(err)
        {
            return cb("#"+Constants.STATUS_OG.UNABLE_LOAD_WEBSITE+" getOpenGraph error url: "+taskRequest.url);
        }
        else if (!result.success)
        {
            return cb("#"+Constants.STATUS_OG.NO_OG_DATA+" getOpenGraph error url: "+taskRequest.url);
        }
        else if(result.data.ogTitle == undefined || result.data.ogDescription == undefined)
        {
            return cb("#" + Constants.STATUS_OG.REQ_META_DATA_MISSING + " getOpenGraph error url: " + taskRequest.url + " ogMeta:" + JSON.stringify(result.data));
        }
        else {

            cb(null, new ResponseModel(Constants.STATUS_SUCCESS,"Open Graph parsing was successful",result.data));
        } // endIf

    });

}