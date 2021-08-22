var g_3d = {
	init: () => {
		g_note.btn = $(`
			<button class="btn btn-primary" data-btn="btn_3d" type="button" data-action="tosubTab,lab,3d"><i class="fa fa-cube" aria-hidden="true"></i></button>
			`).appendTo('#content_lab .btn-group');
		g_note.tab = $(`
			<div class="row mt-10 subContent " id='subContent_3d'>
					<div id="3d" class="w-full"></div>
			</div>`).appendTo('#subContent_lab');

		g_note_bottom = $(`
				<div id="bottom_3d" class="row toolbar hide" style="width: 100%;">`+(1 || g_config.user.name == 'maki' ? `
						<div class="row w-full">
							<i data-action="3d_new" class="fa fa-plus col-1" aria-hidden="true"></i>
							<div class="dropdown dropup"  style="transform: translate(-150%,0);">
	                <i data-toggle="dropdown" class="fa fa-list col-1" aria-hidden="true"></i>
	              <div class="dropdown-menu dropdown-menu-up">
	                 <div class="dropdown-content p-10">
                      <div class="row w-full mt-10">
                          <div class="form-group w-full">
                              <label>通常</label>
                              <select class="form-control col-12" id="select-slug" onchange="select3dModel(this)" >
                                  <option value="normal" selected>通常</option>
                                  <option value="nude">裸</option>
                                  <option value="muscle">筋肉</option>
                                  <option value="smooth">プラスチック</option>
                                  <option value="loomis">棒人間</option>
                              </select>
                          </div>
                      </div>
                  </div>
	              </div>
	            </div>
						</div>
					` : '')+`</div>
			`).prependTo('.navbar-fixed-bottom .container-fluid');

		registerAction('3d_new', (dom, action, params) => {
			var url = prompt('url', 'assets/obj/Cube N230215.3DS');
			if(url != undefined && url != ''){
				url = './3d/'+(confirm('embed?') ? 'embed' : 'index')+'.html#model='+url;
				queryMsg({type: '3d_new', url: url});
			}
		});

		registerRevice('3d_new', (data) => {
			$('#3d').html(`<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width="100%" style="min-height: 300px;" src="`+data.url+`"></iframe>`);
			doAction(null, 'tosubTab,lab,3d')
		});

		// setTimeout(() => {
		// 	reviceMsg({type: '3d_new', url: './3d/embed.html#model=assets/models/logo.obj,assets/models/logo.mtl'});
		// }, 1000);

	},

	load: (url) => {
		// http://127.0.0.1/mosya/3d/embed.html#model=assets/models/logo.obj,assets/models/logo.mtl
	}

}
g_3d.init();
