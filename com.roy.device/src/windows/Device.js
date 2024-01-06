const os = require('os');

const device ={
    device_name:os.hostname(),
    os_type:os.type(),
    platform:os.platform(),
    architecture:os.arch(),
    cpu:os.cpus(),
    free_memory:os.freemem(),
    total_memory:os.totalmem(),
    home_dir:os.homedir(),
    machine:os.machine(),
    network_adaptor:os.networkInterfaces(),
    user_info:os.userInfo(),
    version:os.release(),
    os_variant:os.version()

}

module.exports = device;