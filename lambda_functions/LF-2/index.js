var AWS = require('aws-sdk');
var sqs = new AWS.SQS({region: 'us-west-2', accessKeyId: 'insert_access_keyid', secretAccessKey : 'insert_secret_access_key'});
var https = require('https');
const url = require('url');
var ddb = new AWS.DynamoDB({apiVersion: '2012-10-08'});

var TASK_QUEUE_URL = "add_link";

function receiveMessages() {
    console.log("Receive messages from SQS")
      var queue_params = {
        QueueUrl: TASK_QUEUE_URL,
        MaxNumberOfMessages: 10
      };
      sqs.receiveMessage(queue_params, function(err, data) {
        if (err) {
          console.error('Error SQS', err);
        } else {
          console.log("Success SQS", data.Messages);
          if(data.Messages && data.Messages.length > 0) {
            for(var i = 0; i < data.Messages.length; i++) {
              var message_body = JSON.parse(data.Messages[i].Body);
              var text_query = message_body.text_query;
              var phone_number = '+1' + message_body.phone_number;
              var receipt_handle = data.Messages[i].ReceiptHandle;
              console.log('Receipt handle', receipt_handle);
              var host = "maps.googleapis.com";
              var apikey = "insert_API_key";
      	      var language = "en";
      	      var type = "meal_delivery,meal_takeaway,cafe,bar,restaurant";
      	      var fields = "formatted_address,name,rating,opening_hours";
      	      var path = "/maps/api/place/textsearch/json?";
              var query = "key=" + apikey + "&query=" + text_query + "&language=" + language + "&type=" + type + "&fields=" + fields;
              console.log("Calling https get method for google api");
              var get_url = "https://" + host + path + query;
              console.log(get_url);
              https.get(get_url, function(res) {
                var body = '';
                res.on('data', function(chunk) {
                  body += chunk;
                });
                res.on('end', function() {
                  console.log('Sucess API');
                  body = JSON.parse(body);
                  console.log(body);
                  // get body.results.formatted_address, body.results.name, body.results.rating
                  var suggestions = '';
                  for(var j = 0; j < body.results.length && j < 5; j++) {
                    suggestions += body.results[j].name + '; Address: ' + body.results[j].formatted_address + '\n';
                  }
                  console.log(suggestions);
                  console.log('Pushing to DynamoDB');
                  var table_params = {
                    TableName: 'cloudhw2',
                    Item: {
                      'receipt_handle' : {'S' : receipt_handle},
                      'phone_number' : {'S' : phone_number},
                      'suggestions' : {'S' : suggestions}
                    }
                  };
                  ddb.putItem(table_params, function(err, data) {
                      if (err) {
                        console.log("Error db", err);
                      } else {
                        console.log("Success db", data);
                      }
                  }); //db ends here
                  var sms_params = {
                    Message: suggestions,
                    PhoneNumber: phone_number,
                  };
                  var publishTextPromise = new AWS.SNS({apiVersion: '2010-03-31'}).publish(sms_params).promise();
                  publishTextPromise.then(
                    function(data) {
                      console.log("Success sms: " + data.MessageId);
                  }).catch(
                      function(err) {
                      console.error('Success sms', err);
                  });//sms ends here
                }); //api success ends here
              }).on('error', function(e) {console.log("Error API: " + e.message);}); //get request ends here
              sqs.deleteMessage({
                QueueUrl: queue_params.QueueUrl,
                ReceiptHandle: receipt_handle
              }).promise().then(data => {
                  console.log('Sucess delete SQS');
              }).catch(err => {
                  console.log('Error delete SQS', err);
              });
            }
          }
        }
      });
}

function handleSQSMessages() {
  receiveMessages();
}

exports.handler = function(event, context, callback) {
  handleSQSMessages();
};
