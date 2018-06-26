import os
from zipfile import ZipFile

from flask import abort, jsonify, render_template
from flask_api import status
import markdown

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

@app.route('/solution/<solution_hash>/<solution_key>', methods=['GET'])
def get_solution(solution_hash, solution_key):
    path = os.path.join(
        app.config['SOLUTION_UPLOAD_FOLDER'], solution_hash + '.zip'
    )
    if not os.path.exists(path):
        abort(404)
    with ZipFile(path, 'r') as z:
        files = [x for x in z.namelist() if x.startswith(solution_key)]
        if not files:
            abort(404)
        markdownFile = [x for x in files if x.endswith('.md')]
        html = ''
        if markdownFile:
            with z.open(markdownFile[0], 'r') as mf:
                html = markdown.markdown(mf.read().decode('utf-8'))
                return render_template('base.html', content=html)