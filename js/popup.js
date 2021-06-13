var popup = (function (browser){
    'use strict';
    var
        mainheight = 0,
        $listings = $("#listings"),

        init = function (){
            layout();
            _bindingEvents();
        },
        layout = function () {
            let $body = $("body");
            chrome.windows.getCurrent(function (win) {
                var width = (win.width * .15);
                $body.width(width);
            });
        },
        _bindingEvents = function (){
            $listings.off('click').on('click',function (){
                chrome.tabs.create({'url':'listings.html'})
            });
        };
    init();
})(chrome.runtime);