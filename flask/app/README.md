# Flask App

## Test

### Environment variables

    export APP_SETTINGS=Testing
    export DB_PASSWORD="change_me"
    export DB_DATABASE=""
    export SECRET_KEY="change_me"
    export FLASK_APP=$(pwd)/main.py

### Run tests

    flask test

## Development

### Environment variables

    export APP_SETTINGS=Development
    export DB_PASSWORD="change_me"
    export DB_DATABASE=""
    export SECRET_KEY="change_me"
    export FLASK_APP=$(pwd)/main.py
    export FLASK_DEBUG=1

### Static files

The development static files can be generated using

    gulp dev

or can be generated with watch enabled using

    gulp

### Development server

To launch the development server run

    flask run

## Production

Docker should be used to launch a production version of the app.  Instructions can be found in the README.md file in the root directory.
