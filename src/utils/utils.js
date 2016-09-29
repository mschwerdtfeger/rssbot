"use strict";

function LambdaUtils() {}

LambdaUtils.parameters = function (context, request) {

    var functionName = context.invokedFunctionArn.split(":")[6];
    var stage = functionName.split("-")[1];

    if(request && request.headers)
    {
        var gatewayUrl = request.headers.Host
    };

    return {
        awsRegion : context.invokedFunctionArn.split(":")[3],
        awsAccountID : context.invokedFunctionArn.split(":")[4],
        functionName: functionName,
        stage: stage,
        gatewayUrl: gatewayUrl
    }

} // endFunc

module.exports = LambdaUtils;


