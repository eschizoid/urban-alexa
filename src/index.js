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

var DEFINITION_POINTER = 0;

var UrbanAlexa = function () {
    AlexaSkill.call(this, appId);
};

UrbanAlexa.prototype = Object.create(AlexaSkill.prototype);
UrbanAlexa.prototype.constructor = UrbanAlexa;

UrbanAlexa.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    var repromptOutput, speechOutput;

    DEFINITION_POINTER = 0;

    speechOutput = {
        speech: "Welcome to the Urban Alexa. You can ask a question like, what's the meaning of cleveland steamer? ... Now, what can I help you with.",
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    repromptOutput = {
        speech: "For instructions on what you can say, please say help me.",
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    response.ask(speechOutput, repromptOutput);
};

UrbanAlexa.prototype.intentHandlers = {
    "DefineTerm": function (intent, session, alexaResponse) {
        var termSlot = intent.slots.Term;
        var speech, speechOutput, repromptOutput;

        var hasTerm = termSlot && termSlot.value;

        if (hasTerm) {
            session.attributes.term = termSlot.value;
        } else {
            speechOutput = {
                speech: "<speak>" + "I'm sorry, I couldn't find the term you were looking for." + "</speak>",
                type: AlexaSkill.speechOutputType.SSML
            };
            alexaResponse.tell(speechOutput);
        }

        request({
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
                    speech: "<speak>" + "I'm sorry, I couldn't find the term: " + termSlot.value + "</speak>",
                    type: AlexaSkill.speechOutputType.SSML
                };
                alexaResponse.tell(speechOutput);
            } else {
                console.log(response.statusCode, body);
                if (body.list === 0 || body.tags === 0) {
                    speech = "<speak>" + "I'm sorry, I couldn't find the term: " + termSlot.value + "</speak>";
                } else {
                    speech = "<speak>" + body.list[DEFINITION_POINTER++].definition.replace(/\n/g, '').replace(/\r/g, '') + "</speak>";
                    session.attributes.list = body.list;
                }
                speechOutput = {
                    speech: speech,
                    type: AlexaSkill.speechOutputType.SSML
                };
                repromptOutput = {
                    speech: "<speak>" + "Would you like to hear another definition?" + "</speak>",
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
    "AMAZON.NoIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },
    "AMAZON.YesIntent": function (intent, session, response) {
        var speechOutput, repromptOutput;
        if (DEFINITION_POINTER > session.attribute.list.size) {
            speechOutput = {
                speech: "<speak>I gave you all the definitions that I have.<p>I can't believe the term is still not clear for you!</p></speak>",
                type: AlexaSkill.speechOutputType.SSML
            };
            response.tell(speechOutput);
        } else {
            speechOutput = {
                speech: "<speak>" + session.attribute.list[DEFINITION_POINTER++].definition.replace(/\n/g, '').replace(/\r/g, '') + "</speak>",
                type: AlexaSkill.speechOutputType.SSML
            };
            repromptOutput = {
                speech: "<speak>" + "Would you like to hear another definition?" + "</speak>",
                type: AlexaSkill.speechOutputType.SSML
            };
            response.ask(speechOutput, repromptOutput);
        }
    },
    "AMAZON.HelpIntent": function (intent, session, response) {
    }
};

exports.handler = function (event, context) {
    var urbanAlexa = new UrbanAlexa();
    urbanAlexa.execute(event, context);
};
