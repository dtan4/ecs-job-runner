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

function taskFromARN(tableName, arn) {
  return dynamodb.query({
    TableName: tableName,
    KeyConditions: {
      'ARN': {
        ComparisonOperator: 'EQ',
        AttributeValueList: [
          { S: arn },
        ],
      },
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
  if (process.env.DYNAMODB_LOCKMANAGER_TABLE == undefined) {
    callback('env DYNAMODB_LOCKMANAGER_TABLE is required');
    return;
  }
  let lockManagerTable = process.env.DYNAMODB_LOCKMANAGER_TABLE;

  if (process.env.DYNAMODB_TASKS_TABLE == undefined) {
    callback('env DYNAMODB_TASKS_TABLE is required');
    return;
  }
  let tasksTable = process.env.DYNAMODB_TASKS_TABLE;

  let arn = event['resources'][0];
  let timestamp = toUnixTimestampWithoutSeconds(event['time']);

  acquireSemaphore(lockManagerTable, arn, timestamp).then(_ => {
    return taskFromARN(tasksTable, arn);
  }).then(resp => {
    if (resp.Items.length == 0) {
      return new Promise((_, reject) => {
        reject('event matched to ' + arn + ' is not found');
      });
    }

    let task = resp.Items[0];
    let cluster = task['Cluster']['S'];
    let taskDefinition = task['TaskDefinition']['S'];
    let command = task['Command']['SS'].reverse();
    let container = task['Container']['S'];

    return runTask(cluster, taskDefinition, command, container);
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
