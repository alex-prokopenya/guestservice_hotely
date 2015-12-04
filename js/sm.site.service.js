var site = site || {};

site.service = site.service || {};
site.utils = site.utils || {};

(function (site) {
    "use strict";

    site.service.ajax = function () {
        var getAjaxJson = function (method, data, callback, failcallback) {
                $.ajax({
                    url: method,
                    data: $.param(ko.toJS(data), true ),
                    type: 'GET',
                    dataType: 'json',
                    contentType: 'application/json; charset=utf-8',
                    success: function (json) {
                        callback(json);
                    },
                    error: function (jqXHR, textStatus) {
                        if (failcallback === undefined || failcallback() !== true) {
                            // alert(jqXHR.status + ' ' + jqXHR.statusText + '\r\n' + jqXHR.responseText);
                        }
                    }
                });
            },
            postAjaxJson = function (method, data, successcallback, failcallback) {
                $.ajax({
                    url: method,
                    data: JSON.stringify(ko.toJS(data)),
                    //data: $.param(ko.toJS(data), true ),
                    type: 'POST',
                    dataType: 'json',
                    contentType: 'application/json; charset=utf-8',
                    success: function (json) {
                        successcallback(json);
                    },
                    error: function (jqXHR, textStatus) {
                        if (failcallback === undefined || failcallback() !== true) {
                            // alert(jqXHR.status + ' ' + jqXHR.statusText + '\r\n' + jqXHR.responseText);
                        }
                    }
                });
            }

        return {
            get: getAjaxJson,
            post: postAjaxJson
        };
    } ();



    //------------------------------------------------------------------------
    // itemsview
    //-------------------------------------------------------------------------
    site.service.itemsview = function (items) {
        var self = this;
        
        self.setItemsFlag = ko.observable(false);
        
        self.items = ko.observableArray([]);
        self.setItems = function(items) {
            self.setItemsFlag(true);
            self.items(items);
        };
        self.viewItems = ko.computed(function() { 
            // return all items now. add paging later
            return self.items(); 
        });        
        self.clear = function() {
            self.items([]);
        };
        self.isNotFound = ko.computed(function() {
            return (self.items() != null && self.items().length == 0 && self.setItemsFlag());            
        });
    
        if(items != undefined )
        {
            if( items != null && items.length > 0) {
                self.setItems(items); 
            } else {
                self.setItemsFlag(true);    
            }
        }
    };    

    //------------------------------------------------------------------------
    // date
    //-------------------------------------------------------------------------

    site.utils.date = function() {
        var
        pad2 = function(val) {
            val = String(val);
            return (val.length < 2) ? ("0" + val) : val;
        },
 
        parseIso = function (str) {
            if( str ) {
                var a = $.map(str.split(/[^0-9]/), function (s) { return parseInt(s, 10) });
                return new Date(a[0], a[1] - 1 || 0, a[2] || 1, a[3] || 0, a[4] || 0, a[5] || 0, a[6] || 0);
            }
            else
                return null;
        },

//        parseISO = function(d) {
//            var date_time = d.split('T');
//            var ymd = date_time[0].split('-');
//            var his = date_time[1].split(':');
//            return new Date(ymd[0], ymd[1], ymd[2], his[0], his[1], his[2]);
//        },
        

        formatDateTime = function(date) {
            return pad2(date.getHours()) + ':' + pad2(date.getMinutes()) + ' ' + pad2(date.getDate()) + '.' + pad2(date.getMonth() + 1) + '.' + date.getFullYear();
        },
        formatTimeDate = function(date) {
            return pad2(date.getDate()) + '.' + pad2(date.getMonth() + 1) + '.' + date.getFullYear() + ' ' + pad2(date.getHours()) + ':' + pad2(date.getMinutes());
        },        
        formatDateTimeIf = function(date, cdate) {
            if( date && cdate && date.getDate() == cdate.getDate() && date.getMonth() == cdate.getMonth() && date.getFullYear() == cdate.getFullYear() )
                return pad2(date.getHours()) + ':' + pad2(date.getMinutes());    
            else if(date)
                return formatDateTime(date);
            else 
                return '';
        },
        formatTimeDateIf = function(date, cdate) {
            if( date && cdate && date.getDate() == cdate.getDate() && date.getMonth() == cdate.getMonth() && date.getFullYear() == cdate.getFullYear() )
                return pad2(date.getHours()) + ':' + pad2(date.getMinutes());    
            else if( date )
                return formatTimeDate(date);
            else 
                return '';
        },
        formatIso = function(d) {
            return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + 'T' +  
                pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());  
        },

        formatIsoDate = function(d) {
            return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
        };

        return {
            parseIso: parseIso,
            formatIso: formatIso,
            formatIsoDate: formatIsoDate,
            formatDateTime: formatDateTime,
            formatDateTimeIf: formatDateTimeIf,
            formatTimeDate: formatTimeDate,
            formatTimeDateIf: formatTimeDateIf
        }
    }();
})(site);


