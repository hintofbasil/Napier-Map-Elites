#!/usr/bin/env python

"""
Clears solution file locks.

Assumes environment variables are set
equal to flask configuration.
"""

import glob
import time
import os

import click

from main import app

@click.command()
@click.option('--age', help='The minimum age of the lock in seconds',
              default=0, type=int)
@click.option('--ignore-locks', help='Don\'t delete file locks',
              is_flag=True)
@click.option('--delete-solutions', help='Delete solution files',
              is_flag=True)
def run(**args):
    """ Main module body """
    flag = False
    if not args['ignore_locks']:
        flag = flag or delete_files(args['age'], '.zip.lock')
    if args['delete_solutions']:
        flag = flag or delete_files(args['age'], '.zip')
    if not flag:
        print('No files deleted')

def delete_files(age, extension):
    """
    Delete all files in the solutions folder with the given extension.  Only
    deletes if they are older than max age.
    Returns whether a file was deleted.
    """
    lock_files = glob.iglob(app.config['SOLUTION_UPLOAD_FOLDER'] +
                            '/*' + extension)
    if age:
        lock_files = filter(lambda x: time.time() - os.path.getmtime(x) >
                            age, lock_files)
    lock_files = list(lock_files)
    if not lock_files:
        return False
    for lock_file in lock_files:
        print("Removing lock file: " + lock_file)
        os.remove(lock_file)
    return True

if __name__ == '__main__':
    run()
