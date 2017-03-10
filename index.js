'use strict';

const REQUIRED_KEYS = ['cluster', 'taskDefinition', 'commands'];

let AWS = require('aws-sdk');
let ecs = new AWS.ECS();

function validateEvent(event) {
  let missingKeys = [];

  REQUIRED_KEYS.forEach(key => {
    if (event[key] == null) {
      missingKeys.push(key);
    }
  });

  return missingKeys;
}

exports.handler = (event, context, callback) => {
  let missingKeys = validateEvent(event);

  if (missingKeys.length > 0) {
    callback('missing keys: ' + missingKeys.toString());
    return;
  }

  let cluster = event['cluster'];
  let taskDefinition = event['taskDefinition'];
  let commands = event['commands'];

  console.log(ecs);
  console.log('cluster: ' + cluster);
  console.log('taskDefinition: ' + taskDefinition);
  console.log('commands: ' + commands);

  console.log(event);
  callback(null, 'ok');
};
