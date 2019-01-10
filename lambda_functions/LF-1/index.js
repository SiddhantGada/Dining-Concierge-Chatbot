'use strict';


 // --------------- Helpers to build responses which match the structure of the necessary dialog actions -----------------------

function elicitSlot(sessionAttributes, intentName, slots, slotToElicit, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ElicitSlot',
            intentName,
            slots,
            slotToElicit,
            message,
        },
    };
}

function close(sessionAttributes, fulfillmentState, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState : fulfillmentState,
            message : message,
        },
    };
}

function delegate(sessionAttributes, slots) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Delegate',
            slots,
        },
    };
}

// ---------------- Helper Functions --------------------------------------------------

function buildValidationResult(isValid, violatedSlot, messageContent) {
    if (messageContent == null) {
        return {
            isValid,
            violatedSlot,
        };
    }
    return {
        isValid,
        violatedSlot,
        message: { contentType: 'PlainText', content: messageContent },
    };
}

function validateOrderFlowers(location, cuisine, date, time, no_of_people) {
    const cuisine_types = ['indian', 'italian', 'japanese', 'spanish', 'lebanese', 'mexican', 'continental', 'chinese', 'vietnamese'];
    const location_types = ['manhattan', 'venice', 'paris', 'mumbai', 'delhi', 'kyoto', 'tokyo', 'xian', 'shanghai', 'beijing', 'new york', 'bengaluru'];
    if (location && location_types.indexOf(location.toLowerCase()) === -1) {
        return buildValidationResult(false, 'Location', `We do not offer our services in locations like ${location}. \n Enter the name of another city please.`);
    }
    if (cuisine && cuisine_types.indexOf(cuisine.toLowerCase()) === -1) {
        return buildValidationResult(false, 'Cuisine', `We don't offer cuisines like ${cuisine}. Pick something else.`);
    }
    if (date) {
        if (new Date(date) < new Date()) {
            return buildValidationResult(false, 'Date', 'We would love to time travel in the past. But we cannot do this at the moment. Please enter a valid date.');
        }
    }
    if (time) {
        if (time.length !== 5) {
            // Not a valid time; use a prompt defined on the build-time model.
            return buildValidationResult(false, 'DiningTime', "Dude! Fill in a proper time!");
        }
        const hour = parseInt(time.substring(0, 2), 10);
        const minute = parseInt(time.substring(3), 10);
        if (isNaN(hour) || isNaN(minute)) {
            // Not a valid time; use a prompt defined on the build-time model.
            return buildValidationResult(false, 'DiningTime', "Dude! This is an empty field. Fill it up. Won't cost you money, yet! :)");
        }
        if (hour < 0 || hour > 24) {
            // Outside of business hours
            return buildValidationResult(false, 'DiningTime', 'Pick a time between 0 and 24 hours!');
        }

    }
    if (no_of_people < 0 || no_of_people > 30){
            return buildValidationResult(false, 'NoOfPeople', "Invalid number of people entered. Pick a value betwenn 0 and 30");
        }
    return buildValidationResult(true, null, null);
}

 // --------------- Functions that control the bot's behavior -----------------------

/**
 * Performs dialog management and fulfillment for dining.
 *
 * Beyond fulfillment, the implementation of this intent demonstrates the use of the elicitSlot dialog action
 * in slot validation and re-prompting.
 *
 */
function orderFlowers(intentRequest, callback) {
    const slots = intentRequest.currentIntent.slots;
    console.log(slots);
    const location = slots.Location;
    const cuisine = slots.Cuisine;
    const date = slots.Date;
    const time = slots.DiningTime;
    const no_of_people = slots.NoOfPeople;
    const source = intentRequest.invocationSource;

    if (source === 'DialogCodeHook') {
        // Perform basic validation on the supplied input slots.  Use the elicitSlot dialog action to re-prompt for the first violation detected.
        const slots = intentRequest.currentIntent.slots;
        const validationResult = validateOrderFlowers(location, cuisine, date, time, no_of_people);
        if (!validationResult.isValid) {
            slots[`${validationResult.violatedSlot}`] = null;
            callback(elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, validationResult.violatedSlot, validationResult.message));
            return;
        }

        const outputSessionAttributes = intentRequest.sessionAttributes;
        callback(delegate(outputSessionAttributes, intentRequest.currentIntent.slots));
        return;
    }

    callback(close(intentRequest.sessionAttributes, 'Fulfilled',
    { contentType: 'PlainText', content: `Thanks, your order for ${cuisine} has been placed and will be ready for pickup by ${time} on ${date}` }));
}

 // --------------- Intents -----------------------

/**
 * Called when the user specifies an intent for this skill.
 */
function dispatch(intentRequest, callback) {
    console.log(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);

    const intentName = intentRequest.currentIntent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'DiningSuggestionsIntent') {
        return orderFlowers(intentRequest, callback);
    }
    throw new Error(`Intent with name ${intentName} not supported`);
}

// --------------- Main handler -----------------------

// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) => {
    try {
        console.log(`event.bot.name=${event.bot.name}`);

        /**
         * Uncomment this if statement and populate with your Lex bot name and / or version as
         * a sanity check to prevent invoking this Lambda function from an undesired Lex bot or
         * bot version.
         */
        if (event.bot.name !== 'DiningConcierge') {
             callback('Invalid Bot Name');
        }
        dispatch(event, (response) => callback(null, response));
    } catch (err) {
        callback(err);
    }
};
