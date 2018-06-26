#!/bin/python

import random
import string

import click
from click import BadParameter;

@click.command()
@click.argument('column_count', type=int)
@click.option('--names', help='A comma separated list of column names.  \
Missing values with be randomly generated')
@click.option('--norm', default=20, type=int,
              help='The approximate maximum normalised value')
@click.option('--evals', default=300000, type=int,
              help='The number of evaluations to generate')
def generate(**args):
    if args['names'] == None:
        args['names'] = ',' * (args['column_count'] - 1)
    args['names'] = args['names'].split(',')
    if len(args['names']) != args['column_count']:
        raise BadParameter('Names - Must be the same length as COLUMN_COUNT')
    args['names'] = populate_column_names(args['names']);
    generate_file(**args)

def populate_column_names(names):
    return [x or random_string(10) for x in names]

def random_string(length):
    return ''.join(random.choice(string.ascii_lowercase) for i in range(length))

def generate_file(column_count, norm, evals, names):
    actualNames = map(lambda x: 'Actual' + x, names)
    print(f'Dimensions,{column_count}')
    print(f'Normalised,{norm}')
    print(f'evals,{evals}')
    print(f'key,dist,{",".join(names)},{",".join(actualNames)}')
    for _ in range(evals):
        keys = list(map(lambda x: str(random.choice(range(norm))),
                        range(column_count)))
        values = map(lambda x: str(random.choice(range(100000)) + 100000), range(column_count))
        dist = random.choice(range(100000)) + 100000
        print(f'{":".join(keys)},{dist},{",".join(keys)},{",".join(values)}')

if __name__=='__main__':
    generate()
