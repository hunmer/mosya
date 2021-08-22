var g_note = {
	init: () => {
		g_note.btn = $(`
				<button class="btn btn-primary float-right" type="button" data-action="toTab,note"><i class="fa fa-sticky-note" aria-hidden="true"></i>
	            <span class="badge badge-primary badge-pill position-absolute hide"></span>
	        </button>
			`).insertAfter('[data-action="fullContnet"]');
		g_note.tab = $(`
			<div id='content_note' class='_content hide p-5' style="overflow-x: hidden;min-height: 300px;">
				<div class="row w-full mt-10">
				`+(g_config.user.name == 'maki' ? `
	            <button class="btn btn-primary" style="position: absolute;right: 10px;" data-action="note_modal"><i class="fa fa-comments" aria-hidden="true"></i>
	            </button>
					` : '')+`
					<div id="note-list"></div>
				</div>
			</div>`).prependTo('#tabs_contents');

		g_note_bottom = $(`
				<div id="bottom_note" class="row toolbar hide" style="width: 100%;"></div>
			`).prependTo('.navbar-fixed-bottom .container-fluid');

		registerAction('note_modal', (dom, action, params) => {
			var texts = prompt('input texts', g_config.tips || `ありがとうございます
				おはようございます
				おやすみなさい
				お名前は何ですか`);
			if(texts != undefined){
				var time = parseInt(prompt('input time(ms)', 15 * 1000));
				if(!isNaN(time) && time > 0){
					var interval = parseInt(prompt('input interval(ms)', 300 * 1000));
					if(!isNaN(interval) && interval > 0){
						var tts = confirm('tts?');
						var arr = [];
						if(texts.length){
							g_config.tips = texts;
							local_saveJson('config', g_config);
							arr = texts.split("\r\n");
						}
						console.log(arr);
						queryMsg({type: 'tip_set', data: {
							list: arr,
					    time: time,
					    interval: interval,
					    tts: tts
						}});
					}
				}
			}
		});
	},
	setList: (datas) => {
		var c = Object.keys(datas.list).length;
		var p = g_note.btn.find('.badge-pill').html(c);
		if(c > 0){
			p.show();
		}else{
			p.hide();
		}
    var h = `
	  	<div class="content">
			  <h2 class="content-title">ポイント</h2>
			  <ul>
		`;
    for (var d of datas.list) {
        h += `<li>` + d + `</li>`;
    }
    h += `</ul></div>`;
    g_note.tab.find('#note-list').html(h);
	}
}
g_note.init();
