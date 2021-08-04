var g_click = {
    startRecord: 0,
    endRecord: 0,
    recordTimer: 0,
};
var chunks = [];

var mediaRecorder;

function sendRecord() {
    var reader = new FileReader();
    reader.readAsDataURL(chunks[0]);
    reader.onloadend = function() {
        queryMsg({ type: 'voice', user: g_config.user.name, msg: reader.result});
        closeModal('modal-custom', 'voice', () => {
            halfmoon.toggleModal('modal-custom')
        });
    }
}

function startRecord() {
    _record.pause();
    chunks = [];
    $('[data-action="record"]').addClass('text-primary');
    $('#record_start, #record_end').html('00:00');
    $('#record_progress').css('width', '0%');
    g_click.startRecord = getNow(false);
    mediaRecorder.start();
    console.log("录音中...");
    soundTip('./res/di.mp3');

    g_click.recordTimer = setInterval(() => {
        var s = getNow() - parseInt(g_click.startRecord);
        $('#record_end').html(getTime(s));
    }, 250);
}


function stopRecord(play = true) {
    if (mediaRecorder.state == "recording") {
        clearInterval(g_click.recordTimer);
        $('[data-action="record"]').removeClass('text-primary');
        console.log("录音结束");
        g_click.endRecord = getNow(false);
        g_click.play = play;
        mediaRecorder.stop();
    }
}

function switchRecord() {
    if (mediaRecorder.state !== "recording") {
        startRecord();
    } else {
        stopRecord();
    }
}

if (navigator.mediaDevices.getUserMedia) {
    const constraints = { audio: true };
    navigator.mediaDevices.getUserMedia(constraints).then(
        stream => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = e => {
                chunks.push(e.data);
            };

            mediaRecorder.onstop = e => {
                if(g_click.play){
                    var blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
                    var audioURL = window.URL.createObjectURL(blob);
                    _record.preview = audioURL;
                    _record.src = audioURL;
                }
            };
        },
        () => {
            //alert("授权失败！");
        }
    );
} else {
    // alert("浏览器不支持 getUserMedia");
}