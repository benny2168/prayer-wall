I want to develop a new application that has functionality similar to this: https://prayer-walls.com/.  

Requirements
- users can post prayers, either including their name or anonymously
- prayers consist of prayer text (required), organization (required), name (optional), email (email), option to be notified if prayed for (optional if email entered), and option to post publicly on the "wall"
- public "Wall" webpage where prayers are posted, with each organization having their own wall
- an admin portal where admins can given either global access, or just to a specific organization
- admins can set prayers to be archived either after a certain time or manually
- admins should login using OAuth with a Planning Center account

There should also be an additional "prayer chain" feature.

Requirements:
- through the same admin portal as above, admins can create a "prayer chain" by entering the following settings:
  - time period that the prayer chain will run
  - time period during each day that the prayer chain will be open for (e.g. 4-7pm, 12A-12A)
  - time blocks that can be signed up for (e.g. 1 hour blocks, 30 min, 15 min)
  - max # of people that can sign up for each block (E.g. 1 person, 3 people)
  - ability to enable notifications for users who signed up, along with time interval to notify (e.g. 10 min before, 1 min before, etc)
- users will be able to access a public webpage where they will add their name and email address and sign up for an available time block 
- the system will automatically email the person if notification are enabled

The application should be able to be installed and run in a docker container hosted on a Synology server