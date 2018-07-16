#!/usr/bin/env python

import os
from flask_api import FlaskAPI
from flask_sqlalchemy import SQLAlchemy

app = FlaskAPI(__name__)

app.config.from_object('config.' + os.environ['APP_SETTINGS'])

db = SQLAlchemy(app)

from views.solutions import *
from views.templates import *

@app.after_request
def add_security_headers(response):
    headers = {
        'strict-transport-security': [
            'max-age=31536000',
            'includeSubDomains'
        ],
        'content-security-policy': [
            'default-src \'self\'',
            'font-src \'self\' data: http://fonts.googleapis.com/*',
            'style-src \'self\' \'unsafe-inline\'',
            'script-src \'self\' https://code.jquery.com/jquery-3.3.1.min.js',
            'img-src \'self\' '
                + 'data: '
                + 'http://a.tile.openstreetmap.org '
                + 'http://b.tile.openstreetmap.org '
                + 'http://c.tile.openstreetmap.org',
        ],
        'x-frame-options': ['SAMEORIGIN'],
        'x-xss-protection': [
            '1',
            'mode=block'
        ],
        'x-content-type-options': ['nosniff'],
        'referrer-policy': ['same-origin'],
    }
    for (key, content) in headers.items():
        response.headers[key] = ';'.join(content)
    return response

@app.cli.command()
def initdb():
    db.create_all()

@app.cli.command()
def test():
    import pytest
    currentPath = os.path.dirname(os.path.abspath(__file__))
    rv = pytest.main([currentPath, '--ignore=env', '--ignore=node_modules',
                      '--verbose'])
    exit(rv)

if __name__=='__main__':
    app.run()
