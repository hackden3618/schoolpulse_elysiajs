# PURPOSE
The users directory contains the source for the user management system.
that is, the database and the api endpoints for user management.

# FILE STRUCTURE
* users.route.ts: contains the routes for the user management system and the endpoints related.
* users.controller.ts: contains the controllers described for the routes in users.route.ts, this is for separation of concerns.

# DESCRIPTION & DECISIONS made
-- NOTE: I am not going to write the controllers for the user management system, just the routes and the service.
--
 
* Users are not going to be deleted, they are just going to be suspended.
* Users can exist under different schools while complying with multitenancy - This will be done in a table that deals with a one to many relationship between schools and users.




