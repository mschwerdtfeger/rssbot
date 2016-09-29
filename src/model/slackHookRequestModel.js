"use strict";

function SlackHookRequestModel(request) {

    this.token = request.token;
    this.team_id = request.team_id;
    this.team_domain = request.team_domain;
    this.channel_id = request.channel_id;
    this.channel_name = request.channel_name;
    this.timestamp = request.timestamp;
    this.user_id = request.user_id;
    this.user_name = request.user_name;
    this.text = request.text;
} // endClass

module.exports = SlackHookRequestModel;