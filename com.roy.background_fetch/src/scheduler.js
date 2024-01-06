const schedule = require('node-schedule');
const { ToadScheduler, SimpleIntervalJob, Task } = require('toad-scheduler')
const backgroundTask = new ToadScheduler();

const taskConfiguration = {
    runImmediately: false,
    days: null,
    hours: null,
    minutes: null,
    seconds: null,
    milliseconds: null,
    taskId: ""
};

var runningTaskIds = [], runningTask;

const scheduleTask = (taskToDo, errorCallback) => {
    var i = 0;
    if (!taskConfiguration.taskId) {
        errorCallback("Task id is required for running background task!");
        return;
    };

    if (typeof (taskToDo) !== 'function') {
        errorCallback("Task should be function!");
        return;
    };

    if (typeof (taskToDo) === 'function' && taskConfiguration.taskId) {
        runningTaskIds.push(taskConfiguration.taskId);
        runningTask = new Task(taskConfiguration.taskId, () => {
            taskToDo();
        });
        const job = new SimpleIntervalJob(
            taskConfiguration,
            runningTask,
            { id: taskConfiguration.taskId }
        );
        backgroundTask.addSimpleIntervalJob(job);
    } else {
        if (errorCallback) {
            errorCallback("nothing to do in background task!")
            return;
        }
    }
};

const taskStatus = (taskId, callback) => {
    try {
        const task = backgroundTask.getById(taskId);
        if (callback) {
            callback(task.getStatus())
        } else {
            throw "Callback function is required"
        }
    } catch (err) {
        callback(`task may not running, with ${taskId}`);
    }

};

const stopTaskById = (taskId, callback) => {
    try {
        const task = backgroundTask.getById(taskId);
        if (!task && typeof (callback) === "function") {
            callback(`task not running, with ${taskId}`);
        }
        if (typeof (callback) === "function" && task) {
            const index = runningTaskIds.indexOf(taskId);
            if (index > -1) {
                runningTaskIds.splice(index, 1);
            }

            backgroundTask.stopById(taskId);
            callback(`task ${taskId} stopped.`)
        }
    } catch (err) {
        if (callback) callback(`task may not running, with ${taskId}`);
    }
};


const removeTaskById = (taskId, callback) => {
    try {
        const task = backgroundTask.getById(taskId);
        if (!task && typeof (callback) === "function") {
            const index = runningTaskIds.indexOf(taskId);
            if (index > -1) {
                runningTaskIds.splice(index, 1);
            }

            callback(`task not running, with ${taskId}`);
        }
        if (typeof (callback) === "function" && task) {
            backgroundTask.removeById(taskId);
            callback(`task ${taskId} stopped.`)
        }
    } catch (err) {
        if (callback) callback(`task may not running, with ${taskId}`);
    }
}

module.exports = {
    scheduleTask,
    taskConfiguration,
    backgroundTask,
    taskStatus,
    stopTaskById,
    removeTaskById,
    runningTaskIds
}