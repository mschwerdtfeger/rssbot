var ArticleModel = require('../model/articleModel');
var LambdaUtils = require('../utils/utils');
var Constants = require('../utils/constants');
var ResponseModel = require('../model/responseModel');

var AWS = require('aws-sdk');
var dynamoDbDoc = new AWS.DynamoDB.DocumentClient();
var sns = new AWS.SNS();
var lambda = new AWS.Lambda();


/**
 * PUT /article
 * @param request
 * @param cb
 * @returns {*}
 */

module.exports.createArticle = function(request, context, cb) {

    var contextParams = LambdaUtils.parameters(context,request);

    var payload = request.body;
    var article = new ArticleModel(payload.url, payload.ownerId);

    article.addTags(payload.tags);

    var dynamoDbParams = {
        Item: article,
        TableName: Constants.SERVICE_NAME+"-"+contextParams.stage+"-article" // TODO load externally if serverless supports it
    };


    dynamoDbDoc.put(dynamoDbParams, function (error, response) {

        if(error){
            return cb(error)
        }

        // article saved, send a msg into the SNS queue to fetch the article data async
        var snsParams = {
            TopicArn: 'arn:aws:sns:' + contextParams.awsRegion + ':' + contextParams.awsAccountID + ":"+Constants.SERVICE_NAME+"-article-topic",// TODO load externally if serverless supports it
            Message:"article created",
            Subject:"new-article",
            MessageAttributes:{
                articleId:{
                    DataType: "String",
                    StringValue: article.id
                },
                ownerId:{
                    DataType: "String",
                    StringValue: article.ownerId
                },
                url:{
                    DataType: "String",
                    StringValue: article.url
                }
            }
        }

        sns.publish(snsParams,function(err,result)
        {
            return cb(err, new ResponseModel(Constants.STATUS_SUCCESS,"article successfully added"));
        })


    });

} // endFunc


/**
 * POST /articles/owner/{id}
 * @param request
 * @param cb
 */

module.exports.getArticlesByOwner = function(request,context, cb) {

    var contextParams = LambdaUtils.parameters(context,request);

    var params = {
        TableName: Constants.SERVICE_NAME+"-"+contextParams.stage+"-article", // TODO load externally if serverless supports it
        KeyConditionExpression: "#ownerId = :ownerValue",
        ExpressionAttributeNames:{
            "#ownerId": "ownerId"
        },
        ExpressionAttributeValues: {
            ":ownerValue": request.path.ownerId
        }
    };

    console.log(params);

    dynamoDbDoc.query(params, cb);

};

/**
 * HOOKS
 */

/**
 * afterArticleCreated
 *
 * this hook will add Open Graph data to a new article
 *
 * @param request
 * @param context
 * @param cb
 */

module.exports.afterArticleCreated = function(request, context, cb) {

    // invoke getOpenGraph function to fetch Open Graph for the given URL

    var contextParams = LambdaUtils.parameters(context,request);

    var article = parseArticleFromSnsRequest(request);
    console.log("fetching OG data for article", article.url);

    lambda.invoke({
        FunctionName: Constants.SERVICE_NAME+"-"+contextParams.stage+"-getOpenGraph",
        Payload: JSON.stringify({
            url: article.url
        })
    },function (err,data) {
        if(err)
        {
            return context.fail("#"+Constants.STATUS_ERROR_FETCHING_OTHER_SERVICE+" error while using og fetch micro service");
        } // endIf

        var ogMetaData = null;
        var response = JSON.parse(data.Payload);

        switch(response.status)
        {
            case Constants.STATUS_SUCCESS:
                ogMetaData = response.result;
                break;
            case Constants.STATUS_OG.RECURSIVE_URL:
            case Constants.STATUS_OG.UNABLE_LOAD_WEBSITE:
            case Constants.STATUS_OG.REQ_META_DATA_MISSING:
                console.log("Open Graph fetch status: "+response.status+" meta data saved as NULL");
                break;
            default:
                return context.fail(new Error("Unknown status code ("+response.status+") from Open Graph task. Msg:"+response.message))
        } // endSwitch

        // update the article in the dynamo DB table
        var dynamoTable =  Constants.SERVICE_NAME+"-"+contextParams.stage+"-article"; // TODO load externally if serverless supports it

        updateArticleOGMetaAsync(article.ownerId,article.url, ogMetaData,dynamoTable)
            .then( function (result) {
                console.log("updateArticleOGMetaAsync: completed");
                var response = new ResponseModel(Constants.STATUS_SUCCESS,"Successfully updated article with Open Graph metadata");
                return cb(null,response)
            },function(error){
                console.log("DynamoError: ",error);
                return cb("#"+Constants.STATUS_ERROR_FETCHING_OTHER_SERVICE+" error updating article in DB")
            }); // endFunc
    })
} // endFunc


/**
 * parseArticleFromSnsRequest
 *
 * returns the Article object from the SNS msg
 *
 * @param event
 * @returns {ArticleModel}
 */
function parseArticleFromSnsRequest(event) {

    if(!event.Records || event.Records.length == 0)
    {
        throw new Error("No records in request");
    }
    else if (event.Records.length > 1)
    {
        new Error("This lambda function can handle only one record at a time!! (msg count:" + event.Records.length + ")");
    } // endIf

    var snsMsg = event.Records[0].Sns;
    var article = new ArticleModel(snsMsg.MessageAttributes.url.Value,
                                   snsMsg.MessageAttributes.ownerId.Value,
                                   snsMsg.MessageAttributes.articleId.Value);



    return article;
} // endFunc

/**
 * updateArticleOGMetaAsync
 * update the metadata of the article
 * @param ownerId
 * @param url
 * @param ogMeta
 * @param dynamoTable
 * @returns {Promise}
 */
function updateArticleOGMetaAsync (ownerId,url, ogMeta, dynamoTable) {

    return new Promise(function (resolve, reject) {

        var attributeUpdates = {
            ogMetaFetched: {
                Action: 'PUT',
                Value: true
            },
            lastUpdateTimestamp: {
                Action: 'PUT',
                Value: new Date().getTime()
            }
        };

        // if we have og meta data add it to the model
        if(ogMeta) {
            attributeUpdates.ogMeta = {
                Action: 'PUT',
                Value: ogMeta
            }
        };

        var params = {
            TableName: dynamoTable,
            Key: {
                ownerId: ownerId,
                url:url
            },
            AttributeUpdates: attributeUpdates

        };

        dynamoDbDoc.update(params, function (err, data) {
            if(err) reject(err);
            else resolve(data);
        });

    });

} // endFunc