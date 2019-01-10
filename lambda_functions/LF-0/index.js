'use strict';

function close(sessionAttributes, fulfillmentState, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
        },
    };
}

// --------------- Events -----------------------

function sendToSQS(slots){
    console.log("In sendToSQS function");
    var AWS = require('aws-sdk');
    var sqs = new AWS.SQS({region: 'us-west-2', accessKeyId: 'insert_access_keyid', secretAccessKey : 'insert_secret_access_key'});
    var SQS_QUEUE_URL = "add_link"
    var params = {
     DelaySeconds: 10,
     MessageBody : JSON.stringify(slots),
     QueueUrl: SQS_QUEUE_URL,
    };
    console.log("Sending message");
    sqs.sendMessage(params, function(err, data) {
      if (err) {
        console.log("Error", err);
      } else {
        console.log("Success", data.MessageId);
      }
    });
}

function dispatch(intentRequest, callback) {
    console.log(`request received for userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);
    const sessionAttributes = intentRequest.sessionAttributes;
    const slots = intentRequest.currentIntent.slots;
    const location = slots.Location;
    const cuisine = slots.Cuisine;
    const dining_time = slots.DiningTime;
    const no_of_people = slots.NoOfPeople;
    const phone_number = slots.PhoneNumber;
    let result = `Okay, searching for ${cuisine} places to dine in ${location} for ${no_of_people} at ${dining_time} hrs!`;
    var json_res = {
        "text_query" : result,
        "phone_number" : phone_number
    }
    sendToSQS(json_res);
    console.log(result);
    callback(close(sessionAttributes, 'Fulfilled',
    {'contentType': 'PlainText', 'content': result}));

}

// --------------- Main handler -----------------------

// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) => {
    try {
        dispatch(event,
            (response) => {
                callback(null, response);
            });
    } catch (err) {
        callback(err);
    }
};
