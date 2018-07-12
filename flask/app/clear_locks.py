#!/bin/env python

"""
Clears solution file locks.

Assumes environment variables are set
equal so flask configuration.
"""

import glob
import time
import os

import click

from main import app

@click.command()
@click.option('--age', help='The minimum age of the lock in seconds',
              default=0, type=int)
def run(**args):
    """ Main module body """
    lock_files = glob.iglob(app.config['SOLUTION_UPLOAD_FOLDER'] +
                            '/*.zip.lock')
    if args['age']:
        lock_files = filter(lambda x: time.time() - os.path.getmtime(x) >
                            args['age'], lock_files)
    lock_files = list(lock_files)
    if not lock_files:
        print("No lock files removed")
    for lock_file in lock_files:
        print("Removing lock file: " + lock_file)
        os.remove(lock_file)

if __name__ == '__main__':
    run()
