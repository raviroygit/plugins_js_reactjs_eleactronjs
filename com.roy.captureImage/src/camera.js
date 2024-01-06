const constraints = { facingMode: 'environment', "video": { width: { exact: 400 } }, advanced: [{ focusMode: "continuous" }] };
var imageCapturer, videoRef;

function gotMedia(mediastream, videElement) {
    videoRef = videElement;
    let video = videElement.current;
    video.srcObject = mediastream;
    video.play();
    videElement.srcObject = mediastream;
    var videoTrack = mediastream.getVideoTracks()[0];
    imageCapturer = new ImageCapture(videoTrack);
}

const startCamera = async (videElement, errorCallback) => {
    const status = await navigator.permissions.query({ name: "camera" });
    console.log(typeof (status), status.state, status?.PermissionStatus?.state)
    if (status?.state === "granted") {
        navigator.mediaDevices.getUserMedia({ video: constraints })
            .then((steam) => gotMedia(steam, videElement))
            .catch(err => {
                if (errorCallback) {
                    errorCallback("Something went wrong!: " + err);
                }
            });

    } else {
        errorCallback("Camera permissions denied!: " + err);
    }

};


const takePicture = (canvasElement, callback,errorCallback) => {
    if(canvasElement?.current && videoRef?.current){
        var context = canvasElement.current.getContext('2d');

        context.drawImage(videoRef.current, 0, 0, canvasElement.current.width, canvasElement.current.height);
        var img_data = canvasElement.current.toDataURL('image/jpg');
        if (img_data) {
            stopCamera();
        }
        if (callback) {
            callback(img_data);
        }
    }else{
        if(errorCallback){
            errorCallback("Camera not started yet!");
        }
    }


}

function stopCamera() {
    const stream = videoRef.srcObject;
    const tracks = stream.getTracks();

    tracks.forEach((track) => {
        track.stop();
    });

    videoRef.srcObject = null;
}

module.exports = {
    startCamera,
    stopCamera,
    takePicture
}

