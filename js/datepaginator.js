/* =========================================================
* bootstrap-datepaginator.js v1.1.0 
* modified 26.12.2013 compatibility with DatePicker locales
* =========================================================
* Copyright 2013 Jonathan Miles 
* Project URL : http://www.jondmiles.com/bootstrap-datepaginator
*        
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
* ========================================================= */

; (function ($, window, document, undefined) {

    /*global jQuery, moment*/

    'use strict';

    var pluginName = 'datepaginator';

    var DatePaginator = function (element, options) {
        this._element = element;
        this.$element = $(element);
        this._init(options);
    };

    DatePaginator.defaults = {
        fillWidth: true,
        highlightSelectedDate: true,
        highlightToday: true,
        hint: 'dd MM yyyy',
        injectStyle: true,
        itemWidth: 35,
        navItemWidth: 20,
        offDays: 'Sat,Sun',
        offDaysFormat: 'ddd',
        onSelectedDateChanged: null,
        selectedDate: moment().clone().startOf('day'),
        selectedDateFormat: 'yyyy-mm-dd',
        selectedItemWidth: 140,
        showCalendar: true,
        showOffDays: true,
        showStartOfWeek: true,
        size: undefined,
        startOfWeek: 'Mon',
        startOfWeekFormat: 'ddd',
        squareEdges: false,
        text: 'd<br/>D',
        textSelected: 'dd<br/>MM yyyy',
        useBootstrap2: false,
        width: 0,
        startDate: moment(new Date()),
        startDateFormat: 'yyyy-mm-dd',
        endDate: moment(new Date(8640000000000000)),
        endDateFormat: 'yyyy-mm-dd',
        language: defaults.language
    };

    DatePaginator.prototype = {

        setSelectedDate: function (date, format) {
            this._setSelectedDate(moment(date, format ? format : this.options.selectedDateFormat));
            this._render();
        },

        remove: function () {

            // Cleanup dom and remove events
            this._destroy();

            // Only remove data if user initiated
            $.removeData(this, 'plugin_' + pluginName);
        },

        _init: function (options) {
            
            this.options = $.extend({}, DatePaginator.defaults, options);            

            // If no width provided, default to fill full width
            // this.options.width = this.options.width ? this.options.width : this.$element.width();
            if (this.options.width) {
                this.options.fillWidth = false;
            }
            else {
                this.options.width = this.$element.width();
                this.options.fillWidth = true;
            }

            // Parse and set start and end dates
            if (typeof this.options.startDate === 'string') {
                this.options.startDate = moment(this.options.startDate, this.options.startDateFormat).clone().startOf('day');
            }
            if (typeof this.options.endDate === 'string') {
                this.options.endDate = moment(this.options.endDate, this.options.endDateFormat).clone().startOf('day');
            }

            // Parse, set and validate the initially selected date 
            // 1. overridding the default value of today
            if (typeof this.options.selectedDate === 'string') {
                this.options.selectedDate = moment(this.options.selectedDate, this.options.selectedDateFormat).clone().startOf('day');
            }
            // 2. enforce selectedDate with in startDate and endDate range
            if (this.options.selectedDate.isBefore(this.options.startDate)) {
                this.options.selectedDate = this.options.startDate.clone();
            }
            if (this.options.selectedDate.isAfter(this.options.endDate)) {
                this.options.selectedDate = this.options.endDate.clone();
            }

            // Parse and nomalize size options
            if (this.options.size === 'small') {
                this.options.size = 'sm';
            }
            else if (this.options.size === 'large') {
                this.options.size = 'lg';
            }

            this._destroy();
            this._subscribeEvents();
            this._render();
        },

        _unsubscribeEvents: function () {

            // $(window).off(); // TODO Turns off all resize events not just the one being destroyed
            this.$element.off('click');
            this.$element.off('selectedDateChanged');
        },

        _subscribeEvents: function () {

            this._unsubscribeEvents();

            this.$element.on('click', $.proxy(this._clickedHandler, this));

            if (typeof (this.options.onSelectedDateChanged) === 'function') {
                this.$element.on('selectedDateChanged', this.options.onSelectedDateChanged);
            }

            if (this.options.fillWidth) {
                $(window).on('resize', $.proxy(this._resize, this));
            }
        },

        _destroy: function () {

            if (this.initialized) {

                // Cleanup dom
                if (this.$calendar) {
                    this.$calendar.datepicker('remove');
                }
                this.$wrapper.remove();
                this.$wrapper = null;
                // this.$element.remove();

                // Switch off events
                this._unsubscribeEvents();
            }

            // Reset flag
            this.initialized = false;
        },

        _clickedHandler: function (event) {
            event.preventDefault();
            var target = $(event.target);
            var classList = target.attr('class');
            if (classList.indexOf('dp-nav-left') != -1) {
                this._back();
            }
            else if (classList.indexOf('dp-nav-right') != -1) {
                this._forward();
            }
            else if (classList.indexOf('dp-item') != -1) {
                this._select(target.attr('data-moment'));
            }
        },

        _setSelectedDate: function (selectedDate) {

            if ((!selectedDate.isSame(this.options.selectedDate)) &&
                                (!selectedDate.isBefore(this.options.startDate)) &&
                                (!selectedDate.isAfter(this.options.endDate))) {
                this.options.selectedDate = selectedDate.startOf('day');
                this.$element.trigger('selectedDateChanged', [selectedDate.clone()]);
            }
        },

        _back: function () {
            this._setSelectedDate(this.options.selectedDate.clone().subtract('day', 1));
            this._render();
        },

        _forward: function () {
            this._setSelectedDate(this.options.selectedDate.clone().add('day', 1));
            this._render();
        },

        _select: function (date) {
            this._setSelectedDate(moment(date, this.options.selectedDateFormat));
            this._render();
        },

        _calendarSelect: function (event) {
            this._setSelectedDate(moment(event.date));
            this._render();
        },

        _resize: function () {
            this.options.width = this.$element.width();
            this._render();
        },

        _render: function () {

            var self = this;

            if (!this.initialized) {

                // Setup first time only components, reused on later _renders
                this.$element
                                        .addClass(this.options.useBootstrap2 ? 'pagination' : '')
                                        .removeClass('datepaginator datepaginator-sm datepaginator-lg')
                                        .addClass(this.options.size === 'sm' ? 'datepaginator-sm' : this.options.size === 'lg' ? 'datepaginator-lg' : 'datepaginator');
                this.$wrapper = $(this._template.list);
                this.$leftNav = $(this._template.navItem)
                                        .addClass('dp-nav-left')
                                        .addClass(this.options.size === 'sm' ? 'dp-nav-sm' : this.options.size === 'lg' ? 'dp-nav-lg' : '')
                                        .css('background', '#ccc')
                                        .addClass(this.options.squareEdges ? 'dp-nav-square-edges' : '')
/*                                       .append($(this._template.icon)
                                                .addClass('glyphicon-chevron-left')
                                                .addClass('dp-nav-left')) */
                                         .append($('<img>').attr('src', baseimageurl + 'left.png').addClass("dp-nav-left"))
                                        .width(this.options.navItemWidth);
                this.$rightNav = $(this._template.navItem)
                                        .addClass('dp-nav-right')
                                        .addClass(this.options.size === 'sm' ? 'dp-nav-sm' : this.options.size === 'lg' ? 'dp-nav-lg' : '')
                                        .css('background', '#ccc')
                                        .addClass(this.options.squareEdges ? 'dp-nav-square-edges' : '')                                        
                                        /*.append($(this._template.icon)
                                                .addClass('glyphicon-chevron-right')
                                                .addClass('dp-nav-right')) */
                                         .append($('<img>').attr('src', baseimageurl + 'right.png').addClass("dp-nav-right"))
                                        .width(this.options.navItemWidth);
                this.$calendar = this.options.showCalendar ? $(this._template.calendar) : undefined;
                this._injectStyle();
                this.initialized = true;
            }
            else {

                // Remove datepicker from DOM
                if (this.$calendar) {
                    this.$calendar.datepicker('remove');
                }
            }

            // Get data then string together DOM elements
            var data = this._buildData();
            this.$element.empty().append(this.$wrapper.empty());

            // Left nav
            this.$leftNav
                                .removeClass('dp-no-select')
                                .attr('title', '');
            if (data.isSelectedStartDate) {
                this.$leftNav
                                        .addClass('dp-no-select')
                                        .attr('title', 'Start of valid date range');
            }
            this.$wrapper.append($(self._template.listItem).append(this.$leftNav));

            // Items
            $.each(data.items, function (id, item) {                
                var $a = $(self._template.dateItem)
                                        .attr('data-moment', item.m_)
                                        .attr('title', item.hint)
                                        .width(item.itemWidth);
              
//                if (item.isSelected && self.options.highlightSelectedDate && (!item.isStopSale && !item.allClosed)) {
//                    $a.addClass('dp-selected');
//                }
                if (item.isSelected && self.options.highlightSelectedDate) {
                    $a.addClass('dp-selected');
                }
                if (item.isToday && self.options.highlightToday && (!item.isStopSale && !item.allClosed)) {
                    $a.addClass('dp-today');
                }
                if (item.isStartOfWeek && self.options.showStartOfWeek) {
                    $a.addClass('dp-divider');
                }
                if (item.isOffDay && self.options.showOffDays) {
                    $a.addClass('dp-off');
                }
//                if (item.isStopSale) {
//                    $a.addClass('dp-stopsale');
//                }
//                if (item.allClosed) {
//                    $a.addClass('dp-stopsale');
//                }
                if( item.saleDisabled ) {
                    $a.addClass('dp-sale-disabled');
                }

                if (item.isSelected && self.options.showCalendar) {
                    $a.append(self.$calendar);
                }
                if (self.options.size === 'sm') {
                    $a.addClass('dp-item-sm');
                }
                else if (self.options.size === 'lg') {
                    $a.addClass('dp-item-lg');
                }
                if (!item.isValid) {
                    $a.addClass('dp-no-select');
                }                
                $a.append(item.text);

                self.$wrapper.append($(self._template.listItem).append($a));
            });

            // Right nav
            this.$rightNav
                                .removeClass('dp-no-select')
                                .attr('title', '');
            if (data.isSelectedEndDate) {
                this.$rightNav
                                        .addClass('dp-no-select')
                                        .attr('title', 'End of valid date range');
            }
            this.$wrapper.append($(self._template.listItem).append(this.$rightNav));

            // Add datepicker and setup event handling
            if (this.$calendar) {
                this.$calendar
                                        .datepicker({
                                            autoclose: true,
                                            forceParse: true,
                                            startView: 0, //2
                                            minView: 0, //2
                                            // todayBtn: true,
                                            todayHighlight: true,
                                            startDate: this.options.startDate.toDate(),
                                            endDate: this.options.endDate.toDate()
                                        })
                                .datepicker('update', this.options.selectedDate.toDate())
                                .on('changeDate', $.proxy(this._calendarSelect, this));
            }
        },

        _injectStyle: function () {
            // Make sure we only add it once
            if (this.options.injectStyle && !document.getElementById('bootstrap-datepaginator-style')) {
                $('<style type="text/css" id="bootstrap-datepaginator-style">' + this._css + '</style>').appendTo('head');
            }
        },

        _buildData: function () {           
            var viewWidth = (this.options.width - ((this.options.selectedItemWidth - this.options.itemWidth) + (this.options.navItemWidth * 2))),
                                units = Math.floor(viewWidth / this.options.itemWidth),
                                unitsPerSide = parseInt(units / 2),
                                adjustedItemWidth = Math.floor(viewWidth / units),
                                adjustedSelectedItemWidth = Math.floor(this.options.selectedItemWidth + (viewWidth - (units * adjustedItemWidth))),
                                today = moment().startOf('day'),
                                start = this.options.selectedDate.clone().subtract('days', unitsPerSide),
                                end = this.options.selectedDate.clone().add('days', (units - unitsPerSide));

            var data = {
                isSelectedStartDate: this.options.selectedDate.isSame(this.options.startDate) ? true : false,
                isSelectedEndDate: this.options.selectedDate.isSame(this.options.endDate) ? true : false,
                items: []
            };  

            for (var m = start; m.isBefore(end); m.add('days', 1)) {                            
                var valid = ((m.isSame(this.options.startDate) || m.isAfter(this.options.startDate)) &&
                                                        (m.isSame(this.options.endDate) || m.isBefore(this.options.endDate))) ? true : false;
                var saledisabled = false; //, isstopsale = false, allclosed = false;             
                for(var j=0;j<this.options.description.length;j++) {
                    var temp_ = this.options.description[j].date.split("T");
                    this.options.description[j].date =  temp_[0];                                        
                    if(this.options.description[j].date == m.clone().format(this.options.selectedDateFormat)) { 
                        saledisabled = this.options.description[j].isprice == false ||  this.options.description[j].isstopsale  || this.options.description[j].allclosed;                                           
                        // isstopsale = (this.options.description[j].isstopsale == false && this.options.description[j].isprice == true) ? false : true;
                        // allclosed = this.options.description[j].allclosed;
                    } 
                }                                          
                data.items[data.items.length] = {        
                    m_: m.clone().format(this.options.selectedDateFormat),            
                    isValid: valid,
                    isSelected: (m.isSame(this.options.selectedDate)) ? true : false,
                    isToday: (m.isSame(today)) ? true : false,
                    isOffDay: (this.options.offDays.split(',').indexOf(m.format(this.options.offDaysFormat)) !== -1) ? true : false,
                    isStartOfWeek: (this.options.startOfWeek.split(',').indexOf(m.format(this.options.startOfWeekFormat)) !== -1) ? true : false,
                    text: (m.isSame(this.options.selectedDate)) ? DPGlobal.formatDate(new Date(m), this.options.textSelected, this.options.language) : DPGlobal.formatDate(new Date(m),  this.options.text, this.options.language),
                    hint: valid ? DPGlobal.formatDate(new Date(m), this.options.hint, this.options.language) : 'Invalid date',
                    itemWidth: (m.isSame(this.options.selectedDate)) ? adjustedSelectedItemWidth : adjustedItemWidth,
                    saleDisabled: (saledisabled) ? saledisabled : false
                    // isStopSale: (isstopsale) ? isstopsale : false,
                    // allClosed: (allclosed) ? allclosed : false

                }                             
            }      
            return data;
        },   
        _template: { 
            list: '<ul class="pagination"></ul>', 
            listItem: "<li></li>", 
            navItem: '<a href="#" class="dp-nav"></a>', 
            dateItem: '<a href="#" class="dp-item"></a>', 
            icon: '<i class="glyphicon"></i>', 
            calendar: '<img id="dp-calendar" class="glyphicon" src="' + baseimageurl + 'calendar.png" />' 
        }      
        
    };

    var logError = function (message) {
        if (window.console) {
            window.console.error(message);
        }
    };

    // Prevent against multiple instantiations,
    // handle updates and method calls
    $.fn[pluginName] = function (options, args) {
        return this.each(function () {
            var self = $.data(this, 'plugin_' + pluginName);
            if (typeof options === 'string') {
                if (!self) {
                    logError('Not initialized, can not call method : ' + options);
                }
                else if (!$.isFunction(self[options]) || options.charAt(0) === '_') {
                    logError('No such method : ' + options);
                }
                else {
                    if (typeof args === 'string') {
                        args = [args];
                    }
                    self[options].apply(self, args);
                }
            }
            else {
                if (!self) {
                    $.data(this, 'plugin_' + pluginName, new DatePaginator(this, options));
                }
                else {
                    self._init(options);
                }
            }
        });
    };

})(jQuery, window, document);