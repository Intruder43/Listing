

let content = (function (browser) {
    'use strict';

    var
        baseUrl = document.location.host,
        targetNode = $("#root")[0],
        observerOptions = {
            attributes: true,
            characterData: true,
            childList: true,
            subtree: true
        },
        observer,
        $walmartContainer = $(".Grid-col.u-size-1-2-m > .hf-Bot"),
        $navButtonContainer = $("#header-bubble-links"),
        $navButtonContainerAMZ = $("#nav-tools"),
        $sourceURL = $('[name="sourceURL"]'),
        $platformURL = $('[name="platformURL"]'),
        $initialPrice,
        $sku,
        $btnScan = $("<button/>",{
            "data-toggle":"modal",
            "data-target":"#mdlModal",
            class : "g_a ae_a g_c",
            html: '<span style="font-size: 1.5em" class="fa fa-optin-monster"></span> <span style="font-size: 1.2em">Scan</span>'
        }),
        $btnScanAMZ = $("<a/>",{
            "data-toggle":"modal",
            "data-target":"#mdlModal",
            style: 'text-decoration: none;color: white;',
            html: '<span style="display: inline-block;font-size: 25px;padding-top: 14px;" class="fa fa-optin-monster"></span><span class="nav-line-1"> Scan</span>'
        }),
        $a = $('a'),
        isDisconnect = true,
        watch = {
            input: true,
            content : false
        },
        itemIDs = [],

        init = function () {



            switch (baseUrl) {
                case "www.walmart.com":
                    walmart();
                    break;
                case "sage.oagenius.com":
                    watchChanges(watch);
                    break;
                case "www.amazon.com":
                    _amazon();
                    break;
            }


            $('div.AdHolder').remove();
            $('div.s-widget').remove();
            $('#rhf').remove();
        },
        walmart =  function (){
            // make button for modal scan
            $navButtonContainer.prepend(

                $("<div/>",{
                    right: "xs",
                    class : "b_a bl_b bl_f bl_g b_g",
                    html: $btnScan.off("click").on("click",function (){

                        let template = $('<div/>').load(browser.getURL("src/template/modal.html"));
                        openModal({title:"Walmart IDs",message:template[0]},function (cb){

                            let
                                listingCount = cb.listings.length,
                                count = 0,
                                width = 0,
                                interval,
                                pause = false,
                                result = [];

                            cb.e.ProgressBar.parent().show();
                            for(let listings of cb.listings){
                                fetchURLS('https://www.walmart.com/ip/'+listings.id+'/',function (response){





                                    // if(scriptItem === undefined){
                                    //     cb.e.$alert.removeClass('d-none');
                                    //     cb.e.$alert.text("Something went wrong. Please refresh your browser");
                                    //     return false;
                                    // }
                                    let scriptItem = response.find('script#item')[0],
                                        reCaptcha =  response.find('script#blockScript');
                                    // console.log(scriptItem);
                                    if(!!scriptItem){
                                        console.log(reCaptcha);

                                        if(!reCaptcha){
                                                cb.e.$alert.removeClass('d-none');
                                                cb.e.$alert.text("Something went wrong. Please refresh your browser");
                                                return false;
                                        }
                                        let data = JSON.parse(scriptItem.innerHTML);
                                        if(!!data){

                                            listings.walmartID = data.item.product.buyBox.primaryUsItemId || "";
                                            // listings.isVariant = data.item.product.buyBox.criteria.length < 1 ? 0 : 1 || 0;

                                            // value: data.item.product.buyBox
                                            if(!!data.item.product.buyBox.products){
                                                try {
                                                    $.each(data.item.product.buyBox.products,function (index,value){
                                                        listings.upc = !!value.upc ? value.upc : "";
                                                        listings.images = !!value.images && !!value.images  ? value.images[0].url : "";
                                                        // console.log(value.images);
                                                        listings.name = !!value.productName ? value.productName : "";
                                                        listings.isVariant = !!value.variants ? value.variants : [];
                                                        listings.brandName = !!value.brandName ? value.brandName : "";
                                                        listings.brandName = !!value.brandName ? value.brandName : "";
                                                        listings.shortDescription = !!value.idmlSections.idmlShortDescription ? value.idmlSections.idmlShortDescription : "";
                                                        listings.longDescription = !!value.idmlSections.idmlLongDescription ? value.idmlSections.idmlLongDescription : "";
                                                        if(!!value.priceMap){
                                                            listings.walmartPrice = value.priceMap.price;
                                                            listings.walmartFee = getWalmartCategory(value.promotionsData.productSegment,value.priceMap.price);
                                                        }
                                                        if(listings.upc.length > 0){
                                                            return false;
                                                        }

                                                    });
                                                }catch (e) {
                                                    console.log(e);
                                                }

                                            }
                                            result.push(listings);
                                        }
                                    }
                                    //--------------------------------------

                                    count++;
                                    width = (count / listingCount) * 100;
                                    cb.e.ProgressBar.width(width + "%").text(width.toFixed(0) + "%")

                                    if(width >= 100){
                                        console.log(result);
                                        if(result.length < 1){
                                            cb.e.$alert.removeClass('d-none');
                                            cb.e.$alert.text("Something went wrong. Please refresh your browser");
                                            return false;
                                        }
                                        updateListings({
                                            groupID : cb.groupListings.id,
                                            listings : result,
                                            isWalmartScan : 1,
                                            isAmazonScan : cb.groupListings.isAmazonScan
                                        },function (res){
                                            if(res.isModal){
                                                cb.dialog.modal('hide');
                                            }
                                        });
                                        cb.e.ProgressBar.parent().hide();
                                    }

                                });
                            }


                        });
                    })
                })
            );
            // end make button for modal scan

            try {
                let data = JSON.parse(document.getElementById('item').innerHTML) || {};
                $.get(browser.getURL("src/template/walmartTableParent.html")).then(function (template) {

                    var rendered = Mustache.render(template, {});
                    $walmartContainer.prepend(rendered);
                    var variant = data.item.product.buyBox.criteria.length < 1 ? 'None' : 'Yes',
                        walID = data.item.product.buyBox.primaryUsItemId;
                    $.get(browser.getURL("src/template/walmartTableChild.html")).then(function (temp) {
                        $.each(data.item.product.buyBox.products,function (index,value){
                            if(!!value.upc){
                                let arr = {
                                    variant : variant,
                                    walmartID : walID,
                                    UPC : value.upc
                                }
                                var rendered = Mustache.render(temp, arr);
                                $walmartContainer.find("#walmartTable").append(rendered);
                                return false;
                            }

                        });

                    });

                });
            }catch (e) {

            }


            let content = $('script#searchContent')[0],
                contentJSON,
                currentPage,
                dialog;
            if(!!content){
                contentJSON = JSON.parse(content.innerHTML)
                currentPage = contentJSON.searchContent.preso.requestContext.itemCount;
            }
            console.log(content);
            if(!!currentPage){
                $('body').append(

                    $('<div/>',{
                        id:'ds-input',
                        class:'col-12 d-none',
                        width:'50px',
                        style:'z-index:999999;position: fixed;bottom: 50px;left: 10px;width: 500px;padding: 10px;background-color: whitesmoke;'
                    }),

                    $('<button/>',{
                        text:"GET WALMART ID's",
                        id:"btn-GETWALMARTID",
                        class:'btn btn-primary',
                        style:'position: fixed;bottom: 10px;left: 10px;z-index:999999;'
                    }).off("click").on('click',function (){



                        if(!$('#ds-input').hasClass('d-none')){
                            $('#ds-input').addClass('d-none');
                            $('#ds-input').html("");
                            $("#btn-run-walmart").remove();
                            $("#btn-GETWALMARTID").text("GET WALMART ID's");

                        }else{
                            // $("#btn-GETWALMARTID").prop("disable",true);
                            $("#btn-GETWALMARTID").text("RESET");
                            $('#ds-input').removeClass('d-none');
                            $('#ds-input').html("");
                            $("#ProgressBar").width("0%").text("0%");
                            $('#progressbarIDs').parent().addClass('d-none');
                            $('#ds-input').append(
                                $('<div/>',{
                                    class:"form-group row",
                                    html:
                                        $('<div/>',{
                                            class:"col-sm-12",
                                            html: $('<div />',{
                                                id: 'page-walmarts-alert',
                                                class:"alert alert-danger d-none",
                                                role:'alert',
                                                value: ''
                                            })[0].outerHTML
                                        })[0].outerHTML +

                                        $('<div/>',{
                                            class:"col-sm-5",
                                            html: 'Starting page '+$('<input/>',{
                                                id: 'page-walmarts-from',
                                                class:"form-control form-control-sm",
                                                value: currentPage.page
                                            })[0].outerHTML
                                        })[0].outerHTML +
                                        $('<div/>',{
                                            class:"col-sm-5",
                                            html: 'Last page '+$('<input/>',{
                                                id: 'page-walmarts-to',
                                                class:"form-control form-control-sm",
                                                value: currentPage.page
                                            })[0].outerHTML
                                        })[0].outerHTML +



                                        $('<div/>',{
                                            class:"col-sm-2",
                                            html: '&nbsp;'+ $('<button/>',{
                                                id:'btnWALMARTIDs',
                                                class:"btn btn-success btn-primary",
                                                html: 'Run',
                                                style:'z-index:999999;'
                                            })[0].outerHTML
                                        })[0].outerHTML +

                                        $('<div/>',{
                                            class:"col-sm-12",
                                            html: $('<div/>',{
                                                class:"progress d-none",
                                                html: $('<div />',{
                                                    id:'progressbarIDs',
                                                    role:"progressbar",
                                                    class:"progress-bar",
                                                    'aria-valuenow':'0',
                                                    'aria-valuemin':'0',
                                                    'aria-valuemax':'100',
                                                    text: '0',
                                                    style:'width: 0%;'
                                                })
                                            })[0].outerHTML
                                        })[0].outerHTML

                                }),

                            )

                            $("#btnWALMARTIDs").off('click').on('click',function (){
                                console.log("CALLED");
                                $("#ProgressBar").width("0%").text("0%");
                                $('#progressbarIDs').parent().removeClass('d-none');

                                if(!!dialog){
                                    dialog.hide();
                                }
                                var location = window.location,
                                    params = getURLParams(location.href);
                                let count = 0,
                                    width = 0,
                                    start = parseInt($("#page-walmarts-from").val()),
                                    length = parseInt($("#page-walmarts-to").val()),
                                    notScan = [];
                                try {
                                    console.log(start);
                                    itemIDs = [];

                                    for(let i = start; i <= length;i++){
                                        params.page = i;
                                        console.log(params.page);
                                        $.get( location.origin + location.pathname,
                                            params ,function (text, textStatus, xhr){
                                                // console.log(xhr);
                                                if(xhr.status !== 200){
                                                    notScan.push(i);
                                                    $("#page-walmarts-alert").removeClass('d-none');
                                                    $('#page-walmarts-alert').text("Something went wrong. Please refresh your browser");

                                                    return false;

                                                }else{
                                                    let tempDom =  $('<div/>').append(text),

                                                        scriptItem = !!tempDom.find('script#searchContent')[0] ? tempDom.find('script#searchContent')[0] : undefined;
                                                        if(scriptItem === undefined){
                                                            $("#page-walmarts-alert").removeClass('d-none');
                                                            $('#page-walmarts-alert').text("Something went wrong. Please refresh your browser");

                                                            return false;
                                                        }
                                                        let data = JSON.parse(scriptItem.innerHTML);

                                                    if(!!data){

                                                        let itemsID = data.searchContent.preso.adContext.itemIds.split(',');
                                                        let order = 1;
                                                        for(let val of itemsID){
                                                            itemIDs.push({walmartID:val,group_order:i,order_number:order});
                                                            order++;
                                                        }
                                                    }else{
                                                        notScan.push(i);
                                                    }
                                                }

                                                count++;
                                                width = (count / length) * 100;
                                                $('#progressbarIDs').width(width + "%").text(width.toFixed(0) + "%")

                                                if(width >= 100){
                                                    $('#ds-input').addClass('d-none');
                                                    $('#ds-input').html("");
                                                    $("#btn-run-walmart").remove();
                                                    $("#btn-GETWALMARTID").text("GET WALMART ID's");
                                                    itemIDs.sort(function(a, b){return a.group_order-b.group_order});
                                                    itemIDs.sort(function(a, b){return a.order_number-b.order_number});
                                                    let countItemHTML = '<div class="col-4">Count: '+itemIDs.length+'</div>',
                                                        notScan = '',
                                                        txtAreaHTML = $("<div/>",{
                                                                class:'col-12',
                                                                html: $("<textarea/>",{
                                                                    class:"form-control",
                                                                    rows: 10,
                                                                    id : "txtWalmartIDs"
                                                                })
                                                            })[0].innerHTML;

                                                    if(notScan.length > 0){
                                                        notScan = '<div class="col-6">Page not Scan: '+notScan.toString()+'<div/>';
                                                    }
                                                    dialog = bootbox.dialog({
                                                        title: 'Walmart ID\'s',
                                                        message: countItemHTML + notScan  + txtAreaHTML
                                                    });
                                                    dialog.init(function (){

                                                        dialog.css({"background": "unset", "box-shadow": "unset","display": "block","overflow": "unset","position": "fixed"});

                                                        for(let walmart of itemIDs){

                                                            $('#txtWalmartIDs').append(walmart.walmartID+ "\n");
                                                        }
                                                    });

                                                    $('#progressbarIDs').parent().addClass('d-none');

                                                    // $('#ds-input').append([...new Set(itemIDs.walmartID)].toString().replaceAll(",","<br/>"))
                                                    // console.log([...new Set(itemIDs)].toString().replaceAll(",","\n"))
                                                }



                                            });
                                    }



                                }catch (e) {

                                }


                            })


                        }




                    })

                )
            }




        },
        findWalmart = function (i,params){


        },
        getURLParams = function (url) {
            let params = {};
            new URLSearchParams(url.replace(/^.*?\?/, '?')).forEach(function(value, key) {
                params[key] = value
            });
            return params;
        },
        openModal = function (arr,response){
            var dialog = bootbox.dialog({
                title: arr.title,
                message: arr.message,
                backdrop: false
            });

            dialog.init(function (){
                dialog.css({
                    'background': 'unset',
                    '-webkit-box-shadow': 'unset',
                    'box-shadow': 'unset',
                    'overflow': 'unset',
                    'position' : 'fixed'
                });
                let e = {
                    $alert : $("#page-scan-alert"),
                    $btnRun : $("#btnRun"),
                    $select : $("#groupListingsID").val(0),
                    ProgressBar :$("#ProgressBar").width("0%").text("0%")
                }

                    e.ProgressBar.parent().hide();

                e.$select.html("");

                sendMessage({fn:"getGroupListings",name:"GroupListings"},function (res){
                    e.$select.append(
                        $("<option/>",{
                            value : 0,
                            text:"Please Select"
                        })
                    );
                    for(let val of res){
                        e.$select.append(
                            $("<option/>",{
                                value : val.id,
                                'data-isWalmartScan' : val.isWalmartScan,
                                'data-isAmazonScan' : val.isAmazonScan,
                                text: moment(val.id).format('LLLL')
                            })
                        );
                    }
                });

                e.$btnRun.off("click").on("click",function (){
                    let groupListings = {
                        id : parseInt(e.$select.val()),
                        isWalmartScan : e.$select.find(':selected').data('iswalmartscan') || 0,
                        isAmazonScan : e.$select.find(':selected').data('isamazonscan') || 0
                    };
                    sendMessage({fn:"getListings",name:"listings"},function (cb){
                        let listings = $.grep(cb,function (value,index){
                            return value.listingGroupID === groupListings.id
                        });
                        listings.sort(function(a, b){return a.orderBy-b.orderBy});
                        response({groupListings,listings,e,dialog});
                    })
                });


            });
        },
        getWalmartCategory = function (category,price){
            let walmartFee = 0;
            switch (category){
                case 'Apparel & Accessories':
                    walmartFee = price * 0.15;
                    break;
                case 'Automotive & Powersports':
                    walmartFee = price * 0.12;
                    break;
                case 'Baby':
                    walmartFee = price * 0.15;
                    break;
                case 'Beauty':
                    walmartFee = price * 0.15;
                    break;
                case 'Books':
                    walmartFee = price * 0.15;
                    break;
                case 'Camera & Photo':
                    walmartFee = price * 0.8;
                    break;
                case 'Cell Phones':
                    walmartFee = price * 0.8;
                    break;
                case 'Consumer Electronics':
                    walmartFee = price * 0.8;
                    break;
                case 'Electronics Accessories':
                    walmartFee = price * 0.15;
                    break;
                case 'Furniture & Decor':
                    walmartFee = price * 0.15;
                    break;
                case 'Gourmet Food':
                    walmartFee = price * 0.15;
                    break;
                case 'Grocery':
                    walmartFee = price * 0.15;
                    break;
                case 'Health & Personal Care':
                    walmartFee = price * 0.15;
                    break;
                case 'Home & Garden':
                    walmartFee = price * 0.15;
                    break;
                case 'Industrial & Scientific':
                    walmartFee = price * 0.12;
                    break;
                case 'Jewelry':
                    walmartFee = price * 0.20;
                    break;
                case 'Kitchen':
                    walmartFee = price * 0.15;
                    break;
                case 'Luggage & Travel Accessories':
                    walmartFee = price * 0.15;
                    break;
                case 'Major Appliances':
                    walmartFee = price * 0.8;
                    break;
                case 'Music':
                    walmartFee = price * 0.15;
                    break;
                case 'Musical Instruments':
                    walmartFee = price * 0.12;
                    break;
                case 'Office Products':
                    walmartFee = price * 0.15;
                    break;
                case 'Outdoors':
                    walmartFee = price * 0.15;
                    break;
                case 'Personal Computers':
                    walmartFee = price * 0.6;
                    break;
                case 'Pet Supplies':
                    walmartFee = price * 0.15;
                    break;
                case 'Shoes, Handbags & Sunglasses':
                    walmartFee = price * 0.15;
                    break;
                case 'Software & Computer Video Games':
                    walmartFee = price * 0.15;
                    break;
                case 'Sporting Goods':
                    walmartFee = price * 0.15;
                    break;
                case 'Tires & Wheels':
                    walmartFee = price * 0.10;
                    break;
                case 'Tools & Home Improvement':
                    walmartFee = price * 0.15;
                    break;
                case 'Toys & Games':
                    walmartFee = price * 0.15;
                    break;
                case 'Video & DVD':
                    walmartFee = price * 0.15;
                    break;
                case 'Video Game Consoles':
                    walmartFee = price * 0.8;
                    break;
                case 'Video Games':
                    walmartFee = price * 0.15;
                    break;
                case 'Watches':
                    walmartFee = price * 0.15;
                    break;
                default:
                    walmartFee = price * 0.15;
                    break;
            }
            return walmartFee;
        },
        _amazon = function (){
            $navButtonContainerAMZ.prepend(
                $("<a/>",{
                    'data-toggle': 'modal',
                    'data-target':"#mdlModal",
                    style: 'text-decoration: none;color: white;',
                    html : $btnScanAMZ.off("click").on("click",function (e){
                        e.preventDefault();


                        let template = $('<div/>').load(browser.getURL("src/template/modal.html"));
                        openModal({title:"Find Source",message:template[0]},function (cb){
                            let
                                listingCount = cb.listings.length,
                                UPCToASIN = [],
                                count = 0,
                                width = 0,

                                result = {};

                            cb.e.ProgressBar.parent().show();
                            for(let listings of cb.listings){

                                let amzResult = {
                                    id: listings.id,
                                    result : [{
                                        upc:[],
                                        name:[]
                                    }],
                                }

                                let search = {
                                    upc : listings.upc,
                                    name : listings.name
                                };
                                // result = [];
                                for(let find in search){

                                    fetchURLS('https://www.amazon.com/s?k='+encodeURIComponent(search[find]),function (response){

                                        var tempDom = $('<div>').append(response);
                                        tempDom.find('div.AdHolder').remove();
                                        tempDom.find('div.s-widget').remove();
                                        tempDom.find('#rhf').remove();
                                        var scriptItem = tempDom.find('.s-asin');

                                        if(!!scriptItem) {

                                            amzResult.result[0][find] = $(scriptItem).map(function () {
                                                // if($(this).find("span[aria-label*='Get it as soon']").length < 1){
                                                //
                                                // }
                                                return   {
                                                    asin : $(this).data('asin'),
                                                    name : $(this).find("a.a-link-normal.a-text-normal").children('span.a-text-normal').text(),
                                                    price : $(this).find(".a-price").find('.a-price-whole').text() + $(this).find(".a-price").find('.a-price-fraction').text() || 0,
                                                    isPrime : !!$(this).find(".a-icon-prime").attr('aria-label') ? 1 : 0,
                                                    primeLimit : $(this).find("span[aria-label*='Get it as soon']").length > 0 ? $(this).find("span[aria-label*='Get it as soon']")[0].innerHTML : "",
                                                    amzImage  : $(this).find(".s-image").attr("src"),
                                                    searchBy : find
                                                };
                                            }).get();
                                            if(find === 'name'){
                                                // listings.result = [];
                                                listings.override = 0;
                                                UPCToASIN.push(amzResult);

                                                count++;
                                                width = (count / listingCount) * 100;
                                                cb.e.ProgressBar.width(width + "%").text(width.toFixed(0) + "%")

                                                if(width >= 100){
                                                    console.log(UPCToASIN);
                                                    updateListings({
                                                        groupID : cb.groupListings.id,
                                                        listings : UPCToASIN,
                                                        isWalmartScan : cb.groupListings.isWalmartScan,
                                                        isAmazonScan : 1
                                                    },function (res){
                                                        if(res.isModal){
                                                            cb.dialog.modal('hide');
                                                        }
                                                    });
                                                    cb.e.ProgressBar.parent().hide();
                                                }

                                            }
                                        }


                                    });
                                    // console.log(result);



                                }


                            }

                        });

                    })
                })
            )
        },
        amazons = function (){
            $navButtonContainerAMZ.prepend(
                $("<a/>",{
                    'data-toggle': 'modal',
                    'data-target':"#mdlModal",
                    style: 'text-decoration: none;color: white;',
                    html : $btnScanAMZ.off("click").on("click",function (e){
                            e.preventDefault();

                        // $.get(browser.getURL("src/template/amazon/table.html"),function (table){
                        //     dialog.find("div.modal-dialog").css({"max-width": "90%","max-height": "80%", "margin": "5 auto"})
                        //         .find('.bootbox-body').html(table);
                        // });


                        let template = $('<div/>').load(browser.getURL("src/template/modal.html"));
                        let tableTemplate = $('<div/>').load(browser.getURL("src/template/amazon/table.html"));
                        openModal({title:"Find Source",message:template[0]},function (cb){
                            let
                                listingCount = cb.listings.length,
                                UPCToASIN = [],
                                count = 0,
                                width = 0,
                                result = [];

                            cb.dialog.modal('hide');
                            var dialog = bootbox.dialog({
                                title: "Listings",
                                message: '<p class="text-center mb-0"><i class="fa fa-spin fa-cog"></i> Please wait while we do something...</p>',
                                backdrop: false,
                            })


                            $.get(browser.getURL("src/template/amazon/table.html"),function (table){
                                setTimeout(function (){
                                    dialog.find("div.modal-dialog").css({"max-width": "90%","max-height": "80%", "margin": "5 auto"})
                                        .find('.bootbox-body').html(table);


                                    $.get(browser.getURL("src/template/amazon/row.html"),function (template){
                                        let $tbody = dialog.find('tbody');
                                        for(let listing of cb.listings){
                                            var rendered = Mustache.render(template, listing);
                                            $tbody.append(rendered);
                                            // return false;
                                        }
                                    });

                                    dialog.find("a.dropdown-item").off("click").on("click",function (){
                                        let $el = $(this).find('input.chk'),
                                            $viewAll = $(this).find('input.viewAll');

                                        $viewAll.prop('checked', !$viewAll.prop('checked'));
                                        $el.prop('checked', !$el.prop('checked'));

                                        if($viewAll.prop('checked')){
                                            $('input.chk').prop('checked',false);
                                        }else{
                                            let isAllChecked = $('input.chk').map(function () { /* example: .class */
                                                return $(this).prop('checked');

                                            }).get();

                                            for(let checked of isAllChecked){
                                                if(checked){
                                                    $("input.viewAll").prop('checked', false);
                                                    return false;
                                                }else{
                                                    $("input.viewAll").prop('checked', true);
                                                }
                                            }
                                        }

                                        return false;

                                    });


                                },1000);
                            });






// dialog.find("div.modal-dialog").css({"max-width": "90%","max-height": "80%", "margin": "5 auto"})
                            //     .find('.bootbox-body').html(table);


                            // $.ajax({
                            //     url: url,
                            //     async:true,
                            //     success:function (table){
                            //         dialog.message = "table";
                            //         // dialog.find("div.modal-dialog").css({"max-width": "90%","max-height": "80%", "margin": "5 auto"})
                            //         //     .find('.bootbox-body').html(table);
                            //     }
                            // })










                            // cb.e.ProgressBar.parent().show();
                            for(let listings of cb.listings){




                                // if(listings.upc.length > 0 && listings.isVariant < 1){
                                //
                                //     fetchURLS('https://www.amazon.com/s?k='+listings.upc,function (response){
                                //
                                //         var tempDom = $('<output>').append(response);
                                //         tempDom.find('.AdHolder').remove();
                                //         tempDom.find('#rhf').remove();
                                //         var scriptItem = tempDom.find('.s-asin');
                                //
                                //         if(!!scriptItem) {
                                //
                                //             listings.result = $(scriptItem).map(function () { /* example: .class */
                                //                 return {
                                //                     asin : $(this).data('asin'),
                                //                     price : $(this).find(".a-price").find('.a-price-whole').text() + $(this).find(".a-price").find('.a-price-fraction').text() || 0,
                                //                     isPrime : !!$(this).find(".a-icon-prime").attr('aria-label') ? 1 : 0,
                                //                     amzImage  : $(this).find(".s-image").attr("src")
                                //
                                //                 };
                                //             }).get();
                                //
                                //             if(listings.result.length > 0){
                                //                 listings.amazonID = listings.result[0].asin;
                                //                 listings.amazonPrice = listings.result[0].price;
                                //                 listings.isPrime = listings.result[0].isPrime;
                                //                 listings.amzImage = listings.result[0].amzImage;
                                //             }
                                //
                                //             UPCToASIN.push(listings);
                                //         }
                                //
                                //         count++;
                                //         width = (count / listingCount) * 100;
                                //         cb.e.ProgressBar.width(width + "%").text(width.toFixed(0) + "%")
                                //
                                //         if(width >= 100){
                                //             console.log(UPCToASIN);
                                //             cb.e.ProgressBar.parent().hide();
                                //         }
                                //     });
                                // }else{
                                //     count++;
                                // }


                            }

                        });

                    })
                })
            )
        },
        amazon = function (){


            $.get(browser.getURL("src/template/amazon/modal.html"),function (template){
                $("body").prepend(template);

                let $amazonSelect = $("#FormControlSelect1");

                $amazonSelect.html("");
                sendMessage({fn:"getGroupListings",name:"GroupListings"},function (res){
                    $amazonSelect.append(
                        $("<option/>",{
                            value : 0,
                            text:"Please Select"
                        })
                    );
                    for(let val of res){
                        $amazonSelect.append(
                            $("<option/>",{
                                value : val.id,
                                text: moment(val.id).format('LLLL')
                            })
                        );
                    }

                });

                let $btnRun = $("#btnRun");

                $btnRun.off("click").on("click",function (){
                    try {
                        sendMessage({fn:"getListings",name:"listings"},function (cb){
                            let listings = $.grep(cb,function (value,index){
                                return value.listingGroupID == $amazonSelect.val();
                            });
                            listings.sort(function(a, b){return a.orderBy-b.orderBy});
                            let listingCount = listings.length,
                                counts = 0,
                                result = [],
                                timerId,
                                percent;

                            $.each(listings,function(index,value){

                                fetch('https://www.amazon.com/s?k='+value.upc).then(response => response.text())
                                    .then(text => {
                                        var tempDom = $('<output>').append(text);
                                        tempDom.find('.AdHolder').remove();
                                        tempDom.find('#rhf').remove();
                                        var scriptItem = tempDom.find('.s-asin')[0];

                                        if(!!scriptItem){

                                            let price = $(scriptItem).find(".a-price").find('.a-price-whole').text() + $(scriptItem).find(".a-price").find('.a-price-fraction').text(),
                                                iconPrime = !!$(scriptItem).find(".a-icon-prime").attr('aria-label') ? 1 : 0,
                                                orderSoon = !!$(scriptItem).find('.a-size-small.a-color-price').text() ? $(scriptItem).find('.a-size-small.a-color-price').text().match(/\d+/)[0] : 99;
                                            var data = jQuery(scriptItem).map(function() { /* example: .class */
                                                return {
                                                    asin : $(this).data('asin'),
                                                    amzIMG: $(this).find(".s-image").attr("src"),
                                                    amzDESC : $(this).find("span.a-text-normal").text(),
                                                }
                                            }).get();
                                            console.log(data);
                                            let arr = {
                                                id: value.id,
                                                walmartID : value.walmartID,
                                                amazonID : data[0].asin,
                                                amzIMG: data[0].amzIMG,
                                                amzDESC: data[0].amzDESC,
                                                upc : value.upc,
                                                amazonPrice : parseFloat(price) || 0,
                                                isPrime: iconPrime,
                                                isAmazonScan : 1,
                                                isOrderSoon : orderSoon
                                            }


                                            result.push(arr);

                                        }
                                        counts++;
                                        percent = (counts / listingCount) * 100;
                                        $("#walmartProgress").width(percent + "%").text(percent.toFixed(0) + "%");
                                        if(percent >= 100){

                                            console.log(result);

                                            sendMessage({fn:'updateGroupListings',name:'GroupListings',id:$amazonSelect.val(),value:{isAmazonScan:1}},function (){
                                                let arr = {
                                                    fn: "updateListing",
                                                    name : 'listings',
                                                    groupID : $amazonSelect.val(),
                                                    value : result
                                                };
                                                sendMessage(arr,function (cb){
                                                    $("#walmartProgress").width("0%").text("0%");
                                                    $("#FormControlSelect1").val(0);
                                                    $("#mdlModal").modal("hide");

                                                })
                                            })


                                        }


                                    });
                            })


                        })
                    } catch (e) {
                        console.log(e);
                    }
                });


            });

            $("#nav-tools").prepend(
                $("<a/>",{
                    'data-toggle': 'modal',
                    'data-target':"#mdlModal",
                    style: 'text-decoration: none;color: white;',
                    html :'<span style="display: inline-block;font-size: 25px;padding-top: 14px;" class="fa fa-optin-monster"></span><span class="nav-line-1"> Scan</span>'
                })
            )

        },
        fetchURLS = function (url,cb){
            try {
                fetch(url).then(response => response.text()
                ).then(function (result){
                    return cb($('<template>').append(result));
                });
            }catch (e) {

            }
        },
        updateListings = function ({groupID,listings,isWalmartScan = 0,isAmazonScan = 0},cb){
            sendMessage({fn:'updateGroupListings',name:'GroupListings',id:groupID,value:{isWalmartScan:isWalmartScan,isAmazonScan:isAmazonScan}},function (){
                let arr = {
                    fn: "updateListing",
                    name : 'listings',
                    groupID : groupID,
                    value : listings
                };
                console.log(arr);
                sendMessage(arr,function (response){

                    setTimeout(function (){
                        cb({isModal:true});
                        var success_dialog = bootbox.dialog({
                            title: 'Success',
                            size: 'small',
                            message: 'Go to Listing to see results'
                        });

                        success_dialog.init(function(){

                            success_dialog.css({
                                'background': 'unset',
                                '-webkit-box-shadow': 'unset',
                                'box-shadow': 'unset',
                                'overflow': 'unset',
                                'position' : 'fixed'
                            });

                            setTimeout(function(){
                                success_dialog.modal('hide');
                            }, 3000);
                        });

                    },1000);

                })
            })

        },
        watchChanges = function (watch){

            observer = new MutationObserver(function(mutationsList){

                $sourceURL = $('[name="sourceURL"]');
                $platformURL = $('[name="platformURL"]');
                try {

                    // $sourceURL.on("keyup change", function(e) {
                    //     watchInput();
                    // });
                    // $platformURL.on("keyup change", function(e) {
                    //     watchInput();
                    // });
                    watchInput();

                    $.each(mutationsList,function (index,value){

                        if($(value.target).attr('name') === 'initialPrice'){
                            $initialPrice = $(value.target);
                        }

                       if($(value.target).attr('name') === 'sku'){
                           $sku = $(value.target);
                       }

                       watchContent();

                    });

                    // console.log(mutationsList);

                }catch (e) {

                }
            });

            observer.observe(targetNode, observerOptions);

        },
        watchContent = function (){

            if(!!$sku && !!$initialPrice){
                // console.log($sku);
                // console.log($initialPrice);
                let temp = $sku.val().split('-');
                if(temp[1] === 'OAG'){




                    let ASIN = $sourceURL.val().split('/'),
                        $prices = $("p.MuiTypography-root.MuiTypography-body2").text().split(' ') || "",
                        $table = $("form.jss35 > div.MuiGrid-root.MuiGrid-container.MuiGrid-spacing-xs-3").children('div').eq(1),
                        walmartPrice_el,
                        amzPrice_el,
                        walmartPrice,
                        amzPrice,
                        index = ASIN.findIndex(element => element === 'dp');

                    $sku.val("AMZ"+ASIN[index+1]);

                    walmartPrice_el = $.number($prices[2].replace('Initial','').replace('$',''),2);
                    amzPrice_el = $.number($prices[13].replace('Shipping','').replace('$','') ,2) ;

                    $.get(browser.getURL("src/template/sageTable.html")).then(function (temp) {
                        var rendered = Mustache.render(temp, {walmartPrice:walmartPrice_el,amzPrice: amzPrice_el});
                        $table.append(rendered);
                    });

                    walmartPrice = parseFloat($.number((walmartPrice_el - 0.05),2));
                    amzPrice = parseFloat($.number((amzPrice_el * 1.25),2));

                    // amzPrice  > walmartPrice ? $('[name="initialPrice"]').val(amzPrice) : $('[name="initialPrice"]').val(walmartPrice);

                }
            }



        },
        watchInput = function (){

            if(!!$sourceURL.val().length < 1 && !!$platformURL.val().length < 1){
                // $sourceURL.val("https://www.amazon.com/dp/");
                // $platformURL.val("https://www.walmart.com/ip/");
                isDisconnect = true;
            }

        },
        sendMessage = function (arr, cb) {
            browser.sendMessage(arr, function (response) {
                try {
                    cb && cb(response);
                }catch (e) {
                    console.log(e);
                }
            });
        };

    init();

})(chrome.runtime);