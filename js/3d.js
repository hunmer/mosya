var g_3d = {
	init: () => {
		g_3d.btn = $(`
			<button class="btn btn-primary" data-btn="btn_3d" type="button" data-action="tosubTab,lab,3d"><i class="fa fa-cube" aria-hidden="true"></i></button>
			`).appendTo('#content_lab .btn-group');
		g_3d.tab = $(`
			<div class="row mt-10 subContent " id='subContent_3d'>
					<div id="3d" class="w-full"></div>
			</div>`).appendTo('#subContent_lab');
		g_3d.bottom = $(`
				<div id="bottom_3d" class="row toolbar hide" style="width: 100%;">`+(1 || g_config.user.name == 'maki' ? `
						<div class="row w-full" style="display: flow-root;">
							<i data-action="3d_new" class="fa fa-plus col-1" aria-hidden="true"></i>
							<div class="dropdown dropup col-1">
	                <i data-toggle="dropdown" class="fa fa-list col-1" aria-hidden="true"></i>
	              <div class="dropdown-menu dropdown-menu-up">
	                 <div class="dropdown-content p-10">
                      <div class="row w-full mt-10">
                          <div class="form-group w-full">
                              <label>通常</label>
                              <select class="form-control col-12" onchange="g_3d.load(this.value, true);" >
                                  <option value="assets/obj/Cube N230215.3DS">方块</option>
                                  <option value="assets/obj/上半身-女性.obj">上半身-女性</option>
                                  <option value="assets/obj/头颅.3ds">头颅</option>
                                  <option value="assets/obj/手-张开-女.obj">手-张开-女</option>
                                  <option value="assets/obj/手掌-垂下.obj">手掌-垂下</option>
                                  <option value="assets/obj/上半身-男.obj">上半身-男</option>
                                  <option value="assets/obj/手掌-握拳-女.obj">手掌-握拳-女</option>
                                  <option value="assets/obj/arm.obj">arm</option>
                              </select>
                          </div>
                      </div>
                      <button class="btn btn-primary" onclick="g_3d.send();"><i class="fa fa-paper-plane" aria-hidden="true"></i></button>
                  </div>
	              </div>
	            </div>
							<i onclick="$('#3d iframe')[0].src = $('#3d iframe').attr('src')" class="fa fa-refresh col-1" aria-hidden="true"></i>
						</div>
					` : '')+`</div>
			`).prependTo('.navbar-fixed-bottom .container-fluid');

		registerAction('3d_new', (dom, action, params) => {
			var url = prompt('url', g_test ? 'assets/obj/Cube N230215.3DS' : '');
			if(url != undefined && url != ''){
				g_3d.load(url, url.indexOf('http') != 0);
			}
		});

		registerRevice('3d_new', (data) => {
			if(data.url !=  $('#3d iframe').attr('src')){
				if(data.user){
					reviceMsg({
		          type: 'msg',
		          user: data.user,
		          msg: `<a href="javascript: doAction(null, 'tosubTab,lab,3d')">3Dモデル</a>`
		      });
				}
				g_3d.load(data.url);
			}
		});

		// setTimeout(() => {
		// 	reviceMsg({type: '3d_new', url: './3d/embed.html#model=assets/models/logo.obj,assets/models/logo.mtl'});
		// }, 1000);

	},
	load: (url, b = false) => {
		if(b){
			url = './3d/'+(confirm('embed?') ? 'embed' : 'index')+'.html#model='+url;
		}
		$('#3d').html(`
			 <iframe frameborder="0" allowfullscreen mozallowfullscreen="true" webkitallowfullscreen="true" allow="fullscreen; autoplay;" width="100%" style="min-height: 300px;" src="`+url+`"></iframe>`);
		doAction(null, 'tosubTab,lab,3d');
	},

	send: () => {
		var url = $('#3d iframe').attr('src');
		if(url){
			queryMsg({type: '3d_new', url: url}, true);
		}
	}

}


g_3d.init();
