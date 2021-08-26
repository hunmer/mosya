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
var g_test = 1;

// var socket_url = 'ws://192.168.31.209:8000';
// var g_api = 'api/';
// var g_imageHost = 'http://192.168.31.209/mosya-websocket/';

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
    closeCustom: () => {},
    tags: [],
    a_tts: [],
}
var _viewer;
halfmoon.toggleSidebar1 = halfmoon.toggleSidebar;
halfmoon.toggleSidebar = () => {
    if($(window).width() > 1580){
        $('.sidebar')[0].style.cssText = "z-index: 2100; display: "+ ($('.sidebar').css('display') == 'block' ? 'none' : 'block')+" !important; left: -" + $('body').offset().left+'px';
        return;
    }
    return halfmoon.toggleSidebar1();
}

halfmoon.toggleModal1 = halfmoon.toggleModal;
halfmoon.toggleModal = (id) => {
    var showing = $('#'+id).hasClass('show');
    switch(id){
        case 'modal-img':
            if(showing){
                g_dot.div.hide();
            }
            break;
    }
    halfmoon.toggleModal1(id);
}

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
     _video.onplay = () => {
        if(_video.volume > 0){
            if(!_audio.paused){
                _audio.temp_paused = true;
                _audio.pause();
            }
        }
     },
      _video.onpause = () => {
        if(_audio.temp_paused){
            _audio.temp_paused = false;
            _audio.play();
        }
     },
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
         $('#bottom_music .cover').removeClass('paused');
    }
    _audio.onpause = () => {
        $('i[data-action="audio_play"]').prop('class', 'fa fa-play');
        $('#bottom_music .cover').addClass('paused');
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
            _tts.parse(next);
        }
    }

    _tts.parse = (data) => {

        if(data.meta){
            var timeout = 0;
            switch(data.meta.type){
                case 'time':
                    addAnimation($('#cnt'), 'flash');
                    break;

                case 'chat':
                    if(data.meta.user && data.meta.user == me()) return;
                    break;

                case 'broadcast':
                    break;

                case 'tip':
                    timeout = 3000;
                    g_tip.alert(data.meta.value, data.meta.time);
                    break;
            }
        }
        setTimeout(() => {
            _tts.src = data.data;
            _tts.play();
        }, timeout);
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
        var data = { type: 'status', data: {} };
        if (!_audio.paused) {
            skip = false;
            data.data.audio = {
                time: _audio.currentTime,
                url: _audio.src
            }
        }
        if (!_video.paused) {
            skip = false;
            data.data.video = {
                time: _video.currentTime,
                url: _video.src
            }
        }
        if (!skip) {
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
        lrz(that.files[0], {width: 800, quality: 0.5})
            .then(function(rst) {
                // console.log(rst);
                //console.log(parseInt(that.files[0].size / 1024), parseInt(rst.fileLen / 1024));
                switch (that.id) {
                    case 'input_preview':
                        $('#img_uploadImage').attr('src', rst.base64).attr('title', rst.origin.name).show();
                        $('#upload_title').val(that.files[0].name);
                        break;

                    case 'img_sendImage':
                        var s = '<img class="thumb" data-user="'+g_config.user.name+'" data-action="previewImage" src="' + rst.base64 + '" alt="Upload by ' + g_config.user.name + '">';
                        var m = md5(rst.base64);
                        g_cache.sendedImgMd5 = m;
                        g_cache.sendedImg = s;
                        queryMsg({ type: 'msg', image: m, user: g_config.user.name, msg: s});
                        break;

                    case 'input_bg':
                        g_config.bg = rst.base64;
                        g_cache.uploaded_bg = rst.base64;
                        setBg(rst.base64);
                        break;
                }
            })
            .catch(function(err) {
                // 处理失败会执行
            });
    });

    window.history.pushState(null, null, "#");
    window.addEventListener("popstate", function(event) {
         if (_viewer && _viewer.isShown) {
            _viewer.hide();
        }else
        if($('.modal.show').length){
            halfmoon.toggleModal($('.modal.show')[0].id);
        }else
        if(hideSidebar()) {
        }else
        if(g_cache.tab != undefined){
            g_cache.tab = undefined;
            $('[data-action="toTab,chat"]')[0].click();
        }else{
            if(confirm('終了しますか？オンライン時間 :' + getTime(getNow() -  g_cache.loginTime) )){
                toastPAlert('よろしいですか？!', 1000, '', 'alert-danger');
                return;
            }
        }
        window.history.pushState(null, null, "#");
        event.preventDefault(true);
        event.stopPropagation();
    });


    $('#grid_x').val(g_config.grid.x || 5);
    $('#grid_y').val(g_config.grid.y || 5);
    $('#grid_size').val(g_config.grid.size || 1);
    $('#grid_opacity').val(g_config.grid.opacity || 1);
    $('input[type=color]').val(g_config.grid.color);
    $(window).resize((e) => {
    	var w = $('#image').width();
    	var mw = $('#div_mainImg').width();
    	if(w > mw){
    		w = mw;
    	}else{
    		var w = parseInt($('#image').attr('naturalWidth'));
    		if(w > mw){
    			w = mw;
    		}
    	}
    		$('#image').width(w);
        drawBoard();
    });
    g_cache.loginTime = getNow(); 

    test();
}

function setAudioSrc(player, src) {
    player.source = src;
    player.src = src;
    player.play();
}

function setGrid(type, id, add, min) {
    var i;
    if (min != undefined && typeof(add) == 'object') {
        i = add.value;
        if (i < min) {
            i = min;
            add.value = min;
        }
    } else {
        i = Number($(type + id).val());
        if (add > 0) {
            i+=add;
            if(min != undefined){
                if(i > min) return
                i= i.toFixed(1);
            }
        } else
        if (add < 0) {
            i-=Math.abs(add);
            if(min == undefined){
                min = 1;
            }else{
                i= i.toFixed(1);
            }
            if (i < min) return;
        }
    }
    switch(type){
        case '#grid_':
            g_config.grid[id] = i;
            local_saveJson('config', g_config);
            drawBoard();
            break;

        case '#bg_':
            g_config[id] = i;
            local_saveJson('config', g_config);
            setBg(g_config.bg);
            break;
    }
     $(type + id).val(i)
}



function setGridColor(color) {
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
    $(btn).html('アップロード中...');

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
    if(g_stricker['id_' + id]){
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
    }
   
    g_cache.strick_last = data;
}

function sendStricker() {
    var animation = g_cache.strick_last.animation;
    var key = g_cache.strick_last.id+','+g_cache.strick_last.sid;

    // 保存历史记录
    var i = g_stricker_options.history.indexOf(key);
    if(i != -1) g_stricker_options.history.splice(i, 1);
    g_stricker_options.history.splice(0, 0, key);
    if (g_stricker_options.history.length > 100) {
        g_stricker_options.history.pop();
    }
    local_saveJson('stricker_options', g_stricker_options);
    stricker_initHistory();

    // TODO 默认预载图片
    var s = $('#msg').val();
    var data = { type: 'msg', msg: '<img class="thumb loading animated bounceInDown' + (animation ? ' gif' : '') + '" animated="bounceInDown" data-action="previewImage" data-src="' + (animation || g_cache.strick_last.img) + '">' };
    if (g_cache.strick_last.audio) {
        data.audio = g_cache.strick_last.audio;
    }else
    if(s != ''){
        if(s.substr(0, 1) == '.' || s.substr(0, 4) == 'http'){ // url
            data.audio = s;
        }else{
            data.tts = s;
        }
         $('#msg').val('');
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

function queryPlaylist(id){
    var share = confirm('共有しますか？');
    var random = confirm('ランタイムしますか?');
    $.getJSON(g_api + 'search.php?server=youtube&type=list&id=' + id, function(json, textStatus) {
        if (textStatus == 'success') {
            console.log(json);
            g_playlist[id] = {
                name: json[0].name+'...',
                // name: getFormatedTime(1),
                length: json.length
            }
            local_saveJson('playlist', g_playlist);
            if(random){
                json = json.sort(function(a, b) {
                    return Math.random()>0.5?-1:1;
                });
            }
            var d = { type: 'playlist_set', user: g_config.user.name, data: json };
            if(share){
                queryMsg(d);
            }else{
                reviceMsg(d);
            }
        }
    });
}

function doAction(dom, action, params) {
    var action = action.split(',');
    if(g_actions[action[0]]){
        g_actions[action[0]](dom, action, params);
    }
    switch (action[0]) {
        case 'player_embed':
            var url = prompt('embed url',  $('#iframe_music').attr('src') || g_test ?'https://open.spotify.com/playlist/71j4gz1VqJ3a6LGCVpQsYX' : '');
            if(url != undefined && url.length){
                if(url.indexOf('open.spotify.com') != -1){
                    var id = cutString(url + '&', 'open.spotify.com/playlist/', '&');
                    if(!id.length) return;
                    url = 'https://open.spotify.com/embed/playlist/'+id+'?theme=0';
                }else
                if(url.indexOf('music.163.com') != -1){
                    var id = cutString(url + '&', 'playlist?id=', '&');
                    if(!id.length) return;
                    url = 'https://music.163.com/outchain/player?type=0&id='+id+'&auto=1';
                }else{
                    alert('not supported now');
                    return;
                }
                halfmoon.deactivateAllDropdownToggles();
                queryMsg({type: 'player_embed', url: url}, true);
            }
            break;
        case 'qm':
            halfmoon.deactivateAllDropdownToggles();
            sendMsg($(dom).html());
            break;
        case 'audio_sort':
            if($(dom).hasClass('fa-level-down')){
                c = 'random';
            }else
            if($(dom).hasClass('fa-random')){
                c = 'repeat';
            }else
            if($(dom).hasClass('fa-repeat')){
                c = 'level-down'
            }
            $(dom).attr('class', 'fa fa-'+c);
            break;
        case 'pose_search':
            if($('#content_lab').attr('data-list') == 'true'){
                if(g_config.poseSearch == 'quick-pose'){
                    g_poseCache = {};
                    toPage(1);
                    return;
                }
                initPoseContent(g_pose.datas, false);
            }else{
                toPage(1);
            }
            break;
        case 'pose_selectd':
            if(checkPoseSelected() > 0){
                g_cache.closeCustom = () => {
                    checkPoseSelected('#modal-custom [data-action="selectImg"]', true);
                }
                $('#modal-custom').find('.modal-title').html('pose');
                $('#modal-custom').attr('data-type', 'chat').find('.modal-html').html(`
                    <div class="row w-full mt-10">
                    ` + pose_getImgsHtml(g_pose_selected) + '</div>');
                halfmoon.toggleModal('modal-custom');
            }
            break;
        case 'pose_send':
            if(checkPoseSelected() > 0){
                var time = parseInt(prompt('interval time', 180));
                if(!isNaN(time) && time > 0){
                    queryMsg({ type: 'pose_list', data: g_pose_selected, time: time}, true);
                }
            }else{
                toastPAlert('没有选中任何图片!', 1000, '', 'alert-danger');
            }
            break;
        case 'pose_selectAll':
            var imgs = $('[data-action="selectImg"]');
            if($('.img_active').length){
                g_cache.pose_selected -= $('.img_active').removeClass('img_active').length;
            }else{
                 g_cache.pose_selected += imgs.addClass('img_active').length;
            }
            $('[data-action="pose_selectd"]').html(g_cache.pose_selected);
            break;
        case 'selectPage':
            var page = parseInt(prompt('input page(1-'+g_cache.pose_maxPage+'):', g_cache.pose_page));
            if(page > g_cache.pose_maxPage || page <= 0){
                alert('error');
                return;
            }
            toPage(page);
            break;
        case 'selectImg':
            if($(dom).toggleClass('img_active').hasClass('img_active')){
                g_cache.pose_selected++;
            }else{
                g_cache.pose_selected--;
            }
            $('[data-action="pose_selectd"]').html(g_cache.pose_selected);
            break;
        case 'selectImg1': // 展示图片
            $('.img_active1').removeClass('img_active1');
            $(dom).addClass('img_active1');
            pose_nextImg(parseInt($(dom).attr('data-index')));
            break;
        case 'playUrl_fromMsg':
            playUrl(JSON.parse($(dom).attr('data-json')));
            toastPAlert('解析成功!', 1000, '', 'alert-success');
            break;
        case 'audio_volume':
            if(_audio.volume == 1){
                _audio.volume = 0;
            }
            _audio.volume += Math.min(1 - _audio.volume, 0.1);
            g_config.volume = _audio.volume;
            local_saveJson('config', g_config);
            toastPAlert('volume : ' + parseInt(_audio.volume * 100) + '%', 1000, '', 'alert-secondary');
            break;
        case 'audio_share':
            queryMsg({type: 'play_url', data: {
                type: 'audio',
                url: _audio.src,
                time: 0,
            }}, true);
            toastPAlert('共有成功!', 1000, '', 'alert-success');
            break;
        case 'previewImg_fromURL':
            var url = prompt('url');
            if(url != undefined && url.length){
                $('#img_uploadImage').attr('src', url).attr('title', url).show();
                $('#upload_title').val('from url');
            }
            break;
        case 'doSearch':
            switch(action[1]){
                case 'yandex':
                    s_url = 'https://yandex.com/images/search?text={s}';
                    break;

                case 'pinterest':
                    s_url = 'https://www.pinterest.com/search/pins/?q={s}';
                    break;

                case 'google':
                    s_url = 'https://www.google.com.tw/search?q={s}';
                    break;

                case 'huaban':
                    s_url = 'https://huaban.com/search/?q={s}';
                    break;

                case 'pixiv':
                    s_url = 'https://www.pixiv.net/tags/{s}';
                    break;

                case 'yande':
                    s_url = 'https://yande.re/post?tags={s}';
                    break;

                default: return;
            }
            var s = $('#input_search').val();
            if(s == '') return;
            window.open(s_url.replace('{s}', s), '_blank');
            halfmoon.deactivateAllDropdownToggles();
            break;
        case 'finish':
            if(confirm('完成しましたか？')){
                $(dom).hide();
                $('#cnt').attr('class', 'badge badge-success text-black');
                queryMsg({ type: 'msg', user: g_config.user.name, msg: 'できました！！！', textOnly: true });
            }
            break;
        case 'playlist_selected':
            $('modal-custom').find('tboday.bg-primary').removeClass('bg-primary');
            $(dom).addClass('bg-primary');
            $('#playlist_btns').show();
            break;
        case 'playlist_history':
            if(!Object.keys(g_playlist).length){
                toastPAlert('記録なし!', 1000, '', 'alert-secondary');
                return;
            }
            var h = `<table class="table table-striped">
                <thead>
                    <tr>
                        <th data-action="playlist_clear"><i class="fa fa-trash-o" aria-hidden="true"></i></th>
                        <th style="width: 70%;">名前</th>
                        <th class="text-right">曲数</th>
                    </tr>
                </thead>`;
            var i = 1;
            for(var id in g_playlist){
                h += `
                <tbody data-id="`+id+`" data-action="playlist_selected">
                     <tr>
                  <th>
                      `+i+`
                  </th>
                  <td>` + g_playlist[id].name + `</td>
                  <td class="text-right">` + g_playlist[id].length + `</td>
                </tr>
                </tbody>
                `;
                i++;
            }
            $('#modal-custom').find('.modal-title').html('リスト');
            $('#modal-custom').attr('data-type', 'playlist').find('.modal-html').html(h+`</table>
                <div id="playlist_btns" class="hide mt-10">
                <a data-action="playlist_btn_delete" class="btn bg-danger" role="button"><i class="fa fa-trash-o" aria-hidden="true"></i></a>
                <a data-action="playlist_btn_edit" class="btn bg-default" role="button"><i class="fa fa-pencil-square-o" aria-hidden="true"></i></a>
                <a data-action="playlist_btn_send"  class="btn btn-primary" role="button"><i class="fa fa-paper-plane" aria-hidden="true"></i></a>
                </div>
            `);
            halfmoon.toggleModal('modal-custom');
            break;

        case 'playlist_clear':
            if(confirm('本当に全部削除してよろしですか？')){
                g_playlist = {};
                local_saveJson('playlist', g_playlist);
                halfmoon.toggleModal('modal-custom');
            }
            break;

        case 'playlist_btn_delete':
            var selected = $('#modal-custom').find('tbody.bg-primary');
            delete g_playlist[selected.attr('data-id')];
            local_saveJson('playlist', g_playlist);
            selected.remove();
            if($('#modal-custom tbody').length == 0){
                halfmoon.toggleModal('modal-custom');
            }else{
                $('#playlist_btns').hide();
            }
            break;

        case 'playlist_btn_edit':
            var selected = $('#modal-custom').find('tbody.bg-primary');
            var id = selected.attr('data-id');
            var name = prompt('名前を入力', g_playlist[id].name);
            if(name != undefined && name != ''){
                g_playlist[id].name = name;
                local_saveJson('playlist', g_playlist);
                selected.find('td')[0].innerHTML = name;
            }
            break;

        case 'playlist_btn_send':
            queryPlaylist($('#modal-custom').find('tbody.bg-primary').attr('data-id'));
            halfmoon.toggleModal('modal-custom');
            break;
        case 'saveSetting':
            g_config.tipSound = $('#select-tip').val();
            var bg = $('#select-bg').val();
            if(bg == 'upload' && g_cache.uploaded_bg != undefined){
                bg = g_cache.uploaded_bg
            }
            g_config.bg = bg;
            g_config.blur = $('#bg_blur').val();
            g_config.tts = $('#checkbox_tts').prop('checked');
            g_config.fixInput = $('#checkbox_fixInput').prop('checked');
            local_saveJson('config', g_config);
            halfmoon.toggleModal('modal-custom');
            initSetting();
            break;
        case 'openSetting':
            g_cache.bg =  g_config.bg || '';
            g_cache.closeCustom = () => {
                g_config.bg = g_cache.bg;
                setBg(g_config.bg);
            }
            $('#modal-custom').find('.modal-title').html('設定');
            $('#modal-custom').attr('data-type', 'setting').find('.modal-html').html(`
                <div class="form-group">
                        <label>ヒント音</label>
                        <div class="row">
                            <select class="form-control col-4" id="select-tip" onchange="if (this.value == 'custom') {var url = prompt('input url', 'https://i.pinimg.com/564x/22/a9/ba/22a9ba4562c20c5d8cf43691cb95392d.jpg');if (url != null && url != '') $(this).find(':disabled').val(url).html(url).prop('selected', true);}else{soundTip(this.value)}">
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
                            <div class="col-4"></div>
                        </div>
                    </div>
                    <div class="form-group mt-10">
                        <label>背景</label>
                        <label class="float-right">背景ブラー</label>
                        <div class="row">
                            <select class="form-control col-4" id="select-bg" onchange="if(this.value == 'custom'){var url = prompt('input url', 120);if (url != null && url != ''){$(this).find(':disabled').val(url).html(url).prop('selected', true);}}else if(this.value == 'upload'){$('#input_bg').click()}else{g_cache.uploaded_bg=undefined;g_config.bg = this.value;setBg(this.value)}">
                                <option value="" selected>なし</option>
                                <option value="custom">URL</option>
                                <option value="upload">アップロード</option>
                                <option value="" disabled>--------</option>
                                <option value="res/bg.jpg">少女</option>
                                <option value="res/カエル.jpg">カエル</option>
                                <option value="res/ウサギ.jpg">ウサギ</option>
                                <option value="res/スター.jpg">スター</option>
                                <option value="res/紫色の花.jpg">紫色の花</option>
                                <option value="res/紫色の星.jpg">紫色の星</option>
                                <option value="res/ピクセル.jpg">ピクセル</option>
                                <option value="res/ピクセル1.jpg">ピクセル1</option>
                            </select>
                            <div class="col-4"></div>
                            <div class="input-group col-4">
                                <div class="input-group-prepend">
                                    <span class="input-group-text" onclick="setGrid('#bg_', 'blur', -1, 0)">
                                    <</span> </div> <input id='bg_blur' type="number" class="form-control" value="4" onkeyup="setGrid('#bg_', 'blur', this, 0)">
                                        <div class="input-group-append">
                                            <span class="input-group-text" onclick="setGrid('#bg_', 'blur', 1)">></span>
                                        </div>
                                </div>
                            </div>
                        </div>
                        <div class="custom-switch col-4 mt-10">
                            <input type="checkbox" id="checkbox_tts" value="">
                            <label for="checkbox_tts">音読</label>
                        </div>
                        <div class="custom-switch col-4 mt-10">
                            <input type="checkbox" id="checkbox_fixInput" value="">
                            <label for="checkbox_fixInput">入力修復</label>
                        </div>
                        
                        <button class="btn btn-primary btn-block mt-10" id="btn_upload" data-action="saveSetting">保存</button>
                `);
            halfmoon.toggleModal('modal-custom');
            $('#bg_blur').val(g_config.blur || 0);
            $('#select-tip option[value="' + g_config.tipSound + '"]').prop('selected', true);
            if(typeof(g_config.bg) == 'string' && g_config.bg.substr(0, 5) == 'data:'){
                $('#select-bg option[value="upload"]').prop('selected', true);
            }else{
                $('option[value="' + g_config.bg + '"]').prop('selected', true);
            }
            $('#checkbox_tts').prop('checked', g_config.tts);
            $('#checkbox_fixInput').prop('checked', g_config.fixInput);
            break;
        case 'openViewer':
            hideSidebar();
            if (_viewer != undefined) _viewer.destroy();
            _viewer = new Viewer(dom, {
                backdrop: 'static',
                navbar: 0,
                title: 0,
                toggleOnDblclick: false,
                url(image) {
                    return image.src.replace('saves/_', 'saves/');
                  },
            });
            _viewer.show();
            break;
        case 'imageHistory_toDay':
            $('#days_tabs button.btn-primary').removeClass('btn-primary');
            $(dom).addClass('btn-primary');

            var time = new Date(new Date().getFullYear() + '/' + $(dom).html().replace('.', '/')).getTime();
            queryMsg({ type: 'pics', time: time, max: time + 3600 * 24 * 1000 })
            break;
        case 'downloadImageToServer':
            var src = $('#modal-img img').attr('src');
            if (src.indexOf('http:') == -1) {
                queryMsg({ type: 'save', data: src, user: $('#modal-img').attr('data-user')});
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
                if (prev.length == 0 || ['like', 'search', 'history'].indexOf(prev.attr('data-id')) != -1) {
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
                toastPAlert('読み込み中', 1000, '', 'alert-secondary');
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
            $('#modal-stricker .modal-title span').html(id == 'like' ? 'お気に入り' : id == 'search' ? '検索' : id == 'history' ? '歴史' : g_stricker['id_' + id].name);

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
            var search = prompt('キーワード&URL', 'kizuna');
            if(search.length){
                searchStrick(search);
            }
            break;
        case 'show_stricker':
            initStrickers();
            $('#stricker_footer').css('display', (g_stricker.length ? 'unset' : 'none'));
            halfmoon.toggleModal('modal-stricker');
            if (g_stricker_options.last.id != '') {
                var btn = $('[data-action="stricker_toTab"][data-id="' + g_stricker_options.last.id + '"]')[0];
                if(btn){
                    btn.click();
                    btn.scrollIntoView();
                }
            }
            for (var img of $('#stricker_tabs .loading')) {
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
            addAnimation($(dom), 'rubberBand');
            $('#image_div').toggle();
            $(dom).find('i').prop('class', 'fa fa-arrow-' + ($('#image_div').css('display') == 'none' ? 'down' : 'up'));
            break;
        case 'sendImage':
            if(g_cache.sendedImgMd5){
                if(!confirm('まだアップロードされていない画像がまだ存在していますが、キャンセルされたのでしょうか？')) return;
            }
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
            var m = prompt('PLAYLIST URL', g_test ? 'https://www.youtube.com/playlist?list=PLhZZuOohK5a09TxrOHvwECzWlkLPXb5n6' : '');
            if (m != '' && m != null) {
                m = cutString(m + '&', 'list=', '&');
                if (m == '') {
                    alert('錯誤的url');
                    return;
                }
                queryPlaylist(m);
            }
            break;
        case 'video_set':
            var m = prompt('VIDEO URL', g_test ? 'https://www.youtube.com/watch?v=W1nNBONFybk' : '');
            if (m != '' && m != null) {
                id = cutString(m + '&', '?v=', '&');
                if (id !== '') {
                    if(confirm('embed?')){
                        queryMsg({type: 'play_url', data: {
                            type: 'video_embed',
                            url: 'https://www.youtube.com/embed/'+id,
                            time: 0
                        }}, true);
                    }else{
                        $.getJSON(g_api + 'search.php?server=youtube&type=id&id=' + id, function(json, textStatus) {
                            if (textStatus == 'success') {
                                queryMsg({ type: 'video', user: g_config.user.name, data: json });
                            }
                        });
                    }
                }else{
                    queryMsg({type: 'play_url', data: {
                        type: 'video',
                        url: m,
                        time: 0
                    }}, true);
                }
            }
            break;

        case 'playlist_add':
            halfmoon.deactivateAllDropdownToggles()
            var m = prompt('VIDEO URL', g_test ? 'https://www.youtube.com/watch?v=9MjAJSoaoSo' : '');
            if (m != '' && m != null) {
                id = cutString(m + '&', 'youtube.com/watch?v=', '&');
                if (id !== '') {
                    $.getJSON(g_api + 'search.php?server=youtube&type=id&id=' + id, function(json, textStatus) {
                        if (textStatus == 'success') {
                            queryMsg({ type: 'playlist_add', user: g_config.user.name, data: json });
                        }
                    });
                } else {
                    queryMsg({type: 'play_url', data: {
                        type: 'audio',
                        url: m,
                        time: 0
                    }}, true);
                }
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
            var b = $('[data-action="audio_sort"]');
            if(b.hasClass('fa-repeat')){
                _audio.currentTime = 0;
                _audio.play();
                return;
            }
            if(b.hasClass('fa-level-down')){
                var c = $('[data-vid].bg-primary').next();
            }else
            if(b.hasClass('fa-random')){
                c = $('[data-vid]');
                c = $(c[randNum(0, c.length-1)]);
            }
            if (c.length) c.click();
            break;
        case 'playSong':
            g_config.lastPlay = $(dom).attr('data-vid');
            local_saveJson('config', g_config);
            var src = g_api + 'search.php?server=youtube&type=url&id=' + g_config.lastPlay;
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
            addAnimation($(dom), 'rubberBand');
            sendMsg(msg);
            break;
        case 'playerList':
            updatePlaylist();
            halfmoon.toggleModal('modal-custom');
            break;
        case 'play_url':
            playUrl({
                type: $(dom).attr('data-type'), 
                url: $(dom).attr('data-url'),
                time: $(dom).attr('data-time')});
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
            hideSidebar();
            $('#cnt').hide();
            if (dom.src.indexOf('/animation/') != -1) {
                var now = getNow();
                var last = $('#modal-img').attr('data-click');
                if (!last || now - last >= 5 || $('#modal-img').attr('data-url') != dom.src) {
                    $('#modal-img').attr('data-click', now).attr('data-url', dom.src);
                    return;
                }
            }

            var saved = $(dom).parent().find('.saved').length || $(dom).hasClass('serverImg') || $(dom).parent().find('.mark_cnt').length; // 是否在服务器上存在
            var m = $(dom).attr('data-md5');
            if(m){
                // 获取评论
                $('.img-mark-dots').remove();
                queryMsg({type: 'comments_get', md5: m});
            }
            g_dot.setSwitchDisplay(saved);

            $('[data-action="downloadImageToServer"]').css('display', dom.src.indexOf('data:image/') == -1 || saved ? 'none' : '');

            $('#modal-img .modal-title').html(dom.alt);
             $('#modal-img').attr('data-md5', m).attr('data-user', $(dom).attr('data-user')).
             find('img').attr('src', '').attr('src', $(dom).attr('data-src') || dom.src);

            halfmoon.toggleModal('modal-img');
            break;
        case 'darkMode':
            halfmoon.toggleDarkMode();
            g_config.darkmode = $('body').hasClass('dark-mode');
            local_saveJson('config', g_config);
            var i = $(dom).find('i');
            if (g_config.darkmode) {
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
            g_cache.tab =  action[1];
            $('#tabs .btn-primary').removeClass('btn-primary');
            $('[data-action="toTab,' + action[1] + '"]').addClass('btn-primary');
            if(dom){
                addAnimation($(dom), 'rubberBand');
            }
            
            var hide = false;
            for (var con of $('._content')) {
                if (con.id == 'content_' + action[1]) {
                    hide = $(con).attr('data-hide');
                    $(con).show();
                } else {
                    $(con).hide();
                }
            }
            if(!hide){
                $('.navbar-fixed-bottom').show();
                var toolbar = action.length > 2 ? action[2] : action[1];
                for (var con of $('.toolbar')) {
                    if (con.id == 'bottom_' + toolbar && $(con).html() != '') {
                        $(con).show();
                    } else {
                        $(con).hide();
                    }
                }
            }else{
                $('.navbar-fixed-bottom').hide();
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
            var btn = $('[data-btn="btn_' + action[2] + '"]').addClass('btn-primary');
            
            var unread = btn.find('[data-clickHide]');
            if (unread.length > 0) {
                unread.html('').hide();
            }
            for (var con of par.find('.subContent')) {
                if (con.id == 'subContent_'+action[2]) {
                    $(con).show();
                } else {
                    $(con).hide();
                }
            }
            var toolbar = action.length > 3 ? action[3] : action[2];
            for (var con of $('.toolbar')) {
                if (con.id == 'bottom_' + toolbar && $(con).html() != '') {
                    $(con).show().parent().show();
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

function playUrl(data, user) {
    var obj;
    switch (data.type) {
        case 'video_embed':
            $('iframe').attr('src',data.url).show();
            _video.pause();
            _audio.pause();
            _video.hide();
            break;
        case 'audio':
            obj = _audio;
            if(obj.src == data.url && !obj.paused) return;
            _video.pause();
            $('#bottom_music img').attr('src', 'res/cd.png');

            if(user){
                reviceMsg({
                    type: 'msg',
                    user: user,
                    msg: `<a data-action="playUrl_fromMsg" data-json="`+JSON.stringify(data)+`" href="javascript: void(0);">▶ : 音源</a>`
                });
            }
            break;

        case 'video':
            obj = _video;
            if(obj.src == data.url && !obj.paused) return;
            $('iframe').attr('src', '').hide();
            _audio.pause();
            closeModal('modal-custom', 'playerList', () => {
                halfmoon.toggleModal('modal-custom');
            });
            doAction(null, 'toTab,video');
            $(_video).show();
            break;
    }
    if (obj) {
        obj.src = data.url;
        obj.currentTime = data.time;
    }
}

function updatePlaylist() {
    $('#modal-custom').find('.modal-title').html(`メンバー<i class="fa fa-refresh float-right" onclick="queryMsg({ type: 'list' });" aria-hidden="true"></i>`);
    var html = `
    <table class="table table-striped">
    <thead>
        <tr>
            <th></th>
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
                    <th><i class="fa fa-`+(d.pc ? 'desktop' : 'mobile')+`" aria-hidden="true"></th>
                  <td>
                      <img src="res/` + name + `.jpg" class="img-fluid rounded-circle user-icon" alt="` + name + `">
                  </td>
                  <td>` + (d.status.audio != undefined ? `
                    <a  class="badge-group" role="group" aria-label="...">
                      <span class="badge bg-dark text-white">` + getTime(parseInt(d.status.audio.time)) + `</span> 
                      <span class="badge badge-success" data-action="play_url" data-type='audio' data-url="` + d.status.audio.url + `" data-time="` + d.status.audio.time + `"><i class="fa fa-play" aria-hidden="true"></i></span>
                    </a>
                    ` : '') + `</td>
                  <td>` + (d.status.video != undefined ? `
                    <a  class="badge-group" role="group" aria-label="...">
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
    var s = JSON.stringify(data);
    var max = 30000;
    var p = Math.ceil(s.length / max);
    if(data.image && p > 0){
        $('#modal-custom').find('.modal-title').html('アップロード');
        $('#modal-custom').attr('data-type', 'chat').find('.modal-html').html(`
            <div class="progress-group">
              <div class="progress">
                <div class="progress-bar progress-bar-animated" id='progress_part' role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="`+p+`"></div>
              </div>
              <span class="progress-group-label" id='span_part'>0%</span>
            </div>
            `);
        halfmoon.toggleModal('modal-custom');
        for(var i=0;i<=p;i++){
            console.log(i, s.substr(i * max, max).length);
            connection.send(JSON.stringify({
                type: 'part',
                data: s.substr(i * max, max),
                index: i,
                length: s.length,
                parts: p,
            }));
        }
    }else{
        connection.send(s);
    }
}

var connection;


function recon() {
    $('#status').attr('class', 'bg-dark-light');
    if (g_cache.logined) {
        initWebsock();
    }
}


function initWebsock() {
	console.log(connection);
    if (connection != undefined){
    	connection.close(); // 这个是异步函数,交给Onclose处理
    	connection = undefined;
    	return;
    }
    connection = new WebSocket(socket_url);
    connection.onopen = () => {
        $('#status').attr('class', 'bg-success');
        queryMsg({ type: 'login', user: g_config.user , pc: IsPC()});
        if(!g_cache.logined){
            // queryMsg({ type: 'pics_datas' });
            // queryMsg({ type: 'history_message' });
        }
        g_cache.logined = true;
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
    var con = $('#content_music table').html(h).find('tbody' + g_config.lastPlay ? '[data-vid="'+g_config.lastPlay+'"]' : ':eq(0)').click()
    closeModal('modal-custom', 'music', () => {
        $('#modal-custom .modal-html').html($('#content_music').html());
    });
}

var g_canva = $('canvas');

function drawBoard() {
	if($('#image').css('display') == 'none') return;
    var context = g_canva.get(0).getContext("2d");
    g_canva[0].height = context.height; // 清除画布
    if (!g_config.grid.enable) {
        g_canva.hide();
        return;
    }
    g_canva.show();
    g_canva.css('opacity', g_config.grid.opacity || 1);

    //grid width and height
    var bw = $('#image').width()-4;
    var bh = $('#image').height();

    //padding around grid
    var p = 0;
    //size of canvas

    if (bw != g_canva.width() || bh != g_canva.height()) {
        g_canva.attr('width', bw);
        g_canva.attr('height', bh);
        g_canva.offset($('#image').offset());
    }
    context.beginPath();
    context.setLineDash([3, 3]); //画虚线
    for (var x = 0; x <= bw; x += bw / g_config.grid.x) {
        context.moveTo( x + p, p);
        context.lineTo( x + p, bh + p);
    }

    for (var x = 0; x <= bh; x += bh / g_config.grid.y) {
        context.moveTo(p, x + p);
        context.lineTo(bw + p, x + p);
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

function me(){
    return g_config.user.name;
}



function reviceMsg(data) {
    console.log(data);
    var type = data.type;
    delete data.type;
    if(g_revices[type]){
        return g_revices[type](data);
    }
    switch (type) {
        case 'player_embed':
            reviceMsg({
                type: 'msg',
                user: data.user,
                msg: `<a href="javascript: doAction(null, 'toTab,music')">▶ music playlist</a>`
            });
            $('#content_music table, #bottom_music .row').hide();
            _audio.pause();
            $('#iframe_music').css('height', '500px').html(`<iframe src="`+data.url+`" width="100%" height="100%" frameBorder="0" allowtransparency="true" allow="encrypted-media"></iframe>`);
            break;
        case 'pose_list':
            parsePoseData(data.data, data.time, false);
            break;
        case 'timeSync':
            if(g_cache.post != undefined){
                g_cache.post.time = parseInt(data.data);
                g_cache.post_start = data.start;
            }
            break;
        case 'sendedImg':
            if(data.md5 == g_cache.sendedImgMd5){
                reviceMsg({ type: 'msg', user: g_config.user.name, msg: g_cache.sendedImg, exists: data.exists});
                delete g_cache.sendedImgMd5;
                delete g_cache.sendedImg;
            }
            break;
        case 'part':
            var progress = parseInt(data.index / data.parts * 100);
            $('#progress_part').css('width', progress + '%');
            $('#span_part').html(progress + '%');
            if(progress == 100){
                halfmoon.toggleModal('modal-custom');
            }
            break;
        case 'play_url':
            playUrl(data.data, data.user);
            break;
        case 'tts':
            if (g_config.tts != undefined && !g_config.tts) return;
            if (_tts.paused) {
                _tts.parse(data);
            } else {
                g_cache.a_tts.push(data);
            }
            break;
        case 'history_message':
            for (var d of data.data) {
                if(d.msg != undefined){
                    d.type = 'msg';
                }
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
            $('.sidebar-menu h3').html('第 ' + (days.length+1) + ' 日').show();
            $('#days_tabs div').html(h);
            if (data.removed) {
                $('.serverImg[data-md5="' + data.removed + '"]').parent('.div-photo').remove();
            }
            break;
        case 'pics':
            var h = '';
            if (data.data == undefined) {
                toastPAlert('データがありません!', 1000, '', 'alert-secondary');
                return;
            }
            for (var key in data.data) {
                var detail = data.data[key];
                h += `<div class="div-photo" data-md5="` + key + `"><h6 class="text-center">` + getFormatedTime(1, new Date(detail.time)) + ' (' + detail.user + `)</h6><img data-md5="` + key + `" data-action="previewImage" src="` + g_imageHost + `saves/_` + key + `.jpg" data-src="` + g_imageHost + `saves/` + key + `.jpg" class="serverImg" alt="` + detail.user + `">`;
                if (g_config.user.name == 'maki') {
                    h += `<a  class="btn btn-square btn-danger rounded-circle" data-action="deleteServerImage" role="button"><i class="fa fa-trash-o" aria-hidden="true"></i></a> 
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
                h += `<a  class="sidebar-link sidebar-link-with-icon" data-action="show_onlineTime">
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
            $('#content_music table, #bottom_music .row').show();
            $('#iframe_music').html('');

            reviceMsg({
                type: 'msg',
                user: data.user,
                msg: `<a data-action="toTab,music" href="javascript: void(0);">📚 : ` + data.data.length + '曲</a>'
            });
            parseMusiclist(data.data);
            break;
        case 'playlist_add':
            $('#content_music table, #bottom_music .row').show();
            $('#iframe_music').html('');

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
            broadcastMessage('<b>時間切りです！</b>', 'bg-secondary');
            if(g_cache.post) g_cache.post.time = 0;
            if(g_cache.poseTime) g_cache.poseTime = 0;
            g_cache.poseing = undefined;
            $('#ftb').hide();
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
            g_cache.post_start = data.start || 0;
            parsePost(data.data);
            break;
        case 'tip':
            toastPAlert(data.msg, data.time, data.title, data.msgType);
            break;
        case 'save':
            var img = $('#content_chat [data-md5="' + data.data + '"]');
            if (img.length && !img.parent().find('.saved').length) {
                $(`<a  class="btn btn-square btn-success rounded-circle saved" style="position: relative;bottom: 5px;right: 20px;" role="button"><i class="fa fa-check" aria-hidden="true"></i></a> 
                `).insertAfter(img);
                closeModal('modal-img', false, () => {
                    halfmoon.toggleModal('modal-img');
                });
            }
            break;
        case 'msg':
        case 'voice':
            var d = $('#typing');
            if(d.css('display') != 'none' && d.attr('data-user') == data.user){
                d.hide();
            }
            var dom = addMsg(`<tr class="msg hide">
                  <th>
                      <img src="` + getUserIcon(data.user) + `" class="rounded-circle user-icon" alt="` + data.user + `">
                  </th>
                  <td><div class="position-relative">` + (type == 'msg' ? data.msg : `

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
                    `) + `</div></td>
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
                //if(data.textOnly){
                     soundTip(g_config.tipSound || 'res/pop.mp3');
                //}
            }
            
            if (image.length) {

                if (data.audio) {
                    $(`<a  class="btn btn-square btn-success rounded-circle" data-action="play_strickerAudio" data-audio="` + data.audio + `" style="position: absolute;bottom: 5px;right: 20px;" role="button"><i class="fa fa-play" aria-hidden="true"`+(data.tts ? ' alt="'+data.tts+'"' : '')+`></i></a> 
                    `).insertAfter(image);
                    $('#audio_stricker')[0].src = data.audio;
                }

                var m = md5(image[0].src);
                
                if (image[0].src.indexOf('data:image/') != -1) {
                    $(image).attr('data-md5', m);
                }
                if(data.exists){ // 已存在于服务器
                    reviceMsg({type: 'save', data: m});
                }
                // $(`<a  class="btn btn-square btn-secondary rounded-circle" data-action="show_stricker" style="position: relative;top: 0px;left: 20px;" role="button"><i class="fa fa-smile-o font-size-20" aria-hidden="true"></i></a> 
                // `).insertBefore(image);
                if (image.hasClass('loading')) {
                    reloadImage(image[0]);
                }
                addAnimation(image, 'rubberBand');
            }
            
            closeModal('modal-custom', 'chat', () => {
                $('#modal-custom .modal-html table').prepend(dom.clone());
            });
            _record.btn = 'i[data-action="record_play"]';
            
            return image;
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
    d.fadeIn('slow');
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
    $('#content_lab .row, #content_lab nav').html('');
    setRotate(0);
    $('#cnt').attr('class', 'badge badge-primary text-light').show();
    var isFirst = g_cache.post == undefined;
    var isNew = !isFirst && g_cache.post.img != data.img;
    if (data.user != g_config.user.name || isFirst) {
        g_cache.post = data;
    } else {
        // 自己上传完毕
        $('#btn_upload').html('アップロードする');
        g_cache.upload = false;
        if ($('#modal-upload').hasClass('show')) {
            halfmoon.toggleModal('modal-upload');
        }
    }

    if (isFirst || isNew) { // 图片有变动才在消息显示
        g_canva.hide();
        $('[data-action="finish"]').show();
        reviceMsg({ type: 'msg', user: data.user, msg: '<img class="thumb" data-action="previewImage" src="' + g_cache.post.img + '">' });
            $('#div_mainImg').css('height', '');

        loadImage(g_cache.post.img);
        
    }
    $('#cnt1').hide();
    enableTimer(() => {
        return g_cache.post.time--;
    });
}

function loadImage(src, anime = true, dsrc = ''){
	var img = new Image();
	img.src = src;
	// 
    imagesLoaded(img).on('progress', function(instance, image) {
        if (image.isLoaded) {
        		var w = image.img.width;
        		var h = image.img.height;
        		var data = {
        			src: src,
        			naturalWidth: w,
        			naturalHeight: h,
        		}
        		var mx = $('#div_mainImg').width();
        		console.log(w, mx);
        		if(w > mx){
        			w = mx;
        		}
        		$('#image').attr(data).width(w).show();
            // $('#div_mainImg').height($('#image').height());
            setTimeout(() => {drawBoard()}, 1500);
        }else
        if(dsrc){
            loadImage(dsrc, anime);
        }
    });
    if (_viewer && _viewer.isShown) {
        _viewer.image.src = src;
    }else{
        if(anime) addAnimation($('#image'), 'zoomIn');
    }
}

function enableTimer(run, callback){
    clearInterval(g_cache.timer);
    $('#ftb').show();
    g_cache.timer = setInterval(() => {
        g_cache.post_start++;
        var time = run();
        if (time >= 0) {
            $('#cnt').html(getTime(time));
        } else {
            // $('#cnt').attr('class', 'badge badge-success text-black');
            $('#ftb, [data-action="finish"]').hide();
            clearInterval(g_cache.timer);
            if(typeof(callback) == 'function') callback();
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
    _audio2.play();
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
            if (alert) toastPAlert('もう一度試してください', 3000, '', 'alert-secondary');
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
    // setTyping(g_config.user.name);
    queryMsg({type: 'typing'}, true);
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

        stricker_initHistory();
        g_cache.strickerInited = true;
    }
}

function stricker_initHistory(){
    var h = '';
    if(g_stricker_options.history == undefined) g_stricker_options.history = [];
    for (var key of g_stricker_options.history) {
        var args = key.split(',');
        h += getStrickerHTML(args[0], args[1], true);
    }
    $('#stricker_history').html(h);
}

function setBg(bg){
    var blur = '';
    if(bg != ''){
        bg = 'linear-gradient(rgb(35 35 35 / 25%), rgb(111 111 111 / 55%)), url('+bg+')';
        if(g_config.blur > 0){
            blur = 'saturate(180%) blur('+g_config.blur+'px)';
        }
    }
    $('body').css('backgroundImage', bg).css('backdropFilter', blur);
}

function test() {
    if(g_config.poseSearch){
        $('#select-poseSearch option[value="'+g_config.poseSearch+'"]').prop('selected', true)
    }
    if(g_config.poseSlug){
        $('#select-slug option[value="'+g_config.poseSlug+'"]').prop('selected', true)
    }
    _audio.volume = g_config.volume || 1;
    initSetting();
   
    // if(g_config.user.name == 'maki'){
    //     _audio.src = 'res/music.mp3';
    // }
    // if(g_config.user.name == 'chisato'){
    //     _video.src = 'res/test.mp4';
    //     $(_video).show();
    // }
    $('#switch-grid').prop('checked',g_config.grid.enable);
    setTimeout(() => {drawBoard()}, 3000);

    // halfmoon.toastAlert('precompiled-alert-1', 17500);
    // halfmoon.toggleModal('modal-custom');
    // doAction(null, 'openSetting');
    //setTimeout(() => {doAction(null, 'toTab,lab')}, 500);
    

}

function initSetting(){
     if(g_config.darkmode === false){
        $('body').removeClass('dark-mode');
    }
    if(g_config.bg){
        setBg(g_config.bg);
    }
}

function socketTest() {
    queryMsg({ type: 'online' });
}

function sendMsg(msg){
   queryMsg({ type: 'msg', msg: msg, textOnly: true }, true);
}