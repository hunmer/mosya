String.prototype.replaceAll = function(s1, s2) {
    return this.replace(new RegExp(s1, "gm"), s2);
}

var _GET = getGETArray();
var g_s_api = location.host == '127.0.0.1' ? './api/' : 'https://neysummer-api.glitch.me/';

var g_localKey = 'lyricRecorder_';
// 本地储存前缀
var g_config = local_readJson('config', {
    user: {
        name: '',
        icon: './img/default.jpg'
    }
});

function local_saveJson(key, data) {
    if (window.localStorage) {
        key = g_localKey + key;
        data = JSON.stringify(data);
        if (data == undefined) data = '[]';
        return localStorage.setItem(key, data);
    }
    return false;
}

function local_readJson(key, defaul = '') {
    if (!window.localStorage) return defaul;
    key = g_localKey + key;
    var r = JSON.parse(localStorage.getItem(key));
    return r === null ? defaul : r;
}

function getGETArray() {
    var a_result = [], a_exp;
    var a_params = window.location.search.slice(1).split('&');
    for (var k in a_params) {
        a_exp = a_params[k].split('=');
        if (a_exp.length > 1) {
            a_result[a_exp[0]] = decodeURIComponent(a_exp[1]);
        }
    }
    return a_result;
}
function _s1(s, j = '') {
    s = parseInt(s);
    return (s == 0 ? '' : (s < 10 ? '0' + s : s) + j);
}

function _s2(s, j = '') {
    s = parseInt(s);
    return (s == 0 ? '' : s + j);
}


function _s(i, j = '') {
    return (i < 10 ? '0' + i : i) + j;
}

function getTime(s) {
    s = Number(s);
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
    return _s1(h, ':') + _s(m, ':') + _s(s);
}

function randNum(min, max){
    return parseInt(Math.random()*(max-min+1)+min,10);
}

function getNow(b = true){
    var i = new Date().getTime() / 1000;
    if(b) i = parseInt(i);
    return i;
}

function toTime(s){
    var a = s.split(':');
    if(a.length == 2){
        a.unshift(0);
    }
    return a[0] * 3600 + a[1] * 60 + a[2] * 1;
}

function cutString(str, s, e){
    var i_start = str.indexOf(s);
    if(i_start != -1){
        i_start += s.length;
        var i_end = str.indexOf(e, i_start);
        if(i_end != -1){
            return str.substr(i_start, i_end - i_start);
        }
    }
    return '';
}
