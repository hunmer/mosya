var _audio = $('#audio')[0];
var _audio2 = $('#soundTip')[0];
var _record = $('#record')[0];
var _video = $('#video')[0];
var g_json;

var g_cache = {
    logined: false,
    unread: 0,
    post: undefined,
    video: undefined,
}
var _viewer;
$(function() {
    if (_GET['user']) {
        setUser(_GET['user']);
    }
    var save = false;
    if (typeof(g_config.user.name) != 'string' || g_config.user.name == '') {
        var user = prompt('input user name', '');
        if (user == '' || user == null) {
            return;
        }
        g_config.user.name = user;
        save = true;
    }
    setUser(g_config.user.name, save);
});

function init(){
    if(g_cache.inited) return;

    $('body').show();
    initWebsock();
    _audio.onplay = () => {
        $('i[data-action="audio_play"]').prop('class', 'fa fa-pause');
    }
    _audio.onpause = () => {
        $('i[data-action="audio_play"]').prop('class', 'fa fa-play');
    }

    _audio.oncanplay = () => {
        $('.progress-group-label').find('i').prop('class', 'fa fa-check-circle text-success font-size-16');
    }

    _audio.ontimeupdate = () => {
        var s = _audio.currentTime;
        $('#audio_progress').css('width', parseInt(s / _audio.duration * 100) + '%');
    }

    _audio.onended = () => {
        doAction(null, 'audio_next');
    }

    _record.ontimeupdate = (event) => {
        var s = _record.currentTime;
        closeModal('modal-custom', 'voice', () => {
            $('#record_start').html(getTime(parseInt(s)));
        })
        $(_record._progress).find('.progress-bar').css('width', parseInt(s / _record.duration * 100) + '%');
    }

    _record.onplay = () => {
        _audio.volume = 0.25;
        if (_record.btn != undefined) {
            $(_record.btn).prop('class', 'fa fa-pause');
        }
    }
    _record.onpause = () => {
        if (_record.btn != undefined) {
            $(_record.btn).prop('class', 'fa fa-play');
        }
    }

    _record.onended = () => {
        _audio.volume = 1;
    }

    $(document).on('click', '[data-action]', function(event) {
            doAction(this, $(this).attr('data-action'));
        })
        .on('click', '.progress', function(event) {
            var id = $(this).attr('data-audio');
            if (id != undefined) {
                var player = $('#' + id)[0];
                player._progress = this;

                var src = $(this).attr('data-src');
                if (src != undefined && player.source != src) {
                    setAudioSrc(player, src);
                    return;
                }

                if (player.duration) {
                    player.currentTime = event.originalEvent.offsetX / $(this).width() * player.duration;
                    player.play();
                }
            }
        })

    

    _viewer = new Viewer($('#image')[0], {
        backdrop: 'static',
        navbar: 0,
        title: 0,
        toggleOnDblclick: false,
    });

    $('#image')[0].addEventListener('viewed', function() {
        if (this.viewer === _viewer) {
            $('#ftb_icons').show();
        }
    });

    $('#image')[0].addEventListener('hidden', function() {
        if (this.viewer === _viewer) {
            $('#ftb_icons').hide();
        }
    });

    //halfmoon.toggleModal('modal-custom');
    //doAction(null, 'toTab,video');

}

function setAudioSrc(player, src) {
    player.source = src;
    player.src = src;
}

function uploadImage(btn) {
    if (g_cache.upload) return;
    var img = $('#img_uploadImage')[0];
    if (img.title == '') {
        alert('upload image first');
        return;
    }
    if ($('select')[0].value == '') {
        $($('select').parents('.form-group')[0]).addClass('is-invalid');
        return;
    }
    g_cache.upload = true;
    $(btn).html('Uploading...');

    g_cache.post = {
        username: g_config.user.name,
        time: parseInt($('select')[0].value) * 60,
        title: $('#upload_title').val(),
        img: img.src,
    }
    queryMsg({ type: 'post', data: g_cache.post });
}

function sendImage() {
    var reader = new FileReader();
    reader.readAsDataURL($('#img_sendImage')[0].files[0]);
    reader.onload = (e) => {
        queryMsg({ type: 'msg', user: g_config.user.name, msg: '<img class="thumb" data-action="previewImage" src="'+e.currentTarget.result+'">' });
    }
}



function selectTime(dom) {
    if (dom.value == 'custom') {
        var min = prompt('input min', 120);
        if (min != null) {
            min = parseInt(min);
            if (min <= 0) {
                alert('error number');
                return;
            }
            $('select').find(':disabled').val(min).html(min + 'Min').prop('selected', true);
        }
    }
}

function setUser(name, save = false) {
    g_config.user.name = name;
    $('#img_user').attr('src', 'res/' + (['maki', 'chisato'].indexOf(name) != -1 ? name : 'user') + '.jpg')
    if (save) local_saveJson('config', g_config);
    if(!g_cache.inited){
        init();
    }
}

function saveImage (canvas, filename) {
    var image = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    saveFile(image, filename || 'file_' + new Date().getTime() + '.png');
        canvas.remove();
}
function saveFile(data, filename) {
    var eleLink = document.createElement('a');
    eleLink.style.display = 'none';
    eleLink.download = filename;
    eleLink.href = data;
    document.body.appendChild(eleLink);
    eleLink.click();
    document.body.removeChild(eleLink); 
}

function doAction(dom, action, params) {
    var action = action.split(',');
    switch (action[0]) {
        case 'saveScreenshoot':
            var canvas = document.createElement("canvas");
            canvas.width = _video.videoWidth;
            canvas.height = _video.videoHeight;
            canvas.crossOrigin = 'Anonymous';
            canvas.getContext('2d').drawImage(_video, 0, 0, canvas.width, canvas.height);
            saveImage(canvas, 'screen_' + new Date().getTime() + '.png'); 
            break;
        case 'fullContnet':
            $('#image_div').toggle();
            $(dom).find('i').prop('class', 'fa fa-arrow-' + ($('#image_div').css('display') == 'none' ? 'down' : 'up' ));
            break;
        case 'sendImage':
            $('#img_sendImage').click();
            break;
        case 'playSong_fromMsg':
            $('[data-vid="' + action[1] + '"]').click();
            break;
        case 'playVideo_fromMsg':
            $('#subContent_videoHistory [data-vid="' + action[1] + '"]').click();
            break;
        case 'playlist_set':
            halfmoon.deactivateAllDropdownToggles()
            var m = prompt('PLAYLIST URL', 'https://www.youtube.com/playlist?list=PLhZZuOohK5a09TxrOHvwECzWlkLPXb5n6');
            if (m != '' && m != null) {
                m = cutString(m + '&', '?list=', '&');
                if (m == '') {
                    alert('錯誤的url');
                    return;
                }
                $.getJSON('api/search.php?server=youtube&type=list&id=' + m, function(json, textStatus) {
                    if (textStatus == 'success') {
                        queryMsg({ type: 'playlist_set', user: g_config.user.name, data: json });
                    }
                });
            }
            break;
         case 'video_set':
            var m = prompt('VIDEO URL', 'https://www.youtube.com/watch?v=9MjAJSoaoSo');
            if (m != '' && m != null) {
                m = cutString(m + '&', '?v=', '&');
                if (m == '') {
                    return;
                }
                $.getJSON('api/search.php?server=youtube&type=id&id=' + m, function(json, textStatus) {
                    if (textStatus == 'success') {
                        queryMsg({ type: 'video', user: g_config.user.name, data: json });
                    }
                });
            }
            break;

        case 'playlist_add':
            halfmoon.deactivateAllDropdownToggles()
            var m = prompt('VIDEO URL', 'https://www.youtube.com/watch?v=9MjAJSoaoSo');
            if (m != '' && m != null) {
                m = cutString(m + '&', '?v=', '&');
                if (m == '') {
                    return;
                }
                $.getJSON('api/search.php?server=youtube&type=id&id=' + m, function(json, textStatus) {
                    if (textStatus == 'success') {
                        queryMsg({ type: 'playlist_add', user: g_config.user.name, data: json });
                    }
                });
            }
            break;
        case 'audio_play':
            if (_audio.paused) {
                _audio.play();
            } else {
                _audio.pause();
            }
            break;
        case 'audio_prev':
            var prev = $('[data-vid].bg-primary').prev();
            if (prev.length) prev.click();
            break;
        case 'audio_next':
            var next = $('[data-vid].bg-primary').next();
            if (next.length) {
                next.click();
            }
            break;
        case 'playSong':
            var src = 'api/search.php?server=youtube&type=url&id=' + $(dom).attr('data-vid');
            if (_audio.source != src) {
                $('#audio_progress').css('width', '0%');
                $('.progress-group-label').find('i').prop('class', 'fa fa-spinner text-primary font-size-16');
                setAudioSrc(_audio, src);
                $('#bottom_music img').attr('src', $(dom).find('img').attr('src'));
                $('[data-vid].bg-primary').removeClass('bg-primary');
                $(dom).addClass('bg-primary');
            }
            break;

        case 'playVideo':
            var vid = $(dom).attr('data-vid');
            var src = 'api/search.php?server=youtube&type=url&video=1&id=' + vid;
            if (_video.source != src) {
                _video.vid = vid;
                _video.poster = $(dom).find('img').attr('src');
                setAudioSrc(_video, src);
                $('#subContent_videoHistory [data-vid].bg-primary').removeClass('bg-primary');
                $(dom).addClass('bg-primary');
            }
            break;
        case 'record':
            switchRecord();
            break;

        case 'record_play':
            if (mediaRecorder.state == "recording") {
                stopRecord();
            }else{
                _record.play();
            }
            break;

        case 'record_send':
            sendRecord();
            break;

        case 'prompt_msg':
            var m = prompt('内容');
            if (m != '' && m != null) {
                queryMsg({ type: 'msg', user: g_config.user.name, msg: m });
            }
            break;
        case 'show_chat':
            doAction(null, 'toTab,chat');
            $('#modal-custom').find('.modal-title').html('チャット');
            $('#modal-custom').attr('data-type', 'chat').find('.modal-html').html( `
                <button class="btn btn-primary mb-10 float-right" data-action="prompt_msg">発信</button>
                `+ $('#content_chat').html());
            halfmoon.toggleModal('modal-custom');
            break;

        case 'show_musicPlayer':
                $('#modal-custom').find('.modal-title').html('プレイヤー');
                $('#modal-custom').attr('data-type', 'music').find('.modal-html').html($('#content_music').html());
                halfmoon.toggleModal('modal-custom');
            break;

        case 'show_recorder':
            $('#modal-custom').find('.modal-title').html('音声メッセージ');
            $('#modal-custom').attr('data-type', 'voice').find('.modal-html').html(`
                <div class="row">
                    <div class="progress col-12" data-audio="record">
                        <div class="progress-bar" id='record_progress' role="progressbar" style="width: 0%" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    <div class="col-12 mt-3">
                        <span class="float-left" id='record_start'>00:00</span>
                        <span class="float-right" id='record_end'>00:00</span>
                    </div>
                    <div class="col-12 mt-10 text-center">
                        <i class="fa fa-microphone " style="font-size: 2.5rem;" aria-hidden="true" data-action="record"></i>
                        <i data-action="record_play" class="fa fa-play" style="font-size: 5rem;margin-left: 30px;padding: 15px;margin-right: 30px;position: relative;bottom: -8px;" aria-hidden="true"></i>
                        <i data-action="record_send" class="fa fa-paper-plane text-primary" style="font-size: 2.5rem;" aria-hidden="true"></i>
                    </div>
                </div>`);
            $('#modal-custom').find('.close').on('click', () => {
                stopRecord(false);
                if (_record._progress_old) { // 调整显示进度条
                    _record._progress = _record._progress_old;
                    delete _record._progress_old;
                }
            });

            if (!_record.paused) {
                _record._progress_old = _record._progress; // 记录调整显示进度条
                $('#record_end').html(getTime(parseInt(_record.duration)));
                _record.onplay();
            }

            _record._progress = $('#modal-custom .progress')[0];
            _record.btn = 'i[data-action="record_play"]';
            halfmoon.toggleModal('modal-custom');
            break;
        case 'sendMsg':
            var msg = $('#msg').val();
            if (msg == '') return;
            $('#msg').val('');
            queryMsg({ type: 'msg', user: g_config.user.name, msg: msg });
            break;
        case 'playerList':
            updatePlaylist();
            halfmoon.toggleModal('modal-custom');
            break;
        case 'previewImage':
            $('#modal-img img').attr('src', dom.src);
            halfmoon.toggleModal('modal-img');
            break;
        case 'darkMode':
            halfmoon.toggleDarkMode();
            var i = $(dom).find('i');
            if ($('body').hasClass('dark-mode')) {
                i.attr('class', 'fa fa-moon-o');
            } else {
                i.attr('class', 'fa fa-sun-o');
            }
            break;
        case 'upload':
            $($('select').parents('.form-group')[0]).removeClass('is-invalid');
            halfmoon.toggleModal('modal-upload');
            break;
        case 'toTab':
            $('#tabs .btn-primary').removeClass('btn-primary');
            $('[data-action="toTab,'+action[1]+'"]').addClass('btn-primary');
            for (var con of $('.toolbar')) {
                if (con.id == 'bottom_' + action[1]) {
                    $(con).show();
                } else {
                    $(con).hide();
                }
            }
            for (var con of $('._content')) {
                if (con.id == 'content_' + action[1]) {
                    $(con).show();
                } else {
                    $(con).hide();
                }
            }
            switch (action[1]) {
                case 'chat':
                    g_cache.unread = 0;
                    $('#unread').hide();
                    break;
            }
            break;

         case 'tosubTab':
            // toTab,video,videoHistory
            doAction(null, 'toTab,'+action[1]);
            var par = $('#subContent_'+action[1]).show();

            par.find('[data-btn].btn-primary').removeClass('btn-primary');
            var btn = $('[data-btn=btn_"'+action[2]+'"]').addClass('btn-primary');
            var unread = btn.find('[data-clickHide]');
            console.log(par, btn, unread);
            if(unread.length > 0){
                unread.html('').hide();
            }
            for (var con of par.find('.subContent')) {
                if (con.id == action[2]) {
                    $(con).show();
                } else {
                    $(con).hide();
                }
            }
            break;
    }
}

function updatePlaylist() {
    $('#modal-custom').find('.modal-title').html('メンバー');
    var html = `
    <table class="table table-striped">
    <thead>
        <tr>
            <th>#</th>
            <th>名前</th>
            <th class="text-right">オンライン時間</th>
        </tr>
    </thead>
    <tbody>
    `;
    var date;
    for (var name in g_cache.players) {
        html += `
            <tr>
                  <th>
                      <img src="res/` + name + `.jpg" class="img-fluid rounded-circle user-icon" alt="` + name + `">
                  </th>
                  <td>` + name + `</td>
                  <td class="text-right">` + getTime(g_cache.players[name].loginAt) + `</td>
                </tr> 
        `;
    }
    $('#modal-custom').attr('data-type', 'playerList').find('.modal-html').html(html + '</tbody></table>');
}

function queryMsg(data, debug = false) {
    connection.send(JSON.stringify(data));
    if (debug) console.log(debug);
}

var connection;
var socket_url = 'wss:///mosya-server.glitch.me';
// var socket_url = 'ws://127.0.0.1:8000';
// var socket_url = 'ws://192.168.31.189:8000';

function recon() {
    $('#status').attr('class', 'bg-dark-light');
    if (g_cache.logined) {
        setTimeout(() => { initWebsock() }, 1000);
        /*if(confirm('是否重连?')){
            window.location.reload();
        }*/
    }
}

function initWebsock() {
    connection = new WebSocket(socket_url);
    connection.onopen = () => {
        g_cache.logined = true;
        $('#status').attr('class', 'bg-success');
        queryMsg({ type: 'login', user: g_config.user });
    }

    connection.onclose = () => {
        recon();
    }

    connection.onerror = (error) => {
        recon();
    }

    connection.onmessage = (e) => {
        reviceMsg(JSON.parse(e.data));
    }
}

function parseMusiclist(data) {
    var h = '';
    for (var detail of data) {
        h += `<tbody data-action="playSong" data-vid="` + detail.id + `">
                     <tr>
                  <th>
                      <img src="` + detail.pic + `" class="cover" alt="` + detail.artist + `">
                  </th>
                  <td>` + detail.name + `</td>
                  <td class="text-right"></td>
                </tr>
                </tbody>`
    }
    $('#content_music table').html(h).find('tbody:eq(0)').click();
    closeModal('modal-custom', 'music', () => {
            $('#modal-custom .modal-html').html($('#content_music').html());
    });
}

function reviceMsg(data) {
    console.log(data);
    var type = data.type;
    delete data.type;
    switch (type) {
        case 'playlist_set':
            reviceMsg({
                type: 'msg',
                user: data.user,
                msg: `<a data-action="toTab,music" href="javascript: void(0);">📚 : ` + data.data.length + '曲</a>'
            });
            parseMusiclist(data.data);
            break;
        case 'playlist_add':
            reviceMsg({
                type: 'msg',
                user: data.user,
                msg: `<a data-action="playSong_fromMsg,` + data.data.id + `" href="javascript: void(0);">▶ : ` + data.data.name + '</a>'
            });
            $('#content_music table').prepend(`
                <tbody data-action="playSong" data-vid="` + data.data.id + `">
                     <tr>
                  <th>
                      <img src="` + data.data.pic + `" class="cover" alt="` + data.data.artist + `">
                  </th>
                  <td>` + data.data.name + `</td>
                  <td class="text-right">` + data.data.artist + `</td>
                </tr>
                </tbody>
            `).find('tbody').click();
            closeModal('modal-custom', 'music', () => {
                    $('#modal-custom .modal-html').html($('#content_music').html());
            });
            break;

        case 'video':
            var date = new Date();
            reviceMsg({
                type: 'msg',
                user: data.user,
                msg: `<a data-action="playVideo_fromMsg,` + data.data.id + `" href="javascript: void(0);">🎦 : ` + data.data.name + '</a>'
            });
            $('#subContent_videoHistory table').prepend(`
                <tbody data-action="playVideo" data-vid="` + data.data.id + `">
                     <tr>
                  <th>
                      <img src="` + data.data.pic + `" class="cover" alt="` + data.data.artist + `">
                  </th>
                  <td>` + data.data.name + `</td>
                  <th>
                      <img src="res/` + data.user + `.jpg" class="user-icon rounded-circle" alt="` + data.user + `">
                  </th>
                  <td class="text-right">` + date.getHours() + ':' + date.getMinutes() + `</td>
                </tr>
                </tbody>
            `).find('tbody:eq(0)').click();
            break;
        case 'over':
            broadcastMessage('<b>game over.</b>', 'bg-primary');
            break;
        case 'list':
            g_cache.players = data.data;
            $('[data-action="playerList"] span').html(Object.keys(g_cache.players).length);
            if (g_cache.loginAtTimer) clearInterval(g_cache.loginAtTimer);
            g_cache.loginAtTimer = setInterval(() => {
                for (var name in g_cache.players) {
                    g_cache.players[name].loginAt++;
                }
                closeModal('modal-custom', 'playerList', () => {
                    updatePlaylist();
                });
            }, 1000);
            break;
        case 'getPost':
            if (data != g_cache.post) { // 更新
                parsePost(data.data);
            }
            break;
        case 'post':
            parsePost(data.data);
            break;
        case 'msg':
        case 'voice':
            var date = new Date();
            var dom = addMsg(`<tr class="msg">
                  <th>
                      <img src="` + getUserIcon(data.user) + `" class="rounded-circle user-icon" alt="` + data.user + `">
                  </th>
                  <td>` + (type == 'msg' ? data.msg : `

                        <span class="badge-group" role="group" style="width: 100%;">
                          <a href="javascript: void(0)" onclick="playRecord(this);" class="badge badge-success badge-pill play_btn">
                          <i class="fa fa-play" aria-hidden="true"></i>
                          </a>
                           <span class="badge bg-dark text-white" style="width: 100%;border: 0px;">
                            <div class="progress" style="height: 15px;" data-src="` + data.msg + `"  data-audio="record" >
                          <div class="progress-bar bg-secondary" role="progressbar" style="width: 0%" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                          </span>
                        </span>
                    `) + `</td>
                  <td class="text-right">` + date.getHours() + ':' + date.getMinutes() + `</td>
                </tr>`);
            if( data.user != g_config.user.name){
                var skip = false;
                if(type == 'voice'){
                    if (mediaRecorder.state !== "recording") {
                        dom.find('.play_btn').click();
                        skip = true;
                    }
                }
                if(!skip){
                    if ($('#content_chat').css('display') == 'none') {
                        g_cache.unread++;
                        $('#unread').html(g_cache.unread).show();;
                    }
                }
            }
            closeModal('modal-custom', 'chat', () => {
                console.log(dom);
                $('#modal-custom .modal-html table').prepend(dom);
            });
            _record.btn = 'i[data-action="record_play"]';
            break;
    }
}

function playRecord(dom) {
    var par = $(dom).parent();
    $('tr.msg i').prop('class', 'fa fa-play');
    var src = par.find('[data-src]').attr('data-src');
    if (src !== _record.source) {
        setAudioSrc(_record, src);
    } else
    if (!_record.paused) {
        _record.pause();
    } else {
        _record.play();
    }
    _record._progress = par.find('.progress')[0];
    _record.btn = $(dom).find('i');
}

function broadcastMessage(msg, classes) {
    var date = new Date();
    addMsg(`<tr class="` + classes + `">
      <th>
          <i class="fa fa-exclamation-circle" aria-hidden="true"></i>
      </th>
      <td>` + msg + `</td>
      <td class="text-right">` + date.getHours() + ':' + date.getMinutes() + `</td>
    </tr>`);
}

function addMsg(html) {
    var d = $(html);
    $('#content_chat table').prepend(d);
    soundTip('res/pop.mp3');
        return d;
}

function closeModal(id, type, fun) {
    var modal = $('#' + id)
    if (modal.hasClass('show') && modal.attr('data-type') == type) {
        fun();
    }
}

function parsePost(data, save = true) {
    clearInterval(g_cache.timer);

    if (data.username != g_config.user.name || g_cache.post == undefined) {
        g_cache.post = data;
    } else {
        // 自己上传完毕
        $('#btn_upload').html('Upload');
        g_cache.upload = false;
        if ($('#modal-upload').hasClass('show')) {
            halfmoon.toggleModal('modal-upload');
        }
    }
    reviceMsg({ type: 'msg', user: data.username, msg: '<img class="thumb" data-action="previewImage" src="'+ g_cache.post.img+'">' });
    $('#image').attr('src', g_cache.post.img);
    if (_viewer.isShown) {
        _viewer.image.src = g_cache.post.img;
    }
    g_cache.timer = setInterval(() => {
        g_cache.post.time--;
        if (g_cache.post.time >= 0) {
            $('#cnt').html(getTime(g_cache.post.time));
        }
    }, 1000);
}

// reviceMsg({
//     type: 'msg',
//     user: 'maki',
//     msg: 'hello'
// });
// reviceMsg({
//     type: 'msg',
//     user: 'chisato',
//     msg: '<img src="res/demo.jpg" class="thumb" data-action="previewImage">'
// });
// reviceMsg({
//     type: 'voice',
//     user: 'maki',
//     msg: 'res/music.mp3'
// });
function soundTip(url) {
    _audio2.src = url;
}

function getUserIcon(user) {
    return 'res/' + user + '.jpg';
}