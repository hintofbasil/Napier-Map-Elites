# Flask Docker Boilerplate

## Usage

Generate random password for flask

    export FLASK_DB_PASSWORD=$(pwgen -Bs1 24)

Set mysql database name

    export FLASK_DB_DATABASE="dbname"

Generate Flask secret key

    export FLASK_SECRET_KEY=$(pwgen -Bs1 48)

Set SSL folder

    export SSL_LOCATION="/path/to/ssl/certificates"

Lanuch docker containers

    docker-compose up -d
