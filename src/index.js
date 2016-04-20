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
    var speechText, repromptText;
    var repromptOutput, speechOutput = "";

    if (session.attributes.stage) {
        if (session.attributes.stage === 1) {
            speechText = session.attributes.speechPunchline;
            speechOutput = {
                speech: '<speak>' + speechText + '</speak>',
                type: AlexaSkill.speechOutputType.SSML
            };
            //If the joke completes successfully, this function uses a "tell" response.
            response.tellWithCard(speechOutput, "Wise Guy", cardOutput);
        } else {

            session.attributes.stage = 0;
            speechText = "That's not how knock knock jokes work! <break time=\"0.3s\" /> " + "Knock knock!";

            repromptText = "You can ask who's there.";

            speechOutput = {
                speech: speechText,
                type: AlexaSkill.speechOutputType.SSML
            };
            repromptOutput = {
                speech: repromptText,
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
            //If the joke has to be restarted, this function uses an "ask" response.
            response.askWithCard(speechOutput, repromptOutput, "Wise Guy", cardOutput);
        }
    } else {
        speechText = "Welcome to the Urban Alexa. You can ask a question like, what's the meaning of cleveland steamer? ... Now, what can I help you with.";
        repromptText = "For instructions on what you can say, please say help me.";
        response.ask(speechText, repromptText);

        speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        repromptOutput = {
            speech: repromptText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.askWithCard(speechOutput, repromptOutput, "Wise Guy", speechOutput);
    }
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
            repromptOutput = {
                speech: "<speak>" + "What other term would you like me to search for?" + "</speak>",
                type: AlexaSkill.speechOutputType.SSML
            };
            session.attributes.stage = 0;
            alexaResponse.ask(speechOutput, repromptOutput);
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
                repromptOutput = {
                    speech: "<speak>" + "What other term would you like me to search for?" + "</speak>",
                    type: AlexaSkill.speechOutputType.SSML
                };
                session.attributes.stage = 0;
                alexaResponse.ask(speechOutput, repromptOutput);
            } else {
                console.log(response.statusCode, body);
                if (body.list === 0 || body.tags === 0) {
                    speech = "<speak>" + "I'm sorry, I couldn't find the term: " + termSlot.value + "</speak>";
                    session.attributes.stage = 0;
                } else {
                    speech = "<speak>" + list[0].definition.replace(/\n/g, '').replace(/\r/g, '') + "</speak>";
                    session.attributes.list = body.list;
                    session.attributes.stage = 1;
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
    "AMAZON.HelpIntent": function (intent, session, response) {
        var speechOutput, repromptOutput = "";

        switch (session.attributes.stage) {
            case 0:
                speechOutput = {
                    speech: "<speak>" + "I'm sorry, I couldn't find the term you were looking for." + "</speak>",
                    type: AlexaSkill.speechOutputType.SSML
                };
                repromptOutput = {
                    speech: "<speak>" + "What other term would you like me to search for?" + "</speak>",
                    type: AlexaSkill.speechOutputType.SSML
                };
                response.ask(speechOutput, repromptOutput);
                break;
            case 1:
                handleOtherDefinition(session, response);
                break;
        }
    }
};

/**
 * Selects a joke randomly and starts it off by saying "Knock knock".
 */
function handleOtherDefinition(session, response) {
    var speechText = "";

    //Reprompt speech will be triggered if the user doesn't respond.
    var repromptText = "You can ask, who's there";

    //Check if session variables are already initialized.
    if (session.attributes.stage) {

        //Ensure the dialogue is on the correct stage.
        if (session.attributes.stage === 0) {
            //The joke is already initialized, this function has no more work.
            speechText = "knock knock!";
        } else {
            //The user attempted to jump to the intent of another stage.
            session.attributes.stage = 0;
            speechText = "That's not how knock knock jokes work! "
                + "knock knock";
        }
    } else {
        //Select a random joke and store it in the session variables.
        var jokeID = Math.floor(Math.random() * JOKE_LIST.length);

        //The stage variable tracks the phase of the dialogue.
        //When this function completes, it will be on stage 1.
        session.attributes.stage = 1;
        session.attributes.setup = JOKE_LIST[jokeID].setup;
        session.attributes.speechPunchline = JOKE_LIST[jokeID].speechPunchline;
        session.attributes.cardPunchline = JOKE_LIST[jokeID].cardPunchline;

        speechText = "Knock knock!";
    }

    var speechOutput = {
        speech: speechText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    var repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    response.askWithCard(speechOutput, repromptOutput, "Wise Guy", speechText);
}


exports.handler = function (event, context) {
    var urbanAlexa = new UrbanAlexa();
    urbanAlexa.execute(event, context);
};
