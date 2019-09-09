'use strict';
var mongoose = require('mongoose'),
    model = require('../models/model'),
    mq = require('../../core/controllers/rabbitmq'),
    Chat = mongoose.model('Chat'),
    errorHandler = require('../../core/controllers/errors.server.controller'),
    _ = require('lodash');

var request = require('request');

const reply = (req) => {
    let headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ndkhN/VjsnZb19qalm3byafc2UFus9CZfgI6CB/WbfQG6c3a7qWjB9jmukbfgbLdnaDNn+FWLxfUidoBwolOWDiF+BKpcDHcINKxBgbbnCBcuzejXMJuO8O8YJ7VS296UIbwnjgyqslUeE07Brka3wdB04t89/1O/w1cDnyilFU='
    }
    let body = JSON.stringify({
        replyToken: req.body.events[0].replyToken,
        messages: [{
            type: `text`,
            text: JSON.stringify(req.body)
        }]
    })
    request.post({
        url: 'https://api.line.me/v2/bot/message/reply',
        headers: headers,
        body: body
    }, (err, res, body) => {
        console.log('status = ' + res.statusCode);
    });
}

const postToDialogflow = req => {
    req.headers.host = "bots.dialogflow.com";
    return request.post({
        uri: "https://bots.dialogflow.com/line/eaa24172-d385-4ec2-bce8-23f209e0f229/webhook",
        headers: req.headers,
        body: JSON.stringify(req.body)
    });
};

exports.messageresponse = function (req, res) {
    if (req.method === "POST") {
        let event = req.body.events[0]
        if (event.type === "message" && event.message.type === "text") {
            postToDialogflow(req);
        } else {
            reply(req);
        }
    }
    return res.status(200).send(req.method);
};

exports.getList = function (req, res) {
    var pageNo = parseInt(req.query.pageNo);
    var size = parseInt(req.query.size);
    var query = {};
    if (pageNo < 0 || pageNo === 0) {
        response = { "error": true, "message": "invalid page number, should start with 1" };
        return res.json(response);
    }
    query.skip = size * (pageNo - 1);
    query.limit = size;
    Chat.find({}, {}, query, function (err, datas) {
        if (err) {
            return res.status(400).send({
                status: 400,
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.jsonp({
                status: 200,
                data: datas
            });
        };
    });
};

exports.create = function (req, res) {
    var newChat = new Chat(req.body);
    newChat.createby = req.user;
    newChat.save(function (err, data) {
        if (err) {
            return res.status(400).send({
                status: 400,
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.jsonp({
                status: 200,
                data: data
            });
            /**
             * Message Queue
             */
            // mq.publish('exchange', 'keymsg', JSON.stringify(newOrder));
        };
    });
};

exports.getByID = function (req, res, next, id) {

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send({
            status: 400,
            message: 'Id is invalid'
        });
    }

    Chat.findById(id, function (err, data) {
        if (err) {
            return res.status(400).send({
                status: 400,
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            req.data = data ? data : {};
            next();
        };
    });
};

exports.read = function (req, res) {
    res.jsonp({
        status: 200,
        data: req.data ? req.data : []
    });
};

exports.update = function (req, res) {
    var updChat = _.extend(req.data, req.body);
    updChat.updated = new Date();
    updChat.updateby = req.user;
    updChat.save(function (err, data) {
        if (err) {
            return res.status(400).send({
                status: 400,
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.jsonp({
                status: 200,
                data: data
            });
        };
    });
};

exports.delete = function (req, res) {
    req.data.remove(function (err, data) {
        if (err) {
            return res.status(400).send({
                status: 400,
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.jsonp({
                status: 200,
                data: data
            });
        };
    });
};
