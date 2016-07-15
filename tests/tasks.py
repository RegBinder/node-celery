import logging
import os

from celery import Celery


celery = Celery('tasks', broker=os.environ['CELERY_BROKER_URL'])

celery_opts = {k: v for (k, v) in os.environ.items() if k.startswith('CELERY_')}
celery.conf.update(**celery_opts)


@celery.task
def add(x, y):
    return x + y


@celery.task
def sleep(x):
    time.sleep(x)
    return x


@celery.task
def time():
    import time
    return time.time()


@celery.task
def error(msg):
    raise Exception(msg)


@celery.task
def echo(msg):
    return msg


@celery.task
def send_email(to='me@example.com', title='hi'):
    logging.info("Sending email to '%s' with title '%s'" % (to, title))


if __name__ == '__main__':
    celery.start()
