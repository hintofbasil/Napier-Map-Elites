from main import app, db

from flask_api import status

@app.route('/api/test', methods=['POST'])
def request_delete():
    return dict(
        status='OK',
    ), status.HTTP_200_OK
