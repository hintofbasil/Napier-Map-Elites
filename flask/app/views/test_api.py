from main import app, db

from flask_api import status

import pytest

@pytest.fixture(scope='module')
def set_up_client(request):
    app_context = app.app_context()
    app_context.push()
    def tear_down_client():
        db.drop_all()
        db.configure_mappers()
        db.create_all()
        db.session.commit()

        app_context.pop()
    request.addfinalizer(tear_down_client)

def test_example(set_up_client):
    client = app.test_client()
    response = client.post('/api/test')
    assert response.status_code == status.HTTP_200_OK
