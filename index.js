'use strict';

const REQUIRED_KEYS = [
  'cluster',
  'command',
  'container',
  'taskDefinition',
];

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

function runTask(cluster, taskDefinition, command, container) {
  return ecs.runTask({
    cluster: cluster,
    taskDefinition: taskDefinition,
    overrides: {
      containerOverrides: [
        {
          command: command,
          name: container,
        },
      ],
    },
  }).promise();
}

exports.handler = (event, context, callback) => {
  let missingKeys = validateEvent(event);

  if (missingKeys.length > 0) {
    callback('missing keys: ' + missingKeys.toString());
    return;
  }

  let cluster = event['cluster'];
  let command = event['command'];
  let container = event['container'];
  let taskDefinition = event['taskDefinition'];

  console.log('cluster: ' + cluster);
  console.log('taskDefinition: ' + taskDefinition);
  console.log('command: ' + command);

  runTask(cluster, taskDefinition, command, container).then(_ => {
    callback(null, "SUCCESS");
  }).catch(err => {
    callback(err);
  });
};
