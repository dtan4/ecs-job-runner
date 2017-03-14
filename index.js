'use strict';

let AWS = require('aws-sdk');
let dynamodb = new AWS.DynamoDB();
let ecs = new AWS.ECS();

function toUnixTimestampWithoutSeconds(timestamp) {
  let d = new Date(timestamp);
  d.setSeconds(0);

  return d.getTime().toString();
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
      ':invokedAt': { S: invokedAt },
    },
  }).promise();
}

function runTask(cluster, taskDefinition, container, command) {
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
  if (process.env.DYNAMODB_LOCKMANAGER_TABLE == undefined) {
    callback('env DYNAMODB_LOCKMANAGER_TABLE is required');
    return;
  }
  let lockManagerTable = process.env.DYNAMODB_LOCKMANAGER_TABLE;

  let arn = event['resources'][0];
  let timestamp = toUnixTimestampWithoutSeconds(event['time']);
  let cluster = event['cluster'];
  let taskDefinition = event['task_definition'];
  let container = event['container'];
  let command = event['command'];

  acquireSemaphore(lockManagerTable, arn, timestamp).then(_ => {
    return runTask(cluster, taskDefinition, container, command);
  }).then(_ => {
    callback(null, 'SUCCESS');
  }).catch(err => {
    if (err.code == 'ConditionalCheckFailedException') {
      callback('duplicated execution: ' + JSON.stringify(event));
    } else {
      callback(err);
    }
  });
};
