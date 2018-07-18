#!/bin/bash

# Cron does not get access to environment variables
# so we copy them all across at run time.
(printenv | sed "s/=/=\"/g" | sed "s/$/\"/g"; \
	printf "\n"; \
	crontab -u $(whoami) -l) \
	| crontab -u $(whoami) -

/etc/init.d/cron start

/start.sh
