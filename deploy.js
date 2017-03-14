'use strict';

let AWS = require('aws-sdk');
let lambda = new AWS.Lambda();

let fs = require('fs');
let path = require('path');

let functionName = process.env.LAMBDA_FUNCTION;

if (functionName == undefined) {
  functionName = path.basename(__dirname);
}

console.log('function: ' + functionName);

lambda.updateFunctionCode({
  FunctionName: functionName,
  ZipFile: fs.readFileSync('dist/ecs-job-runner.zip'),
}, (err, _) => {
  if (err) {
    throw err;
  }

  console.log('Deployed successfully!');
});
