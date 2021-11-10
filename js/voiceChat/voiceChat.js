var g_voiceChat = {
    instance: undefined,
    inited: false,
    support: false,
    audio: undefined,
    init: (callback) => {
        if (g_voiceChat.inited) return;
        loadJs('js/voiceChat/recorder.mp3.min.js', () => {
            g_voiceChat.inited = true;

            registerRevice('stream', (data) => {
                g_voiceChat.playerBlobAudio(g_voiceChat.dataURItoBlob(data.data));
            });

            registerRevice('reviceStream', (data) => {
                alertMsg(data, '🎤マイク: ' + (data.data ? 'ON' : 'OFF'));
            });

            callback();
        })

    },

    setEnable: (enable) => { // 麦克风开关
        $('#switch-mic').prop('checked',enable);
        g_config.voiceChat = enable;
        local_saveJson('config', g_config);
        queryMsg({ type: 'reviceStream', data: enable }, true);

        var callback = () => {
            if (enable) {
                recStart();
            } else {
                recStop();
            }
        }
         if(enable){
            g_voiceChat.serRevicealbe(enable);
        }
        if (enable && !g_voiceChat.inited) return g_voiceChat.init(callback);
    },

    serRevicealbe: (enable) => { // 总开关
        $('#switch-tsuwa').prop('checked',enable);
         g_config.voiceChat_all = enable;
        local_saveJson('config', g_config);
        if(!enable){
            g_voiceChat.setEnable(enable);
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


var testSampleRate=16000;
var testBitRate=16;

var SendInterval=300;//mp3 chunk数据会缓冲，当pcm的累积时长达到这个时长，就会传输发送。这个值在takeoffEncodeChunk实现下，使用0也不会有性能上的影响。

//重置环境
var RealTimeSendTryReset=function(){
    realTimeSendTryTime=0;
};

var realTimeSendTryTime=0;
var realTimeSendTryNumber;
var transferUploadNumberMax;
var realTimeSendTryBytesChunks;
var realTimeSendTryClearPrevBufferIdx;

//=====实时处理核心函数==========
var RealTimeSendTry=function(chunkBytes,isClose){
    if(chunkBytes){//推入缓冲再说
        realTimeSendTryBytesChunks.push(chunkBytes);
    };
    
    var t1=Date.now();
    if(!isClose && t1-realTimeSendTryTime<SendInterval){
        return;//控制缓冲达到指定间隔才进行传输
    };
    realTimeSendTryTime=t1;
    var number=++realTimeSendTryNumber;
    
    
    //mp3缓冲的chunk拼接成一个更长点的mp3
    var len=0;
    for(var i=0;i<realTimeSendTryBytesChunks.length;i++){
        len+=realTimeSendTryBytesChunks[i].length;
    };
    var chunkData=new Uint8Array(len);
    for(var i=0,idx=0;i<realTimeSendTryBytesChunks.length;i++){
        var chunk=realTimeSendTryBytesChunks[i];
        chunkData.set(chunk,idx);
        idx+=chunk.length;
    };
    realTimeSendTryBytesChunks=[];
    
    //推入传输
    var blob=null,meta={};
    if(chunkData.length>0){//mp3不是空的
        blob=new Blob([chunkData],{type:"audio/mp3"});
        meta=Recorder.mp3ReadMeta([chunkData.buffer],chunkData.length)||{};//读取出这个mp3片段信息
    };
    TransferUpload(number
        ,blob
        ,meta.duration||0
        ,{set:{
            type:"mp3"
            ,sampleRate:meta.sampleRate
            ,bitRate:meta.bitRate
        }}
        ,isClose
    );
    }

//=====实时处理时清理一下内存（延迟清理），本方法先于RealTimeSendTry执行======
var RealTimeOnProcessClear=function(buffers,powerLevel,bufferDuration,bufferSampleRate,newBufferIdx,asyncEnd){
    if(realTimeSendTryTime==0){
        realTimeSendTryTime=Date.now();
        realTimeSendTryNumber=0;
        transferUploadNumberMax=0;
        realTimeSendTryBytesChunks=[];
        realTimeSendTryClearPrevBufferIdx=0;
    };
    
    //清理PCM缓冲数据，最后完成录音时不能调用stop，因为数据已经被清掉了
    //这里进行了延迟操作（必须要的操作），只清理上次到现在的buffer
    for(var i=realTimeSendTryClearPrevBufferIdx;i<newBufferIdx;i++){
        buffers[i]=null;
    };
    realTimeSendTryClearPrevBufferIdx=newBufferIdx;

};

//=====数据传输函数==========
var TransferUpload=function(number,blobOrNull,duration,blobRec,isClose){
    transferUploadNumberMax=Math.max(transferUploadNumberMax,number);
    if(blobOrNull){
        var blob=blobOrNull;
        
        //*********Read As Base64***************
        var reader=new FileReader();
        reader.onloadend=function(){
            queryMsg({ type: 'stream', data:  reader.result }, true);

        };
        reader.readAsDataURL(blob);
    };
    
    if(isClose){
        console.log('close');
    };
};


//调用录音
var rec;
function recStart(){
    window.sonicAsync&&sonicAsync.flush();
    window.sonicAsync=null;
    

    if(rec){
        rec.close();
    };
    
    rec=Recorder({
        type:"mp3"
        ,sampleRate:testSampleRate
        ,bitRate:testBitRate
        ,onProcess:function(buffers,powerLevel,bufferDuration,bufferSampleRate,newBufferIdx,asyncEnd){
        //  Runtime.Process.apply(null,arguments);
            
            RealTimeOnProcessClear(buffers,powerLevel,bufferDuration,bufferSampleRate,newBufferIdx,asyncEnd);//实时数据处理，清理内存

        }
        ,takeoffEncodeChunk:function(chunkBytes){
            //接管实时转码，推入实时处理
            RealTimeSendTry(chunkBytes,false);
        }
    });
    
    var t=setTimeout(function(){
        console.log("无法录音：权限请求被忽略（超时假装手动点击了确认对话框）",1);
    },8000);
    
    rec.open(function(){//打开麦克风授权获得相关资源
        clearTimeout(t);
        rec.start();//开始录音
        
        RealTimeSendTryReset();//重置
    },function(msg,isUserNotAllow){
        clearTimeout(t);
        console.log((isUserNotAllow?"UserNotAllow，":"")+"无法录音:"+msg, 1);
    });
};
function recStop(){
    if(rec){
          rec.close();//直接close掉即可，这个例子不需要获得最终的音频文件
         RealTimeSendTry(null,true);//最后一次发送
    }
};

