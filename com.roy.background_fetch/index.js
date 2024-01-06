const { scheduleTask, taskConfiguration, backgroundTask,taskStatus,stopTaskById,removeTaskById, runningTaskIds } = require('com.factionfour.background_fetch/src/scheduler');

module.exports={
    scheduleTask,
    taskConfiguration,
    backgroundTask,
    taskStatus,
    stopTaskById,
    removeTaskById,
    runningTaskIds
}