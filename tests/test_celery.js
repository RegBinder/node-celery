var celery = require('../celery'),
    assert = require('assert');

var conf = {
    CELERY_BROKER_URL: 'amqp://guest@rabbit:5672//',
    CELERY_RESULT_BACKEND: 'redis://redis:6379/1',
    CELERY_TASK_SERIALIZER: 'json',
    CELERY_RESULT_SERIALIZER: 'json'
};
var conf_redis = {
    CELERY_BROKER_URL: 'redis://redis:6379/2',
    CELERY_RESULT_BACKEND: 'redis://redis:6379/1',
    CELERY_TASK_SERIALIZER: 'json',
    CELERY_RESULT_SERIALIZER: 'json'
};

describe('celery functional tests', function() {
    describe('initialization', function() {
        it('should create a client without error', function(done) {
            var client1 = celery.createClient(conf),
                client2 = celery.createClient({
                    CELERY_BROKER_URL: 'amqp://foo'
                });

            client1.on('connect', function() {
                done();
            });

            client1.on('error', function(exception) {
                console.log('Expected a successful connection for client1: ', exception);
                // assert.ok(false);
            });

            client1.once('end', function() {
                done();
            });

            client2.on('ready', function() {
                assert.ok(false);
            });

            client2.on('error', function(exception) {
                assert.ok(exception);
            });

            client2.once('end', function() {
                assert.ok(false);
            });
        });
    });

    describe('basic task calls', function() {
        it('should call a task without error', function(done) {
            var client = celery.createClient(conf),
                add = client.createTask('tasks.add');

            client.on('connect', function() {
                add.call([1, 2]);

                setTimeout(function() {
                    done();
                }, 100);
            });
        });

        it('should call a task without error', function(done) {
            var client = celery.createClient(conf_redis),
                add = client.createTask('tasks.add');

            client.on('connect', function() {
                add.call([1, 2]);

                setTimeout(function() {
                    done();
                }, 100);
            });
        });
    });

    // describe('result handling with amqp backend', function() {
    //     it('should return a task result', function(done) {
    //         if (conf.CELERY_RESULT_BACKEND !== 'amqp') done();
    //         var client = celery.createClient(conf),
    //             add = client.createTask('tasks.add');

    //         client.on('connect', function() {
    //             var result = add.call([1, 2]);
    //             result.on('ready', function(message) {
    //                 assert.equal(message.result, 3);
    //                 done();
    //             });
    //         });
    //     });
    // });

    describe('result handling with redis backend', function() {
        it('should return a task result', function(done) {
            var client = celery.createClient(conf),
                add = client.createTask('tasks.add');

            client.on('connect', function() {
                var result = add.call([9, 9]);
                result.once('ready', function(result) {
                    assert.equal(result.result, 18);
                    done();
                });
            });

        });
    });

    describe('eta', function() {
        it('should call a task with a delay', function(done) {
            if (conf.CELERY_RESULT_BACKEND !== 'amqp') done();
            var client = celery.createClient(conf),
                time = client.createTask('tasks.time');

            client.on('connect', function() {
                var start = new Date()
                    .getTime(),
                    eta = new Date(start + 100000);
                var result = time.call(null, null, {
                    eta: eta
                });
                result.on('ready', function(message) {
                    //assert.ok(parseInt(message.result) - start > 1);
                    done();
                });
            });
        });
    });

    describe('expires', function() {
        it('should call a task which expires', function(done) {
            if (conf.CELERY_RESULT_BACKEND !== 'amqp') done();
            var client = celery.createClient(conf),
                time = client.createTask('tasks.time');

            client.on('connect', function() {
                var past = new Date(new Date()
                    .getTime() - 60 * 60 * 1000),
                    result = time.call(null, null, {
                        expires: past
                    });
                result.on('ready', function(message) {
                    assert.equal(message.status, 'REVOKED');
                    done();
                });
            });
        });
    });
});
