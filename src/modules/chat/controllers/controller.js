'use strict';
var mongoose = require('mongoose'),
    model = require('../models/model'),
    mq = require('../../core/controllers/rabbitmq'),
    Chat = mongoose.model('Chat'),
    errorHandler = require('../../core/controllers/errors.server.controller'),
    _ = require('lodash');

    request = require('request');

const reply = (bodyResponse) => {
    let headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ndkhN/VjsnZb19qalm3byafc2UFus9CZfgI6CB/WbfQG6c3a7qWjB9jmukbfgbLdnaDNn+FWLxfUidoBwolOWDiF+BKpcDHcINKxBgbbnCBcuzejXMJuO8O8YJ7VS296UIbwnjgyqslUeE07Brka3wdB04t89/1O/w1cDnyilFU='
    }
    let body = JSON.stringify({
        replyToken: bodyResponse.events[0].replyToken,
        messages: [{
            type: `text`,
            text: `สวัสดี`
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
exports.messageresponse = function (req, res) {
    reply(req.body);

    res.jsonp({
        status: 200,
        data: "hello"
    });
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
