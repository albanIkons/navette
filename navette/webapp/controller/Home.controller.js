sap.ui.define([
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
    function (Controller, MessageBox, JSONModel, Fragment, Filter, FilterOperator, formatter) {
        "use strict";

        return Controller.extend("npmnavette.navette.controller.Home", {
            formatter: formatter,
            onInit: function () {
                this._viewKey = 'create'; 
                // Main Model to controll view (bussy status etc)
                const oMainModel = {
                    trasferBusy: false,
                    receiveBusy: false
                };
                this._setModel(oMainModel, "mainModel");

                //Create the empty model 
                //Table binding
                var oItemData = [{
                    'index': 1,
                    'ARBPL': "",
                    'AUFNR': "",
                    'ICONA_COLLAUDO': "",
                    'ICONA_COLORE': "",
                    'LGORT': "",
                    'MAKTX': "",
                    'MATNR': "",
                    'MEINS': "",
                    'MENGE': "",
                    'MESSAGE': "",
                    'NAVNUM': "",
                    'STATO_COLLAUDO': "",
                    'STATO_COLORE': "",
                    'WIP_OUT': ""
                }];
                this.Index = 1;
                this._setModel(oItemData, "items");//Function to update the model

            },

            //******************************************CREAZIONE NAVETTA**************************************************************************//
            onSavePopUp: function () {
                const oItems = this.getView().getModel("items").getData();//Get the values for our table model 
                var oItemsChecked = this.checkItems(oItems);

                // if(oItemsChecked.length > 0){//Controll if we have at least one wip out inserted
                    this._getDialog().open();//Call the dialog to insert magazzino and date
                // } else {
                //     MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("noItems"));//error no wip outs inserted
                // }
            },

            //Save or update the navetta
            onSaveNavetta: function () {
                const oItems = this.getView().getModel("items").getData();//Get the values for our table model 
                const oNavnum = this.getView().byId("navetteIdCreate").getValue();
                const that = this;

                const requestBody = {//Create the structure fo deep entity
                    NAVNUM: (oNavnum == "") ? '&&' : oNavnum, //Header
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
                    oTempItems.ERDAT = new Date(sap.ui.getCore().byId("creazione").getValue());

                    requestBody.navettatowip.push(oTempItems);
                }

                //Call the deep entity
                this.getView().getModel().create("/update_navettaSet", requestBody, {
                    success: function (oData) {
                        const oModel = that.getView().getModel("items");
                        that.onCloseDialog();
                        oModel.setData(null);
                        if (oNavnum) {//Check if we are updating or creating and show error/success message
                            MessageBox.success(that.getView().getModel("i18n").getResourceBundle().getText("updateSuccess") + oNavnum);//Sucessful update
                        } else {
                            MessageBox.success(that.getView().getModel("i18n").getResourceBundle().getText("createSuccess") + oData.navettatowip.results[0].NAVNUM);//Sucessful creation
                        }
                    },
                    error: function (err) {
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

                this.getView().getModel().read("/dati_navettaSet", {
                    filters: [aFilter],
                    success: function (oData) {
                        //Clear the model and insert new wip-out
                        const oModel = that.getView().getModel("items");
                        oModel.setData(null);
                        that._setModel(oData.results, "items");//Function to update the model	
                    },
                    error: function (err) {
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
                that.getView().getModel().read("/get_lgortSet", {
                    success: function (oData) {
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

                if(this._viewKey === 'create'){
                    this.SelectedIndex = oEvent.getSource().getBindingContext("items").getObject().index;//Get the selected index 
                }
                
                this.getView().getModel().read("/get_wipSet", {
                    success: function (oData) {
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

                if(this._viewKey === 'create') { // Do this logic only in creation page
                    if (!oSelectedItem) return;
                    //Call the wip out details
                    this.onInsertWip(oWipOut, '');

                }else{ // For recieve page ----------------------------------------------
                    const oWipInput = this.byId("recieveWipOutId");
                    oWipInput.setValue(this.checkFieldSplit(oWipOut));
                }
            },
            //Wip Out Help
            onWipSubmit: function (oEvent) {
                if(this._viewKey === 'create') { // Do this logic only in creation page
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
                // const aFilter = new Filter({
                //     filters: [new Filter('WIP_OUT', FilterOperator.EQ, iWipOut),
                //               new Filter('LGORT', FilterOperator.EQ, oLgort)]
                // })
                const aFilter = new Filter('WIP_OUT', FilterOperator.EQ, iWipOut);
                var oCheckWip = this.checkExistingWip(iWipOut, iIndex);

                if (!oCheckWip) {//Add wip only in case is not already used
                    this.getView().getModel().read("/get_wipdataSet", {
                        filters: [aFilter],
                        success: function (oData) {
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
                                        MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("wipoutUsed"));//Wip out already used
                                    }
                                }
                            } else {
                                MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("noWipout"));//No wip out found
                            }
                        },
                        error: function (err) {
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
                oItems.push({
                    'index': this.Index,
                    'ARBPL': "",
                    'AUFNR': "",
                    'ICONA_COLLAUDO': "",
                    'ICONA_COLORE': "",
                    'LGORT': "",
                    'MAKTX': "",
                    'MATNR': "",
                    'MEINS': "",
                    'MENGE': "",
                    'MESSAGE': "",
                    'NAVNUM': "",
                    'STATO_COLLAUDO': "",
                    'STATO_COLORE': "",
                    'WIP_OUT': ""
                });
                this._setModel(oItems, "items");//Function to update the model
            },

            //Function to remove an item
            onDeleteItem: function (oEvent) {
                var oDeleteRecord = oEvent.getSource().getBindingContext("items").getObject();//Get the record we want to delete
                var oItems = this.getView().getModel("items").getData();//Get the values for our model and save it in a variable

                for (var i = 0; i < oItems.length; i++) {
                    if (oItems[i].index == oDeleteRecord.index) {
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

            },

            // //Insert save status meaning that the wip out is ready to be saved
            // onSaveStatusUpdate: function (iItems) {
            //     for(var i = 0; i < iItems.length; i++){
            //         iItems[i].saveStatus = true
            //     }
            // },

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
                } else {
                    this._showFooter(false);
                }
            },
            //********************************************TRANSFER NAVETTA*************************************************************************//            
            // Event handler for Transfer Navetta press 
            onTransferPress: function () {
                const that = this;
                const oConfirmMsg = this._geti18n("transferConfirm");
                const oWarningMsg = this._geti18n("transferWarning");
                const oNavetteNr = this.byId("navetteId").getValue();
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

            //Navette Help
            onNavetteHelp: function (oEvent) {
                const that = this;
                const oView = this.getView();
                const sInputValue = oEvent.getSource().getValue();

                that.getView().getModel().read("/get_navnumSet", {
                    success: function (oData) {
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
                        console.log(err);
                    }
                });
            },

            onHelpSearchNavette: function (oEvent) {
                const sValue = oEvent.getParameter("value");
                const oFilter = new Filter("LGORT", FilterOperator.Contains, sValue);
                oEvent.getSource().getBinding("items").filter([oFilter]);
            },

            onHelpCloseNavette: function (oEvent) {
                const oSelectedItem = oEvent.getParameter("selectedItem");
                oEvent.getSource().getBinding("items").filter([]);

                if (!oSelectedItem) return;
                const oMagazzino = `${oSelectedItem.getTitle()} - ${oSelectedItem.getDescription()}`;
                // Set selected key values to input field------------------------------------------
                this.byId(this.MagazzinoId).setValue(oMagazzino);
            },
            //Navette Help

            // Make request on BE to Transfer selected Navette
            trasferNavette: function (NavetteNr, MainModel) {
                const that = this;
                const oModel = that.getView().getModel();
                const oTransfer = { NAVNUM : NavetteNr};
                
                oModel.create("/trasf_navettaSet", oTransfer, {
                    success: function (oData){
                        MessageBox.alert(oData.MESSAGE);  
                        that.byId("navetteId").setValue(""); // Clear input Field
                        MainModel.setProperty("/trasferBusy", false);
                    },
                    error: function(err){
                        try {
                            const errorJson = JSON.parse(err.responseText);
                            MessageBox.error(errorJson.error.message.value);    
                        }catch (e){
                            MessageBox.error(err.message);    
                        } 
                        MainModel.setProperty("/trasferBusy", false);
                    }
                });
            },
            //********************************************RICEZIONE NAVETTA*************************************************************************//              

            // Event handler for Receiving Navetta press 
            onReceivePress: function () {
                const that        = this;
                const oWarningMsg = this._geti18n("transferWarning");
                const oNavetteNr  = this.byId("recNavetteId").getValue();
                const oWipInput   = this.byId("recieveWipOutId").getValue();
                const oMainModel  = this.getView().getModel("mainModel");

                // Check that Navette number is not empty
                if (oNavetteNr === "") {
                    MessageBox.warning(oWarningMsg);
                } else {  // Make request to BE
                    that.receiveWipOut(oNavetteNr, oWipInput, oMainModel);
                }
            },

            // Recieve navete nr & wip-out message ------------------------------------------------
            receiveWipOut: function (NavetteNr, WipInput, MainModel) {
                const that = this;
                const oModel = that.getView().getModel();
                const oRecModel = this.getView().getModel("wipOutList");  
                var oRecData = [];
                var oRecieve = {};
                        oRecieve.NAVNUM = NavetteNr;
                        oRecieve.WIP_OUT= WipInput;

                if( typeof oRecModel !== 'undefined' ) oRecData = oRecModel.getData();

                MainModel.setProperty("/receiveBusy", true);
                oModel.create("/ricevi_navettaSet", oRecieve, {
                    success: function (oData){
                        oRecData.push(oData);
                        that.getView().setModel(new JSONModel(oRecData),"wipOutList");
                        MainModel.setProperty("/receiveBusy", false);
                    },
                    error: function(err){
                        try {
                            const errorJson = JSON.parse(err.responseText);
                            MessageBox.error(errorJson.error.message.value);    
                        }catch (e){
                            MessageBox.error(err.message);    
                        } 
                        MainModel.setProperty("/receiveBusy", false);
                    }
                });
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
