


var background = (function (browser) {
    'use strict';
    var
        db,
        init = function () {

            db = new Localbase('db');

            browser.onMessage.addListener(function (request, sender,sendResponse) {

                if(request.fn in backgroundFn){
                    backgroundFn[request.fn](request, sender,function (res){
                        sendResponse(res);
                    });
                }
                return true;
            });

        },
        backgroundFn = {

            getAMZSource : function (request, sender,sendResponse){

                fetch('https://www.amazon.com/dp/'+request.asinID
                ).then(response => response.text())
                    .then(text => sendResponse(text))
                    .then(error => console.log(error))

                return true;
            },
            updateGroupListings : function (request, sender,sendResponse){
                try {
                    db.collection(request.name).doc({id:parseInt(request.id)}).update(request.value).then(response => {
                        sendResponse(response);
                    })
                }catch (e) {
                    console.log(e);
                }
                true;
            },
            setGroupListings : function (request, sender,sendResponse){
                try {
                    db.collection(request.name).add(request.value)
                        .then(response => {
                            sendResponse(response);
                        });
                }catch (e) {
                    console.log(e);
                }
                return true;
            },
            getGroupListings : function (request, sender,sendResponse){
                try{
                    db.collection(request.name).orderBy('id','desc').get().then(response =>{
                        sendResponse(response || {});
                    });
                }catch (e) {
                    console.log(e);
                }
                return true;
            },
            updateListing : function (request, sender,sendResponse){

                for(let val of request.value){
                    console.log(val.id+"_"+request.groupID);
                    try {
                        db.collection(request.name).doc(val.id+"_"+request.groupID).update(val).then(response => {
                            sendResponse(response);
                        })
                    }catch (e) {
                        console.log(e);
                    }

                }

                return true;

            },
            setListings: function (request, sender,sendResponse){
                let orderBy = 0;
                for (let val of request.value) {
                    try {
                        val.orderBy = (orderBy++);
                        db.collection(request.name).doc(val.id+"_"+val.listingGroupID).set(val)
                            .then(response => {
                                sendResponse(response);
                            });
                    }catch (e) {
                        console.log(e);
                    }
                }
                sendResponse(true);
                return true;


            },
            getListings : function (request, sender,sendResponse){
                try{
                    db.collection(request.name).orderBy('orderBy','desc').get().then(response =>{
                        sendResponse(response || {});
                    });
                }catch (e) {
                    console.log(e);
                }
                return true;
            }

        };

    init();

})(chrome.runtime);







