var g_poseCache = {};
var g_pose_selected = {};
toPage(1);

function checkPoseSelected(selector = '#content_lab [data-action="selectImg"]', b = false){
    for(var div of $(selector)){
        div = $(div);
        var id = div.attr('data-id');
        var json = div.attr('data-json');
        if(div.hasClass('img_active')){
            if(!g_pose_selected[id]){
                g_pose_selected[id] = JSON.parse(json);
            }
        }else{
            if(g_pose_selected[id]){
                delete g_pose_selected[id];
            }
            if(b){
             $('#content_lab [data-id="'+id+'"]').removeClass('img_active');
            }
        }
    }
    g_cache.pose_selected = Object.keys(g_pose_selected).length;
    $('[data-action="pose_selectd"]').html(g_cache.pose_selected);
    return g_cache.pose_selected;
}

function prevPage() {
    if (g_cache.pose_page > 1) {
        toPage(g_cache.pose_page - 1);
    }
}

function nextPage() {
    if (g_cache.pose_page < g_cache.pose_maxPage) {
        toPage(g_cache.pose_page + 1);
    }
}

function toPage(page) {
    checkPoseSelected();
    $('.content-wrapper')[0].scrollTo(0, 0);
    if (g_poseCache[page] == undefined) {
        if(g_cache.pose_maxPage && page > g_cache.pose_maxPage) return;
        queryPoselist(page);
    }else{
        parsePoses(g_poseCache[page], page);
    }
}

function changePath_before(dom) {
    $(dom).next().html(dom.value);
    if(!g_cache.poseing) return;
    loadImage(getImageUrl(g_cache.poseing.uuid, g_config.poseSlug, dom.value, 100), false);
}

function changePath(dom) {
    if(!g_cache.poseing) return;
    loadImage(getImageUrl(g_cache.poseing.uuid, g_config.poseSlug, dom.value, 512), false);
    g_pose.datas[g_cache.poseing.id].offset = dom.value;
}

function pose_iconShow(isSearch){
    var d = $('[data-action="pose_send"], [data-action="pose_selectAll"]');
    var d1 = $('[data-action="pose_search"]');
    if(isSearch){
        d.show();
    }else{
        d1.removeClass('text-primary').show();
        d.hide();
         $('[data-action="pose_selectd"]').html(Object.keys(g_pose.datas).length);
    }
}

function pose_getImgsHtml(datas, b = true){
    var h = '';
    var i = 0;
    for (var id in datas) {
        h += `
            <div class="col-6`+(g_pose_selected[id] ? ' img_active' : '')+`" data-action="`+(b ? 'selectImg' : 'selectImg1')+`" data-id="`+id+`" data-json='`+JSON.stringify(datas[id])+`' data-index="`+i+`">
                <img class="full-wdith-img" src="` + getImageUrl(datas[id].uuid) + `">
            </div>
        `;
        i++;
    }
    return h;
}

function initPoseContent(datas, b, nav = ''){
    pose_iconShow(b);
    $('#content_lab').attr('data-list', b);
    var h = pose_getImgsHtml(datas, b);
    $('#pose_list').html(h);
    $('#content_lab nav').html(nav);
}
function parsePoseData(datas, time, selectable = true){
    g_cache.pose_index = 0;
    console.log('parse');
    if(datas.user && datas.user == g_config.user.name){
        g_pose.datas = g_pose_selected;
        g_pose_selected = {};
        g_pose.time = datas.time;
    }else{
        g_pose.datas = datas;
        g_pose.time = time;
    }
    initPoseContent(g_pose.datas, selectable);
    $('[data-action="pose_selectd"]').html(Object.keys(g_pose.datas).length);

    clearInterval(g_cache.timer);
    setRotate(0);
    $('#cnt').attr('class', 'badge badge-primary text-light').show();
    pose_nextImg();
}

function pose_nextImg(index){
    g_cache.poseTime = g_pose.time;
    var keys = Object.keys(g_pose.datas);
    var index;
    if(index == undefined){
        index = g_cache.pose_index;
    }else{
        g_cache.pose_index = index;
    }
    $('#cnt1').html((index+1)+'/'+keys.length).show();
    var id = keys[index];
    var data = g_pose.datas[id];
    g_cache.poseing = data;
    g_cache.poseing.id = id;
    if(!g_cache.poseing.offset){
        // randNum(0, 32)
        g_cache.poseing.offset = 0;
    }
    loadImage(getImageUrl(g_cache.poseing.uuid, g_config.poseSlug, g_cache.poseing.offset));
    for(var i=0;i<data.cnt-1;i++){
        preloadImage(getImageUrl(data.uuid, g_config.poseSlug, i, 100));
    }
    $('.range-slider__range').val(g_cache.poseing.offset);
    $('.range-slider__value').html(g_cache.poseing.offset);
    local_saveJson('config', g_config);
    enableTimer(() => {
        return g_cache.poseTime--;
    }, () => {
        if(index == keys.length - 1){
            reviceMsg({type: 'over'});
        }else{
            g_cache.pose_index++;
            pose_nextImg();
        }
    });
    $('[data-action="selectImg1"][data-id="'+id+'"]').addClass('img_active1');
}

function preloadImage(url){
    return new Promise(function(resolve,reject){
        let img=new Image();
        img.onload=function(){
            resolve(img);
        }
        img.onerror=function(){
            //reject(src+'load failed');
        }
        img.src=url;
    })
}

function parsePoses(datas, page) {
    page = parseInt(page);
    var h = '<ul>';
    var i;
    if (page > 1) {
        i = page - 1;
        h += `<li class="page-item">
                  <a href="javascript: prevPage();" class="page-link">
                    <i class="fa fa-angle-left" aria-hidden="true"></i>
                    <span class="sr-only">Previous</span> 
                  </a>
                </li>`;
        h += `<li class="page-item"><a href="javascript: toPage(` + i + `)" class="page-link">` + i + `</a></li>`;
    }
    h += `<li class="page-item active"><a href="javascript: toPage(` + page + `)" class="page-link">` + page + `</a></li>`;
    if (page < g_cache.pose_maxPage) {
        i = page + 1;
        h += `<li class="page-item"><a href="javascript: toPage(` + i + `)" class="page-link">` + i + `</a></li>`;
        h += `<li class="page-item ellipsis" data-action="selectPage"></li>`;
        h += `<li class="page-item"><a href="javascript: toPage(` + g_cache.pose_maxPage + `)" class="page-link">` + g_cache.pose_maxPage + `</a></li>`;
        h += `<li class="page-item">
          <a href="javascript: nextPage();" class="page-link">
            <i class="fa fa-angle-right aria-hidden="true"></i>
            <span class="sr-only">Next</span>
          </a>
        </li>`;
    }else{
        h += `<li class="page-item ellipsis" data-action="selectPage"></li>`;
    }
    initPoseContent(datas, true, h+'</ul>')
}

function queryPoselist(page = 1) {
    g_cache.pose_page = page;
    if(g_poseCache[page] != undefined){
        return toPage(page);
    }
    // $('#content_lab nav').html('');
    $('#pose_list').html('<h4 class="text-center mx-auto">読み込み中..</h4>');
    $.getJSON(g_api + 'pose.php?data={"page": ' + page + '}&type=pose-search', function(json, textStatus) {
        if (textStatus == 'success') {
            g_cache.pose_maxPage = json.poses.meta.last_page;
            var poses = [];
            for (var pose of json.poses.data) {
                var arr = [];
                for (var state of pose.states) {
                    arr.push(state.type);
                }
                poses["_"+pose.id] = {
                    uuid: pose.uuid,
                    cnt: pose.render_count,
                    slug: arr
                };
            }
            g_poseCache[page] = poses;
            parsePoses(poses, page);
        }else{
            toastPAlert('読み込みに失敗しました、もう一度お試しください!', 1000, '', 'alert-danger');
        }
    });
}


function selectSlug(dom){
    g_config.poseSlug = dom.value;
    for(var i=0;i<g_cache.poseing.cnt-1;i++){
        preloadImage(getImageUrl(g_cache.poseing.uuid, g_config.poseSlug, i, 100));
    }
    local_saveJson('config', g_config);
    loadImage(getImageUrl(g_cache.poseing.uuid, dom.value, g_cache.poseing.offset, 512));
}


function getImageUrl(uuid, model = 'normal',offset = 0,  size = 512) {
    return 'https://love.figurosity.com/muses/' + uuid.substr(0, 2) + '/' + uuid.substr(2, 2) + '/' + uuid.substr(4, 2) + '/' + uuid + '/' + model + '/' + size + '/pose-' + _s(offset || 1) + '.jpg';
}