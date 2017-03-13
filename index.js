'use strict';

const REQUIRED_KEYS = [
  'cluster',
  'command',
  'container',
  'taskDefinition',
];

let AWS = require('aws-sdk');
let dynamodb = new AWS.DynamoDB();
let ecs = new AWS.ECS();

function toUnixTimestampWithoutSeconds(timestamp) {
  let d = new Date(timestamp);
  d.setSeconds(0);

  return d.getTime().toString();
}

function validateEvent(event) {
  let missingKeys = [];

  REQUIRED_KEYS.forEach(key => {
    if (event[key] == null) {
      missingKeys.push(key);
    }
  });

  return missingKeys;
}

function acquireSemaphore(tableName, arn, invokedAt) {
  return dynamodb.updateItem({
    Key: {
      ARN: {
        S: arn,
      },
    },
    TableName: tableName,
    ConditionExpression: 'NOT InvokedAt = :invokedAt',
    UpdateExpression: 'SET InvokedAt = :invokedAt',
    ExpressionAttributeValues: {
      ":invokedAt": { S: invokedAt },
    },
  }).promise();
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
  if (process.env.DYNAMODB_TABLENAME == undefined) {
    callback('env DYNAMODB_TABLENAME is required');
    return;
  }

  let tableName = process.env.DYNAMODB_TABLENAME;
  let arn = event['arn'];
  let timestamp = toUnixTimestampWithoutSeconds(event['timestamp']);

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

  acquireSemaphore(tableName, arn, timestamp).then(_ => {
    return runTask(cluster, taskDefinition, command, container);
  }).then(_ => {
    callback(null, "SUCCESS");
  }).catch(err => {
    if (err.code == 'ConditionalCheckFailedException') {
      callback('duplicated execution: ' + JSON.stringify(event));
    } else {
      callback(err);
    }
  });
};
