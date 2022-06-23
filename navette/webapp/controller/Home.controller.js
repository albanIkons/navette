sap.ui.define([
    "../util/ms_BarcodeScanner",
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    'sap/ui/model/json/JSONModel',
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "../model/formatter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BarcodeScanner, Controller, MessageBox, JSONModel, Fragment, Filter, FilterOperator, formatter) {
        "use strict";
        var oMagazzinoArrivo;
        var oMagazzinoPartenza;
        var oMagazzinoData;

        return Controller.extend("npmnavette.navette.controller.Home", {
            formatter: formatter,
            onInit: function () {

                const oDevice = sap.ui.Device.system;

                this._viewKey = 'create';
                // Main Model to controll view (bussy status etc)
                const oMainModel = {
                    trasferBusy: false,
                    receiveBusy: false,
                    mobile: (oDevice.phone === true || oDevice.tablet === true ? true : false)
                };
                this._setModel(oMainModel, "mainModel");

                //Create the empty model 
                //Table binding
                var oItemData = [{
                    'index': 1,
                    'ARBPL': "",
                    'AUFNR': "",
                    'ICONA_COLLAUDO': "NI",
                    'ICONA_COLORE': "NI",
                    'LGORT': "",
                    'MAKTX': "",
                    'MATNR': "",
                    'MEINS': "",
                    'MENGE': "",
                    'MESSAGE': "",
                    'NAVNUM': "",
                    'STATO_COLLAUDO': "",
                    'STATO_COLORE': "",
                    'STATO': "",
                    'WIP_OUT': "",
                    'RUECK': "",
                    'RMZHL': ""
                }];
                this.Index = 1;
                this._setModel(oItemData, "items");//Function to update the model

                //Set the model for receive funcionality
                oItemData = [];
                this._setModel(oItemData, "items_ric");//Function to update the model

                //Initialize Loader Model
                const oModel = new JSONModel({
                    busy: false
                });
                this.getView().setModel(oModel, "viewModel");

            },

            //******************************************CREAZIONE NAVETTA**************************************************************************//
            onSavePopUp: function () {
                const oItems = this.getView().getModel("items").getData();//Get the values for our table model 
                const oItemsChecked = this.checkItems(oItems);
                const oNavnum = this.getView().byId("navetteIdCreate").getValue();

                // if(oItemsChecked.length > 0){//Controll if we have at least one wip out inserted
                this._getDialog().open();//Call the dialog to insert magazzino and date
                // } else {
                //     MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("noItems"));//error no wip outs inserted
                // }

                //Set the pop up values in case of update
                if (oNavnum) {
                    sap.ui.getCore().byId("partenza").setValue(oMagazzinoPartenza);
                    sap.ui.getCore().byId("arrivo__").setValue(oMagazzinoArrivo);
                    // sap.ui.getCore().byId("creazione").setValue(oMagazzinoData);
                } else {
                    //Clear pop up input fields
                    sap.ui.getCore().byId("partenza").setValue("");
                    sap.ui.getCore().byId("arrivo__").setValue("");
                    sap.ui.getCore().byId("creazione").setValue("");
                }
            },

            //Save or update the navetta
            onSaveNavetta: function () {
                const oItems = this.getView().getModel("items").getData();//Get the values for our table model 
                const oNavnum = this.getView().byId("navetteIdCreate").getValue();
                const that = this;
                const oModel = that.getView().getModel("items");
                const oViewModel = this.getView().getModel("viewModel");

                const requestBody = {//Create the structure fo deep entity
                    NAVNUM: (oNavnum == "") ? '&&' : oNavnum, //Header
                    NAVDAT: sap.ui.getCore().byId("creazione").getDateValue(), //Header
                    navettatowip: [] // Item
                };

                //Create the item section for the deep entity call
                for (var i = 0; i < oItems.length; i++) {
                    const oTempItems = {};
                    oTempItems.NAVNUM = (oNavnum == "") ? '&&' : oNavnum;
                    oTempItems.WIP_OUT = oItems[i].WIP_OUT;
                    oTempItems.AUFNR = oItems[i].AUFNR;
                    oTempItems.LGORT = this.checkFieldSplit(sap.ui.getCore().byId("partenza").getValue());
                    oTempItems.UMLGO = this.checkFieldSplit(sap.ui.getCore().byId("arrivo__").getValue());
                    oTempItems.MATNR = oItems[i].MATNR;
                    oTempItems.MAKTX = oItems[i].MAKTX;
                    oTempItems.ARBPL = oItems[i].ARBPL;
                    oTempItems.MENGE = oItems[i].MENGE;
                    oTempItems.MEINS = oItems[i].MEINS;
                    oTempItems.RUECK = oItems[i].RUECK;
                    oTempItems.RMZHL = oItems[i].RMZHL;
                    // oTempItems.ERDAT = new Date(sap.ui.getCore().byId("creazione").getValue());
                    oTempItems.ERDAT = sap.ui.getCore().byId("creazione").getDateValue();

                    requestBody.navettatowip.push(oTempItems);
                }

                //Call the deep entity
                oViewModel.setProperty('/busy', true);
                this.getOwnerComponent().getModel().create("/update_navettaSet", requestBody, {
                    success: function (oData) {
                        oViewModel.setProperty('/busy', false);
                        that.onCloseDialog();
                        oModel.setData(null);
                        if (oNavnum) {//Check if we are updating or creating and show error/success message
                            MessageBox.success("La navetta " + oData.navettatowip.results[0].NAVNUM + " e stata aggiornata");//Sucessful update
                        } else {
                            MessageBox.success("La navetta " + oNavnum + " e stata creata");//Sucessful update
                        }
                    },
                    error: function (err) {
                        oViewModel.setProperty('/busy', false);
                        that.onCloseDialog();
                        oModel.setData(null);
                        if (oNavnum) {
                            MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("updateError"));//error update
                        } else {
                            MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("createError"));//error creation
                        }
                    }
                });

                //Clear pop up input fields
                sap.ui.getCore().byId("partenza").setValue("");
                sap.ui.getCore().byId("arrivo__").setValue("");
                sap.ui.getCore().byId("creazione").setValue("");
            },

            //Dialog before save
            _getDialog: function () {
                if (!this._oDialog) {
                    this._oDialog = sap.ui.xmlfragment("npmnavette.navette.fragments.saveHelp", this.getView().getController());
                    this.getView().addDependent(this._oDialog);
                }
                return this._oDialog;
            },

            //Close save dialog
            onCloseDialog: function () {
                this._getDialog().close();
            },

            // Get text translations from i18n ----------------------------------------------------
            _geti18n: function (textName) {
                return this.getView().getModel("i18n").getResourceBundle().getText(textName);
            },

            //Function to create and update the model
            _setModel: function (items, modelName) {
                //Set the model for the added items
                var oitemModel = new JSONModel(items);//Create new model for the items	
                this.getView().setModel(oitemModel, modelName);
            },

            //Get the already saved navetta
            getNavettaList: function () {
                const that = this;
                const oNavetta = this.getView().byId("navetteIdCreate").getValue();
                const aFilter = new Filter('NAVNUM', FilterOperator.EQ, oNavetta);
                const oItems = this.getView().getModel("items").getData();//Get the values for our table model 
                const oViewModel = this.getView().getModel("viewModel");

                //Clear the wip out input
                this.getView().byId("recieveWipOutIdCr").setValue("");

                oViewModel.setProperty('/busy', true);
                this.getOwnerComponent().getModel().read("/dati_navettaSet", {
                    filters: [aFilter],
                    success: function (oData) {
                        //Clear the model and insert new wip-out
                        oViewModel.setProperty('/busy', false);
                        const oModel = that.getView().getModel("items");
                        oModel.setData(null);
                        that._setModel(oData.results, "items");//Function to update the model	

                        //Save the pop up values for update navetta
                        oMagazzinoArrivo = oData.results[0].LGORT;
                        oMagazzinoPartenza = oData.results[0].UMLGO;
                        // oMagazzinoData = oData.results[0].ERDAT;
                        // oMagazzinoData = sap.ui.core.format.DateFormat.getDateInstance({pattern : "YYYY/MM/DD" }).format(oData.results[0].ERDAT) + "" + new Date().getFullYear(); 

                        var oModelDate = new JSONModel();
                        oModelDate.setData({
                            dateValue: oData.results[0].ERDAT
                        });
                        that.getView().setModel(oModelDate);
                    },
                    error: function (err) {
                        oViewModel.setProperty('/busy', false);
                        MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("noNavetta"));
                    }
                });
            },

            //Magazzino Help
            onMagazzinoHelp: function (oEvent) {
                const that = this;
                const oView = this.getView();
                const sInputValue = oEvent.getSource().getValue();
                this.MagazzinoId = oEvent.mParameters.id.substring(oEvent.getSource().getId().length - 8);
                const oViewModel = this.getView().getModel("viewModel");

                oViewModel.setProperty('/busy', true);
                this.getOwnerComponent().getModel().read("/get_lgortSet", {
                    success: function (oData) {
                        oViewModel.setProperty('/busy', false);
                        that.getView().setModel(new JSONModel(oData.results), "magazzinoHelp");

                        if (!that._pValueHelpMagazzinoDialog) {
                            that._pValueHelpMagazzino = Fragment.load({
                                id: oView.getId(),
                                name: "npmnavette.navette.fragments.magazinoHelp",
                                controller: that
                            }).then(function (oDialog) {
                                oView.addDependent(oDialog);
                                return oDialog;
                            });
                        }
                        that._pValueHelpMagazzino.then(function (oDialog) {
                            // Create a filter for the binding
                            oDialog.getBinding("items").filter([
                                new Filter("LGORT", FilterOperator.Contains, sInputValue)
                            ]);
                            // Open ValueHelpDialog filtered by the input's value
                            oDialog.open(sInputValue);
                        });

                    },
                    error: function (err) {
                        console.log(err);
                        oViewModel.setProperty('/busy', false);
                    }
                });
            },

            onHelpSearchMagazzino: function (oEvent) {
                const sValue = oEvent.getParameter("value");
                const oFilter = new Filter("LGORT", FilterOperator.Contains, sValue);
                oEvent.getSource().getBinding("items").filter([oFilter]);
            },

            onHelpCloseMagazzino: function (oEvent) {
                const oSelectedItem = oEvent.getParameter("selectedItem");
                oEvent.getSource().getBinding("items").filter([]);

                if (!oSelectedItem) return;
                const oMagazzino = `${oSelectedItem.getTitle()} - ${oSelectedItem.getDescription()}`;
                // Set selected key values to input field------------------------------------------
                sap.ui.getCore().byId(this.MagazzinoId).setValue(oMagazzino);
            },
            //Magazzino Help

            //Wip Out Help
            onWipoutHelp: function (oEvent) {
                const that = this;
                const oView = this.getView();
                const sInputValue = oEvent.getSource().getValue();
                const oNavnum = this.getView().byId("recNavetteId").getValue();
                var oFilter = [];
                const oViewModel = this.getView().getModel("viewModel");
                this.WipID = oEvent.getSource().sId.substring((oEvent.getSource().sId.length - 17));

                if (this._viewKey === 'create') {
                    //We add this line of code in order to avoid the error when we 
                    //call the entity from the main wip out insteda of the items wip out
                    if (this.WipID != 'recieveWipOutIdCr') {
                        this.SelectedIndex = oEvent.getSource().getBindingContext("items").getObject().index;//Get the selected index 
                    }
                }
                if (oNavnum) {
                    oFilter = new Filter("NAVNUM", FilterOperator.EQ, oNavnum);
                }

                oViewModel.setProperty('/busy', true);
                this.getOwnerComponent().getModel().read("/get_wipSet", {
                    filters: [oFilter],
                    success: function (oData) {
                        oViewModel.setProperty('/busy', false);
                        that.getView().setModel(new JSONModel(oData.results), "wipoutHelp");

                        if (!that._pValueHelpWipOutDialog) {
                            that._pValueHelpWipOutDialog = Fragment.load({
                                id: oView.getId(),
                                name: "npmnavette.navette.fragments.wipoutHelp",
                                controller: that
                            }).then(function (oDialog) {
                                oView.addDependent(oDialog);
                                return oDialog;
                            });
                        }
                        that._pValueHelpWipOutDialog.then(function (oDialog) {
                            // Create a filter for the binding
                            oDialog.getBinding("items").filter([
                                new Filter("WIP_OUT", FilterOperator.Contains, sInputValue)
                            ]);
                            // Open ValueHelpDialog filtered by the input's value
                            oDialog.open(sInputValue);
                        });

                    },
                    error: function (err) {
                        oViewModel.setProperty('/busy', false);
                        console.log(err);
                    }
                });
            },

            onHelpSearchWipout: function (oEvent) {
                const sValue = oEvent.getParameter("value");
                const oFilter = new Filter("WIP_OUT", FilterOperator.Contains, sValue);
                oEvent.getSource().getBinding("items").filter([oFilter]);
            },

            onHelpCloseWipout: function (oEvent) {
                const oSelectedItem = oEvent.getParameter("selectedItem");
                oEvent.getSource().getBinding("items").filter([]);
                const oWipOut = oSelectedItem.getTitle();

                if (this._viewKey === 'create') { // Do this logic only in creation page
                    if (!oSelectedItem) return;

                    //Here we handle the call depending from which wip out input is called
                    if (this.WipID != 'recieveWipOutIdCr') {
                        //Call the wip out details
                        this.onInsertWip(oWipOut, '');
                    } else {
                        //Call the related wip out
                        this.onWipSubmitCr();
                    }
                } else { // For recieve page ----------------------------------------------
                    const oWipInput = this.byId("recieveWipOutId");
                    oWipInput.setValue(oWipOut);
                }
            },
            //Wip Out Help

            //Navette Help
            onNavetteHelp: function (oEvent) {
                const that = this;
                const oView = this.getView();
                const sInputValue = oEvent.getSource().getValue();
                const oFilter = [];
                const oFilterArray = this.checkboxFilter();
                const oViewModel = this.getView().getModel("viewModel");

                if (oFilterArray.NC) {
                    oFilter.push(new Filter("STATUS_NC", 'EQ', "X"));
                }
                if (oFilterArray.NT) {
                    oFilter.push(new Filter("STATUS_NT", 'EQ', "X"));
                }
                if (oFilterArray.WR) {
                    oFilter.push(new Filter("STATUS_WR", 'EQ', "X"));
                }
                if (oFilterArray.NG) {
                    oFilter.push(new Filter("STATUS_NG", 'EQ', "X"));
                }

                oViewModel.setProperty('/busy', true);
                this.getOwnerComponent().getModel().read("/get_navnumSet", {
                    filters: oFilter,
                    success: function (oData) {
                        oViewModel.setProperty('/busy', false);
                        that.getView().setModel(new JSONModel(oData.results), "navetteHelp");

                        if (!that._pValueHelpNavetteDialog) {
                            that._pValueHelpNavetteDialog = Fragment.load({
                                id: oView.getId(),
                                name: "npmnavette.navette.fragments.navetteHelp",
                                controller: that
                            }).then(function (oDialog) {
                                oView.addDependent(oDialog);
                                return oDialog;
                            });
                        }
                        that._pValueHelpNavetteDialog.then(function (oDialog) {
                            // Create a filter for the binding
                            oDialog.getBinding("items").filter([
                                new Filter("NAVNUM", FilterOperator.Contains, sInputValue)
                            ]);
                            // Open ValueHelpDialog filtered by the input's value
                            oDialog.open(sInputValue);
                        });

                    },
                    error: function (err) {
                        oViewModel.setProperty('/busy', false);
                        console.log(err);
                    }
                });
            },

            onHelpSearchNavette: function (oEvent) {
                const sValue = oEvent.getParameter("value");
                const oFilter = new Filter("NAVNUM", FilterOperator.Contains, sValue);
                oEvent.getSource().getBinding("items").filter([oFilter]);
            },

            onHelpCloseNavette: function (oEvent) {
                const oSelectedItem = oEvent.getParameter("selectedItem");
                oEvent.getSource().getBinding("items").filter([]);

                const oNaveteNumber = (typeof oSelectedItem === 'undefined' ? '' : oSelectedItem.getTitle());

                if (this._viewKey === 'create') {
                    const oNavetteInput = this.byId("navetteIdCreate");
                    oNavetteInput.setValue(oNaveteNumber);
                    this.getNavettaList();
                } else if (this._viewKey === 'transfer') {
                    const oNavetteInput = this.byId("transferNavetteId");
                    oNavetteInput.setValue(oNaveteNumber);
                } else {
                    const oNavetteInput = this.byId("recNavetteId");
                    oNavetteInput.setValue(oNaveteNumber);
                    this.getNavettaListRic();
                }

            },
            //Navette Help

            //Do the get wip out logic on enter
            onWipSubmit: function (oEvent) {
                if (this._viewKey === 'create') { // Do this logic only in creation page

                    const oWipOut = oEvent.getParameters().value;
                    const oIndex = oEvent.getSource().getBindingContext("items").getObject().index;
                    this.SelectedIndex = oIndex;
                    //Call the wip out details
                    this.onInsertWip(oWipOut, oIndex);
                }
            },

            //Function to handle new wip insertion
            onInsertWip: function (iWipOut, iIndex) {
                const that = this;
                // const oLgort = this.checkFieldSplit(this.byId("arrivo__").getValue());
                const oItems = this.getView().getModel("items").getData();//Get the values for our table model 
                const oViewModel = this.getView().getModel("viewModel");
                // const aFilter = new Filter({
                //     filters: [new Filter('WIP_OUT', FilterOperator.EQ, iWipOut),
                //               new Filter('LGORT', FilterOperator.EQ, oLgort)]
                // })
                const aFilter = new Filter('WIP_OUT', FilterOperator.EQ, iWipOut);
                var oCheckWip = this.checkExistingWip(iWipOut, iIndex);

                if (!oCheckWip) {//Add wip only in case is not already used
                    oViewModel.setProperty('/busy', true);
                    this.getOwnerComponent().getModel().read("/get_wipdataSet", {
                        filters: [aFilter],
                        success: function (oData) {
                            oViewModel.setProperty('/busy', false);
                            if (oData.results.length === 1) {
                                for (var i = 0; i < oItems.length; i++) {//Change the selected index
                                    if (oData.results[0].MESSAGE === "") {
                                        if (oItems[i].index === that.SelectedIndex) {
                                            oItems[i] = oData.results[0];
                                            oItems[i].index = that.SelectedIndex;
                                            that._setModel(oItems, "items");//Function to update the model	
                                            break;
                                        }
                                    } else {
                                        // MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("wipoutUsed"));//Wip out already used
                                        MessageBox.error(oData.results[0].MESSAGE);
                                    }
                                }
                            } else {
                                MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("noWipout"));//No wip out found
                            }
                        },
                        error: function (err) {
                            oViewModel.setProperty('/busy', false);
                            console.log(err);
                        }
                    });
                } else {
                    MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("existingWip"));//Wip already inserted
                }

            },

            //Function to add a new item 
            onAddItem: function (oEvent) {
                var oItems = this.getView().getModel("items").getData();//Get the values for our table model 
                this.Index = this.Index + 1; //We increment our index by 1 every time we add a new item

                //We add an empty row to our table model
                if (oItems === null) {
                    var oItemData = [{
                        'index': 1,
                        'ARBPL': "",
                        'AUFNR': "",
                        'ICONA_COLLAUDO': "NI",
                        'ICONA_COLORE': "NI",
                        'LGORT': "",
                        'MAKTX': "",
                        'MATNR': "",
                        'MEINS': "",
                        'MENGE': "",
                        'MESSAGE': "",
                        'NAVNUM': "",
                        'STATO_COLLAUDO': "",
                        'STATO_COLORE': "",
                        'STATO': "",
                        'WIP_OUT': "",
                        'RUECK': "",
                        'RMZHL': ""
                    }];
                    this.Index = 1;
                    this._setModel(oItemData, "items");//Function to update the model
                } else {
                    oItems.push({
                        'index': this.Index,
                        'ARBPL': "",
                        'AUFNR': "",
                        'ICONA_COLLAUDO': "NI",
                        'ICONA_COLORE': "NI",
                        'LGORT': "",
                        'MAKTX': "",
                        'MATNR': "",
                        'MEINS': "",
                        'MENGE': "",
                        'MESSAGE': "",
                        'NAVNUM': "",
                        'STATO_COLLAUDO': "",
                        'STATO_COLORE': "",
                        'STATO': "",
                        'WIP_OUT': "",
                        'RUECK': "",
                        'RMZHL': ""
                    });
                    this._setModel(oItems, "items");//Function to update the model
                }

            },

            //Function to remove an item
            onDeleteItem: function (oEvent) {
                var oDeleteRecord = oEvent.getSource().getBindingContext("items").getObject();//Get the record we want to delete
                var oItems = this.getView().getModel("items").getData();//Get the values for our model and save it in a variable

                for (var i = 0; i < oItems.length; i++) {
                    if (oItems[i].WIP_OUT == oDeleteRecord.WIP_OUT) {
                        oItems.splice(i, 1);//Remove 1 record from i index
                        break;
                    }
                }
                this._setModel(oItems, "items");//Function to update the model	
            },

            //Function to check if the wip number already exists
            checkExistingWip: function (iValue, iIndex) {
                var oItems = this.getView().getModel("items").getData();//Get the values for our model and save it in a variable
                for (var i = 0; i < oItems.length; i++) {
                    if (oItems[i].WIP_OUT === iValue && oItems[i].index !== iIndex) {//return true if wip out exist and is not located in the same index
                        return true;
                    }
                }
                return false;
            },

            //Check the inserted wip outs
            checkItems: function (iItems) {
                //Nothing, 
            },

            //Hide or shoe footer if we are on the creation tab
            _showFooter: function (iBool) {
                const oPage = this.byId("page");
                // if (!oPage.getShowFooter()) {
                oPage.setShowFooter(iBool);
                // }
            },

            //Get the selected filter tab
            onIconTabBarSelect: function (oEvent) {
                const oKey = oEvent.getParameter("key");
                this._viewKey = oKey;
                if (oKey == "create") {
                    this._showFooter(true);
                    this.getView().byId("recNavetteId").setValue("");
                    this.getView().byId("recieveWipOutId").setValue("");
                    this.getView().byId("transferNavetteId").setValue("");
                    this.getView().byId("navetteIdCreate").setValue("");
                    this.getView().byId("recieveWipOutIdCr").setValue("");
                    this.onClearItemModel();
                } else if (oKey == "transfer") {
                    this._showFooter(false);
                    this.getView().byId("recNavetteId").setValue("");
                    this.getView().byId("recieveWipOutId").setValue("");
                    this.getView().byId("transferNavetteId").setValue("");
                    this.getView().byId("navetteIdCreate").setValue("");
                    this.getView().byId("recieveWipOutIdCr").setValue("");
                    this.onClearItemModel();
                } else if (oKey == "receive") {
                    this._showFooter(false);
                    this.getView().byId("recNavetteId").setValue("");
                    this.getView().byId("recieveWipOutId").setValue("");
                    this.getView().byId("transferNavetteId").setValue("");
                    this.getView().byId("navetteIdCreate").setValue("");
                    this.getView().byId("recieveWipOutIdCr").setValue("");
                    this.onClearItemModel();
                }
            },

            onClearItemModel: function () {//restore the view to the initial state
                var oItemData = [{
                    'index': 1,
                    'ARBPL': "",
                    'AUFNR': "",
                    'ICONA_COLLAUDO': "NI",
                    'ICONA_COLORE': "NI",
                    'LGORT': "",
                    'MAKTX': "",
                    'MATNR': "",
                    'MEINS': "",
                    'MENGE': "",
                    'MESSAGE': "",
                    'NAVNUM': "",
                    'STATO_COLLAUDO': "",
                    'STATO_COLORE': "",
                    'STATO': "",
                    'WIP_OUT': "",
                    'RUECK': "",
                    'RMZHL': ""
                }];
                this.Index = 1;
                this._setModel(oItemData, "items");//Function to update the model
                this.getView().byId("navetteIdCreate").setValue("");

            },

            //Call the barcode for the wip out
            onBtnScanPress: function (oEvent) {
                let oIndex = oEvent.getSource().getBindingContext("items").getObject().index;
                BarcodeScanner.scan(
                    function (oResult) { /* process scan result */
                        this.onInsertWip(oResult.text, oIndex);
                    }.bind(this),
                    function (oError) {
                        console.log(oError);
                    }
                );
            },

            checkboxFilter: function () {
                const aFilter = {
                    "NC": false,
                    "NT": false,
                    "WR": false,
                    "NG": false
                };

                switch (this._viewKey) {
                    case "create":
                        if (this.byId("NC_C").getSelected()) {
                            aFilter.NC = true;
                        }
                        if (this.byId("NT_C").getSelected()) {
                            aFilter.NT = true;
                        }
                        if (this.byId("WR_C").getSelected()) {
                            aFilter.WR = true;
                        }
                        if (this.byId("NG_C").getSelected()) {
                            aFilter.NG = true;
                        }
                        break;
                    case "transfer":
                        if (this.byId("NC_T").getSelected()) {
                            aFilter.NC = true;
                        }
                        if (this.byId("NT_T").getSelected()) {
                            aFilter.NT = true;
                        }
                        if (this.byId("WR_T").getSelected()) {
                            aFilter.WR = true;
                        }
                        if (this.byId("NG_T").getSelected()) {
                            aFilter.NG = true;
                        }
                        break;
                    case "receive":
                        if (this.byId("NC_R").getSelected()) {
                            aFilter.NC = true;
                        }
                        if (this.byId("NT_R").getSelected()) {
                            aFilter.NT = true;
                        }
                        if (this.byId("WR_R").getSelected()) {
                            aFilter.WR = true;
                        }
                        if (this.byId("NG_R").getSelected()) {
                            aFilter.NG = true;
                        }
                        break;
                }
                return aFilter;
            },

            //Get the related wipouts and fill the item model
            onWipSubmitCr: function () {
                const oWipout = this.getView().byId("recieveWipOutIdCr").getValue();
                const aFilter = new Filter('WIP_OUT', FilterOperator.EQ, oWipout);
                const oItems = this.getView().getModel("items").getData();//Get the values for our table model 
                const oViewModel = this.getView().getModel("viewModel");
                const that = this;

                //Clear the navetta number input
                this.getView().byId("navetteIdCreate").setValue("");

                oViewModel.setProperty('/busy', true);
                this.getOwnerComponent().getModel().read("/dati_odpSet", {
                    filters: [aFilter],
                    success: function (oData) {
                        oViewModel.setProperty('/busy', false);
                        if (oData.results.length > 0) {
                            //Clear the model and insert new wip-out
                            const oModel = that.getView().getModel("items");
                            oModel.setData(null);
                            for(var i = 0; i < oData.results.length; i++){
                                oItems.push(oData.results[i]);
                            }
                            that._setModel(oItems, "items");//Function to update the model	
                        } else {
                            MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("nessunWip"));
                        }
                    },
                    error: function (err) {
                        oViewModel.setProperty('/busy', false);
                        MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("nessunWip"));
                    }
                });
            },
            //********************************************TRANSFER NAVETTA*************************************************************************//            
            // Event handler for Transfer Navetta press 
            onTransferPress: function () {
                const that = this;
                const oConfirmMsg = this._geti18n("transferConfirm");
                const oWarningMsg = this._geti18n("transferWarning");
                const oNavetteNr = this.byId("transferNavetteId").getValue();
                const oMainModel = this.getView().getModel("mainModel");

                oMainModel.setProperty("/trasferBusy", true); // Show busy loader 
                MessageBox.confirm(oConfirmMsg, {
                    actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.YES,
                    onClose: function (sAction) {
                        if (sAction === "YES") {
                            // Check that Navette number is not empty
                            if (oNavetteNr === "") {
                                MessageBox.warning(oWarningMsg);
                                oMainModel.setProperty("/trasferBusy", false);
                            } else {  // Make request to BE
                                that.trasferNavette(oNavetteNr, oMainModel);
                            }
                        } else {
                            oMainModel.setProperty("/trasferBusy", false); // Hide busy loader 
                        }
                    }
                });
            },

            // Make request on BE to Transfer selected Navette
            trasferNavette: function (NavetteNr, MainModel) {
                const that = this;
                const oModel = that.getOwnerComponent().getModel();
                const oTransfer = { NAVNUM: NavetteNr };

                oModel.create("/trasf_navettaSet", oTransfer, {
                    success: function (oData) {
                        if (oData.RCODE == 1) {
                            MessageBox.success(oData.MESSAGE);
                        } else {
                            MessageBox.error(oData.MESSAGE);
                        }
                        that.byId("transferNavetteId").setValue(""); // Clear input Field
                        MainModel.setProperty("/trasferBusy", false);
                    },
                    error: function (err) {
                        try {
                            const errorJson = JSON.parse(err.responseText);
                            MessageBox.error(errorJson.error.message.value);
                        } catch (e) {
                            MessageBox.error(err.message);
                        }
                        MainModel.setProperty("/trasferBusy", false);
                    }
                });
            },
            //********************************************RICEZIONE NAVETTA*************************************************************************//              

            // Event handler for Receiving Navetta press 
            onReceivePress: function () {
                const that = this;
                const oWarningMsg = this._geti18n("mandatory");
                const oNavetteNr = this.byId("recNavetteId").getValue();
                const oWipInput = this.byId("recieveWipOutId").getValue();
                const oMainModel = this.getView().getModel("mainModel");

                // Check that Navette number is not empty
                // if (oNavetteNr === "" || oWipInput === "") {
                //     MessageBox.warning(oWarningMsg);
                // } else {  // Make request to BE
                //     that.receiveWipOut(oNavetteNr, oWipInput, oMainModel);
                // }

                // if (oNavetteNr !== "" || oWipInput !== "") {
                //     that.receiveWipOut(oNavetteNr, oWipInput, oMainModel);
                // }

                // Check that Navette number is not empty
                if (oNavetteNr === "") {
                    MessageBox.warning(oWarningMsg);
                } else {  // Make request to BE
                    that.receiveWipOut(oNavetteNr, oWipInput, oMainModel);
                }

            },

            // // Recieve navete nr & wip-out message ------------------------------------------------
            receiveWipOut: function (NavetteNr, WipInput, MainModel) {
                const that = this;
                const oModel = that.getOwnerComponent().getModel();
                const oRecModel = this.getView().getModel("wipOutList");
                // var oRecData = [];
                // var oRecieve = {};
                // oRecieve.NAVNUM = NavetteNr;
                // oRecieve.WIP_OUT = WipInput;

                const requestBody = {//Create the structure fo deep entity
                    NAVNUM: NavetteNr, //Header
                    ricnavettatowip: [] // Item
                };
                const oTagTable = this.byId("table_ric");
                const oSeleectedItems = oTagTable.getSelectedItems();
                var oTags = [];

                //Create the item section for the deep entity call
                if (WipInput) {//one wipout only from input
                    const oTempItems = {};
                    oTempItems.NAVNUM = NavetteNr;
                    oTempItems.WIP_OUT = WipInput;
                    requestBody.ricnavettatowip.push(oTempItems);
                } else {//wipouts from the list
                    oSeleectedItems.forEach((e) => {
                        const oItem = e.getBindingContext("items_ric").getProperty();
                        const oTempItems = {};
                        oTempItems.NAVNUM = NavetteNr;
                        oTempItems.WIP_OUT = oItem.WIP_OUT;
                        requestBody.ricnavettatowip.push(oTempItems);
                    });
                }

                // if (typeof oRecModel !== 'undefined') oRecData = oRecModel.getData();

                MainModel.setProperty("/receiveBusy", true);
                oModel.create("/ricevi_navettaSet", requestBody, {
                    success: function (oData) {
                        // console.log(oData);
                        // oRecData.push(oData);
                        // that.getView().setModel(new JSONModel(oRecData), "wipOutList");
                        // MessageBox.success(oData.MESSAGE);
                        that.displayMessage(oData.ricnavettatowip.results, that);
                        MainModel.setProperty("/receiveBusy", false);
                    },
                    error: function (err) {
                        try {
                            const errorJson = JSON.parse(err.responseText);
                            MessageBox.error(errorJson.error.message.value);
                        } catch (e) {
                            MessageBox.error(err.message);
                        }
                        MainModel.setProperty("/receiveBusy", false);
                    }
                });
            },

            //Get the already saved navetta for ricevi
            getNavettaListRic: function () {
                this.getView().byId("recieveWipOutId").setValue("");
                const that = this;
                const oNavetta = this.getView().byId("recNavetteId").getValue();
                const aFilter = new Filter('NAVNUM', FilterOperator.EQ, oNavetta);
                const oItems = this.getView().getModel("items_ric").getData();//Get the values for our table model 
                const oViewModel = this.getView().getModel("viewModel");

                oViewModel.setProperty('/busy', true);
                this.getOwnerComponent().getModel().read("/dati_navettaSet", {
                    filters: [aFilter],
                    success: function (oData) {
                        //Clear the model and insert new wip-out
                        oViewModel.setProperty('/busy', false);
                        const oModel = that.getView().getModel("items_ric");
                        oModel.setData(null);
                        that._setModel(oData.results, "items_ric");//Function to update the model	

                        //Save the pop up values for update navetta
                        oMagazzinoArrivo = oData.results[0].LGORT;
                        oMagazzinoPartenza = oData.results[0].UMLGO;
                        oMagazzinoData = oData.results[0].ERDAT;
                    },
                    error: function (err) {
                        oViewModel.setProperty('/busy', false);
                        MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("noNavetta"));
                    }
                });
                this.getView().byId("recieveWipOutId").setEnabled(false);
            },

            //Display messages for ricevimento  
            displayMessage: function (oData, that) {
                var oMessagges = [];
                if (oData.length !== 0) {
                    for (var i = 0; i < oData.length; i++) {
                        var oItemMsg = [{ message: "" }];
                        oItemMsg.message = oData[i].MESSAGE + " per Wip Out " + oData[i].WIP_OUT;
                        oMessagges.push(oItemMsg);
                    }
                    var oMsgModel = new sap.ui.model.json.JSONModel(oMessagges);
                    that.getView().setModel(oMsgModel, "informationMsg");
                    that._getDialogMessagge().open();
                }
            },

            //Bind the messages and get the dialog
            _getDialogMessage: function () {
                if (!this._oDialog) {
                    this._oDialog = sap.ui.xmlfragment("npmnavette.navette.fragments.ricevimentoList", this);
                    this.getView().addDependent(this._oDialog);
                }
                return this._oDialog;
            },

            //Close the dialog
            onCloseDialog: function () {
                this.onClearItemModelRic();
                this._oDialog.close();
            },

            onClearItemModelRic: function () {
                var oItemData = [];
                this.Index = 1;
                this._setModel(oItemData, "items_ric");//Function to update the model
                this.getView().byId("recieveWipOutId").setEnabled(true);
                // this.getView().byId("recNavetteId").setValue("");
            },

            //Split the input fields
            checkFieldSplit: function (iValue) {
                if (iValue.includes("-")) {
                    return iValue.split("-")[0].trim();
                } else {
                    return iValue;
                }
            },

        });
    });