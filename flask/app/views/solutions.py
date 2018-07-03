import os
import re
import string
from zipfile import ZipFile

from flask import abort, jsonify, render_template, Response, request
from flask_api import status
import markdown
from werkzeug.utils import secure_filename

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
                return render_template('solution.html', content=html,
                                      solution_hash=solution_hash,
                                       solution_key=solution_key)

@app.route('/solution_kmls/<solution_hash>/<solution_key>', methods=['GET'])
def get_solution_kmls(solution_hash, solution_key):
    path = os.path.join(
        app.config['SOLUTION_UPLOAD_FOLDER'], solution_hash + '.zip'
    )
    if not os.path.exists(path):
        abort(404)
    with ZipFile(path, 'r') as z:
        files = [x for x in z.namelist() if x.startswith(solution_key)]
        if not files:
            abort(404)
        keyLength = len(solution_key)
        kmlFiles = [x[keyLength + 1:] for x in files if x.endswith('.kml')]
        return jsonify(kmlFiles)

@app.route('/solution_kmls/<solution_hash>/<solution_key>/<file_name>', methods=['GET'])
def get_solution_kml(solution_hash, solution_key, file_name):
    path = os.path.join(
        app.config['SOLUTION_UPLOAD_FOLDER'], solution_hash + '.zip'
    )
    if not os.path.exists(path):
        abort(404)
    with ZipFile(path, 'r') as z:
        files = [x for x in z.namelist() if x.startswith(solution_key)]
        if not files:
            abort(404)
        keyLength = len(solution_key)
        found = [x for x in files if x == f'{solution_key}/{file_name}']
        if found:
            with z.open(found[0], 'r') as f:
                return Response(
                    f.read().decode('utf-8'),
                    mimetype='text/xml'
                )
        abort(404)

@app.route('/solutions/upload', methods=['POST'])
def upload_solution():
    filename = request.data.get('filename', None)
    if not filename:
        return 'Missing argument \'filename\'', 400
    filename = secure_filename(filename)
    if not re.match('[a-f\d]+\.zip', filename):
        return 'Invalid filename.  Valid names are [0-9,a-f].zip', 400
    f = request.files.get('file', None)
    if not f:
        return "Missing argument 'file'", 400
    outPath = os.path.join(app.config['SOLUTION_UPLOAD_FOLDER'], filename + '.zip')
    f.save(outPath)
    return "OK"
