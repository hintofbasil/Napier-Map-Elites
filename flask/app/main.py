#!/usr/bin/env python

import os
from flask_api import FlaskAPI
from flask_sqlalchemy import SQLAlchemy

app = FlaskAPI(__name__)

app.config.from_object('config.' + os.environ['APP_SETTINGS'])

db = SQLAlchemy(app)

from views.api import *
from views.templates import *

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
