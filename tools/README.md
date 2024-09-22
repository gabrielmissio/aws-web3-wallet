# Stacks

Load the envs:

```bash
export STAGE=dev
export REGION=us-east-1
export APP_NAME=Web3Wallet
```

## DynamoDB Tables

```bash
aws cloudformation create-stack \
    --region ${REGION} \
    --stack-name ${APP_NAME}-DynamodbTables-${STAGE} \
    --template-body file://tools/stacks/dynamodb-tables.yml \
    --parameters ParameterKey=AppName,ParameterValue=${APP_NAME}
```

## KMS Keys

```bash
aws cloudformation create-stack \
    --region ${REGION} \
    --stack-name ${APP_NAME}-KmsKeys-${STAGE} \
    --template-body file://tools/stacks/kms-keys.yml \
    --parameters ParameterKey=AppName,ParameterValue=${APP_NAME}
```
