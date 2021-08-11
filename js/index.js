var _audio = $('#audio')[0];
var _audio2 = $('#soundTip')[0];
var _record = $('#record')[0];
var _video = $('#video')[0];
var _tts = $('#tts')[0];
var _audio_stricker = $('#audio_stricker')[0];
var g_json;
var socket_url = 'wss:///mosya-server.glitch.me';
var g_imageHost = 'https://mosya-server.glitch.me/';
var g_api = 'https://neysummer-api.glitch.me/';


// var socket_url = 'ws://127.0.0.1:8000';
// // var socket_url = 'ws://192.168.31.189:8000';
// var g_api = 'api/';
// var g_imageHost = 'http://127.0.0.1/mosya-websocket/';

var g_cache = {
    logined: false,
    unread: 0,
    post: undefined,
    video: undefined,
    reloadImage: [],
    reloadImage_timer: 0,
    saveTag: {
        timer: 0,
    },
    tags: [],
    a_tts: [],
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

function init() {
    if (g_cache.inited) return;
    g_cache.inited = true;
    $('body').show();

    initWebsock();
    _audio_stricker.onplay = () => {
        if (_audio_stricker.icon) {
            $(_audio_stricker.icon).prop('class', 'fa fa-pause')
        }
    }
    _audio_stricker.onpause = () => {
        if (_audio_stricker.icon) {
            $(_audio_stricker.icon).prop('class', 'fa fa-play')
        }
    }
    _audio_stricker.onended = () => {
        if (_audio_stricker.icon) {
            $(_audio_stricker.icon).prop('class', 'fa fa-play')
            _audio_stricker.icon = undefined;
        }
    }

    _audio.onplay = () => {
        $('i[data-action="audio_play"]').prop('class', 'fa fa-pause');
    }
    _audio.onpause = () => {
        $('i[data-action="audio_play"]').prop('class', 'fa fa-play');
    }

    _audio.oncanplay = () => {
        _audio.retry = 0;
        $('.progress-group-label').find('i').prop('class', 'fa fa-check-circle text-success font-size-16');
    }

    _audio.ontimeupdate = () => {
        var s = _audio.currentTime;
        $('#audio_progress').css('width', parseInt(s / _audio.duration * 100) + '%');
    }

    _audio.onended = () => {
        doAction(null, 'audio_next');
    }

    _tts.onended = () => {
        _audio.volume = 1;
        _audio2.volume = 1;
        var next = g_cache.a_tts.pop();
        if (next != undefined) {
            _tts.src = next;
        }
    }

    _tts.onplay = () => {
        _audio.volume = 0.25;
        _audio2.volume = 0.25;
    }

    _audio.onerror = () => {
        if (_audio.retry == undefined) _audio.retry = 0;
        //console.log('audio retry ' + _audio.retry, _audio.src);
        _audio.retry++;
        if (_audio.retry >= 3) {
            doAction(null, 'audio_next');
        } else {
            _audio.src = _audio.source;
        }
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

    setInterval(() => {
        var skip = true;
        var data = {type: 'status', data: {}};
        if(!_audio.paused){
            skip = false;
            data.data.audio = {
                time: _audio.currentTime,
                url: _audio.src
            }
        }
        if(!_video.paused){
            skip = false;
            data.data.video = {
                time: _video.currentTime,
                url: _video.src
            }
        }
        if(!skip){
            queryMsg(data, true)
        }
         //queryMsg({type: 'list'})
    }, 10000);

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
        }).
    on('mouseenter', '.gif', (event) => {
        var img = event.currentTarget;
        img.src = img.src;
    });



    $('#image')[0].addEventListener('viewed', function() {
        if (this.viewer === _viewer) {
            $('#cnt').show();
        }
    });

    $('#image')[0].addEventListener('hidden', function() {
        if (this.viewer === _viewer) {
            if (!g_cache.post || g_cache.post.time <= 0) {
                $('#cnt').hide();
            }
            $('#ftb_icons').hide();
        }
    });

    $('input[type=file]').on('change', function(event) {
        var that = this;
        lrz(that.files[0])
            .then(function(rst) {
                // console.log(rst);
                //console.log(parseInt(that.files[0].size / 1024), parseInt(rst.fileLen / 1024));
                switch (that.id) {
                    case 'input_preview':
                        $('#img_uploadImage').attr('src', rst.base64).attr('title', rst.origin.name).show();
                        $('#upload_title').val(that.files[0].name);
                        break;

                    case 'img_sendImage':
                        queryMsg({ type: 'msg', user: g_config.user.name, msg: '<img class="thumb" data-action="previewImage" src="' + rst.base64 + '" alt="Upload by ' + g_config.user.name + '">' });
                        break;
                }
            })
            .catch(function(err) {
                // 处理失败会执行
            });
    });
    $('#grid_x').val(g_config.grid.x);
    $('#grid_y').val(g_config.grid.y);
    $('#grid_size').val(g_config.grid.size);
    $('input[type=color]').val(g_config.grid.color); 
    $('#div_mainImg').height($('#image').height());
    $(window).resize((e) => {
        drawBoard();
    })
    test();

}

function setAudioSrc(player, src) {
    player.source = src;
    player.src = src;
}
function setGrid(type, add, min) {
    var i;
    if(min != undefined){
        i = add.value;
        if(i<min){
            i = min;
            add.value = min;
        }
    }else{
        i = Number($('#grid_'+type).val());
        if(add > 0){
            i++;
        }else
        if(add < 0){
            i--;
            if(i < 1) return;
        }
    }
    g_config.grid[type] = i;
    local_saveJson('config', g_config);
    $('#grid_'+type).val(i)
    drawBoard();
}



function setGridColor(color){
    g_config.grid.color = color;
    local_saveJson('config', g_config);
    drawBoard();
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
        user: g_config.user.name,
        time: parseInt($('select')[0].value) * 60,
        title: $('#upload_title').val(),
        img: img.src,
    }
    queryMsg({ type: 'post', data: g_cache.post });
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
    $('#img_user').attr('src', 'res/' + (['maki', 'chisato'].indexOf(name) != -1 ? name : 'user') + '.jpg');
    if (save) local_saveJson('config', g_config);
    if (!g_cache.inited) {
        init();
    }
}

function saveImage(canvas, filename) {
    var image = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    saveFile(image, filename || 'file_' + new Date().getTime() + '.png');
    canvas.remove();
}

function saveFile(url, filename) {
    var eleLink = document.createElement('a');
    eleLink.style.display = 'none';
    eleLink.download = filename;
    eleLink.href = url;
    document.body.appendChild(eleLink);
    eleLink.click();
    document.body.removeChild(eleLink);
}

function isShow($node) {
    return $node.offset().top <= $(window).height() + $(window).scrollTop()
}


function checkStrickerMeta(id, sid, img) {
    var pic;
    data = {
        id: id,
        sid: sid,
        img: $(img).attr('data-src'),
    };
    if (g_stricker['id_' + id]['hasAnimation']) {
        pic = 'http://dl.stickershop.line.naver.jp/products/0/0/1/' + id + '/android/animation/' + sid + '.png';
        data.animation = pic;
        reloadImage($(img).attr('data-src', pic)[0]);
    }
    if (g_stricker['id_' + id]['hasSound']) {
        data.audio = 'http://dl.stickershop.line.naver.jp/products/0/0/1/' + id + '/android/sound/' + sid + '.m4a';
        _audio_stricker.src = data.audio;
        _audio_stricker.img = pic || $(img).attr('data-src');
    }
    g_cache.strick_last = data;
}

function sendStricker() {
    var animation = g_cache.strick_last.animation;
    // TODO 默认预载图片
    var data = { type: 'msg', msg: '<img class="thumb loading' + (animation ? ' gif' : '') + '" data-action="previewImage" data-src="' + (animation || g_cache.strick_last.img) + '">' };
    if (g_cache.strick_last.audio) {
        data.audio = g_cache.strick_last.audio;
    }
    $('#bottom_stricker').hide();
    queryMsg(data, true);
}

function reloadImage(img) {
    img.src = img.getAttribute('data-src');
    imagesLoaded(img).on('progress', function(instance, image) {
        var index = g_cache.reloadImage.indexOf(image.img);
        if (!image.isLoaded) {
            image.img.src = 'res/reload.png';
            if (index == -1) g_cache.reloadImage.push(image.img);
            if (!g_cache.reloadImage_timer) {
                g_cache.reloadImage_timer = setInterval(() => {
                    for (var img of g_cache.reloadImage) {
                        reloadImage(img);
                    }
                }, 2000);
            }
            return;
        }
        img.classList.remove('loading');
        if (index != -1) g_cache.reloadImage.splice(index, 1);
        if (g_cache.reloadImage.length == 0) {
            clearInterval(g_cache.reloadImage_timer);
            g_cache.reloadImage_timer = 0;
        }
    });
}


function doAction(dom, action, params) {
    var action = action.split(',');
    switch (action[0]) {
        case 'saveSetting':
            g_config.tipSound = $('#select-tip').val();
            g_config.tts = $('#checkbox_tts').prop('checked');
            local_saveJson('config', g_config);
            halfmoon.toggleModal('modal-custom');
            break;
        case 'openSetting':
            $('#modal-custom').find('.modal-title').html('設定');
            $('#modal-custom').attr('data-type', 'setting').find('.modal-html').html(`
                <div class="form-group">
                        <label>ヒント音</label>
                        <div class="row">
                            <select class="form-control col-4" id="select-tip" onchange="if (this.value == 'custom') {var url = prompt('input url', 120);if (url != null && url != '') $(this).find(':disabled').val(url).html(url).prop('selected', true);}else{soundTip(this.value)}">
                                <option value="" selected>なし</option>
                                <option value="res/tip_paopao.wav">シャボン玉</option>
                                <option value="res/tip_dingdong.wav">ディンドン</option>
                                <option value="res/tip_dingdong.mp3">ディンドン1</option>
                                <option value="res/tip_line.wav">line</option>
                                <option value="res/tip_mail.wav">メール</option>
                                <option value="res/tip_iphone.wav">iphone</option>
                                <option value="custom">カスタム</option>
                            </select>
                            <div class="col-4"></div>
                            <div class="custom-switch col-4">
                                <input type="checkbox" id="checkbox_tts" value="">
                                <label for="checkbox_tts">音読</label>
                            </div>
                        </div>
                        <button class="btn btn-primary btn-block mt-10" id="btn_upload" data-action="saveSetting">保存</button>
                    </div>

                `);
            halfmoon.toggleModal('modal-custom');
            $('option[value="'+g_config.tipSound+'"]').prop('selected', true);
            $('#checkbox_tts').prop('checked', g_config.tts);
            break;
        case 'openViewer':
            if ($('#page-wrapper').attr('data-sidebar-hidden') != 'hidden') {
                halfmoon.toggleSidebar();
            }
            if (_viewer != undefined) _viewer.destroy();
            _viewer = new Viewer(dom, {
                backdrop: 'static',
                navbar: 0,
                title: 0,
                toggleOnDblclick: false,
            });
            _viewer.show();
            break;
        case 'imageHistory_toDay':
            $('#days_tabs button.btn-primary').removeClass('btn-primary');
            $(dom).addClass('btn-primary');

            var time = new Date(new Date().getFullYear() + '/' + $(dom).html().replace('.', '/')).getTime();
            queryMsg({ type: 'pics', time: time, max: 3600 * 24 * 1000 })
            break;
        case 'downloadImageToServer':
            var src = $('#modal-img img').attr('src');
            if (src.indexOf('http:') == -1) {
                queryMsg({ type: 'save', data: src, desc: $('#modal-img .modal-title').html() });
            }
            break;
        case 'stricker_delete':
            var selected = $('[data-action="stricker_toTab"].btn-primary');
            delete g_stricker['id_' + selected.attr('data-id')];
            selected.remove();
            local_saveJson('stricker', g_stricker);
            break;
        case 'stricker_left':
            var selected = $('[data-action="stricker_toTab"].btn-primary');
            var keys = Object.keys(g_stricker);
            var key = 'id_' + selected.attr('data-id');
            var index = keys.indexOf(key);
            if (index != -1) {
                var prev = $(selected).prev();
                if (prev.length == 0 || ['like', 'search'].indexOf(prev.attr('data-id')) != -1) {
                    selected.appendTo($('#stricker_tabs div'));
                    to = keys.length - 1;
                } else {
                    $(selected).insertBefore(prev);
                    to = index - 1;
                }
                var temp = keys[to];
                keys[index] = temp;
                keys[to] = key;
            }
            var n = {};
            for (var key of keys) {
                n[key] = g_stricker[key];
            }
            g_stricker = n;
            local_saveJson('stricker', g_stricker);
            selected[0].scrollIntoView();
            break;

        case 'stricker_right':
            var selected = $('[data-action="stricker_toTab"].btn-primary');
            var keys = Object.keys(g_stricker);
            var key = 'id_' + selected.attr('data-id');
            var index = keys.indexOf(key);
            if (index != -1) {
                var next = $(selected).next();
                if (next.length == 0) {
                    selected.insertAfter($('.btn[data-id="like"]'));
                    to = 0;
                } else {
                    $(selected).insertAfter(next);
                    to = index + 1;
                }
                var temp = keys[to];
                keys[index] = temp;
                keys[to] = key;
            }
            g_test = keys;
            var n = {};
            for (var key of keys) {
                n[key] = g_stricker[key];
            }
            g_stricker = n;
            local_saveJson('stricker', g_stricker);
            selected[0].scrollIntoView();
            break;

        case 'sendStricker':
            var img = $('.selected').attr('src');
            if (img.indexOf('res/reload.png') != -1) {
                toastPAlert('読み込み中', 1000, '', 'alert-warning');
                return;
            }
            sendStricker();
            $('#stricker_footer').hide();
            halfmoon.toggleModal('modal-stricker');
            local_saveJson('stricker_options', g_stricker_options); // 保存最后选择的贴图
            break;
        case 'previewStricker_bottom':
            if (dom.src.indexOf('res/reload.png') != -1) {
                dom.src = $(dom).attr('data-src');
                reloadImage(dom);
            } else {
                if (!$(dom).hasClass('selected')) {
                    checkStrickerMeta($(dom).attr('data-id'), $(dom).attr('data-sid'), dom);
                    $(dom).addClass('selected');
                    return;
                }
                $('#msg').val('');
                sendStricker();
            }
            break;
        case 'previewStricker':
            if (dom.src.indexOf('res/reload.png') != -1) {
                dom.src = $(dom).attr('data-src');
                reloadImage(dom);
            } else {
                if ($(dom).hasClass('selected')) {
                    sendStricker();
                    halfmoon.toggleModal('modal-stricker');
                    return;
                }
                $('.selected').removeClass('selected');
                $(dom).addClass('selected');

                var sid = $(dom).attr('data-sid');
                g_stricker_options.last.sid = sid;

                reloadImage($('#stricker_footer').css('display', 'flex').find('img').attr({
                    'data-src': dom.src,
                    'data-id': g_stricker_options.last.id,
                    'data-sid': sid,
                })[0]);


                checkStrickerMeta(g_stricker_options.last.id, sid, $('#stricker_footer img'));

                var key = ($(dom).attr('data-id') || g_stricker_options.last.id) + ',' + g_stricker_options.last.sid;
                $('#modal-stricker input[type=checkbox]').prop('checked', g_stricker_options.likes.indexOf(key) != -1)
                $('#modal-stricker textarea').val(g_stricker_options.tags[key] != undefined ? g_stricker_options.tags[key] : '');
            }
            break;
        case 'stricker_toTab':
            $('.selected').removeClass('selected');
            g_cache.reloadImage = [];
            clearInterval(g_cache.reloadImage_timer);
            g_cache.reloadImage_timer = 0;

            $('[data-action="stricker_toTab"].btn-primary').removeClass('btn-primary')
            $(dom).addClass('btn-primary');


            var id = $(dom).attr('data-id');
            $('[data-action="stricker_delete"], [data-action="stricker_left"], [data-action="stricker_right"], [data-action="stricker_openURL"]').css('display', ['like', 'search'].indexOf(id) != -1 ? 'none' : 'unset')
            $('#modal-stricker .modal-title span').html(id == 'like' ? 'お気に入り' : id == 'search' ? '検索' : g_stricker['id_' + id].name);

            for (var div of $('.stricker_content')) {
                if (div.id == 'stricker_' + id) {
                    g_stricker_options.last.id = id;
                    for (var img of $(div).show().find('.loading')) {
                        reloadImage(img);
                    }
                } else {
                    $(div).hide();
                }
            }
            break;
        case 'stricker_openURL':
            if (parseInt(g_stricker_options.last.id) > 0) {
                window.open('https://store.line.me/stickershop/product/' + g_stricker_options.last.id, '_blank');
            }
            break;
        case 'addStrick':
            if (confirm('[' + $(dom).attr('data-title') + '] を追加しますか?')) {
                queryStricker($(dom).attr('data-id'));
            }
            break;
        case 'show_stricker_search':
            var div = $('#modal-stricker .modal-title');
            var opened = div.find('span').css('display') == 'none';
            div.find('span').css('display', opened ? 'unset' : 'none');
            div.find('input').css('display', opened ? 'none' : 'initial');
            break;
        case 'show_stricker':
            initStrickers();
            $('#stricker_footer').css('display', (g_stricker.length ? 'unset' : 'none'));
            halfmoon.toggleModal('modal-stricker');
            if (g_stricker_options.last.id != '') {
                var btn = $('[data-action="stricker_toTab"][data-id="' + g_stricker_options.last.id + '"]')[0];
                btn.click();
                btn.scrollIntoView();
            }
            for(var img of $('#stricker_tabs .loading')){
                reloadImage(img);
            }
            break;
        case 'downloadImage':
            var src = $('#modal-img img').attr('src');
            if (src.indexOf('data:image/') != -1) {
                saveFile(src, getNow());
            } else {
                window.open(src, '_blank');
            }
            break;
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
            $(dom).find('i').prop('class', 'fa fa-arrow-' + ($('#image_div').css('display') == 'none' ? 'down' : 'up'));
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
                $.getJSON(g_api + 'search.php?server=youtube&type=list&id=' + m, function(json, textStatus) {
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
                $.getJSON(g_api + 'search.php?server=youtube&type=id&id=' + m, function(json, textStatus) {
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
                $.getJSON(g_api + 'search.php?server=youtube&type=id&id=' + m, function(json, textStatus) {
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
            var src = g_api + 'search.php?server=youtube&type=url&id=' + $(dom).attr('data-vid');
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
            var src = g_api + 'search.php?server=youtube&type=url&video=1&id=' + vid;
            if (_video.source != src) {
                _video.vid = vid;
                _video.poster = $(dom).find('img').attr('src');
                $(_video).show();
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
            } else {
                _record.play();
            }
            break;

        case 'record_send':
            sendRecord();
            break;

        case 'prompt_msg':
            var m = prompt('内容');
            if (m != '' && m != null) {
                queryMsg({ type: 'msg', user: g_config.user.name, msg: m, textOnly: true });
            }
            break;
        case 'show_chat':
            doAction(null, 'toTab,chat');
            $('#modal-custom').find('.modal-title').html('チャット');
            $('#modal-custom').attr('data-type', 'chat').find('.modal-html').html(`
                <button class="btn btn-primary mb-10 float-right" data-action="prompt_msg">発信</button>
                ` + $('#content_chat').html());
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
            $('#bottom_stricker').hide();
            queryMsg({ type: 'msg', user: g_config.user.name, msg: msg, textOnly: true });
            break;
        case 'playerList':
            updatePlaylist();
            halfmoon.toggleModal('modal-custom');
            break;
        case 'play_url':
            var obj;

            switch ($(dom).attr('data-type')) {
                case 'audio':
                    obj = _audio;
                    _video.pause();
                    break;

                case 'video':
                    obj = _video;
                    _audio.pause();
                    closeModal('modal-custom', 'playerList', () => {
                        halfmoon.toggleModal('modal-custom');
                    });
                    doAction(null, 'toTab,video');
                    $(_video).show();
                    break;
            }
            if (obj) {

                obj.src = $(dom).attr('data-url');
                obj.currentTime = $(dom).attr('data-time');
            }
            break;
        case 'play_strickerAudio':
            _audio_stricker.src = $(dom).attr('data-audio');
            _audio_stricker.icon = $(dom).find('i');
            break;
        case 'deleteServerImage':
            if (confirm('are you sure?')) {
                queryMsg({ type: 'deleteServerImage', md5: $(dom).parent('[data-md5]').attr('data-md5') });
            }
            break;
        case 'previewImage':
            if (dom.src.indexOf('/animation/') != -1) {
                var now = getNow();
                var last = $('#modal-img').attr('data-click');
                if (!last || now - last >= 5 || $('#modal-img').attr('data-url') != dom.src) {
                    $('#modal-img').attr('data-click', now).attr('data-url', dom.src);
                    return;
                }
            }

            $('[data-action="downloadImageToServer"]').css('display', dom.src.indexOf('data:image/') != -1 ? '' : 'none');
            $('#modal-img img').attr('src', '').attr('src', dom.src);
            $('#modal-img .modal-title').html(dom.alt);
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
            $('[data-action="addTime"]').css('display', g_cache.post == undefined ? 'none' : 'unset');
            halfmoon.toggleModal('modal-upload');
            break;
        case 'toTab':
            $('#tabs .btn-primary').removeClass('btn-primary');
            $('[data-action="toTab,' + action[1] + '"]').addClass('btn-primary');
            var toolbar = action.length > 2 ? action[2] : action[1];
            for (var con of $('.toolbar')) {
                if (con.id == 'bottom_' + toolbar) {
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
            doAction(null, 'toTab,' + action[1]);
            var par = $('#subContent_' + action[1]).show();

            par.find('[data-btn].btn-primary').removeClass('btn-primary');
            var btn = $('[data-btn=btn_"' + action[2] + '"]').addClass('btn-primary');
            var unread = btn.find('[data-clickHide]');
            console.log(par, btn, unread);
            if (unread.length > 0) {
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

        case 'addTime':
            if (g_cache.post == undefined) return;
            var min = $('select')[0].value;
            if (min == '') {
                $($('select').parents('.form-group')[0]).addClass('is-invalid');
                return;
            }
            queryMsg({ type: 'addTime', data: min }, true);
            break;

    }
}

function updatePlaylist() {
    $('#modal-custom').find('.modal-title').html(`メンバー<i class="fa fa-refresh float-right" onclick="queryMsg({ type: 'list' });" aria-hidden="true"></i>`);
    var html = `
    <table class="table table-striped">
    <thead>
        <tr>
            <th><i class="fa fa-user" aria-hidden="true"></th>
            <th><i class="fa fa-music" aria-hidden="true"></th>
            <th><i class="fa fa-video-camera" aria-hidden="true"></th>
            <th class="text-right"><i class="fa fa-clock-o" aria-hidden="true"></th>
        </tr>
    </thead>
    <tbody>
    `;
    var date, d;
    for (var name in g_cache.players) {
        d = g_cache.players[name];
        html += `
            <tr>
                  <th>
                      <img src="res/` + name + `.jpg" class="img-fluid rounded-circle user-icon" alt="` + name + `">
                  </th>
                  <td>` + (d.status.audio != undefined ? `
                    <a href="#" class="badge-group" role="group" aria-label="...">
                      <span class="badge bg-dark text-white">` + getTime(parseInt(d.status.audio.time)) + `</span> 
                      <span class="badge badge-success" data-action="play_url" data-type='audio' data-url="` + d.status.audio.url + `" data-time="` + d.status.audio.time + `"><i class="fa fa-play" aria-hidden="true"></i></span>
                    </a>
                    ` : '') + `</td>
                  <td>` + (d.status.video != undefined ? `
                    <a href="#" class="badge-group" role="group" aria-label="...">
                      <span class="badge bg-dark text-white">` + getTime(parseInt(d.status.video.time)) + `</span> 
                      <span class="badge badge-success" data-action="play_url" data-type='video' data-url="` + d.status.video.url + `" data-time="` + d.status.video.time + `"><i class="fa fa-play" aria-hidden="true"></i></span>
                    </a>
                    ` : '') + `</td>
                  <td class="text-right">` + getTime(d.loginAt) + `</td>
                </tr> 
        `;
    }
    $('#modal-custom').attr('data-type', 'playerList').find('.modal-html').html(html + '</tbody></table>');
}

function queryMsg(data, user = false) {
    if (user) data.user = g_config.user.name;
    connection.send(JSON.stringify(data));
}

var connection;


function recon() {
    $('#status').attr('class', 'bg-dark-light');
    if (g_cache.logined) {
        initWebsock();
        /*if(confirm('是否重连?')){
            window.location.reload();
        }*/
    }
}


function initWebsock() {
    if (connection != undefined) connection.close();
    connection = new WebSocket(socket_url);
    connection.onopen = () => {
        g_cache.logined = true;
        $('#status').attr('class', 'bg-success');
        queryMsg({ type: 'login', user: g_config.user });
        queryMsg({ type: 'pics_datas' });
        socketTest();
    }

    connection.onclose = () => {
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

var g_canva = $('canvas');

function drawBoard() {
    var context = g_canva.get(0).getContext("2d");
    g_canva[0].height=context.height;  // 清除画布
    if(!g_config.grid.enable){
        g_canva.hide();
        return;
    }
    g_canva.show();

    //grid width and height
    var bw = $('#image').width();
    var bh = $('#image').height();

    //padding around grid
    var p = 0;
    //size of canvas
    var cw = bw + (p * 2) + 1;
    var ch = bh + (p * 2) + 1;
    
    if (cw != g_canva.width() || ch != g_canva.height()) {
        g_canva.attr('width', cw);
        g_canva.attr('height', ch);
        g_canva.offset($('#image').offset());
    }
    context.beginPath();
    context.setLineDash([3, 3]);  //画虚线
    for (var x = 0; x <= bw; x += bw / g_config.grid.x) {
        context.moveTo(0.5 + x + p, p);
        context.lineTo(0.5 + x + p, bh + p);
    }

    for (var x = 0; x <= bh; x += bh / g_config.grid.y) {
        context.moveTo(p, 0.5 + x + p);
        context.lineTo(bw + p, 0.5 + x + p);
    }

    context.strokeStyle = g_config.grid.color;
    context.lineWidth = g_config.grid.size;
    context.stroke();
    context.closePath();

}


var g_i_current = 0;

function spturn() {
    g_i_current = 0;
    $('#image').toggleClass('mirrorRotateLevel');
}

function czturn() {
    g_i_current = 0;
    $('#image').toggleClass('mirrorRotateVertical');
}

function turnLeft() {
    g_i_current = (g_i_current - 90) % 360;
    setRotate(g_i_current);
}

function turnRight() {
    g_i_current = (g_i_current + 90) % 360;
    setRotate(g_i_current);
}

function setRotate(rotate) {
    $('#image')
        .removeClass('mirrorRotateLevel')
        .removeClass('mirrorRotateVertical')[0].style.transform = 'rotate(' + rotate + 'deg)';
}


function reviceMsg(data) {
    console.log(data);
    var type = data.type;
    delete data.type;
    switch (type) {

        case 'tts':
            if(g_config.tts != undefined && !g_config.tts) return;
            if (_tts.paused) {
                _tts.src = data.data;
                _tts.play();
            } else {
                g_cache.a_tts.push(data.data);
            }
            break;
        case 'history_message':
            for (var d of data.data) {
                d.type = 'msg';
                reviceMsg(d);
            }
            for (var img of $('img.loading')) {
                reloadImage(img);
            }
            break;
        case 'pics_datas':
            var h = '';
            var days = [];
            for (var time of data.data) {
                var day = getFormatedTime(2, new Date(time));
                if (days.indexOf(day) == -1) {
                    days.push(day);
                    h += `<button class="btn" data-action="imageHistory_toDay" data-id="search">` + day + `</button>`;
                }
            }
            $('#days_tabs div').html(h);
            if (data.removed) {
                $('.div-photo[data-md5="' + data.removed + '"]').remove();
            }
            break;
        case 'pics':
            var h = '';
            if (data.data == undefined) {
                toastPAlert('データがありません!', 1000, '', 'alert-warning');
                return;
            }
            for (var key in data.data) {
                var detail = data.data[key];
                h += `<div class="div-photo" data-md5="` + key + `"><h6 class="text-center">` + getFormatedTime(1, new Date(detail.time)) + ' (' + detail.desc + `)</h6><img data-action="openViewer" src="` + g_imageHost + `saves/` + key + `.jpg" class="serverImg" alt="` + detail.desc + `">`;
                if (g_config.user.name == 'maki') {
                    h += `<a href="#" class="btn btn-square btn-danger rounded-circle" data-action="deleteServerImage" role="button"><i class="fa fa-trash-o" aria-hidden="true"></i></a> 
                    `;
                }
                h += '</div>'
            }
            $('#days_imgs').html(h);
            break;
        case 'online':
            var h = '';
            for (var user in data.data) {
                var i = 0;
                for (var day in data.data[user]) {
                    i += data.data[user][day];
                }
                h += `<a href="#" class="sidebar-link sidebar-link-with-icon" data-action="show_onlineTime">
                    <span class="sidebar-icon">
                        <img id='img_user' data-action="previewImage" src="res/` + user + `.jpg" class="rounded-circle user-icon" alt="` + user + `">
                    </span>
                    約` + parseInt(i / 3600) + `時間
                </a>`
            }
            $('#online_time').html(h);
            break;
        case 'addTime':
            toastPAlert(data.user + 'が時間を延長しました(' + data.data + 'Min)');
            g_cache.post.time += parseInt(data.data * 60);
            break;
        case 'login':
            break;
        case 'quit':
            // 由服务端统一发送list
            // 这里只发出提示
            break;
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
                  <td class="text-right">` + getFormatedTime() + `</td>
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
            closeModal('modal-custom', 'playerList', () => {
                updatePlaylist();
            });
            if (data.quit) {
                // 离开房间
            }
            break;
        case 'post':
            parsePost(data.data);
            break;
        case 'tip':
            toastPAlert(data.msg, data.time, data.title, data.msgType);
            break;
        case 'save':
            var img = $('[data-md5="' + data.data + '"]');
            if (img.length) {
                $(`<a href="#" class="btn btn-square btn-success rounded-circle" style="position: relative;bottom: 5px;right: 20px;" role="button"><i class="fa fa-check" aria-hidden="true"></i></a> 
                `).insertAfter(img);
                closeModal('modal-img', false, () => {
                    halfmoon.toggleModal('modal-img');
                });
            }
            break;
        case 'msg':
        case 'voice':
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
                  <td class="text-right">` + getFormatedTime() + `</td>
                </tr>`);
            var image = dom.find('.thumb');
            if (data.user != g_config.user.name) {
                var skip = false;
                if (type == 'voice') {
                    if (mediaRecorder.state !== "recording") {
                        dom.find('.play_btn').click();
                        skip = true;
                    }
                }
                if (!skip) {
                    if ($('#content_chat').css('display') == 'none') {
                        g_cache.unread++;
                        $('#unread').html(g_cache.unread).show();;
                        alertMsg(data);
                    }
                }
            }
            if (data.audio) {
                $(`<a href="#" class="btn btn-square btn-success rounded-circle" data-action="play_strickerAudio" data-audio="` + data.audio + `" style="position: relative;bottom: 5px;right: 20px;" role="button"><i class="fa fa-play" aria-hidden="true"></i></a> 
                `).insertAfter(image);
                $('#audio_stricker')[0].src = data.audio;
            }
            if (image.length) {
                if (image[0].src.indexOf('data:image/') != -1) {
                    $(image).attr('data-md5', md5(image[0].src));
                }
                // $(`<a href="#" class="btn btn-square btn-secondary rounded-circle" data-action="show_stricker" style="position: relative;top: 0px;left: 20px;" role="button"><i class="fa fa-smile-o font-size-20" aria-hidden="true"></i></a> 
                // `).insertBefore(image);
                if (image.hasClass('loading')) {
                    reloadImage(image[0]);
                }
            }
            closeModal('modal-custom', 'chat', () => {
                $('#modal-custom .modal-html table').prepend(dom.clone());
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
    addMsg(`<tr class="` + classes + `">
      <th>
          <i class="fa fa-exclamation-circle" aria-hidden="true"></i>
      </th>
      <td>` + msg + `</td>
      <td class="text-right">` + getFormatedTime() + `</td>
    </tr>`);
}

function addMsg(html) {
    var d = $(html);
    $('#content_chat table').prepend(d);
    soundTip(g_config.tipSound || 'res/pop.mp3');
    return d;
}

function alertMsg(data) {
    var div = $('#alert_custom');
    div.find('img').attr('src', 'res/' + data.user + '.jpg');
    div.find('h4').html(data.user);
    div.find('div').html(data.msg);
    $('#alert_custom').on('click', () => {
        doAction(null, 'prompt_msg');
    });
    halfmoon.toastAlert('alert_custom', 2000);
}

function closeModal(id, type, fun) {
    var modal = $('#' + id)
    if (modal.hasClass('show')) {
        if (type && modal.attr('data-type') != type) {
            return;
        }
        fun();
    }
}

function parsePost(data, save = true) {
    clearInterval(g_cache.timer);
    setRotate(0);
    $('#cnt').attr('class', 'badge badge-primary text-light').show();

    var isFirst = g_cache.post == undefined;
    var isNew = !isFirst && g_cache.post.img != data.img;
    if (data.user != g_config.user.name || isFirst) {
        g_cache.post = data;
    } else {
        // 自己上传完毕
        $('#btn_upload').html('Upload');
        g_cache.upload = false;
        if ($('#modal-upload').hasClass('show')) {
            halfmoon.toggleModal('modal-upload');
        }
    }

    if (isFirst || isNew) { // 图片有变动才在消息显示
        reviceMsg({ type: 'msg', user: data.user, msg: '<img class="thumb" data-action="previewImage" src="' + g_cache.post.img + '">' });
        $('#image').attr('src', g_cache.post.img);
        if (_viewer && _viewer.isShown) {
            _viewer.image.src = g_cache.post.img;
        }
    }

    g_cache.timer = setInterval(() => {
        g_cache.post.time--;
        if (g_cache.post.time >= 0) {
            $('#cnt').html(getTime(g_cache.post.time));
        } else {
            $('#cnt').attr('class', 'badge badge-success text-light');
            clearInterval(g_cache.timer);
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

function searchStrick(keyword) {
    var id = cutString(keyword + '/', 'product/', '/');
    if (id != '') {
        queryStricker(id);
        return;
    }
    $.getJSON(g_api + 'stricker.php?type=search&s=' + keyword, function(json, textStatus) {
        if (textStatus == 'success') {
            var h = '';
            for (var detail of json) {
                h += `
                <div class="col-4" data-action="addStrick" data-title='` + detail['name'] + `' data-id="` + detail['id'] + `">
                    <img src='` + detail['icon'] + `' title='` + detail['name'] + `'>    
                `;
                if (detail['hasAnimation'] || detail['hasSound']) {
                    h += '<span class="badge-group float-right">';
                    if (detail['hasAnimation']) {
                        h += '<span class="badge badge-primary"><i class="fa fa-volume-down" aria-hidden="true"></i></span>';
                    }
                    if (detail['hasSound']) {
                        h += '<span class="badge badge-primary"><i class="fa fa-play" aria-hidden="true"></i></span>';
                    }
                    h += '</span>';
                }
                h += '</div>';
            }
            $('#stricker_search').html(h);
            $('.btn[data-id="search"]').show().click();
        }
    });
}

function queryStricker(id, alert = true) {
    $.getJSON(g_api + 'stricker.php?type=ids&id=' + id, function(json, textStatus) {
        if (textStatus == 'success') {
            g_stricker['id_' + id] = json;
            local_saveJson('stricker', g_stricker);

            addStrick(json, alert);
            if (alert) toastPAlert('追加に成功しました', 3000, '', 'alert-success');
        } else {
            if (alert) toastPAlert('もう一度試してください', 3000, '', 'alert-warning');
        }
    });
}

function addStrick(data, active = false) {
    var btn = $(`
    <button class="btn" data-action="stricker_toTab" data-id="` + data.id + `">
        <img class="loading" data-src='https://sdl-stickershop.line.naver.jp/products/0/0/1/` + data.id + `/android/main.png'>
    </button>
    `);
    $('#stricker_tabs div').append(btn)[0];
    var h = `<div id='stricker_` + data.id + `' class="row w-full h-200 stricker_content" style="align-items: center; display:none">`;
    for (var id of data.stickers) {
        h += getStrickerHTML(data.id, id);
    }
    $('#stricker_content').append(h + '</div>');
    if (active) {
        var tabs = $('#stricker_tabs')[0];
        tabs.scrollTo(tabs.scrollWidth, 0);
        btn.click();
    }
}

function getStrickerHTML(id, sid, fromLike = false) {
    return `
        <div class="col-4">
            <img class="loading"` + (fromLike ? ' data-id="' + id + '"' : '') + ` data-sid="` + sid + `" data-action="previewStricker" data-src='http://dl.stickershop.line.naver.jp/products/0/0/1/` + id + `/android/stickers/` + sid + `.png'>
        </div>
        `;
}

function getStrickerHTML_bottom(id, sid) {
    var url = `http://dl.stickershop.line.naver.jp/products/0/0/1/` + id + `/android/stickers/` + sid + `.png`;
    return `
        <div class="col-4">
            <img data-id="` + id + `" data-sid="` + sid + `" data-action="previewStricker_bottom" data-src='` + url + `' src='` + url + `'>
        </div>
        `;
}

function likeStrickerImg(switcher) {
    var img = $('#stricker_footer img');
    var id = $(img).attr('data-id');
    var sid = $(img).attr('data-sid');
    var key = id + ',' + sid;
    var index = g_stricker_options.likes.indexOf(key);
    var save = false;
    if (switcher.checked) {
        if (index == -1) {
            g_stricker_options.likes.push(key);
            save = true;
            $('#stricker_like').prepend(getStrickerHTML(id, sid));
        }
    } else {
        if (index != -1) {
            g_stricker_options.likes.splice(index, 1);
            save = true;
        }
    }
    if (save) {
        local_saveJson('stricker_options', g_stricker_options);
    }
}

function stricker_saveTags(textarea) {
    var img = $('#stricker_footer img');
    var text = textarea.value;
    var key = $(img).attr('data-id') + ',' + $(img).attr('data-sid');
    if (g_cache.saveTag.timer) clearTimeout(g_cache.saveTag.timer);
    g_cache.saveTag = {
        text: text,
        key: key,
        timer: setTimeout(() => {
            var text = g_cache.saveTag.text;
            var key = g_cache.saveTag.key;
            console.log(text, key);
            var exists = g_stricker_options.tags[key] != undefined;
            if (text == '') {
                if (!exists) {
                    return;
                }
                delete g_stricker_options.tags[key];
            } else {
                if (exists && g_stricker_options.tags[key] == text) {
                    return;
                }
                g_stricker_options.tags[key] = text;
            }
            local_saveJson('stricker_options', g_stricker_options);
            g_cache.tags = Object.entries(g_stricker_options.tags);
        }, 1000)
    }
}

function checkStrickerTags(textarea) {
    var h = '';
    var text = textarea.value;
    if (text != '') {
        for (var tag of g_cache.tags) {
            if (tag[1].indexOf(text) != -1) {
                var args = tag[0].split(',');
                h += getStrickerHTML_bottom(args[0], args[1]);
            }
        }
    }
    if (h != '') {
        $('#bottom_stricker').show().find('.row').html(h);
    } else {
        $('#bottom_stricker').hide();
    }
}

function initStrickers() {
    if (!g_cache.strickerInited) {
        g_cache.tags = Object.entries(g_stricker_options.tags);
        for (var id in g_stricker) {
            addStrick(g_stricker[id]);
        }
        var h = '';
        for (var key of g_stricker_options.likes) {
            var args = key.split(',');
            h += getStrickerHTML(args[0], args[1], true);
        }
        $('#stricker_like').html(h);

        g_cache.strickerInited = true;
    }
}

function test() {
    
    // if(g_config.user.name == 'maki'){
    //     _audio.src = 'res/music.mp3';
    // }
    // if(g_config.user.name == 'chisato'){
    //     _video.src = 'res/test.mp4';
    //     $(_video).show();
    // }

    drawBoard();
    // halfmoon.toastAlert('precompiled-alert-1', 17500);
    // halfmoon.toggleModal('modal-custom');
    //doAction(null, 'toTab,video');
}

function socketTest() {
    queryMsg({ type: 'online' });
}