import os

def get_base_folder():
    return os.path.dirname(os.path.realpath(__file__))

class Config:
    DEBUG = True
    TESTING = True
    DEVELOPMENT = True
    CSRF_ENABLED = True
    SECRET_KEY = ''
    SQLALCHEMY_DATABASE_URI = ''
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SOLUTION_UPLOAD_FOLDER = os.path.join(get_base_folder(), 'solutions')
    MAX_CONTENT_LENGTH = 2 * 1024 * 1024 * 1024 # 2GB

class Testing(Config):
    CSRF_ENABLED = False
    SECRET_KEY = 'change_me'
    SQLALCHEMY_DATABASE_URI = 'sqlite:////tmp/test.db'

class Development(Config):
    CSRF_ENABLED = False
    SECRET_KEY = 'change_me'
    SQLALCHEMY_DATABASE_URI = 'sqlite:////tmp/test.db'

class Docker(Config):
    DEVELOPMENT = False
    DEBUG = False
    TESTING = False
    SECRET_KEY = os.environ['SECRET_KEY']
    SQLALCHEMY_DATABASE_URI = 'mysql://flask:{}@db/{}'.format(
        os.environ['DB_PASSWORD'],
        os.environ['DB_DATABASE']
    )
    SOLUTION_UPLOAD_FOLDER = os.path.abspath('/var/map-elites/solutions')
