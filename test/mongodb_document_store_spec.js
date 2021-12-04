var assert = require('assert');
var MongoDocumentStore = require('../lib/document_stores/mongo');


describe('mongodb_document_store', () => {
    
    it('should be able to set a key and have an expiration set', () => {
        var store = new MongoDocumentStore({ expire: 10 });
        store.set('hello1', 'world', function () {
            var assert = require('assert');('hello1', function (err, res) {
                if(res) {
                    assert.equal('hello1', res);
                }
                done();
            });
        })
    });

    // it('should create new task', () => {
    //     return service.addTask({ name: 'next', completed: false })
    //         .then(task => {
    //             expect(task.name).to.equal('next')
    //             expect(task.completed).to.equal(false)
    //         })
    //         .then(() => service.getTasks())
    //         .then(tasks => {
    //             expect(tasks.length).to.equal(2)
    //             expect(tasks[1].name).to.equal('next')
    //         })
    // })

    // it('should remove task', () => {
    //     return service.getTasks()
    //         .then(tasks => tasks[0]._id)
    //         .then(taskId => service.deleteTask(taskId))
    //         .then(() => service.getTasks())
    //         .then(tasks => {
    //             expect(tasks.length).to.equal(0)
    //         })
    // })
})