"use strict";

var crypto = require('crypto');

function ArticleModel (url, ownerId,id){

    if(id == undefined)
    {
        this.id = crypto.createHash('md5').update(ownerId+url+new Date().getTime()).digest('hex');
    }

    this.url = url;
    this.tags = [];
    this.ownerId = ownerId;
    this.creationTimestamp = new Date().getTime();
    this.lastUpdateTimestamp = new Date().getTime();
    this.ogMeta = undefined; // open graph meta data, if available
    this.ogMetaFetched = false; // open graph meta data, if available
} // endClass

ArticleModel.prototype.addTag = function(tag){

    if (typeof tag !== "string") throw Error("Article: tag must be a String");
    if(this.tags.indexOf(tag) == -1) this.tags.push(tag);
} // endFunc

ArticleModel.prototype.addTags = function(tagList){
    if(!tagList) return;

    var self = this;
    tagList.forEach(function (tag) {
        self.addTag(tag);
    });
} // endFunc

ArticleModel.prototype.getTagString = function(){
    var str = "";
    this.tags.forEach(function (tag) {
        str += tag+", ";
    });

    if (str.length >= 2) return str.substring(0, str.length - 2);
    else return str;
} // endFunc

ArticleModel.parseObject = function(obj){

    var article = new ArticleModel(obj.url,obj.ownerId);
    article.tags = obj.tags;
    article.creationTimestamp = obj.creationTimestamp;
    article.lastUpdateTimestamp = obj.lastUpdateTimestamp;
    article.ogMeta = obj.ogMeta;
    article.ogMetaFetched = obj.ogMetaFetched;

    return article;
} // endFunc

module.exports = ArticleModel;
