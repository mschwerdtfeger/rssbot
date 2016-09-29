"use strict";

function ResponseModel (status, message, result) {

    this.status = Number(status);
    this.message = message;
    this.result = result;
}

ResponseModel.prototype.toString = function () {
    return "#"+this.status +
        (this.message)? " Msg: "+this.message:"" +
        (this.result) ? " Result: "+ this.result : "";
}

module.exports = ResponseModel;