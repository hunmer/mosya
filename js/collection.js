var g_collection = {
    grid: undefined,
    data: {},
    loadedJs: false,
    init: () => {



        g_collection.btn = $(`<button class="btn ml-5" data-action="toTab,collection"><i class="fa fa-file-image-o" aria-hidden="true"></i>
	            <span class="badge badge-primary badge-pill position-absolute hide"></span>
	        </button>
			`).prependTo('#tabs');
        g_collection.tab = $(`
			<div id='content_collection' class='_content hide p-5'>
				<div class="w-full row mx-auto">
					<select class="form-control" onchange="g_collection.showCollection(this.value)">
						<option value="" selected disabled>アルバムを選択</option>
					</select>
				</div>
				<div class="grid mt-10">
                  <h4 class="text-center">読み込み中...</h4>
              </div>
			</div>`).prependTo('#tabs_contents');

        g_collection.bottom = $(`
					<div id="bottom_collection" class="row toolbar hide" style="width: 100%;">
							<div class="row w-full" style="display: flow-root;">
                                <i data-action="collection_new" class="fa fa-plus col-1" aria-hidden="true"></i>
                                <i data-action="uploadImageToCollection" class="fa fa-file-image-o col-1" aria-hidden="true"></i>
                                <i data-action="collection_delete" class="fa fa-trash-o col-1" aria-hidden="true"></i>
								<i onclick="queryMsg({ type: 'collction_list' });" class="fa fa-refresh col-1" aria-hidden="true"></i>
							</div>
					</div>
				`).prependTo('.navbar-fixed-bottom .container-fluid');

        registerAction('collction_photo_action', (dom, action, params) => {
            var div = $('.grid-item[data-time="' + action[2] + '"]');

            switch(action[1]){
                case 'share':
                    var name = g_collection.getSelected();
                    queryMsg({ type: 'msg', msg: '<img class="thumb" data-action="previewImage" src="' +div.find('img').attr('src') + '">' }, true);
                    queryMsg({ type: 'msg', msg: `<a href="javascript: g_collection.btn[0].click();g_collection.selectCollection('`+name+`') ">アルバム > `+name+`</a>` }, true);
                     halfmoon.toggleModal('modal-custom');
                    break;

                case 'delete':
                    queryMsg({type: 'collection_remove', time: action[2], collection: g_collection.getSelected()});
                    break;
            }
        });

        registerAction('collction_photo_delete', (dom, action, params) => {
            var div = $('.grid-item[data-time="' + action[1] + '"]');
            console.log(div.find('img').attr('src'));
        });

        registerAction('collction_list', (dom, action, params) => {
            queryMsg({ type: 'collction_list', data: g_collection.getSelected()});
        });

        registerAction('collection_delete', (dom, action, params) => {
            var name = g_collection.getSelected();
            if(confirm('delete ' + name + '?')){
                queryMsg({ type: 'collection_delete', collection: name});
            }
        });

        registerAction('collection_new', (dom, action, params) => {
             var name = prompt('アルバムの名前を入力してください', '');
            if (name != undefined && name.length) {
                 queryMsg({ type: 'collction_new', collection: name });
             }
        });

        registerAction('collction_photo_actions', (dom, action, params) => {
            var div = $(dom).parents('.grid-item');
            var time = div.attr('data-time');
            $('#modal-custom').find('.modal-title').html('操作');
            $('#modal-custom').attr('data-type', 'collction_photo_actions').find('.modal-html').html(`
            		<div class="w-full mb-10">
            			<img src="` + div.find('img').attr('src') + `" class="h-150 mx-auto">
            		</div>
                <button class="btn btn-block" data-action="collction_photo_action,share,` + time + `">シェア</button>
                <button class="btn btn-block btn-danger" data-action="collction_photo_action,delete,` + time + `">削除</button>
                `);
            halfmoon.toggleModal('modal-custom');
        });


         registerRevice('collection_remove', (data) => {
            var div = $('.grid-item[data-time="' + data.time + '"]');
            if(div.length){
                 closeModal('modal-custom', 'collction_photo_actions', () => {
                    halfmoon.toggleModal('modal-custom');
                })
                g_collection.grid.isotope('remove', div).isotope('layout');
            }
        });

        registerRevice('collection_upload', (data) => {
             if (g_collection.getSelected() == data.data.collection) {
                var $items = $(g_collection.getImageHtml(data.time, data.data));
                  g_collection.grid.prepend( $items ).isotope( 'prepended', $items );
                     g_collection.gridProgress();

                   closeModal('modal-upload', '', () => {
                     $('#btn_upload').html('アップロードする');
                    g_cache.upload = false;
                    halfmoon.toggleModal('modal-upload');
                })
            }
        });

        registerRevice('collection_delete', (data) => {
            if(g_collection.getSelected() == data.collection){
                g_collection.grid.html('').isotope( 'destroy');
                $('#content_collection select option:selected').remove();
            }
         });
         registerRevice('collection_existed', (data) => {
             $('#btn_upload').html('アップロードする');
               g_cache.upload = false;
            toastPAlert('すでにアップロードされました', 3000, '', 'alert-danger');
         });

        

        registerRevice('collction_new', (data) => {
            var name = data.collection;
            g_collection.data[name] = {};
            toastPAlert('new ['+name+']!', 1000, '', 'alert-success');
           $('#content_collection select').append('<option value="' + name + '">' + name + '</option>');
           g_collection.selectCollection(name);
        });
        registerRevice('collction_list', (data) => {
            $('#content_collection select option:gt(0)').remove();
            g_collection.initHtml(data.data);
        });

        //doAction(null, 'toTab,collection');

    },

    getSelected: () => {
        return $('#content_collection select').val()
    },

    loadUntil: (callback) => {
        loadJs('js/isotope.pkgd.js', () => {
            loadJs('js/imagesloaded.pkgd.min.js', () => {
                g_collection.loadedJs = true;
                console.log('load done!');
                callback();
            })
        });
    },
    initHtml: (json) => {
        if(!g_collection.loadedJs){
            g_collection.loadUntil(() => {
                g_collection.initHtml(json);
            });
            return;
        }


        if (json.collection) {
            g_collection.data[json.collection] =  json.data;
            if (g_collection.getSelected() == json.collection) {
                g_collection.selectCollection(json.collection);
            }
        } else {
            for (var name in json) {
                $('#content_collection select').append('<option value="' + name + '">' + name + '</option>');
            }
            g_collection.data = json;
            g_collection.selectCollection(g_config.lastCollection);
        }
    },

    selectCollection: (collection) => {

        if($('#content_collection').css('display') == 'none'){
            g_collection.selected = collection; 
        }else{
            delete g_collection.selected;
                $('#content_collection select option[value="'+collection+'"]').prop('selected', true);
              g_collection.showCollection(collection);
        }
    },

    getImageHtml: (time, d) => {
        return `<div class="grid-item " data-time="` + time + `">
                      <img class="photo"  data-action="openViewer" src="` + (d.url.substr(0, 4).toLowerCase() == 'http' ? d.url : g_imageHost + 'collection/'+d.url+'.jpg') + `" alt="` + d.title + `" title="` + d.title + `">
                        <a class="btn btn-square rounded-circle btn-primary" data-action="collction_photo_actions" style="position: absolute;bottom: 16px;right: 16px;" role="button"> <i class="fa fa-ellipsis-h" aria-hidden="true"></i></a>
                      </div>`
    },

    showCollection: (collection) => {
        g_config.lastCollection = collection;
        local_saveJson('config', g_config);
        
          if(!g_collection.loadedJs){
            g_collection.loadUntil(() => {
                g_collection.showCollection(collection);
            });
            return;
        }

        var h = '';
    	var data = g_collection.data[collection];
        for (var time in data) {
            var d = data[time];
            h = g_collection.getImageHtml(time, d) + h;
        }

        if (g_collection.grid) g_collection.grid.isotope('destroy')
        g_collection.grid = $('.grid').html(h).isotope({
            itemSelector: '.grid-item',
            percentPosition: false,
        });
        g_collection.gridProgress();
    },
    gridProgress: () => {
        g_collection.grid.imagesLoaded().progress(function(instance, image) {
           if (image.isLoaded) {
             g_collection.grid.isotope('layout');
         }
        });
    }

}

g_collection.init();