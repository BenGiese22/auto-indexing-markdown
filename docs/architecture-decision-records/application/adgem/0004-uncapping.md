# 0004: Handling Capping in Adgem

## STATUS
    Accepted

## CONTEXT

Currently, the Adgem dashboard caps campaigns based on the number of times the campaign has beend converted on the current day. It also allows for capping based on total ad spend of the campaign on the current day.

We are looking at adding campaign caps based on a designated goal. For example, if I had a campaign with the following 3 goals:
- Install
- Level 10
- Level 20

I could choose to cap this campaign after 100 Level 10 completions. So the campaign would no longer be shown to new users for that day after 100 people have reached level 10 for the day.

Also see [this ADR](https://main.d34po8gjhxcbxm.amplifyapp.com/architecture-decision-records/application/adgem/0013-sort-data-delivery-to-adgem/) for a similar situation.

### Considered Options

1. Laravel scheduled command that pulls data from the DynamoDB ad-tracking table and marks campaigns as capped
2. Laravel scheduled command that pulls data from the Redshift Adgem Events table and marks campaigns as capped.
3. airflow DAG that pulls data from the Redshift Adgem Events table and makes API calls to an adgem endpoint to cap campaigns.


## DECISION

Option 1 is the most similar to the existing solution. However, DynamoDB is optimized for simple key-value and document store use cases. It's not a great solution for this use-case and would likely be fairly expensive because of the high throughput.

Option 2 was not chosen because we want to get the this processing out of adgem and into a data-processing platform like airflow.

We will adopt Option 3, creating a new API Endpoint in the dashboard and calling it from an airflow task in the data account.

## CONSEQUENCES
- airflow dag will pull in adgem data (`daily_installs`, `daily_budget`, and new field that specifies which goal should determine capping) from Redshift using the `prod_mirror`
- new endpoint required in adgem for capping campaigns. It should take in a list of `campaign_id`s and their corresponding `capped_until` values
- need to set up separate logic for handling uncapping (to set the `campaign_capped` field to false when the `capped_until` datetime has been reached). This will be a separate ADR

### Dashboard API

For the new API we will use the following URL and payload to update
many campaign and goals simultaneously:
```json
POST /v1/campaigns/caps

{
  "campaigns": [
    {
      "id": 123,
      "capped_until": 2024-10-28T11:35:00.000Z
    },
    ...
  ]
}
```


### Risks


## NOTES

### References

### Original Author

Dylan Kreth

### Approval date

Nov 22, 2024

### Approved by

Ron White, Ben Giese

## Appendix
