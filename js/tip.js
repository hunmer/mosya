var g_tip = {
    dom: undefined,
    data: {},
    init: () => {
        g_tip.dom = $(`
			<div id="alert-center-div" class="hide">
				<div class="alert alert-center mx-auto animated bounceIn" animated='bounceIn' role="alert">
					<div class="alert-content"></div>
					<div class="progress">
				  <div class="progress-bar" role="progressbar" aria-valuenow="80" aria-valuemin="0" aria-valuemax="100"></div>
					</div>
	    	</div>
	    	
	    </div>
			`).appendTo($('body'));
        g_tip.progress = g_tip.dom.find('.progress-bar');
    },
    alert: (html, time = 10000, interval = 2000) => {
        clearInterval(g_tip.timer_alert);
        g_tip.timer_alert = setTimeout(() => {
            g_tip.dom.find('.alert-content').html(html);
            var p = 100;
            clearInterval(g_tip.timer);

            g_tip.timer = setInterval(() => {
                g_tip.progress.css('width', p + '%');
                p--;
                if (p == 0) {
                    clearInterval(g_tip.timer);
                    g_tip.timer = 0;
                }
            }, time / 100);

            g_tip.dom.show();
            removeAnimation(g_tip.dom);
            setTimeout(() => {
                addAnimation(g_tip.dom, 'bounceOut', () => {
                    g_tip.dom.hide();
                    g_tip.next();
                });
            }, time)
        }, interval);

    },
    setList: (data, play = false) => {
        g_tip.index = 0;
        g_tip.data = data;
        g_note.setList(data);
        if(play) g_tip.play();
    },
    next: () => {
        g_tip.index++;
        g_tip.play();

    },
    play: () => {
        var index = g_tip.index;
        if (g_tip.data && g_tip.data.list[index]) {
            var data = g_tip.data.list[index];
            g_tip.alert(data.text, g_tip.data.time, g_tip.data.interval);
        } else {
            g_tip.index = 0;
        }
    }
}

g_tip.init();
/*g_tip.setList({
    list: [{
            text: "text1",
        },
        {
            text: "text2",
        }
    ],
    time: 3000,
    interval: 2000,
    tts: true
});*/
// g_tip.alert('test', 10000);

function setTyping(user){
    var d = $('#typing').attr('data-user', user);
    d.find('img').attr('src', getUserIcon(user));
    d.show();
    if(g_cache.timer_typing) clearTimeout(g_cache.timer_typing);
    g_cache.timer_typing = setTimeout(() => {
           d.fadeOut('slow');
           // bug 动画没有效果
        // addAnimation(d, 'backOutLeft', () => {d.addClass('hide');});
    }, 3000)
}

registerRevice('typing', (data) => {
    if(data.user != g_config.user.name){
        setTyping(data.user);
    }
});
registerRevice('tip_set', (data) => {
    //if(data.user != g_config.user.name){
        g_tip.setList(data.data, false);
    //}
});