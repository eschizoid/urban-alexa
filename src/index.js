/**
 * Lambda function for handling Alexa Skill requests that uses Urbandictionary.com REST api to define a term.
 * Examples:
 * One-shot model:
 *  User: "Alexa, ask Urban Dictionary what is the meaning of Boston Pancake?"
 *  Alexa: "(queries Urban Dictionary REST api and finds the term)"
 */

'use strict';

var AlexaSkill = require('./AlexaSkill');

var config = require('./config');

var request = require('request');

var appId = config.appId;

var UrbanAlexa = function () {
    AlexaSkill.call(this, appId);
};

UrbanAlexa.prototype = Object.create(AlexaSkill.prototype);
UrbanAlexa.prototype.constructor = UrbanAlexa;

UrbanAlexa.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    var speechText = "Welcome to the Urban Alexa. You can ask a question like, what's the meaning of cleveland steamer? ... Now, what can I help you with.";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "For instructions on what you can say, please say help me.";
    response.ask(speechText, repromptText);
};

UrbanAlexa.prototype.intentHandlers = {
    "DefineTerm": function (intent, session, alexaResponse) {
        var termSlot = intent.slots.Term;
        var speech, speechOutput, repromptOutput;

        console.log(termSlot.value);

        return request({
            url: config.endpoint,
            method: "GET",
            json: true,
            qs: {
                term: termSlot.value
            },
            headers: {
                "Accept": "application/json"
            }
        }, function (error, response, body) {
            if (error) {
                console.log(error);
                speechOutput = {
                    speech: "<speak>" + "I'm sorry, I cannot define the term: " + termSlot.value + "</speak>",
                    type: AlexaSkill.speechOutputType.SSML
                };
                repromptOutput = {
                    speech: "<speak>" + "What else can I help with?" + "</speak>",
                    type: AlexaSkill.speechOutputType.SSML
                };
                alexaResponse.ask(speechOutput, repromptOutput);
            } else {
                console.log(response.statusCode, body);
                speech = body.total === 0 ? "<speak>" + "What else can I help with?" + "</speak>" : "<speak>" + body.list[0].definition + "</p>";
                speechOutput = {
                    speech: speech,
                    type: AlexaSkill.speechOutputType.SSML
                };
                repromptOutput = {
                    speech: "<speak>" + "What else can I help with?" + "</speak>",
                    type: AlexaSkill.speechOutputType.SSML
                };
                alexaResponse.ask(speechOutput, repromptOutput);
            }
        });
    },
    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },
    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },
    "AMAZON.HelpIntent": function (intent, session, response) {
        var speechText = "You can ask urban Dictionary to define such as, what's boston pancake, or, you can say exit... Now, what can I help you with?";
        var repromptText = "You can say things like, what's boston pancake, or you can say exit... Now, what can I help you with?";
        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        var repromptOutput = {
            speech: repromptText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.ask(speechOutput, repromptOutput);
    }
};

exports.handler = function (event, context) {
    var urbanAlexa = new UrbanAlexa();
    urbanAlexa.execute(event, context);
};
