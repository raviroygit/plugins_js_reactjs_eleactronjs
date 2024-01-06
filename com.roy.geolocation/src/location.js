const geoLocationPermission = (callback) => {
    navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "granted") {
            if (callback) callback(result.state);
        } else if (result.state === "prompt") {
            if (callback) callback(result.state);
            navigator.geolocation.getCurrentPosition(
                revealPosition,
                positionDenied,
                geoSettings,
            );
        } else if (result.state === "denied") {
            if (callback) callback(result.state);
        }
        result.addEventListener("change", () => {
            if (callback) callback(result.state);
        });
    });
}

const getLocation = (successCallback, errorCallback) => {
    const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
    };

    function success(pos) {
        if (successCallback) successCallback(pos.coords);
    }

    function error(err) {
        if (errorCallback) errorCallback(`ERROR(${err.code}): ${err.message}`);
    }

    navigator.geolocation.getCurrentPosition(success, error, options);
}

module.exports = {
    geoLocationPermission,
    getLocation
}