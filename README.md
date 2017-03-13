# ecs-job-runner

Run a job on ECS using CloudWatch Events -> Lambda

## Usage

### Required IAM Policy for function

`dynamodb:UpdateItem` for Lock manager table and `ecs:RunTask` must be authorized.

```json
{
  "Version": "2012-10-17",
  "Statement": [
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

### Function environment variables

|key|description|required|
|---|---|---|
|`DYNAMODB_TABLENAME`|DynamoDB table name for lock manager|`SchedulerLockManager`|

### Input event JSON

```json
{
  "cluster": "sample-cluster",
  "command": ["ruby", "-v"],
  "container": "job",
  "taskDefinition": "sample-task-definition"
}
```

|key|value|
|---|---|
|`cluster`|ECS cluster name|
|`command`|Command to execute as job (= `CMD` in `Dockerfile`)|
|`container`|Container name to use|
|`taskDefinition`|ECS task definition name|

## Author

Daisuke Fujita ([@dtan4](https://github.com/dtan4))

## License

[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE)
