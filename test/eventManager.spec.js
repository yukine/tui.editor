import EventManager from '../src/js/eventManager';

describe('eventManager', function() {
    var em;

    beforeEach(function() {
        em = new EventManager();
    });

    afterEach(function() {
        $('body').empty();
    });

    describe('Event registration', function() {
        it('should throw exception when it use not registered event type', function() {
            expect(function() {
                em.listen('testNoEvent', function() {});
            }).toThrow(new Error('There is no event type testNoEvent'));
        });

        it('should throw exception when it register event type that already have', function() {
            em.addEventType('testAlreadyHaveEvent');

            expect(function() {
                em.addEventType('testAlreadyHaveEvent');
            }).toThrow(new Error('There is already have event type testAlreadyHaveEvent'));
        });
    });

    describe('Event', function() {
        beforeEach(function() {
            em.addEventType('testEvent');
            em.addEventType('testEventHook');
        });

        it('should emit and listen event', function() {
            var handler = jasmine.createSpy('handler');

            em.listen('testEvent', handler);
            em.emit('testEvent');

            expect(handler).toHaveBeenCalled();
        });

        it('emit should return value that returned by listener', function() {
            var result,
            count = 0;

            em.listen('testEventHook', function() {
                return count;
            });

            em.listen('testEventHook', function() {
                count += 1;
                return count;
            });

            result = em.emit('testEventHook');

            expect(result).toEqual([0, 1]);
        });

        it('emit should return undefined if listener have not return value', function() {
            var handler = jasmine.createSpy('handler'),
            result;

            em.listen('testEvent', handler);
            result = em.emit('testEvent');

            expect(result).toBeUndefined();
        });

        it('emit event handler added with namespace', function() {
            var handler = jasmine.createSpy('handler');

            em.listen('testEvent.ns', handler);
            em.emit('testEvent');
            expect(handler).toHaveBeenCalled();
        });
    });
    describe('emitReduce()', function() {
        beforeEach(function() {
            em.addEventType('reduceTest');
        });

        it('emit handlers reduce style return value', function() {
            em.listen('reduceTest', function(data) {
                data += 1;
                return data;
            });

            em.listen('reduceTest', function(data) {
                data += 2;
                return data;
            });

            expect(em.emitReduce('reduceTest', 1)).toEqual(4);
        });

        it('emitReduce can have additional parameter', function() {
            em.listen('reduceTest', function(data, addition) {
                data += addition;
                return data;
            });

            em.listen('reduceTest', function(data, addition) {
                data += (addition + 1);
                return data;
            });
            expect(em.emitReduce('reduceTest', 1, 2)).toEqual(6);
        });

        it('emitReduce pass handler return value if return value is falsy', function() {
            em.listen('reduceTest', function() {
                return;
            });

            em.listen('reduceTest', function(data, addition) {
                data += (addition + 1);
                return data;
            });
            expect(em.emitReduce('reduceTest', 1, 2)).toEqual(4);
        });
    });

    describe('remove handler', function() {
        var handlerBeRemoved, handlerBeRemained;
        beforeEach(function() {
            handlerBeRemoved = jasmine.createSpy('handlerBeRemoved');
            handlerBeRemained = jasmine.createSpy('handlerBeRemained');
            em.addEventType('myEvent');
            em.addEventType('myEvent2');
        });

        it('remove all event handler by event', function() {
            em.listen('myEvent', handlerBeRemoved);
            em.listen('myEvent.ns', handlerBeRemoved);

            em.removeEventHandler('myEvent');

            em.emit('myEvent');

            expect(handlerBeRemoved).not.toHaveBeenCalled();
        });

        it('remove all event handler by namespace', function() {
            em.listen('myEvent.ns', handlerBeRemoved);
            em.listen('myEvent2.ns', handlerBeRemoved);
            em.listen('myEvent', handlerBeRemained);

            em.removeEventHandler('.ns');

            em.emit('myEvent');
            em.emit('myEvent2');

            expect(handlerBeRemoved).not.toHaveBeenCalled();
            expect(handlerBeRemained).toHaveBeenCalled();
        });

        it('remove specific event handler by namespace and type', function() {
            em.listen('myEvent.ns', handlerBeRemoved);
            em.listen('myEvent2.ns', handlerBeRemained);
            em.listen('myEvent', handlerBeRemained);

            em.removeEventHandler('myEvent.ns');

            em.emit('myEvent');
            em.emit('myEvent2');

            expect(handlerBeRemoved).not.toHaveBeenCalled();
            expect(handlerBeRemained).toHaveBeenCalled();
        });
    });
});
