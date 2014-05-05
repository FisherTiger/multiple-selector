
/// this plugin replies on jQuery widget (1.6+)
/// and it should work together with jquery.multipleSelector.css
/// sample usage 1: $("#myMultipleSelector").multipleSelector({
///          dataSource: [{ ID: 58, Name: "English (United States)" }, { ID: 1033, Name: "Chinese (Simplified)" }, { ID: 2048, Name: "French (Frence)" }],
///          selectedItemValues: [58, 1033],
///          width: 300,
///          animate: 10,
///          closed: function () {
///              console.log("multiple selector colsed!");
///          },
///          selectionChanged: function () {
///              console.log("multiple selector selection changed!");
///          }
///      });
/// sample usage 2: $("#myMultipleSelector").multipleSelector("select", [58]); or $("#myMultipleSelector").multipleSelector("select", "all");
/// sample usage 3: $("#myMultipleSelector").multipleSelector("selectedItemValues"); or $("#myMultipleSelector").multipleSelector("selectedItemNames");
/// sample usage 4: $(selector).multipleSelector();
/// for more information, please refer to http://api.jqueryui.com/jquery.widget/ 
///     or http://learn.jquery.com/jquery-ui/widget-factory/how-to-use-the-widget-factory/ 

$.widget("selector.multipleSelector", {
    options: {
        dataSource: null, // should be an array which contains strings, numbers or objects(default format:{ID:"",Name:"})
        displayBinding: "Name", // specify name property that show on UI. Optional, default "Name"
        valueBinding: "ID", // specify value property that bind to checkbox. Optional, default "ID"
        selectedItemValues: new Array(),
        selectedItemNames: new Array(),
        title: null,    // "loading, please wait...",   // Optional
        isOpened: false,
        width: 180,  // "initial",
        animate: 0,    //fast",
        friendlyMessage: {
            EMPTYDATASOURCE: "NO item found",
            NOMATCHEDITEMS: "NO matched item found",
            ERROR: "Error, please try again"
        },
        searchable: false,
        // callbacks
        closed: null,
        selectionChanged: null,
    },
    _create: function () {
        var that = this;
        var $container = that.element;
        if ($container == null || $container.length == 0) return;
        $container.empty();
        $container.prop("data-role", "multiple-selector").attr("data-role", "multiple-selector");
        var $div1 = $("<div data-role='multiple-selector-header'></div>");
        $div1.width(that.options.width);
        var $input = $("<input type='search' data-role='multiple-selector-input' style='display:none'/>");
        $input.val(that.options.title);
        if (!that.options.searchable) $input.prop("readonly", "readonly").attr("readonly", "readonly");
        var $fakeSelect = $("<select data-role='multiple-selector-select'></select>");
        $fakeSelect.append($("<option></option>").text(that.options.title));
        $div1.append($input).append($fakeSelect).appendTo($container);
        //// append datalist for multiple-selector-input
        //var datalistID = "multiple-selector-datalist-" + Math.floor(Math.random() * 16384); // ($container.attr("id") || $container.attr("name") || $container.attr("class").split(' ')[0]);
        //var $dataList = $("<datalist id='" + datalistID + "'></datalist>");
        //for (var i = 0; i < that.options.dataSource.length; i++) {
        //    $dataList.append("<option value='" + that.options.dataSource[i][this.options.displayBinding] + "'><option>");
        //}
        //$dataList.appendTo($div1); $input.attr("list", datalistID);

        var $div2 = $("<div data-role='multiple-selector-items-container'></div>");
        $div2.css("minWidth", isNaN(that.options.width) ? $div1.width() : that.options.width);
        $container.append($div2);
        that._binding(that.options.dataSource);

        $fakeSelect.mousedown(function (event) {
            if (event) event.returnValue = false;
            if (event.preventDefault) event.preventDefault();
            that._open();
        });
        $input.focus(function () {
            this.select();
        }).blur(function () {
            setTimeout(function () {
                if (that.element.has(document.activeElement).length == 0) {
                    // document.activeElement is not part of current multiple selector widget
                    that._close();
                }
            }, 100);
        });
        $container.on("focusout", function () {
            setTimeout(function () {
                if (that.element.has(document.activeElement).length == 0) {
                    // colse when document.activeElement is not part of current multiple selector widget
                    // note: document.activeElement could only be textarea or select in Chrome!!!
                    that._close();
                }
            }, 100);
        }).on("click", "div[data-role='multiple-selector-items-container']", function (event) {
            //$input.focus();
            if (event.stopPropagation) event.stopPropagation();
            //if (event.preventDefault) event.preventDefault();
            //event.returnValue = false;
            //return false;
        }).on("keypress", "input", function () {
            if (that.options.searchable) {
                if (window.event.keyCode == 13) {
                    that.search(this.value);
                }
            }
        });//.on("input", function () {
        //    if (that.options.searchable) {
        //        that.search(this.querySelector("input").value); // this should be multiple-selector, not the input
        //    }
        //})
        if (that.options.isOpened) {
            that._open();
        }
    },
    _binding: function (newValue) {
        var that = this;
        var $itemsContainer = that.element.children("div[data-role='multiple-selector-items-container']");
        $itemsContainer.empty();
        if (newValue == null || !newValue instanceof Array || newValue.length == 0) {
            that._showContentMessage(that.options.friendlyMessage.EMPTYDATASOURCE);
            return;
        } else {
            var dataItems = newValue;
            var $allLbl = $("<label data-role='multiple-selector-item'></label>");
            var $allInput = $("<input type='checkbox' class='selectAll' value='all'/>");
            $allInput.change(function () { that._selectAllItems(); });
            $allLbl.append($allInput).append("<span>(Select All)</span>");
            $itemsContainer.append($allLbl);
            for (var i = 0; i < dataItems.length; i++) {
                var $lbl = $("<label data-role='multiple-selector-item'></label>");
                var $input = $("<input type='checkbox'/>");
                // set display name and value
                // only support strings, numbers or objects(default format: {ID:"",Name:"})
                $input.text(dataItems[i][that.options.displayBinding]).val(dataItems[i][that.options.valueBinding]);
                if (that.options.selectedItemValues.indexOf(dataItems[i][that.options.valueBinding]) != -1
                    || that.options.selectedItemValues.indexOf(String(dataItems[i][that.options.valueBinding])) != -1) {
                    // checked default if the item's value is listed in selectedItemValues
                    // for better experience, it is recommended that convert value to string before set default selectedItemValues
                    $input.prop("checked", true).attr("checked", "checked");
                }
                $input.change(function () { that._syncAllItemsStatus(); });
                $lbl.append($input).append("<span>" + dataItems[i][that.options.displayBinding] + "</span>")
                    .prop("title", dataItems[i][that.options.displayBinding]);
                $itemsContainer.append($lbl);
            }
            if ($itemsContainer.find("input:not(.selectAll):not(:checked)").length == 0) {
                $allInput.prop("checked", true).attr("checked", "checked");   // all items are selected
            }
        }
        //if (that.options.selectedItemValues.length > 0) {   // do we need?
        //    that.select(that.options.selectedItemValues);
        //}
        that.options.dataSource = newValue;
        that._updateSelectedItems();
        that.title();
    },
    _setOption: function (key, value) {
        if (key == "dataSource") {
            this._binding(value);
        } else if (key == "selectedItemValues") {
            this.select(value);
        } else if (key == "title") {
            this.title(value);
        } else if (key == "isOpened") {
            this._open();
        }
        this._super(key, value);
    },
    _setOptions: function (options) {
        this._super(options);
    },
    _open: function () {
        this.element.children("div[data-role='multiple-selector-header']").children("select").hide();
        this.element.children("div[data-role='multiple-selector-header']").children("input").show().focus();
        //// set items container position, like popup
        //var position = $(this.element).offset();//.getBoundingClientRect();
        //position.top += this.element.children("div[data-role='multiple-selector-header']").height();
        var $itemsContainer = $(this.element.children("div[data-role='multiple-selector-items-container']"));
        $itemsContainer.slideDown(this.options.animate);//.css(position);
        this.options.isOpened = true;
    },
    _close: function () {
        this.element.children("div[data-role='multiple-selector-header']").children("input").hide();
        this.element.children("div[data-role='multiple-selector-header']").children("select").show();
        this.element.children("div[data-role='multiple-selector-items-container']").slideUp(this.options.animate);
        this.options.isOpened = false;
        this._updateSelectedItems();
        this.title();
        this._trigger("closed", null, this.options.selectedItemValues);
    },
    _selectAllItems: function () {
        // this function is written with pure javascript (against _syncAllItemsStatus)
        var itemsContainer = this.element[0].querySelector("div[data-role='multiple-selector-items-container']");
        var inputs = itemsContainer.querySelectorAll("input:not(.selectAll)");  // since ":not(:hidden)" is not supported in CSS3, it's also not supported in querySelectorAll
        if (itemsContainer.querySelector(".selectAll").checked) {
            // select all 
            for (var i = 0; i < inputs.length; i++) {
                if (inputs[i].offsetWidth > 0 && inputs[i].offsetHeight > 0)    // !$(inputs[i]).is(":hidden")
                    inputs[i].checked = true;
            }
        } else {
            // unselect all 
            for (var j = 0; j < inputs.length; j++) {
                if (inputs[j].offsetWidth > 0 && inputs[j].offsetHeight > 0)    //if (!$(inputs[i]).is(":hidden"))
                    inputs[j].checked = false;
            }
        }
        //this._updateSelectedItems();
        this._trigger("selectionChanged", null, this.options.selectedItemValues);
    },
    _syncAllItemsStatus: function () {
        // this function is written with jQuery (against _selectAllItems)
        var $itemsContainer = this.element.children("div[data-role='multiple-selector-items-container']");
        var totalCount = $itemsContainer.find("label:not(:hidden)").length - 1;
        var selectedCount = $itemsContainer.find("input:not(.selectAll):not(:hidden):checked").length;
        if (selectedCount == totalCount) {
            // all items selected
            $itemsContainer.find("input.selectAll")[0].checked = true;
        } else if (selectedCount == 0) {
            // no items selected
            $itemsContainer.find("input.selectAll")[0].checked = false;
        } else {
            // partly selected
            $itemsContainer.find("input.selectAll")[0].checked = false;
        }
        //this._updateSelectedItems();
        this._trigger("selectionChanged", null, this.options.selectedItemValues);
    },
    _updateSelectedItems: function () {
        var $selectedItems = this.element.children("div[data-role='multiple-selector-items-container']").find("input:not(.selectAll):checked");
        $selectedItems = $.grep($selectedItems, function (e) {
            return $(e).attr("data-match") == null || $(e).attr("data-match");   // remove unmatch items
        });
        if ($selectedItems == null || $selectedItems.length == 0) {
            this.options.selectedItemNames.length = 0;
            this.options.selectedItemValues.length = 0;
        } else {
            var selectedNames = new Array(), selectedValues = new Array();
            $.each($selectedItems, function (k, v) {
                selectedValues.push(v.value);
                selectedNames.push($(v).next("span").text());
            });
            this.options.selectedItemNames = selectedNames;
            this.options.selectedItemValues = selectedValues;
        }
    },
    _destroy: function () {
        this.element.removeProp("data-role").removeAttr("data-role").removeData("role");
        this.element.removeData("selectorMultipleSelector");
        this.element.empty();
        return this._super();
    },
    title: function (newTitle) {
        var tmpTitle = newTitle;
        if (tmpTitle == null) {
            var allLen = this.options.dataSource == null ? 0 : this.options.dataSource.length;
            var len = this.options.selectedItemValues == null ? 0 : this.options.selectedItemValues.length;
            if (len == 1) {
                tmpTitle = this.options.selectedItemNames[0];   // only one item selected
            } else if (len == allLen) {
                tmpTitle = "(All " + len + " items" + " selected)";   // all selected
            } else {
                tmpTitle = "(" + len + " of " + allLen + " items selected)";
            }
        }
        this.options.title = tmpTitle;
        this.element.find("input[data-role='multiple-selector-input']")[0].value = tmpTitle;
        var $fakeSelect = $(this.element).find("select");
        $fakeSelect.children("option").text(tmpTitle);
        $fakeSelect.children("option").val(JSON.stringify(this.options.selectedItemValues));
    },
    _showContentMessage: function (newMsg) {
        newMsg = newMsg ? newMsg : this.options.friendlyMessage.EMPTYDATASOURCE;
        var $msgLbl = this.element.children("div[data-role='multiple-selector-items-container']").children("label[data-role='multiple-selector-message']");
        if (!$msgLbl.length) {
            $msgLbl = $("<label data-role='multiple-selector-message'>" + this.options.friendlyMessage.EMPTYDATASOURCE + "</label>");
            $msgLbl.appendTo(this.element.children("div[data-role='multiple-selector-items-container']"));
        }
        $msgLbl.html(newMsg).show();
        // others checkbox should be hidden if message labal are shown
        this.element.children("div[data-role='multiple-selector-items-container']").children("label").not($msgLbl).hide();
        // flag all items as unmatched
        this.element.children("div[data-role='multiple-selector-items-container']").find("input:not(.selectAll)").attr("data-match", false).prop("data-match", false);
    },
    _hideContentMessage: function () {
        if (this.options.dataSource.length) {
            this.element.children("div[data-role='multiple-selector-items-container']").children("label[data-role='multiple-selector-message']").hide();
            // select all checkbox should be visible if message labal are hidden
            this.element.children("div[data-role='multiple-selector-items-container']").find("input.selectAll").parents("label").show();
        } else {
            // the data source is null
            this._showContentMessage(this.options.friendlyMessage.EMPTYDATASOURCE);
        }
    },
    search: function (keyword) {
        var that = this;
        if (keyword) keyword = keyword.trim().toLowerCase();
        if (keyword.length) {
            this.element.children("div[data-role='multiple-selector-items-container']").find("input.selectAll")[0].checked = false;
            var allInputItems = this.element.children("div[data-role='multiple-selector-items-container']").find("input:not(.selectAll)");
            var matchedItemCount = 0;
            $.each(allInputItems, function (k, v) {
                v.checked = false;
                if ($(v).next("span").text().toLowerCase().indexOf(keyword) != -1) {
                    $(v).attr("data-match", true).prop("data-isMatch", true);
                    $(v).parents("label[data-role='multiple-selector-item']").show();
                    matchedItemCount++;
                } else {
                    $(v).attr("data-match", false).prop("data-isMatch", false);
                    $(v).parents("label[data-role='multiple-selector-item']").hide();
                }
            });
            if (matchedItemCount == 0) {
                // NO matched item found!
                this._showContentMessage(this.options.friendlyMessage.NOMATCHEDITEMS);
            } else {
                this._hideContentMessage();
                //this._syncAllItemsStatus();
            }
        } else {
            // clear search keyword, show all items
            var allInputItems = this.element.children("div[data-role='multiple-selector-items-container']").find("input:not(.selectAll)");
            if (allInputItems.length) {
                this._hideContentMessage();
                $.each(allInputItems, function (k, v) {
                    $(v).parents("label[data-role='multiple-selector-item']").show();
                });
                // remove all matched flag
                this.element.children("div[data-role='multiple-selector-items-container']").find("input:not(.selectAll)").removeAttr("data-match").removeProp("data-match");
                this._syncAllItemsStatus();
            } else {
                // no items
                this._showContentMessage(this.options.friendlyMessage.EMPTYDATASOURCE);
            }
        }
    },
    select: function (selectedItemValues) {
        // select items
        var $itemsContainer = this.element.children("div[data-role='multiple-selector-items-container']");
        if ($itemsContainer == null || $itemsContainer.length == 0)
            return false;
        if (typeof selectedItemValues == "string" && selectedItemValues.toLowerCase().trim() == "all") {
            $itemsContainer.find("input").prop("checked", true);       // value == "all", select all
        } else if (selectedItemValues == null || selectedItemValues == "" || selectedItemValues.length == 0) {
            $itemsContainer.find("input").removeProp("checked");    // value == null || value == "" || value=[], clear select
        } else if (typeof selectedItemValues == "string" && selectedItemValues.toLowerCase().trim() == "first") {
            $itemsContainer.find("input").removeProp("checked");    // value == "first", select the first item
            $itemsContainer.find("input:eq(1)").prop("checked", true);
        } else {
            $itemsContainer.find("input").removeProp("checked");
            for (var v in selectedItemValues) {
                var $input = $itemsContainer.find("input[value='" + selectedItemValues[v] + "']");
                if ($input != null)
                    $input.prop("checked", true);
            }
            // if all item are selected, check "Select All"
            if ($itemsContainer.find("input:not(.selectAll):not(:checked)").length == 0)
                $itemsContainer.find("input.selectAll").prop("checked", true);
        }
        //this._super("selectedItemValues", selectedItemValues);
        this._updateSelectedItems();
        this.title();
    },
    selectedItemValues: function (newValues) {
        if (newValues && newValues instanceof Array && newValues.length > 0) {
            // setter, only support array input
            this.select(newValues); //this.options.selectedItemValues = newValues;
        } else if (newValues == null) {
            // getter
            this._updateSelectedItems();    // bug fix: can't get the latest selection when user call this function without close it
            return this.options.selectedItemValues;
        } else {
            throw "invalid arguments.";
        }

    },
    selectedItemNames: function () {
        // getter
        return this.options.selectedItemNames;
    }
});
