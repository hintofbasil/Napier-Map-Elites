import errno
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

def try_lock_solution(filename):
    """
    Checks if solution lock exists and creates one if it doesn't.
    This operation is atomic on certain file systems.
    See https://stackoverflow.com/a/10979569 for details.
    Returns true on successful lock or false on unsuccessful lock.
    """
    path = os.path.join(
        app.config['SOLUTION_UPLOAD_FOLDER'],
        filename + '.lock'
    )
    try:
        # These flags throw an error when opening the file if it doesn't exist.
        # They also create the file on open.
        os.open(path, os.O_CREAT | os.O_EXCL)
        print('Locked ' + filename)
        return True
    except OSError as err:
        if err.errno == errno.EEXIST:
            print('Failed to lock ' + filename)
            return False
        else:
            # Not the error we were expecting.
            raise err

def unlock_solution(filename):
    """ Deletes a solution lock file """
    path = os.path.join(
        app.config['SOLUTION_UPLOAD_FOLDER'],
        filename + '.lock'
    )
    print('Unlocking ' + filename)
    os.remove(path)

@app.route('/solutions/upload/<filename>', methods=['POST'])
def upload_solution(filename):
    """ Endpoint for uploading a solutions zip file """
    if not filename:
        return 'Missing argument \'filename\'', 400
    filename = secure_filename(filename)
    if not re.match(r'^[a-f\d]+\.zip$', filename):
        return 'Invalid filename.  Valid names are [0-9,a-f].zip', 400
    if not try_lock_solution(filename):
        return "Another file upload is currently in progress for this dataset", 400
    upload_file = request.files.get('file', None)
    if not upload_file:
        return "Missing argument 'file'", 400
    out_path = os.path.join(app.config['SOLUTION_UPLOAD_FOLDER'], filename)
    upload_file.save(out_path)
    unlock_solution(filename)
    return "OK"
