String.prototype.replaceAll = function(s1, s2) {
    return this.replace(new RegExp(s1, "gm"), s2);
}

var _GET = getGETArray();
var g_localKey = 'mosya_';
// 本地储存前缀
var g_config = local_readJson('config', {
    bg: undefined,
    blur: 0,
    grid: {
        x: 5,
        y: 5,
        color: 'black',
        size: 1,
        opacity: 1,
        enable: false,
    },
    user: {
        name: '',
        icon: './img/default.jpg'
    }
}, true);
var g_stricker = local_readJson('stricker', { "id_1202706": { "id": 1202706, "name": "いたわりコーギー2", "author": "株式会社DK", "stickers": [8235812, 8235813, 8235814, 8235815, 8235816, 8235817, 8235818, 8235819, 8235820, 8235821, 8235822, 8235823, 8235824, 8235825, 8235826, 8235827, 8235828, 8235829, 8235830, 8235831, 8235832, 8235833, 8235834, 8235835, 8235836, 8235837, 8235838, 8235839, 8235840, 8235841, 8235842, 8235843, 8235844, 8235845, 8235846, 8235847, 8235848, 8235849, 8235850, 8235851] }, "id_9802": { "id": 9802, "name": "キズナアイ ボイススタンプ", "author": "キズナアイ", "stickers": [22854240, 22854241, 22854242, 22854243, 22854244, 22854245, 22854246, 22854247, 22854248, 22854249, 22854250, 22854251, 22854252, 22854253, 22854254, 22854255, 22854256, 22854257, 22854258, 22854259, 22854260, 22854261, 22854262, 22854263], "hasAnimation": false, "hasSound": true }, "id_1267037": { "id": 1267037, "name": "語彙力がない男子", "author": "株式会社DK", "stickers": [10825944, 10825945, 10825946, 10825947, 10825948, 10825949, 10825950, 10825951, 10825952, 10825953, 10825954, 10825955, 10825956, 10825957, 10825958, 10825959, 10825960, 10825961, 10825962, 10825963, 10825964, 10825965, 10825966, 10825967, 10825968, 10825969, 10825970, 10825971, 10825972, 10825973, 10825974, 10825975, 10825976, 10825977, 10825978, 10825979, 10825980, 10825981, 10825982, 10825983] }, "id_8474340": { "id": 8474340, "name": "ポッキーにゃ", "author": "buddle", "stickers": [212758086, 212758087, 212758088, 212758089, 212758090, 212758091, 212758092, 212758093, 212758094, 212758095, 212758096, 212758097, 212758098, 212758099, 212758100, 212758101, 212758102, 212758103, 212758104, 212758105, 212758106, 212758107, 212758108, 212758109] }, "id_1666763": { "id": 1666763, "name": "武士カノジョ（改）", "author": "株式会社DK", "stickers": [21878968, 21878969, 21878970, 21878971, 21878972, 21878973, 21878974, 21878975, 21878976, 21878977, 21878978, 21878979, 21878980, 21878981, 21878982, 21878983, 21878984, 21878985, 21878986, 21878987, 21878988, 21878989, 21878990, 21878991, 21878992, 21878993, 21878994, 21878995, 21878996, 21878997, 21878998, 21878999, 21879000, 21879001, 21879002, 21879003, 21879004, 21879005, 21879006, 21879007] }, "id_9349486": { "id": 9349486, "name": "無口男子2", "author": "株式会社DK", "stickers": [241080302, 241080303, 241080304, 241080305, 241080306, 241080307, 241080308, 241080309, 241080310, 241080311, 241080312, 241080313, 241080314, 241080315, 241080316, 241080317, 241080318, 241080319, 241080320, 241080321, 241080322, 241080323, 241080324, 241080325, 241080326, 241080327, 241080328, 241080329, 241080330, 241080331, 241080332, 241080333, 241080334, 241080335, 241080336, 241080337, 241080338, 241080339, 241080340, 241080341] }, "id_6909522": { "id": 6909522, "name": "-闇男子2-", "author": "株式会社DK", "stickers": [162488798, 162488799, 162488800, 162488801, 162488802, 162488803, 162488804, 162488805, 162488806, 162488807, 162488808, 162488809, 162488810, 162488811, 162488812, 162488813, 162488814, 162488820, 162488822, 162488827, 162488829, 162488831, 162488833, 162488835, 162488837, 162488839, 162488840, 162488841, 162488842, 162488843, 162488844, 162488845, 162488846, 162488847, 162488848, 162488849, 162488850, 162488851, 162488852, 162488853] }, "id_10237162": { "id": 10237162, "name": "キズナアイ #02", "author": "キズナアイ", "stickers": [269717750, 269717751, 269717752, 269717753, 269717754, 269717755, 269717756, 269717757, 269717758, 269717759, 269717760, 269717761, 269717762, 269717763, 269717764, 269717765, 269717766, 269717767, 269717768, 269717769, 269717770, 269717771, 269717772, 269717773, 269717774, 269717775, 269717776, 269717777, 269717778, 269717779, 269717780, 269717781] }, "id_10301577": { "id": 10301577, "name": "レトロ男子", "author": "株式会社DK", "stickers": [271723982, 271723983, 271723984, 271723985, 271723986, 271723987, 271723988, 271723989, 271723990, 271723991, 271723992, 271723993, 271723994, 271723995, 271723996, 271723997, 271723998, 271723999, 271724000, 271724001, 271724002, 271724003, 271724004, 271724005, 271724006, 271724007, 271724008, 271724009, 271724010, 271724011, 271724012, 271724013, 271724014, 271724015, 271724016, 271724017, 271724018, 271724019, 271724020, 271724021] }, "id_11574068": { "id": 11574068, "name": "いじわる男子", "author": "株式会社DK", "stickers": [308215486, 308215487, 308215488, 308215489, 308215490, 308215491, 308215492, 308215493, 308215494, 308215495, 308215496, 308215497, 308215498, 308215499, 308215500, 308215501, 308215502, 308215503, 308215504, 308215505, 308215506, 308215507, 308215508, 308215509, 308215510, 308215511, 308215512, 308215513, 308215514, 308215515, 308215516, 308215517, 308215518, 308215519, 308215520, 308215521, 308215522, 308215523, 308215524, 308215525] }, "id_13083342": { "id": 13083342, "name": "ゆめかわ男子", "author": "株式会社DK", "stickers": [346275254, 346275255, 346275256, 346275257, 346275258, 346275259, 346275260, 346275261, 346275262, 346275263, 346275264, 346275265, 346275266, 346275267, 346275268, 346275269, 346275270, 346275271, 346275272, 346275273, 346275274, 346275275, 346275276, 346275277, 346275278, 346275279, 346275280, 346275281, 346275282, 346275283, 346275284, 346275285, 346275286, 346275287, 346275288, 346275289, 346275290, 346275291, 346275292, 346275293] }, "id_7875762": { "id": 7875762, "name": "かまって男子2", "author": "株式会社DK", "stickers": [193613694, 193613695, 193613696, 193613697, 193613698, 193613699, 193613700, 193613701, 193613702, 193613703, 193613704, 193613705, 193613706, 193613707, 193613708, 193613709, 193613710, 193613711, 193613712, 193613713, 193613714, 193613715, 193613716, 193613717, 193613718, 193613719, 193613720, 193613721, 193613722, 193613723, 193613724, 193613725, 193613726, 193613727, 193613728, 193613729, 193613730, 193613731, 193613732, 193613733] }, "id_13220592": { "id": 13220592, "name": "毒舌男子7-敬語ver-", "author": "株式会社DK", "stickers": [349451558, 349451559, 349451560, 349451561, 349451562, 349451563, 349451564, 349451565, 349451566, 349451567, 349451568, 349451569, 349451570, 349451571, 349451572, 349451573, 349451574, 349451575, 349451576, 349451577, 349451578, 349451579, 349451580, 349451581, 349451582, 349451583, 349451584, 349451585, 349451586, 349451587, 349451588, 349451589, 349451590, 349451591, 349451592, 349451593, 349451594, 349451595, 349451596, 349451597] }, "id_14522961": { "id": 14522961, "name": "ゆめかわ男子-ミニver.-3", "author": "株式会社DK", "stickers": [380516054, 380516055, 380516056, 380516057, 380516058, 380516059, 380516060, 380516061, 380516062, 380516063, 380516064, 380516065, 380516066, 380516067, 380516068, 380516069, 380516070, 380516071, 380516072, 380516073, 380516074, 380516075, 380516076, 380516077, 380516078, 380516079, 380516080, 380516081, 380516082, 380516083, 380516084, 380516085, 380516086, 380516087, 380516088, 380516089, 380516090, 380516091, 380516092, 380516093] }, "id_15228400": { "id": 15228400, "name": "もっふり＊たれ耳うさぎさんの敬語", "author": "tattsun", "stickers": [397523462, 397523463, 397523464, 397523465, 397523466, 397523467, 397523468, 397523469, 397523470, 397523471, 397523472, 397523473, 397523474, 397523475, 397523476, 397523477, 397523478, 397523479, 397523480, 397523481, 397523482, 397523483, 397523484, 397523485, 397523486, 397523487, 397523488, 397523489, 397523490, 397523491, 397523492, 397523493, 397523494, 397523495, 397523496, 397523497, 397523498, 397523499, 397523500, 397523501] }, "id_15010980": { "id": 15010980, "name": "みんなに使える敬語スタンプ１", "author": "a418t", "stickers": [392272750, 392272751, 392272752, 392272753, 392272754, 392272755, 392272756, 392272757, 392272758, 392272759, 392272760, 392272761, 392272762, 392272763, 392272764, 392272765, 392272766, 392272767, 392272768, 392272769, 392272770, 392272771, 392272772, 392272773, 392272774, 392272775, 392272776, 392272777, 392272778, 392272779, 392272780, 392272781, 392272782, 392272783, 392272784, 392272785, 392272786, 392272787, 392272788, 392272789] }, "id_15863955": { "id": 15863955, "name": "ひねくれうさぎの大人な敬語", "author": "ともぞー", "stickers": [412984590, 412984591, 412984592, 412984593, 412984594, 412984595, 412984596, 412984597, 412984598, 412984599, 412984600, 412984601, 412984602, 412984603, 412984604, 412984605, 412984606, 412984607, 412984608, 412984609, 412984610, 412984611, 412984612, 412984613, 412984614, 412984615, 412984616, 412984617, 412984618, 412984619, 412984620, 412984621, 412984622, 412984623, 412984624, 412984625, 412984626, 412984627, 412984628, 412984629] }, "id_1456606": { "id": 1456606, "name": "なつのこ", "author": "株式会社DK", "stickers": [17216554, 17216555, 17216556, 17216557, 17216558, 17216559, 17216560, 17216561, 17216562, 17216563, 17216564, 17216565, 17216566, 17216567, 17216568, 17216569, 17216570, 17216571, 17216572, 17216573, 17216574, 17216575, 17216576, 17216577, 17216578, 17216579, 17216580, 17216581, 17216582, 17216583, 17216584, 17216585, 17216586, 17216587, 17216588, 17216589, 17216590, 17216591, 17216592, 17216593] }, "id_1253810": { "id": 1253810, "name": "ほのぼの吹き出しクマ", "author": "株式会社DK", "stickers": [10293344, 10293345, 10293346, 10293347, 10293348, 10293349, 10293350, 10293351, 10293352, 10293353, 10293354, 10293355, 10293356, 10293357, 10293358, 10293359, 10293360, 10293361, 10293362, 10293363, 10293364, 10293365, 10293366, 10293367, 10293368, 10293369, 10293370, 10293371, 10293372, 10293373, 10293374, 10293375, 10293376, 10293377, 10293378, 10293379, 10293380, 10293381, 10293382, 10293383] }, "id_9136624": { "id": 9136624, "name": "動く大好きな❤きずな❤へ送る名前3", "author": "さあや❤名前スタンプ", "stickers": [234551486, 234551487, 234551488, 234551489, 234551490, 234551491, 234551492, 234551493, 234551494, 234551495, 234551496, 234551497, 234551498, 234551499, 234551500, 234551501, 234551502, 234551503, 234551504, 234551505, 234551506, 234551507, 234551508, 234551509], "hasAnimation": true, "hasSound": false } });
var g_stricker_options = local_readJson('stricker_options', {
    likes: [],
    tags: {},
    history: [],
    last: {
        id: undefined,
        sid: undefined,
    }
});
var g_playlist = local_readJson('playlist', {});
// var g_pose = local_readJson('pose', {
//     datas: {},
//     index: 0,
//     time: 0
// });
var g_pose = {
    datas: {},
    index: 0,
    time: 0
}

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

function getGETArray() {
    var a_result = [],
        a_exp;
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

function randNum(min, max) {
    return parseInt(Math.random() * (max - min + 1) + min, 10);
}

function getNow(b = true) {
    var i = new Date().getTime() / 1000;
    if (b) i = parseInt(i);
    return i;
}

function toTime(s) {
    var a = s.split(':');
    if (a.length == 2) {
        a.unshift(0);
    }
    return a[0] * 3600 + a[1] * 60 + a[2] * 1;
}

function cutString(str, s, e, d = '') {
    var i_start = str.indexOf(s);
    if (i_start != -1) {
        i_start += s.length;
        var i_end = str.indexOf(e, i_start);
        if (i_end != -1) {
            return str.substr(i_start, i_end - i_start);
        }
    }
    return d;
}

function getFormatedTime(i = 0, date = new Date()) {
    switch (i) {
        case 0:
            return _s(date.getHours()) + ':' + _s(date.getMinutes());
        case 1:
            return date.getMonth() + 1 + '/' + date.getDate() + ' ' + _s(date.getHours()) + ':' + _s(date.getMinutes());
        case 2:
            return date.getMonth() + 1 + '/' + date.getDate();
            break;
    }
}

function toastPAlert(msg, time, title, type) {
    console.log(halfmoon.initStickyAlert({
        content: msg,
        title: title || '',
        alertType: type || "alert-primary",
        hasDismissButton: false,
        timeShown: time || 3000
    }));
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


function IsPC() {
    var userAgentInfo = navigator.userAgent;
    var Agents = new Array("Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod");
    var flag = true;
    for (var v = 0; v < Agents.length; v++) {
        if (userAgentInfo.indexOf(Agents[v]) > 0) { flag = false; break; }
    }
    return flag;
}

function hideSidebar() {
    if ($('#page-wrapper').attr('data-sidebar-hidden') != 'hidden') {
        halfmoon.toggleSidebar();
        return true;
    }
    return false;
}


var g_actions = {};
function registerAction(name, callback){
    g_actions[name] = callback;
}

var g_revices = {};
function registerRevice(name, callback){
    g_revices[name] = callback;
}