# ecs-job-runner

Run a job on ECS using CloudWatch Events -> Lambda

## Usage

### Required IAM Policy for function

The actions described below must be authorized

- `dynamodb:Query` for Task table
- `dynamodb:UpdateItem` for Lock manager table
- `ecs:RunTask` for ECS cluster where job container runs

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "dynamodb:Query"
      ],
      "Effect": "Allow",
      "Resource": "arn:aws:dynamodb:ap-northeast-1:123456789012:table/SchedulerTasks"
    },
    {
      "Action": [
        "dynamodb:UpdateItem"
      ],
      "Effect": "Allow",
      "Resource": "arn:aws:dynamodb:ap-northeast-1:123456789012:table/SchedulerLockManager"
    },
    {
      "Action": [
        "ecs:RunTask"
      ],
      "Effect": "Allow",
      "Resource": "arn:aws:ecs:ap-northeast-1:123456789012:*/*"
    }
  ]
}
```

### Required DynamoDB table

#### Lock manager (e,g. `SchedulerLockManager`)

|key|type|
|---|---|
|ARN|string|

#### Task table (e,g. `SchedulerTasks`)

|key|type|
|---|---|
|ARN|string|

### Function environment variables

|key|description|required|
|---|---|---|
|`DYNAMODB_LOCKMANAGER_TABLE`|DynamoDB table name for lock manager|required|
|`DYNAMODB_TASKS_TABLE`|DynamoDB table name for tasks|required|

### Input event JSON

Please select `Matched event` as CloudWatch Events Rules target (Lamdbda function) input.

```json
{
  "version": "0",
  "id": "89d1a02d-5ec7-412e-82f5-13505f849b41",
  "detail-type": "Scheduled Event",
  "source": "aws.events",
  "account": "123456789012",
  "time": "2016-12-30T18:44:49Z",
  "region": "us-east-1",
  "resources": [
    "arn:aws:events:us-east-1:123456789012:rule/SampleRule"
  ],
  "detail": {}
}
```

## Author

Daisuke Fujita ([@dtan4](https://github.com/dtan4))

## License

[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE)
