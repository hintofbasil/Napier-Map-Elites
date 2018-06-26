import os

from flask import jsonify
from flask_api import status

from main import app

@app.route('/solution/<solution_hash>', methods=['GET'])
def solution_exists(solution_hash):
    exists = os.path.isfile(
        os.path.join(
            app.config['SOLUTION_UPLOAD_FOLDER'], solution_hash + '.zip'
        )
    )
    if exists:
        return jsonify(
            dict(
                status='OK',
            )
        ), status.HTTP_200_OK
    return jsonify(
        dict(
            status='Err',
        )
    ), status.HTTP_404_NOT_FOUND
