 var g_localKey = 'mosya_';
 var g_data = local_readJson('data', {
     md5: undefined,
     datas: {}
 });
 var g_config = local_readJson('config', {});

 function local_saveJson(key, data) {
     if (window.localStorage) {
         key = g_localKey + key;
         data = JSON.stringify(data);
         if (data == undefined) data = '[]';
         return localStorage.setItem(key, data);
     }
     return false;
 }

 function local_readJson(key, defaul = {}, check = false) {
     if (!window.localStorage) return defaul;
     key = g_localKey + key;
     var r = JSON.parse(localStorage.getItem(key));
     if (r === null) return defaul;
     if (check) {
         for (var k in defaul) {
             if (r[k] == undefined) {
                 r[k] = defaul[k];
             }
         }
     }
     return r;
 }

 function toggleDots() {
     if (_viewer.isShown) {
         _viewer.zoomTo(_viewer.initialImageData.ratio);
         _viewer.reset();
     }
 }

 var g_actions = {};

 function registerAction(name, callback) {
     g_actions[name] = callback;
 }

 var g_revices = {};

 function registerRevice(name, callback) {
     g_revices[name] = callback;
 }

 var g_imageHost = 'https://mosya-server.glitch.me/';
 var socket_url = 'wss:///mosya-server.glitch.me';

 // var g_imageHost = 'http://127.0.0.1/mosya-websocket/';
 // var socket_url = 'ws:///127.0.0.1:8000';
 var _viewer;
 var g_cache = {
     filter: '',
     lastConnect: 0,
 }

 $(function() {
     if (!g_config.user) {
         alert('请先登录!');
         location.href = 'index.html';
         return;
     }
     if (g_data.data) {
         parseData(g_data.data);
     }
     initWebsock();
     $(document).on('click', '[data-action]', function(event) {
         doAction(this, $(this).attr('data-action'));
     });
 });

 function getTime(date) {
     return date.getMonth() + 1 + '/' + date.getDate() + ' ' + _s(date.getHours()) + ':' + _s(date.getMinutes());
 }

 function _s(i, j = '') {
     return (i < 10 ? '0' + i : i) + j;
 }

 function _s1(s, j = '') {
     s = parseInt(s);
     return (s == 0 ? '' : (s < 10 ? '0' + s : s) + j);
 }


 function getTime1(s) {
     s = Number(s);
     if (s >= 86400) {
         return parseInt(s / 86400) + '天';
     }
     var h = 0,
         m = 0;
     if (s >= 3600) {
         h = parseInt(s / 3600);
         s %= 3600;
     }
     if (s >= 60) {
         m = parseInt(s / 60);
         s %= 60;
     }
     return _s1(h, '时') + _s(m, '分') + _s(parseInt(s), '秒');
 }

 function addAnimation(d, x, callback) {
     removeAnimation(d);
     d.attr('animated', x).addClass('animated ' + x).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend',

         function() {
             if (removeAnimation(d)) { // 确保有移除过动画
                 if (callback != undefined) {
                     callback();
                 }
             }

         })
 }

 function removeAnimation(d) {
     var x = d.attr('animated');
     if (x != undefined) {
         d.removeClass('animated ' + x).attr('animated', null);
     }
     return x;
 }

 function doAction(dom, action, params) {
     var action = action.split(',');
     if (g_actions[action[0]]) {
         return g_actions[action[0]](dom, action, params);
     }
     // switch (action[0]) {}
 }

 function reviceMsg(data) {
     // 未登录所以不会接受到服务器的公告
     console.log(data);
     var type = data.type;
     delete data.type;
     if (g_revices[type]) {
         return g_revices[type](data);
     }
     switch (type) {
         case 'pics':
             if (data.data) {
                 g_data = data;
                 local_saveJson('data', g_data);
                 parseData(data.data);
             }
             break;
     }
 }

 function setFilter(dom, search) {
     $('.selected').removeClass('selected');
     if (g_cache.filter == search) {
         search = '';
         g_cache.filter = '';
     } else {
         $(dom).find('img').addClass('selected');
         g_cache.filter = search;
     }
     var i = 0;
     $('.grid').isotope({
         filter: function() {
             var name = $(this).find('img[title]').attr('title');
             var b = name.match(search);
             if (b) i++;
             return b;
         }
     });
     $('#cnt').html(i + '枚');

 }

 function toastPAlert(msg, time, title, type) {
     halfmoon.initStickyAlert({
         content: msg,
         title: title || '',
         alertType: type || "alert-primary",
         hasDismissButton: false,
         timeShown: time || 3000
     });
 }

 function parseData(json) {
     if (g_grid) g_grid.isotope('destroy')
     if (_viewer) _viewer.destroy();
     var enable = [true];
     var h = '<div class="grid-sizer"></div>';
     var i = 0;
     for (var md5 in json) {
         var date = new Date(json[md5].time);
         var day = date.getFullYear() + '/' + date.getMonth() + '/' + date.getDate();
         if (enable[day] == undefined) {
             enable[day] = day.split('/');
         }
         var desc = '[' + getTime(date) + '] By ' + json[md5].user;
         if (json[md5].spend != undefined) {
             desc += `(` + getTime1(json[md5].spend) + ')';
         }
         h = `<div class="grid-item" data-time="` + json[md5].time + `">
                        <img class="icon" src="res/` + json[md5].user + `.jpg">
                        <img class="photo" data-md5="` + md5 + `" data-src="` + g_imageHost + `saves/` + md5 + `.jpg" src="` + g_imageHost + `saves/_` + md5 + `.jpg" alt="` + desc + `" title="` + desc + `">` + (json[md5].comments ? `
                            <a class="btn btn-square rounded-circle btn-secondary mark_cnt" style="position: absolute;top: 16px;left: 16px;" role="button">` + Object.keys(json[md5].comments).length + `</a>
                            ` : '') + `
                    </div>` + h;
         i++;
     }
     $('#cnt').html(i + '枚');
     $('.grid').html(h);

     $('.timepicker').pickadate({
         disable: Object.values(enable),
         onSet: function(thingSet) {
             setDataFilter(thingSet.select, thingSet.select + 3600 * 24 * 1000);
         }
     });

     _viewer = new Viewer($('.grid')[0], {
         backdrop: 'static',
         toggleOnDblclick: false,
         filter(image) {
             return image.classList.contains('photo');
         },
         title: (image, imageData) => `${image.alt} (${imageData.naturalWidth} × ${imageData.naturalHeight})`,
         url(image) {
             return image.src.replace('/_', '/');
         },
         viewed(ev) {
             _viewer.image.onclick = (ev) => { modalImgClick(ev) };
             $('.img-mark-dots').remove();
             var dom = ev.detail.originalImage;
             var md5 = $(dom).attr('data-md5');
             $('.viewer-canvas').attr('data-md5', md5);
             $('[data-action=mark_switch]').removeClass('btn-success').addClass('btn-secondary').find('i').attr('class', 'fa fa-pencil');
             $('#btn_toggle').show();
             if (g_data.data[md5].comments) {
                 for (var key in g_data.data[md5].comments) {
                     var p = key.split('_');
                     g_dot.new(p[0], p[1], md5, g_data.data[md5].comments[key]);
                 }
             }
         },
         hidden(ev) {
             $('#btn_toggle').hide();
             $('.img-mark-dots').remove();
         },
         move(ev) {
             if (Math.abs(Math.abs(_viewer.initialImageData.left) - Math.abs(ev.detail.x)) >= 2 && Math.abs(Math.abs(_viewer.initialImageData.top) - Math.abs(ev.detail.y)) >= 2) {
                 $('.img-mark-dots').hide();
             } else {
                 //$('.img-mark-dots').show();
             }
         },
         zoom(ev) {
             if (ev.detail.ratio == _viewer.initialImageData.ratio) {
                 $('.img-mark-dots').show();
             } else {
                 $('.img-mark-dots').hide();
             }
         },
     });
     g_grid = $('.grid').isotope({
         itemSelector: '.grid-item',
         percentPosition: true,
         masonry: {
             columnWidth: '.grid-sizer'
         }
     });
     g_grid.imagesLoaded().progress(function(instance, image) {
         if (image.img.classList.contains('photo')) {
             g_grid.isotope('layout');
         }
     });

 }

 var g_grid;

 function setDataFilter(start, end) {
     var i = 0;
     $('.grid').isotope({
         filter: function() {
             var time = $(this).attr('data-time');
             var b = start == undefined || time >= start && time <= end;
             if (b) i++;
             return b;
         }
     });
     $('#cnt').html(i + '枚');
 }

 var connection;

 function initWebsock() {
     if (connection) connection.close();
     connection = new WebSocket(socket_url);
     connection.onopen = () => {
         setTimeout(() => {
             queryMsg({ type: 'pics', md5: g_data.md5 });
         }, 500);
     }

     connection.onclose = () => {
         var now = new Date().getTime();
         if (g_cache.lastConnect < now) {
             g_cache.lastConnect = now + 1000;
             initWebsock();
         }
     }
     connection.onmessage = (e) => {
         reviceMsg(JSON.parse(e.data));

     }
 }

 function queryMsg(data, user) {
     if (user) data.user = g_config.user.name;
     connection.send(JSON.stringify(data));
 }

 function me() {
     return g_config.user.name;
 }