var g_kadai = {
    init: () => {
         g_kadai.btn = $(`<button class="btn ml-5" data-action="toTab,kadai"><i class="fa fa-file-image-o" aria-hidden="true"></i>
                <span class="badge badge-primary badge-pill position-absolute hide"></span>
            </button>
            `).prependTo('#tabs');
        g_kadai.tab = $(`
            <div id='content_collection' class='_content hide p-5'>
                <div class="w-full row mx-auto">
                     <input type="text" class="form-control timepicker text-center" style="width: 125px;" readonly placeholder="日付を選択">
                </div>
                <div class="grid mt-10">
                  <h4 class="text-center">読み込み中...</h4>
              </div>
            </div>`).prependTo('#tabs_contents');

        g_kadai.bottom = $(`
                    <div id="bottom_collection" class="row toolbar hide" style="width: 100%;">
                            <div class="row w-full" style="display: flow-root;">
                                <i data-action="uploadImageToKadai" class="fa fa-file-image-o col-1" aria-hidden="true"></i>
                                <i data-action="collection_delete" class="fa fa-trash-o col-1" aria-hidden="true"></i>
                                <i onclick="queryMsg({ type: 'kadai_list' });" class="fa fa-refresh col-1" aria-hidden="true"></i>
                            </div>
                    </div>
                `).prependTo('.navbar-fixed-bottom .container-fluid');


        registerAction('kadai_list', (dom, action, params) => {
            queryMsg({ type: 'kadai_list'});
        });

         registerRevice('kadai_list', (data) => {
            g_kadai.data = data;
             g_kadai.initHtml();
         });

            reviceMsg({ type: 'kadai_list', data: {
                '2021/11/2': {
                    title: 'title',
                    desc: 'desc',
                    imgs: {
                        set_1: {
                            img: 'res/紫色の星.jpg',
                            comments: [

                            ],
                            uploadAt: ,
                        }

                    }
                }
            }});
    },

    initHtml: () => {
        var json = g_kadai.data;
         var enable = [true];
        for(var day in json){
             if (enable[day] == undefined) {
                 enable[day] = day.split('/');
             }
         }

        $('.timepicker').pickadate({
         disable: Object.values(enable),
         onSet: function(thingSet) {
             loadDate(thingSet.select);
         }
     });
    },

    getSelected: () => {
        return g_kadai.tab.find('input').val();
    },

    loadDate: (day) => {

        console.log(day);

        var d = g_kadai.data[getFormatedTime(3, day)];
        console.log(d);
        var h = '';
        for(var set in d.imgs){
            for(var img of d.imgs[set]){

            }
        }
    }



}