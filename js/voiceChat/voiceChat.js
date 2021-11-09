var g_voiceChat = {
    inited: false,
    support: false,
    audio: undefined,
    init: () => {
       if(g_voiceChat.inited) return;
        loadJs('js/voiceChat/recorder.js', () => {
            loadJs('js/voiceChat/stream.js', () => {
                g_voiceChat.inited = true;
                g_voiceChat.audio = new audiostream(function() {
                    console.log('授权成功');
                    g_voiceChat.support = true;
                }, function(e) {
                    console.error('授权失败');
                });
                g_voiceChat.audio.pipe = function(ev) {
                    var blob = ev.data;
                    var reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = function() {
                        var base64data = reader.result;
                        queryMsg({ type: 'stream', data: base64data }, true);
                        //g_voiceChat.playerBlobAudio(g_voiceChat.dataURItoBlob(base64data));
                    }
                    // return;
                    // g_voiceChat.playerBlobAudio(blob);
                };

                // registerAction('', (dom, action, params) => {

                // });
                registerRevice('stream', (data) => {
                    g_voiceChat.playerBlobAudio(g_voiceChat.dataURItoBlob(data.data));
                });

                registerRevice('reviceStream', (data) => {
                    alertMsg(data, '🎤マイク: ' + (data.data ? 'ON' : 'OFF'));
                });
            });
        })

    },

    setEnable: (enable) => {
      g_config.voiceChat = enable;
      local_saveJson('config', g_config);
        queryMsg({ type: 'reviceStream', data: enable }, true);
        if (enable && !g_voiceChat.inited) return g_voiceChat.init();
        if(enable){
          g_voiceChat.Recorder.start(1000)
        }else{
          g_voiceChat.Recorder.stop()
        }
    },
    playerBlobAudio: (blob) => {
        var url = URL.createObjectURL(blob);
        var audio = document.getElementsByTagName("audio")[0];
        g_voiceChat.audio = audio;
        audio.src = url;
    },

    dataURItoBlob: (dataURI) => {
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]; // mime类型
        var byteString = atob(dataURI.split(',')[1]); //base64 解码
        var arrayBuffer = new ArrayBuffer(byteString.length); //创建缓冲数组
        var intArray = new Uint8Array(arrayBuffer); //创建视图

        for (var i = 0; i < byteString.length; i++) {
            intArray[i] = byteString.charCodeAt(i);
        }
        return new Blob([intArray], { type: mimeString });
    }
}

$('#switch-tsuwa').prop('checked', g_config.voiceChat);
