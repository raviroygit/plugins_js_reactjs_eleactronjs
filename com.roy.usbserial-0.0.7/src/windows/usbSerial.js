const { SerialPort } = require('serialport')
const { usb } = require('usb');

var serialport, isOpen = false, isClosed = false;
const getDevices = async (callback) => {
  const serial = await SerialPort.list();
  const expectedDevice = serial?.length > 0 && serial.filter(d => d.manufacturer === 'FTDI');

  if (callback) {
    callback(expectedDevice);
  }
};

const alreadyConnectedDeviceCall = async (callback) => {
  const serialDevice = await SerialPort.list();
  const expectedDevice = serialDevice?.length > 0 && serialDevice.filter(d => d.manufacturer === 'FTDI');
  if (expectedDevice.length > 0 && expectedDevice[0]?.path) {
    if (!isOpen) {
      const config = {
        path: expectedDevice.length > 0 && expectedDevice[0].path,
        baudRate: 9600,
        dataBits: 8,
        parity: 'none',
        autoOpen: false
      };
      serialport = new SerialPort(config);
      await serialport.open(async err => {
        if (err && callback) {
          callback(err)
        } else {
          serialport.set({ dtr: true, rts: true })
          serialport?.emit('data');
          isOpen = serialport.port;
          if (callback) {
            callback("connected")
          }
        };
      });
    } else {
      if (callback) {
        callback("port already open!")
      }
    }
  } else {
    if (callback) {
      callback("device not connected!")
    }
  }

}



const serialPortOpen = async (callback) => {
  if (!isOpen || isClosed) {
    await alreadyConnectedDeviceCall(callback);
  }
  usb.on('attach', async function (device) {
    const serialDevice = await SerialPort.list();
    const expectedDevice = serialDevice?.length > 0 && serialDevice.filter(d => d.manufacturer === 'FTDI');
    if (!isOpen) {
      const config = {
        path: expectedDevice.length > 0 && expectedDevice[0].path,
        baudRate: 9600,
        dataBits: 8,
        parity: 'none',
        autoOpen: false
      };
      if (!serialport) {
        serialport = new SerialPort(config);
      }
      serialport.open(async err => {
        if (err) {
          callback(err)
        } else {
          serialport.set({ dtr: true, rts: true })
          serialport?.emit('data')
          if (callback) {
            callback("connected")
          }
        };
      });
    }

  });
  usb.on('detach', async function (device) {
    await serialport.close(() => {
      isClosed = true;
      isOpen = null;
    });
  })

};

const closePort = (callback) => {
  if (serialport.isOpen) {
    serialport.close(function () {
      if (callback) {
        callback("disconnected");
      }
    });
  } else {
    if (callback) {
      callback("port already closed!");
    }
  }

}

const listenData = (callback) => {
  serialport?.on('data', (data) => {
    if (callback) {
      callback(data)
    }
    if (data) {
      serialport.close(() => {
        isClosed = true;
        isOpen = null;
      });
    }
    return data;
  })
}

module.exports = {
  getDevices,
  serialPortOpen,
  closePort,
  listenData,
}