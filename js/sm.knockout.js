///////////////////////////////////////////////////////////////////////////////
// Custom functions for knockout
//
///////////////////////////////////////////////////////////////////////////////

//
// configure defaults validation settings
//
//ko.validation.configure({
//    errorsAsTitle: false,
//    insertMessages: false,
//    decorateElement: true,
//    errorElementClass: 'validation-error',
//    grouping: {
//        deep: true
//    }
//});

var sm = sm || {};

sm.utils = sm.utils || {};

sm.utils.ieVersion = function () {
    var version = 3, div = document.createElement('div'), iElems = div.getElementsByTagName('i');

    // Keep constructing conditional HTML blocks until we hit one that resolves to an empty fragment
    while (
            div.innerHTML = '<!--[if gt IE ' + (++version) + ']><i></i><![endif]-->',
            iElems[0]
        );
    return version > 4 ? version : undefined;
} ();

//
// used to format date & time
//
sm.utils.pad2 = function pad2(val) {
    val = String(val);
    return (val.length < 2) ? ("0" + val) : val;
}
//
// used to search array item by 'id' property
//
sm.utils.arrayFirstById = function (array, id) {
    return (id ? ko.utils.arrayFirst(array, function (item) { return item.id == id; }) : null);
}
//
// creates object with id field
//
sm.utils.toIdField = function (val) {
    return (val && val !== '') ? { id: val } : null;
}

sm.utils.toNullable = function (val) {
    return (val && val !== '') ? val : null;
}

sm.utils.forceRefresh = function (node) {
    // Workaround for an IE9 rendering bug - https://github.com/SteveSanderson/knockout/issues/209
    if (sm.utils.ieVersion >= 9) {
        // For text nodes and comment nodes (most likely virtual elements), we will have to refresh the container
        var elem = node.nodeType == 1 ? node : node.parentNode;
        if (elem.style)
            elem.style.zoom = elem.style.zoom;
    }
};

sm.utils.setTextContent = function (element, textContent) {
    var value = ko.utils.unwrapObservable(textContent);
    if ((value === null) || (value === undefined))
        value = "";

    if (element.nodeType === 3) {
        element.data = value;
    } else {
        // We need there to be exactly one child: a text node.
        // If there are no children, more than one, or if it's not a text node,
        // we'll clear everything and create a single text node.
        var innerTextNode = ko.virtualElements.firstChild(element);
        if (!innerTextNode || innerTextNode.nodeType != 3 || ko.virtualElements.nextSibling(innerTextNode)) {
            ko.virtualElements.setDomNodeChildren(element, [document.createTextNode(value)]);
        } else {
            innerTextNode.data = value;
        }

        sm.utils.forceRefresh(element);
    }
};

sm.utils.parseDate = function (str) {
    var a = $.map(str.split(/[^0-9]/), function (s) { return parseInt(s, 10) });
    return new Date(a[0], a[1] - 1 || 0, a[2] || 1, a[3] || 0, a[4] || 0, a[5] || 0, a[6] || 0);
};

ko.extenders.numeric = function (target, precision) {
    var result = ko.computed({
        read: target,  //always return the original observables value
        write: function (newValue) {            
            if (newValue && typeof(newValue) == 'string') newValue = newValue.replace(',', '.');
            var current = target(),
                roundingMultiplier = Math.pow(10, precision),
                valueToWrite = '';
            if (!isNaN(newValue)) {
                valueToWrite = Math.round(parseFloat(+newValue) * roundingMultiplier) / roundingMultiplier;
            }
            //only write if it changed
            if (valueToWrite !== current) {
                target(valueToWrite);
            } else {
                //if the rounded value is the same, but a different value was written, force a notification for the current field
                if (newValue !== current) {
                    target.notifySubscribers(valueToWrite);
                }
            }
        }
    });
    result(target());
    return result;
};

//
// checked binding for foundation checkbox
//
ko.bindingHandlers['sm.checked'] = {
    'init': function (element, valueAccessor, allBindingsAccessor) {
        var updateHandler = function () {
            var valueToWrite;
            if (element.type == "checkbox") {
                valueToWrite = element.checked;
            } else if ((element.type == "radio") && (element.checked)) {
                valueToWrite = element.value;
            } else {
                return; // "checked" binding only responds to checkboxes and selected radio buttons
            }

            var modelValue = valueAccessor(), unwrappedValue = ko.utils.unwrapObservable(modelValue);
            if ((element.type == "checkbox") && (unwrappedValue instanceof Array)) {
                //                        // For checkboxes bound to an array, we add/remove the checkbox value to that array
                //                        // This works for both observable and non-observable arrays
                //                        var existingEntryIndex = ko.utils.arrayIndexOf(unwrappedValue, element.value);
                //                        if (element.checked && (existingEntryIndex < 0))
                //                            modelValue.push(element.value);
                //                        else if ((!element.checked) && (existingEntryIndex >= 0))
                //                            modelValue.splice(existingEntryIndex, 1);
            } else {
                modelValue(valueToWrite); 
            }
        };
        ko.utils.registerEventHandler(element, "change", updateHandler);

        //                // IE 6 won't allow radio buttons to be selected unless they have a name
        //                if ((element.type == "radio") && !element.name)
        //                    ko.bindingHandlers['uniqueName']['init'](element, function () { return true });
    },
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (element.type == "checkbox") {
            if (value instanceof Array) {
                // When bound to an array, the checkbox being checked represents its value being present in that array
                element.checked = ko.utils.arrayIndexOf(value, element.value) >= 0;
            } else {
                // When bound to anything other value (not an array), the checkbox being checked represents the value being trueish
                element.checked = value;
            }
        }
        else if (element.type == "radio") {
            element.checked = (element.value == value);
        }
        var span = $(element).next('span.custom.checkbox');
        $(span).toggleClass('checked', element.checked);
    }
};

//
// foreach binding for fade on add/remove items
//
ko.bindingHandlers['sm.foreach.fade'] = function () {
    var makeTemplateValueAccessor = function (valueAccessor) {
        return function () {
            return {
                'foreach': valueAccessor(),
                'afterAdd': function (element) {
                    if (element.nodeType === 1) {
                        $(element).hide().fadeIn();
                    }
                },
                'beforeRemove': function (element) {
                    if (element.nodeType === 1) {
                        $(element).fadeOut(function () { $(element).remove(); });
                    }
                },
                'templateEngine': ko.nativeTemplateEngine.instance
            };
        }
    };

    return {
        'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            return ko.bindingHandlers['template']['init'](element, makeTemplateValueAccessor(valueAccessor));
        },
        'update': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            return ko.bindingHandlers['template']['update'](element, makeTemplateValueAccessor(valueAccessor), allBindingsAccessor, viewModel, bindingContext);
        }
    };
} ();

//
// foreach binding for slide on add/remove items
//
ko.bindingHandlers['sm.foreach.slide'] = function () {
    var makeTemplateValueAccessor = function (valueAccessor) {
        return function () {
            return {
                'foreach': valueAccessor(),
                'afterAdd': function (element) {
                    if (element.nodeType === 1) {
                        $(element).hide().slideDown();
                    }
                },
                'beforeRemove': function (element) {
                    if (element.nodeType === 1) {
                        $(element).slideUp(function () { $(element).remove(); });
                    }
                },
                'templateEngine': ko.nativeTemplateEngine.instance
            };
        }
    };

    return {
        'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            return ko.bindingHandlers['template']['init'](element, makeTemplateValueAccessor(valueAccessor));
        },
        'update': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            return ko.bindingHandlers['template']['update'](element, makeTemplateValueAccessor(valueAccessor), allBindingsAccessor, viewModel, bindingContext);
        }
    };
} ();


ko.bindingHandlers['sm.with'] = {
    'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        return ko.bindingHandlers['with']['init'](element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
    },
    'update': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var result = ko.bindingHandlers['with']['update'](element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
        var withIfData = ko.utils.domData.get(element, '__ko_withIfBindingData')
        if (withIfData.didDisplayOnLastUpdate === false || withIfData.qb === false) {
            sm.utils.setTextContent(element, '\xA0');
        }
        return result;
    }
};

ko.bindingHandlers['sm.if'] = {
    'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        return ko.bindingHandlers['if']['init'](element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
    },
    'update': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var result = ko.bindingHandlers['if']['update'](element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
        var withIfData = ko.utils.domData.get(element, '__ko_withIfBindingData')
        if (withIfData.didDisplayOnLastUpdate === false || withIfData.qb === false) {
            sm.utils.setTextContent(element, '\xA0');
        }
        return result;
    }
};

ko.bindingHandlers['sm.ifnot'] = {
    'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        return ko.bindingHandlers['ifnot']['init'](element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
    },
    'update': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var result = ko.bindingHandlers['ifnot']['update'](element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
        var withIfData = ko.utils.domData.get(element, '__ko_withIfBindingData')
        if (withIfData.didDisplayOnLastUpdate === false || withIfData.qb === false) {
            sm.utils.setTextContent(element, '\xA0');
        }
        return result;
    }
};

ko.bindingHandlers['sm.text'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        sm.utils.setTextContent(element, value !== null && value !== undefined && value.toString().trim() !== '' ? value : '\xA0');
    }
};

ko.bindingHandlers['sm.text.money'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        sm.utils.setTextContent(element, value !== null && value !== undefined && value.toString().trim() !== '' ? value : '\xA0');
    }
};

ko.bindingHandlers['sm.text.date'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (value) {
            var date = sm.utils.parseDate(value);
            sm.utils.setTextContent(element, sm.utils.pad2(date.getDate()) + '.' + sm.utils.pad2(date.getMonth() + 1) + '.' + date.getFullYear());
        } else {
            sm.utils.setTextContent(element, '\xA0');
        }
    }
};

//
// text binding for time format 'hh:mm'
//
ko.bindingHandlers['sm.text.time'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (value) {
            var date = sm.utils.parseDate(value);
            sm.utils.setTextContent(element, sm.utils.pad2(date.getHours()) + ':' + sm.utils.pad2(date.getMinutes()));
        } else {
            sm.utils.setTextContent(element, '\xA0');
        }
    }
};

//
// text binding for time format 'dd.mm.yyyy hh:mm'
//
ko.bindingHandlers['sm.text.datetime'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (value) {
            var date = sm.utils.parseDate(value);
            sm.utils.setTextContent(element, sm.utils.pad2(date.getDate()) + '.' + sm.utils.pad2(date.getMonth() + 1) + '.' + date.getFullYear() + ' ' + sm.utils.pad2(date.getHours()) + ':' + sm.utils.pad2(date.getMinutes()));
        } else {
            sm.utils.setTextContent(element, '\xA0');
        }
    }
};
ko.bindingHandlers['sm.datepicker'] = {
    'init': function (element, valueAccessor, allBindingsAccessor) {
        $(element).datepicker({ weekStart: 1 });
        var widget = $(element).data("datepicker");
      
        if (widget) {
            var validationInput = widget.element.find('input');
            if (validationInput.length > 0) {
                ko.applyBindingsToNode(validationInput[0], { validationElement: valueAccessor() });
            }
        }
        ko.utils.registerEventHandler(element, "changeDate", function (event) {
            var value = valueAccessor();
            if (widget && ko.isObservable(value)) {
                var date = widget.date;
                value(date ? (date.getFullYear() + '-' + sm.utils.pad2(date.getMonth() + 1) + '-' + sm.utils.pad2(date.getDate()) + 'T00:00:00') : null);
            }
        });
    },
    'update': function (element, valueAccessor) {
        var widget = $(element).data("datepicker");
        if (widget) {
            var value = ko.utils.unwrapObservable(valueAccessor());
            widget.date = value ? sm.utils.parseDate(value) : null;
            widget.setValue();
        }
    }
}

ko.bindingHandlers['sm.datepickergroup'] = {
    'init': function (element, valueAccessor, allBindingsAccessor) {

        $(element).parent().datepicker({ weekStart: 1 });

        var widget = $(element).parent().data("datepicker");

        /* if (widget) {
        var validationInput = widget.element.find('input');
        if (validationInput.length > 0) {
        ko.applyBindingsToNode(validationInput[0], { validationElement: valueAccessor() });
        }
        }*/
        ko.utils.registerEventHandler($(element).parent(), "changeDate", function (event) {
            var value = valueAccessor();          
           
            if (widget && ko.isObservable(value)) {

                var date = widget.date;
               
                value(date ? (date.getFullYear() + '-' + sm.utils.pad2(date.getMonth() + 1) + '-' + sm.utils.pad2(date.getDate()) + 'T00:00:00') : null);
            }
        });
    },
    'update': function (element, valueAccessor) {
        var widget = $(element).parent().data("datepicker");
        if (widget) {
            var value = ko.utils.unwrapObservable(valueAccessor());
            widget.date = value ? sm.utils.parseDate(value) : null;
            widget.setValue();
        }
    }
}

//ko.bindingHandlers['sm.choosen'] = {
//    'init': function(element, valueAccessor, allBindingsAccessor, viewModel) {
//        var allBindings = allBindingsAccessor();         
//        var options = { default: 'Select one...'};      
//        $.extend(options, allBindings);             
//        $(element).attr('data-placeholder', options['sm.choosen'].default).addClass('chzn-select');                         
//        ko.utils.registerEventHandler(element, "change", function (event) {            
//            var value = valueAccessor();                    
//            if (ko.isObservable(value)) {            
//                value({"id":$(element).val(),"name":$(element).children(':selected').text()});
//            }
//        });
//    },
//    'update': function(element, valueAccessor, allBindingsAccessor, viewModel) {    
//        $('.chzn-select').chosen();
//    }
//};

//
// <select> binding with standard options
//
ko.bindingHandlers['sm.options'] = {
    'update': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        allBindingsAccessor().optionsValue = allBindingsAccessor().optionsValue || 'id';
        allBindingsAccessor().optionsText = allBindingsAccessor().optionsText || 'name';
        allBindingsAccessor().optionsCaption = allBindingsAccessor().optionsCaption || '&nbsp;';

        return ko.bindingHandlers['options']['update'](element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
    }
};

//
// 'choosen' component binding. used with 'sm.options'
//
ko.bindingHandlers['sm.choosen'] = {
    'init': function (element, valueAccessor, allBindingsAccessor) {
        $(element).chosen();
        return ko.bindingHandlers['value']['init'](element, valueAccessor, allBindingsAccessor);
    },
    'update': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var result = ko.bindingHandlers['value']['update'](element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
        setTimeout(function () { $(element).trigger("liszt:updated"); }, 0);
        return result;
    }
};


ko.bindingHandlers['sm.value'] = {
    'init': function (element, valueAccessor, allBindingsAccessor) {
        return ko.bindingHandlers['value']['init'](element, valueAccessor, allBindingsAccessor);
    },
    'update': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        return ko.bindingHandlers['value']['update'](element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
    }
};

//ko.bindingHandlers['sm.value.money'] = function () {
//    var mask = new Mask("#,###.00", "number"); 
//    return 
//    {
//        'init': function (element, valueAccessor, allBindingsAccessor) {
//            mask.attach(element);
//            return ko.bindingHandlers['value']['init'](element, valueAccessor, allBindingsAccessor);
//        },
//        'update': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
//            ko.bindingHandlers['value']['update'](element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
//            element.value = mask.format(element.value);
//        }
//    };
//}();

//ko.bindingHandlers['sm.value.money'] = function () {
//    var mask = new Mask("#.00", "number");
//    return {
//        'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
//            mask.attach(element);
//            return ko.bindingHandlers['value']['init'](element, valueAccessor, allBindingsAccessor);
//        },
//        'update': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
//            var result = ko.bindingHandlers['value']['update'](element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
//            if (element.value && element.value !== '')
//                element.value = mask.format(element.value);
//            return result;
//        }
//    };
//} ();

//ko.bindingHandlers['sm.value.number'] = function () {
//    var mask = new Mask("#", "number");
//    return {
//        'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
//            mask.attach(element);
//            return ko.bindingHandlers['value']['init'](element, valueAccessor, allBindingsAccessor);
//        },
//        'update': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
//            var result = ko.bindingHandlers['value']['update'](element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
//            if (element.value && element.value !== '')
//                element.value = mask.format(element.value);
//            return result;
//        }
//    };
//} ();

ko.bindingHandlers['sm.value.spinner'] = {
    'init': function (element, valueAccessor, allBindingsAccessor) {
        var options = allBindingsAccessor().spinnerOpions || {};
       
        var i = $(element).wrap('<div class="sm-spinner" style="overflow: hidden;"/>');
        $(i).wrap('<div style="overflow: hidden;"/>');
        
        $('<div style="float: right;" class="spinner-buttons btn-group btn-group-vertical" ><button type="button" class="btn spinner-up"><i class="icon-chevron-up"></i></button><button type="button" class="btn spinner-down"><i class="icon-chevron-down"></i></button></div>').insertBefore($(i).parent());
        var spinnerElement = $(element).parent().parent();
   
        
     /*   $(element).wrap('<div class="sm-spinner"/>');
        $('<div class="spinner-buttons btn-group btn-group-vertical"><button class="btn spinner-up"><i class="icon-chevron-up"></i></button><button class="btn spinner-down"><i class="icon-chevron-down"></i></button></div>').insertAfter(element);
        var spinnerElement = $(element).parent();
       */ 
        
        $(spinnerElement).spinner(options);
        ko.utils.registerEventHandler(spinnerElement, "change", function () {
            valueAccessor()($(spinnerElement).spinner("value"));
        });
        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            $(spinnerElement).spinner("destroy");
        });
    },
    'update': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        var spinnerElement = $(element).parent().parent();
        var current = $(spinnerElement).spinner("value");
        if (value !== current) {
            $(spinnerElement).spinner("value", value);
        }
    }
};

//ko.bindingHandlers['sm.mask'] = {
//    init: function (element, valueAccessor) {        
//        var options = valueAccessor();
//        var mask = "";
//        if (options === "dates")
//            mask = "99.99.9999";
//        else if (options === "times")
//            mask = "99:99";
//        else if (options === "phones")
//            mask = "(9999) 9999-9999";
//        $(element).mask(mask);
//    }
//};

//
// 
//
//jqAuto -- main binding (should contain additional options to pass to autocomplete)
//jqAutoSource -- the array to populate with choices (needs to be an observableArray)
//jqAutoQuery -- function to return choices
//jqAutoValue -- where to write the selected value
//jqAutoSourceLabel -- the property that should be displayed in the possible choices
//jqAutoSourceInputValue -- the property that should be displayed in the input box
//jqAutoSourceValue -- the property to use for the value

sm.utils.autocomplete = {
    escapeRegex: function (value) {
        return value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    },
    filter: function (array, term) {
        var matcher = new RegExp(sm.utils.autocomplete.escapeRegex(term), "i");
        return $.grep(array, function (value) {
            return matcher.test(value.label || value.value || value);
        });
    }
};

ko.bindingHandlers['sm.lookup'] = function () {
    var mapresponsearray = function (items, fieldvalue, fieldtext) {
        var mapped = ko.utils.arrayMap(items, function (item) {
            var result = {};
            result.label = result.value = item[fieldtext] != undefined ? item[fieldtext] : ('(\'' + fieldtext + '\' field undefined)');
            result.actualValue = item[fieldvalue]; // or item
            return result;
        });
        return mapped;
    };

    return {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var options = { autoFocus: true },
            url = ko.utils.unwrapObservable(allBindingsAccessor().url),
            lookupValue = ko.utils.unwrapObservable(allBindingsAccessor().sourceValue) || 'id',
            lookupText = ko.utils.unwrapObservable(allBindingsAccessor().sourceText) || 'text';

            //on a selection write the proper value to the model
            options.select = function (event, ui) {
                $(element).val(ui.item ? ui.item.value : "")
                writeValueToModel(ui.item ? ui.item.actualValue : "");
                return false;
            };

            //on a change, make sure that it is a valid value or clear out the model value
            options.change = function (event, ui) {
                var elementValue = $(element).val();
                if (ui.item && ui.item.actualValue !== undefined) {
                    writeValueToModel(ui.item.actualValue);
                } else {
                    var result = sm.utils.autocomplete.filter(element._sourceitems, elementValue);
                    if (result && result.length == 1) {
                        if (ko.utils.unwrapObservable(valueAccessor()) == result[0].actualValue)
                            $(element).val(result[0].value);
                        writeValueToModel(result[0].actualValue);
                    } else {
                        $(element).val('');
                        writeValueToModel('');
                    }
                }
            };

            function writeValueToModel(value) {
                var modelvalue = valueAccessor();
                if (ko.isWriteableObservable(modelvalue)) {
                    modelvalue(value);
                } else {  // write to non-observable
                    alert('write nonobservable');
                    //if (allBindings['_ko_property_writers'] && allBindings['_ko_property_writers']['jqAutoValue'])
                    //    allBindings['_ko_property_writers']['jqAutoValue'](valueToWrite);
                }
            };

            element._sourceitems = [];
            element._isallitems = false;

            options.source = function (request, response) {
                if (element._isallitems == false) {
                    if (url) {
                        site.service.ajax.get(url, $.extend({ text: request.term }, allBindingsAccessor()['sm.lookup.params'] || {}),
                            function (json) {
                                if (json) {
                                    element._sourceitems = mapresponsearray(json.items || [], lookupValue, lookupText);
                                    if (json.isall === true) {
                                        element._isallitems = true;
                                        response(sm.utils.autocomplete.filter(element._sourceitems, request.term));
                                    } else {
                                        element._isallitems = false;
                                        response(element._sourceitems);
                                    }
                                }
                                else {
                                    element._sourceitems = [];
                                    element._isallitems = false;
                                    response([]);
                                }
                            }
                        );
                    } else {
                        // no action specified
                        response([]);
                    }
                } else {
                    // we have list of all items. just filter it
                    response(sm.utils.autocomplete.filter(element._sourceitems, request.term));
                }
            };

            $(element).autocomplete(options);
            /// make sm.lookup validatable
            ko.bindingHandlers['validationCore'].init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var value = ko.utils.unwrapObservable(valueAccessor()),
                url = ko.utils.unwrapObservable(allBindingsAccessor().url),
                lookupValue = ko.utils.unwrapObservable(allBindingsAccessor().sourceValue) || 'id',
                lookupText = ko.utils.unwrapObservable(allBindingsAccessor().sourceText) || 'text';

            if (value === undefined || value == null || value === '') {
                $(element).val('');
            } else {
                var matchingItem = ko.utils.arrayFirst(element._sourceitems, function (item) {
                    return (item.actualValue === value);
                });
                if (matchingItem) {
                    $(element).val(matchingItem.value);
                } else if (element._isallitems == true) {
                    $(element).val('[' + value + '] NOT FOUND');
                } else {
                    site.service.ajax.get(url, $.extend({ id: value }, allBindingsAccessor()['sm.lookup.params'] || {}),
                        function (json) {
                            var resultItems = mapresponsearray((json ? json.items : null) || [], lookupValue, lookupText);

                            var result = ko.utils.arrayFirst(resultItems, function (item) {
                                return (item.actualValue === value);
                            });

                            if (result != null) {
                                $(element).val(result.value);
                            } else {
                                $(element).val('[' + value + '] NOT FOUND');
                            }

                            if (json.isall === true) {
                                element._isallitems = true;
                                element._sourceitems = resultItems;
                            }
                        });
                }
            }

        }
    };
} ();


//!!!!!!!!!!!!!!!
//ko.bindingHandlers['sm.select'] = function () {
//    var selectedValue, bindingsOptions, bindingsOptionsValue, bindingsOptionsName;

//    var selectedValueAccessor = function () {
//        return selectedValue;
//    };

//    return {
//        'init': function (element, valueAccessor, allBindingsAccessor) {
//            bindingsOptions = allBindingsAccessor().options;
//            bindingsOptionsValue = allBindingsAccessor().optionsValue || 'id';
//            bindingsOptionsName = allBindingsAccessor().optionsName || 'name';

//            $(element).chosen();

//            if (ko.isObservable(bindingsOptions)) {
//                bindingsOptions.subscribe(function (value) {
//                    setTimeout(function() { $(element).trigger("liszt:updated"); }, 0);
//                });
//            }

//            selectedValue = ko.computed({
//                read: function () {
//                    var bindValue = valueAccessor();
//                    if (ko.isObservable(bindValue)) {
//                        return bindValue() ? bindValue()[bindingsOptionsValue] : null;
//                    } else
//                        return bindValue ? bindValue[bindingsOptionsValue] : null;
//                },
//                write: function (value) {
//                    var bindValue = valueAccessor();
//                    if (ko.isWriteableObservable(bindValue)) {
//                        if (value && bindingsOptions && bindingsOptions()) {
//                            bindValue(ko.utils.arrayFirst(bindingsOptions(), function (item) { return item[bindingsOptionsValue] == value; }));
//                        } else {
//                            bindValue(null);
//                        }
//                    }
//                },
//                owner: this
//            }).extend({ required: true });

//            var result = ko.bindingHandlers['value']['init'](element, selectedValueAccessor, allBindingsAccessor);
//            setTimeout(function () { $(element).trigger("liszt:updated"); }, 0);
//            return result;
//        },
//        'update': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
//            var result = ko.bindingHandlers['value']['update'](element, selectedValueAccessor, allBindingsAccessor, viewModel, bindingContext);
//            setTimeout(function () { $(element).trigger("liszt:updated"); }, 0);
//            return result;
//        }
//    };
//} ();


