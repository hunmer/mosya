var g_dot = {
	hide: () => {
		if(!g_dot.dot.attr('data-text')){
			g_dot.dot.remove();
		}
    g_dot.div.fadeOut('slow');
		// addAnimation(g_dot.div, 'flipOutX', () => {
	  //       g_dot.div.hide();
	  //   });
	},
	getText: () => {
		return g_dot.div.find('textarea').val();
	},
	setText: (text) => {
		return g_dot.div.find('textarea').val(text);
	},
	init: () => {
		g_dot.gallery = location.pathname == "/mosya/gallery.html";
		g_dot.div = $(`
			<div class="bg-dark-light text-light row position-fixed p-5 border rounded w-200" style="z-index: 99999;display: none;">
				<textarea class="form-control col-12" placeholder="コメントを書く..." onclick="getTextWithPrompt(event, 'コメント')"></textarea>
				<div class="btn-group col-12 mt-5">
					<button data-action="dot_delete" class="btn col"><i class="fa fa-trash-o" aria-hidden="true"></i></button>
					<button data-action="dot_apply" class="btn col"><i class="fa fa-check" aria-hidden="true"></i></button>
				</div>
			</div>
		`).appendTo('body');
		registerAction('dot_delete', (dom, action, params) => {
			if(!g_dot.md5) return;

			if(confirm('削除してもいいですか？?')){
				g_dot.dot.attr('data-text',null);
				g_dot.hide();

				queryMsg({type: 'dot_delete', md5: g_dot.md5, key: g_dot.key, noResponse: g_dot.gallery}, true);
			}
		});
		registerAction('dot_apply', (dom, action, params) => {
				var text = g_dot.getText();
				if(g_dot.dot.attr('data-isnew') || text != g_dot.dot.attr('data-text')){
					g_dot.dot.attr('data-isnew', null);
					g_dot.dot.attr('data-text', text).attr('title', text);
					queryMsg({type: 'dot_apply', md5: g_dot.md5, text: text, key: g_dot.key, noResponse: g_dot.gallery}, true);
				}
				g_dot.hide();
		});
		registerAction('mark_switch', (dom, action, params) => {
			var i = $(dom).find('i');
			var c = i.hasClass('fa-pencil') ? 'check' : 'pencil';
			i.attr('class', 'fa fa-'+c);
			if(c == 'check'){
				r = 'btn-secondary';
				a = 'btn-success';
			}else{
				a = 'btn-secondary';
				r = 'btn-success';
			}
			$(dom).removeClass(r).addClass(a);
		});
		registerAction('dot_click', (dom, action, params) => {
			dom = $(dom);
			console.log(dom);
			g_dot.user = dom.attr('data-user');
			g_dot.text = dom.attr('data-text');
			if(g_dot.user != me()){
				return toastPAlert(g_dot.text, 10000, '', 'alert-primary');
			}

			var i = g_dot.div.width() / 2;
			var x = dom.offset().left;
			var mw = $(window).width();
			if(x + i > mw){
				x = mw - g_dot.div.width();
			}else{
				x -= i;
			}

			var y = dom.offset().top + 20;
			var mh = $(window).height();
			if(y + g_dot.div.height() > mh){
				y = mh - g_dot.div.height();
			}

			g_dot.dot = dom;
			g_dot.key = dom.attr('data-dot');;
			g_dot.md5 = dom.attr('data-md5');
			g_dot.div.find('textarea').val(g_dot.text)
			addAnimation(g_dot.div.css({
					left: x+'px',
					top: y+'px',
					display: 'unset'
				}), 'flipInX', () => {
	          // g_dot.div.find('textarea').focus();
	      });
		});

		registerRevice('dot_delete', (data) => {
			g_dot.setPill(data.md5, data.cnts);
			$('[data-dot="'+data.key+'"]').remove();
			if (g_data.data[md5].comments[dat.key]) {
				delete g_data.data[md5].comments[dat.key];
			}
		});

		if(!g_dot.gallery){
				registerRevice('comments_get', (data) => {
					var showing = $('#modal-img').hasClass('show') && $('#modal-img').attr('data-md5') == data.md5;
				if(showing){
					g_dot.setSwitchDisplay(true);
					$('[data-action="downloadImageToServer"]').hide();
				}
				g_dot.setPill(data.md5, Object.keys(data.comments).length, false);
				for(var key in data.comments){
						var p = key.split('_');
						g_dot.new(p[0], p[1], data.md5, data.comments[key]);
				}
			});
		}
		
		registerRevice('dot_apply', (data) => {
			if(data.user != me() && !g_dot.gallery){
				if ($('#modal-img').hasClass('show') && $('#modal-img').attr('data-md5') == data.md5) {
					// console.log('玩家正在展示被标注的图片');
					var p = data.key.split('_');
					g_dot.new(p[0], p[1], data.md5, {text: data.text, user: data.user, time: data.time});
				}
			}
			g_dot.setPill(data.md5, data.cnts);
		});
	},
	setSwitchDisplay: (show) => {
		var mark = $('[data-action=mark_switch]').removeClass('btn-success').addClass('btn-secondary');
    if(show){
    	mark.removeClass('hide');
    }else{
    	mark.addClass('hide');
    }
    mark.find('i').attr('class', 'fa fa-pencil');
	},
	new: (x, y, md5, data, isNew) => {
		data = Object.assign({text: '', user: me(), time: new Date().getTime()}, data);

		var k = x+'_'+y;
		var css = '';
		if(g_dot.gallery){
			 x = _viewer.image.width * (x / 100) + 'px';
     	y = _viewer.image.height * (y / 100) + 'px';
     	css = `margin-top: ` + $(_viewer.image).offset().top + `px;margin-left: ` + $(_viewer.image).offset().left + `px;`;
		}else{
			x += '%';
			y += '%';
		}

    var dot = $(`<span class='img-mark-dots' title="`+data.text+`" data-text="`+data.text+`" data-md5="`+md5+`" data-user="`+data.user+`" data-dot="`+k+`" style="left: `+x+`;top:`+y+`;background-image: url(res/`+data.user+`.jpg);`+css+`" data-action="dot_click"></span>`).appendTo(g_dot.gallery ? '.viewer-canvas' : '#modal-img-div');
    if(isNew){
    	dot.attr('data-isnew', 1).click();
    }
	},
	setPill: (md5, cnt, create = true) => {
		var img;
		if(g_dot.gallery){
			img = $('.photo[data-md5="'+md5+'"]');
		}else{
			img = $('#content_chat img[data-md5="'+md5+'"]')
			if(!img.length){
				if(!create) return;
				img = reviceMsg({ type: 'msg', image: md5, msg: '<img class="thumb" data-md5="'+md5+'" data-user="'+me()+'" data-action="previewImage" src="' + g_imageHost + 'saves/_' + md5 + '.jpg" alt="Comment by ' + me() + '"><a  class="btn btn-square btn-success rounded-circle saved" style="position: relative;bottom: 5px;right: 20px;" role="button"><i class="fa fa-check" aria-hidden="true"></i></a>', user: me()});
			}
		}
		var dom = img.next('.mark_cnt');
		if(!dom.length){
			if(cnt == 0) return;
			var i = g_dot.gallery ? '16px' : '5px';
			dom = $(`<a class="btn btn-square rounded-circle btn-secondary mark_cnt" style="position: absolute;top: `+i+`;left: `+i+`;" role="button"></a> `).insertAfter(img);
		}
		if(cnt == 0){
			dom.remove();
		}else{
			dom.html(cnt);
			addAnimation(img, 'heartBeat');

			if(!img.parent().find('.saved').length){
				$(`<a  class="btn btn-square btn-success rounded-circle saved" style="position: relative;bottom: 5px;right: 20px;" role="button"><i class="fa fa-check" aria-hidden="true"></i></a> 
                `).insertAfter(img);
			}	
		}
	}
}

g_dot.init();

function modalImgClick(ev){
	if(g_dot.div.css('display') != 'none'){
		return g_dot.hide();
	}

	var md5 = $(g_dot.gallery ? '.viewer-canvas' : '#modal-img').attr('data-md5');
	if(!md5 || !$('[data-action="mark_switch"]').find('i').hasClass('fa-check')) return;
	
	var text = prompt('コメントを入力する');
	if(text != undefined && text.length){
		var r = 25 / 2;
	  var x = ((ev.offsetX - r) / $(ev.srcElement).width()).toFixed(2) * 100;
	  var y = ((ev.offsetY - r)/ $(ev.srcElement).height()).toFixed(2) * 100;
		g_dot.new(x, y, md5, {text: text}, true);
	}
}


function getTextWithPrompt(event, title) {
    event.preventDefault(true);
    event.stopPropagation();
    var m = prompt(title, event.srcElement.value);
    if (m != undefined) {
        event.srcElement.value = m;
    }
}
