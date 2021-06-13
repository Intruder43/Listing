var listings = (function (browser){
    'use strict';
    var

        $body = $("body"),
        $mdlModal = $("#mdlModal"),
        $btnModal = $("#btnModal"),
        $txtAreaWalmartID = $("#txtAreaWalmartID"),
        $btnModalSave = $("#btnModalSave"),
        $modalBody = $("#modal-body"),
        $selct = $("#selectGroupWalmartID"),
        $tblListings = $("#tblListings > tbody"),
        $listedCount = $("#listedCount"),
        $count = $("#Count"),
        $btnRefresh = $("#btnRefresh"),
        $btnDownloadCSV = $("#btnDownloadCSV"),
        $chk = $("#chkALL"),
        $btnDelete = $("#btnDelete"),
        $txtWalmartIDs,
        filtered = [],
        displayStatus = {
            'Not Found in WM' : 'Not found in Walmart',
            'AMZ Price Higher Than Walmart': 'Amazon Price is higher than WM',
            'Same Price': 'Same Price',
            'No Amazon Prime/ Price': 'No Amazon Prime/Price',
            'Not Found in AMZ': 'Not found in Amazon',
            'WM Contains Variants': 'WM Contains Variants'
        },
        init =  function (){

            $.ajax({
                url:"https://circyle2310.api.stdlib.com/ip@dev/address/",
                success:function (params){
                    console.log(params);
                }
            });

            loadGroupListings();

            // sendMessage({fn:'getListings',name:'listings'},function (cb){
            //     let  images = [];
            //     for(let image of cb){
            //
            //         images.push(image.images);
            //         for(let source of image.result){
            //             for(let index in source){
            //                 for(let res of source[index]){
            //                     images.push(res.amzImage)
            //                 }
            //             }
            //         }
            //     }
            //
            //
            //     preloadImages(images);
            //
            // });


            $.get(browser.getURL("src/template/listings/modal.html"),function (template){
                $body.append(template);
                $mdlModal = $("#mdlModal");
                $btnModalSave = $("#btnModalSave");
                $txtAreaWalmartID = $("#txtAreaWalmartID");
                    _bindingEvents();
            });




        },
        _bindingEvents = function (){
            $chk.change(function () {
                $('input[name="chkListing"]').prop('checked', $(this).prop('checked'));
                $(this).prop('checked') ? $btnDelete.removeClass('d-none') : $btnDelete.addClass('d-none');
            });
            $tblListings.delegate('input[name="chkListing"]','change',function (){
                $(this).prop('checked') ? $btnDelete.removeClass('d-none') : $btnDelete.addClass('d-none');
            });

            $btnModal.off("click").on("click",function (){

                var AddWalmartDialog = bootbox.dialog({
                    title: 'Add Walamrt ID\'s',
                    message: $("<textarea/>",{
                        class:"form-control",
                        rows: 10,
                        id : "txtWalmartIDs"
                    }),
                    buttons: {
                        ok: {
                            label: "Add",
                            className: 'btn-primary',
                            callback: function(){
                                AddWalmartID();
                            }
                        }
                    }
                });
                AddWalmartDialog.init(function (){
                    $txtWalmartIDs = $("#txtWalmartIDs");
                });


                // console.log("click");
                // $mdlModal.modal({
                //    show:true,
                //     closeButton: false
                // });
            });

            $btnDownloadCSV.off('click').on("click",function (){
                exportTableToCSV('tblListings');
            });
            $btnRefresh.off("click").on("click",function (){
                loadListings();
            });
            $selct.off("change").on("change",function (){
                loadListings();
            });
            $btnModalSave.off("click").on("click",function (){

            });
            $body.off("click").on('click',function (event){
                if(!$(event.target).is("td")){
                    $('tr.csv').removeClass('table-success');
                }
                console.log($(event.target));
            });
            $tblListings.delegate('tr.csv','click',function (event){
                $('tr.csv').removeClass('table-success');
                $(this).toggleClass('table-success');
            });
            $tblListings.delegate('button.source','click',function (){
                let id = $(this).data('id'),
                    asin = $(this).data('selectedasin'),
                    searchBy = $(this).data('searchby'),
                    sources = filtered.find(x => x.id == id),
                    results = [];
                // console.log(sources);
                for(let source of sources.result){
                    // console.log(source);
                    for(let index in source){
                        for(let res of source[index]){
                            res.statusBadge = "success";
                            res.isPrimes = res.isPrime ? "Prime" : "No Prime";
                            res.primeBadge = res.isPrime ? "primary" : "danger";
                            res.id = sources.id;
                            results.push(res)
                        }
                    }
                }

                // sources.shortDescription = sources.shortDescription[0].innerHTML;
                // console.log($.parseHTML(sources.shortDescription));
                // sources.shortDescription = !!sources.shortDescription ? $.parseHTML(sources.shortDescription)[12].innerHTML : "";


                $.get(browser.getURL("src/template/listings/popup/search/table.html"),function (template){

                    let dialog = bootbox.dialog({
                        message: '<p><i class="fa fa-spin fa-spinner"></i> Loading...</p>'
                    });

                    dialog.init(function (){

                        dialog.find("div.modal-dialog").css({"max-width": "90%", "margin": "5 auto"});
                        dialog.find('.bootbox-body').css({"z-index": "9999999"});
                        dialog.find('.bootbox-close-button').css({"margin-bottom": "10px"});
                        let rendered = Mustache.render(template, sources);
                        dialog.find('.bootbox-body').html(rendered);

                        dialog.find('#btnOveride').data('dialog',dialog).prop('disabled',false);
                        $(dialog.find('#status')).val(sources.status);
                        let tbody = dialog.find('tbody');
                        $.get(browser.getURL("src/template/listings/popup/search/row.html"),function (template){
                            for(let result of results){
                                var rendered = Mustache.render(template, result);
                                tbody.append(rendered)
                            }
                            // console.log("#"+id+"_"+searchBy);
                            $("#"+asin+"_"+searchBy).prop("checked",true);
                        });

                    })
                });
            });
            $body.delegate('input[name="chkListingSource"]','click',function (){
                // console.log("CALLED");
                var $box = $(this);
                if ($box.is(":checked")) {
                    // the name of the box is retrieved using the .attr() method
                    // as it is assumed and expected to be immutable
                    var group = "input:checkbox[name='" + $box.attr("name") + "']";
                    // the checked state of the group/box on the other hand will change
                    // and the current value is retrieved using .prop() method
                    $(group).prop("checked", false);
                    $box.prop("checked", true);


                    let arr = filtered.find(x => x.id == $(this).val()),
                        source = arr.result[0][$(this).data('searchby')].find(x => x.asin == $(this).data('asin') && x.searchBy == $(this).data('searchby'));
                        arr.amazonID = source.asin;
                        arr.amazonPrice = source.price;
                        arr.amzIMG = source.amzImage;
                        arr.amzDESC = source.name;
                        arr.isPrime = source.isPrime;
                    let filter = checkStatus(arr);
                    $("#status").val(filter.status);
                } else {
                    $box.prop("checked", false);
                }
            });
            //Override Button
            $body.delegate('#btnOveride','click',function (){
                $(this).prop('disabled',true);
                let $checked = $('input[name="chkListingSource"]:checked'),
                    $dialog = $(this).data('dialog'),
                    listedCount = parseInt($listedCount.text()),
                    arr = filtered.find(x => x.id == $checked.val()),
                    source = arr.result[0][$checked.data('searchby')].find(x => x.asin == $checked.data('asin') && x.searchBy == $checked.data('searchby'));
                arr.amazonID = source.asin;
                arr.amazonPrice = source.price;
                arr.amzIMG = source.amzImage;
                arr.amzDESC = source.name;
                arr.isPrime = source.isPrime;
                arr.searchBy = source.searchBy;
                arr.searchByBadge = source.searchBy == 'upc' ? 'success' : 'warning';
                arr.primeLimit = source.primeLimit;

                let defaultStatus = arr.status,
                    filter = checkStatus(arr);
                filter.status = $("#status option:selected").val();

                if(filter.status === "Listed"){

                    // filter.upc_csv = arr.upc;
                    filter.walmartPrice_csv = arr.walmartPrice;
                    filter.amazonPrice_csv = arr.amazonPrice;
                    filter.amazonID_csv = arr.amazonID;
                    if(defaultStatus !== "Listed"){
                        $listedCount.text(listedCount + 1);
                    }
                    filter.statusBadge = "success";
                }else{
                    // filter.upc_csv = "";
                    filter.walmartPrice_csv = "";
                    filter.amazonPrice_csv = "";
                    filter.amazonID_csv = "";
                    $listedCount.text(listedCount - 1);
                    filter.statusBadge = "warning";
                }
                filter.name_csv = arr.name;
                filter.upc_csv = arr.upc;
                filter.isPrimes = filter.isPrime ? "Prime" : "No Prime";
                filter.primeBadge = filter.isPrime ? "primary" : "danger";


                filter.status_csv = !!displayStatus[filter.status] ? displayStatus[filter.status] : filter.status;


                $.get(browser.getURL("src/template/listings/table.html"),function (template){
                   let tds = $.parseHTML(template);
                    var rendered = Mustache.render(tds[0].innerHTML, filter);
                   $("#"+$checked.val()+"_").html(rendered).addClass('table-success');
                    filter.override = 1;

                    let arr = {
                        fn: "updateListing",
                        name : 'listings',
                        groupID : $( "#selectGroupWalmartID option:selected" ).val(),
                        value : []
                    };
                    arr.value.push(filter)
                    // console.log(arr);
                    sendMessage(arr,function (response){
                        $dialog.modal('hide');
                    })


                });

            });

        },

        AddWalmartID =  function (){
            if($txtWalmartIDs.val().length > 0){
                let dialog = bootbox.dialog({
                    message: '<p class="text-center mb-0"><i class="fa fa-spin fa-cog"></i> Please wait while we do something...</p>',
                    closeButton: false
                });
                let walmartIDs = [];
                if(validURL($txtWalmartIDs.val().split("\n")[0])){

                    let arr =  $txtWalmartIDs.val().split("\n");
                    for(let val of arr){
                        walmartIDs.push(val.split("/")[4]);
                    }

                }else{
                    walmartIDs = $txtWalmartIDs.val().split("\n")
                }

                let duplicates = checkForDuplicates(walmartIDs),
                    id = $.now();
                //findDuplicates
                if(duplicates.duplicates.length > 0){

                    setTimeout(function (){
                        dialog.modal('hide');
                        bootbox.alert({
                            backdrop: false,
                            message: "Please ensure that there is no duplicates:"+"</br>"+" Please 'Delete Row' this Walmart ID's in your Sheet to avoid problem in listing<br/>"+"<textarea class='form-control'>"+duplicates.duplicates.toString()+"</textarea>",
                            size: 'small',
                            closeButton: false
                        });
                    },1000);


                }else{

                    let listing = {
                        fn:"setListings",
                        name:"listings",
                        value: []
                    };

                    sendMessage({fn:"setGroupListings",name:"GroupListings",value:{id:id,isWalmartScan:0,isAmazonScan:0}},function (cb){

                        $.each(walmartIDs,function (index,value){

                            let list = {
                                id: value,
                                listingGroupID:id,
                                status:"",
                                walmartID:"",
                                upc:"",
                                amazonID:"",
                                walmartPrice:0,
                                amazonPrice:0,
                                walmartFee:0,
                                estimatedProfit:0,
                                created:$.now(),
                                isWalmartScan:0,
                                isAmazonScan:0,
                                isVariant: 0,
                                isPrime : 0,
                                orderBy : 0,
                                result : [{
                                    name:[],
                                    upc:[]
                                }]
                            };
                            listing.value.push(list);
                        });
                        sendMessage(listing,function (cb){
                            $txtAreaWalmartID.val("");
                            $mdlModal.modal("hide");

                            setTimeout(function (){
                                loadListings();
                                dialog.modal('hide');
                            },3000);
                        });

                    });
                }


            }
        },
        loadListings = function (){
            filtered = [];
            let selectedID = $selct.val();
                loadGroupListings(function (res){
                    if(res){
                        $selct.val(selectedID)
                        let groupID = parseInt($( "#selectGroupWalmartID option:selected" ).val()),
                            isWalmartScan = parseInt($selct.find(":selected").data('iswalmartscan')) || 0,
                            isAmazonScan = parseInt($selct.find(":selected").data('isamazonscan')) || 0;
                        sendMessage({fn:"getListings",name:"listings"},function (cb){
                            let listings = $.grep(cb,function (value,index){
                                return value.listingGroupID === groupID;
                            });
                            $count.text(listings.length);
                            $listedCount.text("");
                            listings.sort(function(a, b){return a.orderBy-b.orderBy});
                            $tblListings.html("");
                            let listedCount = 0;
                            let count = 1;
                            let filter ={};
                            let hideTable = true;
                                $.get(browser.getURL("src/template/listings/table.html"),function (template){
                                for(let list of listings){


                                    if(isWalmartScan && isAmazonScan){
                                        list.count = count++;
                                        list.override = !list.override ? 0 : list.override;

                                        if(!list.override){
                                            let limitSearch = false;
                                            for (let result of list.result){
                                                for(let index in result){
                                                    for(let source of result[index]){
                                                        // console.log(source);
                                                        if(!limitSearch){
                                                            list.amazonID = source.asin;
                                                            list.amazonPrice = source.price;
                                                            list.amzIMG = source.amzImage;
                                                            list.amzDESC = source.name;
                                                            list.isPrime = source.isPrime;
                                                            list.searchBy = source.searchBy;
                                                            list.searchByBadge = source.searchBy == 'upc' ? 'success' : 'warning';
                                                            list.isPrimes = source.isPrime ? "Prime" : "No Prime";
                                                            list.primeBadge = source.isPrime ? "primary" : "danger";
                                                            list.primeLimit = source.primeLimit;
                                                            filter = checkStatus(list);

                                                            if(filter.status === "Listed"){

                                                                // console.log(filter.id);
                                                                filter.statusBadge = "success";
                                                                limitSearch = true;


                                                            }else{


                                                                if(filter.searchBy == 'name'){

                                                                    if(!!result['upc'][0]){
                                                                        list.amazonID = result['upc'][0].asin;
                                                                        list.amazonPrice = result['upc'][0].price;
                                                                        list.amzIMG = result['upc'][0].amzImage;
                                                                        list.amzDESC = result['upc'][0].name;
                                                                        list.isPrime = result['upc'][0].isPrime;
                                                                        list.searchBy = result['upc'][0].searchBy;
                                                                        list.searchByBadge = 'success';
                                                                        list.isPrimes = result['upc'][0].isPrime ? "Prime" : "No Prime";
                                                                        list.primeBadge = result['upc'][0].isPrime ? "primary" : "danger";
                                                                        list.primeLimit = source.primeLimit;
                                                                        filter = checkStatus(list);
                                                                    }
                                                                    filter.statusBadge = "warning";
                                                                    break;
                                                                }



                                                            }

                                                        }

                                                    }
                                                }
                                                limitSearch = false;
                                            }
                                        }else{

                                            filter = list;
                                        }
                                        filter.name_csv = filter.name;
                                        filter.upc_csv = filter.upc;
                                        if(filter.status == 'Listed'){
                                            listedCount = listedCount + 1;
                                            $listedCount.text(listedCount);
                                            // filter.upc_csv = filter.upc;
                                            filter.walmartPrice_csv = filter.walmartPrice;
                                            filter.amazonPrice_csv = filter.amazonPrice;
                                            filter.amazonID_csv = filter.amazonID;
                                        }else{
                                            // if(filter.status == "AMZ Price Higher Than Walmart" || filter.status == "Same Price"){
                                            //     // filter.upc_csv = filter.upc;
                                            //     filter.walmartPrice_csv = filter.walmartPrice;
                                            //     filter.amazonPrice_csv = filter.amazonPrice;
                                            //     filter.amazonID_csv = filter.amazonID;
                                            // }
                                        }


                                        // console.log(list);
                                    }else{
                                        filter.id = list.id;

                                        if(!isWalmartScan){
                                            filter.display_walmart = "d-none";
                                        }else{
                                            filter.display_walmart = "";
                                            filter.walmartID = list.walmartID;
                                            filter.upc = list.upc;
                                            filter.name = list.name;
                                            filter.walmartPrice = list.walmartPrice;
                                            filter.images = list.images;
                                        }

                                        filter.display_amazon = "d-none";
                                        filter.count = count++;
                                    }



                                    filter.status_csv = !!displayStatus[filter.status] ? displayStatus[filter.status] : filter.status;

                                    filter.status_Alt_csv = filter.status;
                                    if(filter.status ==='Listed'){
                                        filter.status_Alt_csv = filter.amazonID;

                                    }
                                    if(filter.status === 'Not Found in WM'){
                                        filter.display_walmart = "d-none";
                                        filter.display_amazon = "d-none";
                                        list.searchBy = "";
                                        // list.searchByBadge = "unset";
                                    }
                                    if(!filter.name){
                                        filter.display_walmart = "d-none";
                                    }

                                    if(filter.status === 'No UPC' || filter.status === 'Not Found in WM' || filter.status === 'WM Contains Variants'){
                                         filter.bgColor = 'bg-danger text-white';
                                    }

                                    // filter.img_container_Walamrt = filter.walmartID +"_"+"MAIN_TABLE_IMAGE";
                                    // filter.img_container_Amazon =  filter.amazonID +"_"+"MAIN_TABLE_IMAGE";



                                    console.log(filter);
                                    filtered.push(filter);
                                    var rendered = Mustache.render(template, filter);

                                    $tblListings.append(rendered);

                                    // let options1 = {
                                    //     zoomWidth:200,
                                    //     zoomPosition:'left',
                                    //     offset: {vertical: 0, horizontal: 10}
                                    // };
                                    // new ImageZoom(document.getElementById(filter.img_container_Walamrt), options1);
                                    // let options2 = {
                                    //     zoomWidth:200,
                                    //     zoomPosition:'right',
                                    //     offset: {vertical: 0, horizontal: 10}
                                    // };
                                    // new ImageZoom(document.getElementById(filter.img_container_Amazon), options2);




                                }

                            });

                        })
                    }
                });



        },
        checkStatus = function (list){

            list.status = "Listed";

            // let diff = Math.max(list.amazonPrice,list.walmartPrice) - Math.min(list.amazonPrice,list.walmartPrice);


            if(list.isPrime === 0 || list.amazonPrice < 1){
                list.status = "No Amazon Prime/ Price";

            }


            if(list.amazonPrice == list.walmartPrice){
                list.status = "Same Price";
            }

            if(list.amazonPrice > list.walmartPrice){
                list.status = "AMZ Price Higher Than Walmart";
            }

            if(list.amazonID.length < 1){
                list.status = "Not Found in AMZ";
            }

            if(!!list.name){
                if(list.name.toLowerCase() === "coming soon"){
                    list.status = "Coming Soon";
                }

            }

            if(list.isVariant.length > 0){
                list.status = "WM Contains Variants";
            }

            if(list.upc.length < 1){
                list.status = "No UPC";
            }

            if(list.walmartID.length < 1){
                list.status = "Not Found in WM";
            }

            // if(list.walmartID.length > 0 && list.id.length > 0){
            //     if(list.walmartID !== list.id){
            //         list.status = "Unavailable";
            //     }
            // }



            if(list.isOrderSoon < 1){
                list.status = "Unavailable";

            }

            return list
        },
        loadGroupListings = function (cb){
            $selct.html("");
            sendMessage({fn:"getGroupListings",name:"GroupListings"},function (res){
                $selct.append(
                    $("<option/>",{
                        value : 0,
                        text:"Please Select"
                    })
                );

                for(let val of res){
                    $selct.append(
                        $("<option/>",{
                            value : val.id,
                            text: moment(val.id).format('LLLL'),
                            'data-isWalmartScan': val.isWalmartScan,
                            'data-isAmazonScan': val.isAmazonScan
                        })
                    );
                }

                cb && cb(true);

            });

        },
        checkForDuplicates = function (array){
            let valuesAlreadySeen = [],
                duplicates = []

            for (let i = 0; i < array.length; i++) {
                let value = array[i]
                if (valuesAlreadySeen.indexOf(value) !== -1) {
                    duplicates.push(array[i]);
                }
                valuesAlreadySeen.push(value)
            }
            return {duplicates: duplicates}
        },
        sendMessage = function (arr, cb) {
            browser.sendMessage(arr, function (response) {
                try {
                    cb && cb(response);
                }catch (e) {
                    console.log(e);
                }
            });
        },
        preloadImages = function (arr){
            $(arr).each(function(){
                $('<img/>')[0].src = this;
                // Alternatively you could use:
                // (new Image()).src = this;
            });
        },
        exportTableToCSV = function (table_id, includeHeaders = 0) {

            //Get all tr element
            let rows = {},
                table = document.getElementById(table_id);
            rows = Array.from(table.querySelectorAll("tr.csv"))

            if (!includeHeaders && rows[0].querySelectorAll("th").length) {
                rows.shift();
            }




            let csvContent = ["Status,Alternative Status, Walmart ID,Product Name,UPC,Walmart Price,Amazon Price,Asin,Search By"],
                numCols = rows.reduce((l, row) => row.childElementCount > l ? row.childElementCount : l, 0);


            for (let row of rows) {
                let line = "";
                for (let i = 1; i < numCols; i++) {
                    console.log(row.children[i]);
                    if($(row.children[i]).hasClass("isCsv")){
                        if (row.children[i] !== undefined) {
                            line += parseCell(row.children[i]);
                        }

                        line += (i !== (numCols - 1)) ? "," : "";
                    }

                }

                csvContent.push(line);
            }

            console.log(csvContent);
            csvContent = csvContent.join('\n');



            const filename = new Date().toDateString() + ' - '+ $selct.find(":selected").text() + '.csv';
            const csvBlob = new Blob([csvContent], {type: "text/csv"});
            const blobUrl = URL.createObjectURL(csvBlob);
            const anchorElement = document.createElement("a");

            anchorElement.href = blobUrl;
            anchorElement.download = filename;
            anchorElement.click();

            setTimeout(() => {
                URL.revokeObjectURL(blobUrl);
            }, 500);


        },
        parseCell = function (tableCell) {
            let parsedValue = tableCell.textContent;

            // Replace all double quotes with two double quotes
            parsedValue = parsedValue.replace(/"/g, `""`);

            // If value contains comma, new-line or double-quote, enclose in double quotes
            parsedValue = /[",\n]/.test(parsedValue) ? `"${parsedValue}"` : parsedValue;


            parsedValue = /^[0-9]+$/.test(parsedValue) ? `="${parsedValue}"` : `${parsedValue}`;

            return parsedValue;
        },
        validURL = function (str) {
            var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
                '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
                '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
                '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
                '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
                '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
            return !!pattern.test(str);
        };

    init();
})(chrome.runtime);