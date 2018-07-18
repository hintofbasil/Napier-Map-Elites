FROM tiangolo/uwsgi-nginx-flask:python3.6

# Install NodeJS - requires additional repository
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash && apt-get update && apt-get install nodejs -y && rm -rf /var/lib/apt/lists/*

# Install cron
RUN apt-get update && apt-get install cron -y && rm -rf /var/lib/apt/lists/*

ENV FLASK_APP /app/main.py
COPY ./app /app

ARG NGINX_ETC
COPY ${NGINX_ETC} /etc
RUN rm /etc/nginx/conf.d/nginx.conf

RUN pip install -r /app/requirements.txt

# Install npm and run gulp build
RUN cd /app && npm install && npm run prod && cp /app/images /app/static -r

# Enable logging
RUN printf "\nlogto = /var/log/uwsgi/uwsgi.log" >> /etc/uwsgi/uwsgi.ini && mkdir -p /var/log/uwsgi

# Create solutions folder
RUN mkdir -p /var/map-elites/solutions && chmod a+rw /var/map-elites/solutions

# Add lockfile deleting cron job running every minute
# deleting locks older than 15 minutes
ENV MAX_LOCK_AGE 900
RUN (crontab -u $(whoami) -l; \
	echo "* * * * * python /app/clear_locks.py --age $MAX_LOCK_AGE"; \
	echo "0 1 * * * python /app/clear_locks.py --age 3600 --ignore-locks --delete-solutions") \
	| crontab -u $(whoami) -

COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
