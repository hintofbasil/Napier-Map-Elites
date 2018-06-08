FROM mysql

ENV FLASK_DB_PASSWORD ""

COPY ./docker-entrypoint-initdb.d /docker-entrypoint-initdb.d

RUN chown mysql:mysql /docker-entrypoint-initdb.d/*
