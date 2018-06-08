FROM tiangolo/uwsgi-nginx-flask:flask-python3.5

# Install NodeJS - requires additional repository
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash && apt-get update && apt-get install nodejs -y && rm -rf /var/lib/apt/lists/*

ENV FLASK_APP /app/main.py
COPY ./app /app

ARG NGINX_ETC
COPY ${NGINX_ETC} /etc
RUN rm /etc/nginx/conf.d/nginx.conf

RUN pip install -r /app/requirements.txt

# Install npm and run gulp build
RUN cd /app && npm install && npm run prod && cp /app/images /app/static -r

#Enable logging
RUN echo "logto = /var/log/uwsgi/uwsgi.log" >> /etc/uwsgi/uwsgi.ini && mkdir -p /var/log/uwsgi

