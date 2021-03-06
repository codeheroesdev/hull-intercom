# Changelog

## 0.5.1
- hotfix variable name

## 0.5.0
- save user tags after events coming from Intercom
- don't tag or untag user for particular segment tag based on `intercom/tags` trait values (don't untag if the segment user left is not present there, don't tag if the segment users should be in is already there)
- set event `ip` context param to Intercom event `last_seen_ip` field
- updates `hull-node`
- switch the default log format to json

## 0.4.0
- manual batch is NOT filtering users based on segment information
- fix NodeJS version to 6.10.0
- improve logging for user going through and for manual/automatic batch events

## 0.3.1
- hotfix error handling

## 0.3.0
- change the segment filtering - send no one by default
- store created attributes in the `intercom` group (Intercom -> Hull mapping)
- don't allow "create new values" in the Intercom attribute selector (Intercom -> Hull mapping)
- message the customer about custom attributes list behavior (they are available right after first
incoming user is processed by the ship)

## 0.1.0
- capturing basic events from Intercom (skipping events for Hull Segments Tags)
- adds `ensureWebhook` method which makes sure that the webhook has all topics set
- fixes handling data coming from Hull and Intercom webhook
- makes sure that companies, tags and segments array are clean 
- overall maintenance fixes - linting, logging and cleanup

## 0.0.2
- setting default `name` value for new users sent to Hull
- minor bugfixes
