'use strict';

let AWS = require('aws-sdk');
let lambda = new AWS.Lambda();

let path = require('path');

let functionName = process.env.LAMBDA_FUNCTION;

if (functionName == undefined) {
  functionName = path.basename(__dirname);
}

console.log('function: ' + functionName);

let event = JSON.stringify({
  'version': '0',
  'id': '89d1a02d-5ec7-412e-82f5-13505f849b41',
  'detail-type': 'Scheduled Event',
  'source': 'aws.events',
  'account': '123456789012',
  'time': new Date().toISOString(),
  'region': 'ap-northeast-1',
  'resources': [
    'arn:aws:events:ap-northeasteast-1:123456789012:rule/SampleRule',
  ],
  'detail': {},
});

lambda.invoke({
  FunctionName: functionName,
  Payload: event,
}, (err, data) => {
  if (err) {
    throw err;
  }

  if (data.FunctionError) {
    console.error('invocation error has occured');
    throw data.Payload;
  }

  console.log('Invoked successfully!');
});
