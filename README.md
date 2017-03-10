# ecs-job-runner

Run a job on ECS using CloudWatch Events -> Lambda

## Usage

### Required IAM Policy for function

`ecs:RunTask` must be authorized.

```json
{
  "Version": "2012-10-17",
  "Statement": [
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
