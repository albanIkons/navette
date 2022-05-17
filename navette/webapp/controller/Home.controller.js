sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    'sap/ui/model/json/JSONModel',
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, MessageBox, JSONModel, Fragment, Filter, FilterOperator) {
        "use strict";

        return Controller.extend("npmnavette.navette.controller.Home", {
            onInit: function () {
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
                this._getDialog().open();//Call the dialog to insert magazzino and date
            },

            onSaveNavetta: function () {
                const oItems = this.getView().getModel("items").getData();//Get the values for our table model 
                const requestBody = {
                    NAVNUM: "0000000000",
                    navettatowip: [ {
                        "NAVNUM" : "0000000000",
                        "WIP_OUT" : "10-1"
                        }
                    ]
                };

                // for (var i = 0; i < oItems.length; i++) {
                //     oItems[i].Lgort = this.checkFieldSplit(sap.ui.getCore().byId("partenza").getValue());
                //     oItems[i].Umlgo = this.checkFieldSplit(sap.ui.getCore().byId("arrivo__").getValue());

                //     oItems[i].NAVNUM = "0000000000";
                //     delete oItems[i].index;

                //     requestBody.navettatowip.push(oItems[i]);
                // }

                // requestBody.NAVNUM = "&&";
                // requestBody.navettatowip = oItems;

                this.getView().getModel().create("/update_navettaSet", requestBody, {
                    success: function (oData) {

                    },
                    error: function (err) {
                        console.log(err);
                    }
                });

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
            onBtnCancelPress: function () {
                this.closeDialog();
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

                this.SelectedIndex = oEvent.getSource().getBindingContext("items").getObject().index;//Get the selected index 

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

                if (!oSelectedItem) return;
                const oWipOut = oSelectedItem.getTitle();
                //Call the wip out details
                this.onInsertWip(oWipOut);
            },
            //Wip Out Help

            //Function to handle new wip insertion
            onInsertWip: function (iWipOut) {
                const that = this;
                // const oLgort = this.checkFieldSplit(this.byId("arrivo__").getValue())
                const oItems = this.getView().getModel("items").getData();//Get the values for our table model 
                // const aFilter = new Filter({
                //     filters: [new Filter('WIP_OUT', FilterOperator.EQ, iWipOut),
                //               new Filter('LGORT', FilterOperator.EQ, oLgort)]
                // })
                const aFilter = new Filter('WIP_OUT', FilterOperator.EQ, iWipOut);
                var oCheckWip = this.checkExistingWip(iWipOut);

                this.getView().getModel().read("/get_wipdataSet", {
                    filters: [aFilter],
                    success: function (oData) {
                        if (oData.results.length === 1) {
                            for (var i = 0; i < oItems.length; i++) {//Change the selected index
                                if (oItems[i].index === that.SelectedIndex) {
                                    oItems[i] = oData.results[0];
                                    oItems[i].index = that.SelectedIndex;
                                    that._setModel(oItems, "items");//Function to update the model	
                                    break;

                                }
                            }
                        } else {
                            MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("noWipout"));
                        }
                    },
                    error: function (err) {
                        console.log(err);
                    }
                });
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
                    'MATNR': "test",
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
            checkExistingWip: function (iValue) {
                var oItems = this.getView().getModel("items").getData();//Get the values for our model and save it in a variable
            },

            _showFooter: function (iBool) {
                const oPage = this.byId("page");
                // if (!oPage.getShowFooter()) {
                oPage.setShowFooter(iBool);
                // }
            },

            onIconTabBarSelect: function (oEvent) {
                const oKey = oEvent.getParameter("key");

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
                MessageBox.success(`This Number: "${NavetteNr}" will be sent to backend`);
                this.byId("navetteId").setValue(""); // Clear input Field
                MainModel.setProperty("/trasferBusy", false);
            },
            //********************************************RICEZIONE NAVETTA*************************************************************************//              

            // Event handler for Receiving Navetta press 
            onReceivePress: function () {
                const that = this;
                const oWarningMsg = this._geti18n("transferWarning");
                const oNavetteNr = this.byId("recNavetteId").getValue();
                const oMainModel = this.getView().getModel("mainModel");

                // Check that Navette number is not empty
                if (oNavetteNr === "") {
                    MessageBox.warning(oWarningMsg);
                } else {  // Make request to BE
                    that.receiveWipOut(oNavetteNr, oMainModel);
                }
            },

            // Get List of WIP Outs
            receiveWipOut: function (NavetteNr, MainModel) {
                const modelNew = new JSONModel("../jsonTest/dummy.json");
                MainModel.setProperty("/receiveBusy", true);

                // Just for test to see how data will be displayed with trafic lights
                setTimeout(() => {
                    this.getView().setModel(modelNew, "wipOutList");
                    MainModel.setProperty("/receiveBusy", false);
                }, 2500);
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
