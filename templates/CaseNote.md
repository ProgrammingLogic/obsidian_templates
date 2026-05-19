<%*
const case_number = await tp.system.prompt("Case number:", "null");
-%>
---
tags:
  - toast/integrations
  - cases/<% case_number %> 
---

# Case <% case_number %>

## Related Cases:
- 

## Restaurants:
- Management group 1
	- Management group GUID
	- Restaurant 1
		- Toast GUID
		- Address

## Notes
Issue:
Name: 
Phone: 
Email: 
Integrations:
- 

Steps to Resolve:
- 

Next Steps:
1. Next step

Resolution:
Links:

## Timeline
```dataview
LIST WITHOUT ID entry.caseNumber + " " + entry.date + " @ " + entry.timeStarted + " | " + entry.note
FROM "_DATABASES/TimeTracking"
FLATTEN file.lists AS entry
WHERE (entry.taskType = "casework" OR entry.taskType = "call") AND string(entry.caseNumber) = this.file.name
```

<%* await tp.file.move("Notes/Cases/" + case_number + "/" + case_number); -%>
