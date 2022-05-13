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
                //Create the empty model 
                //Table binding
                var oItemData = [{
                    'index': 1,
                    'wipout': '',
                    'ordine': '',
                    'materiale': '',
                    'descrizione': '',
                    'icona': '',
                    'stato': '',
                    'centro_di_lavoro': '',
                    'quantita': '',
                    'um': '',
                }];
                this.Index = 1;
                this._setModel(oItemData);//Function to update the model
            },

//******************************************CREAZIONE NAVETTA**************************************************************************//
            //Function to handle the go button of the toolbar
            onGo: function () {
                var oCheckFields = this.checkMandatoryFields();
                var oWarn = this._geti18n("mandatory");

                if (oCheckFields === false) {//if all the fields are filled make table visible
                    MessageBox.warning(oWarn);
                } else {
                    this.getView().byId("table").setVisible(true)
                }
            },

            //Function to check if all the mandatory fields are filled
            checkMandatoryFields: function () {
                // var oNavetta = this.byId("navetta").getValue();
                var oPartenza = this.byId("partenza").getValue();
                var oArrivo = this.byId("arrivo").getValue();
                var oData = this.byId("creazione").getValue();

                // if (oPartenza && oArrivo && oData) {
                    return true;
                // } else {
                //     return false;
                // }
            },

            // Get text translations from i18n ----------------------------------------------------
            _geti18n: function (textName) {
                return this.getView().getModel("i18n").getResourceBundle().getText(textName);
            },

            //Function to create and update the model
            _setModel: function (items) {
                //Set the model for the added items
                var oitemModel = new JSONModel(items);//Create new model for the items	
                this.getView().setModel(oitemModel, "items");//Set the model with name "items"	
            },

            //Function to create the dynamic search helps
            oHeaderFilterHelp: function (oEvent) {
                var oInputId = oEvent.mParameters.id;
                var oHelpObject = {
                    title: ""
                };
                var oHelpItem = [];
                var sInputValue = oEvent.getSource().getValue();
                var oView = this.getView();
                // this.oInputSelected = oInputId.substring(74);
                this.oInputSelected = oInputId.substring(oEvent.getSource().getId().length - 8);

                //Create dynamic serch helps
                switch (this.oInputSelected) {
                    case "wip_out_":
                        oHelpObject = this.onCreateHelpTitleModels("wipout");
                        break;
                    case "partenza":
                        oHelpObject = this.onCreateHelpTitleModels("partenza");
                        break;
                    case "arrivo__":
                        oHelpObject = this.onCreateHelpTitleModels("arrivo");
                        break;
                    default:
                        break;
                }

                var oHelpModel = new JSONModel(oHelpObject);
                this.getView().setModel(oHelpModel, "helpModel");

                var oHelpItemModel = new JSONModel(oHelpItem);
                this.getView().setModel(oHelpItemModel, "helpModelItem");

                if (!this._pHelpDialog) {
                    this._pHelpDialog = Fragment.load({
                        id: oView.getId(),
                        name: "npmnavette.navette.fragments.headerFilter",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        return oDialog;
                    });
                }

                this._pHelpDialog.then(function (oDialog) {
                    // Create a filter for the binding
                    oDialog.getBinding("items").filter([new Filter("HelpValue", FilterOperator.Contains, sInputValue)]);
                    // Open ValueHelpDialog filtered by the input's value
                    oDialog.open(sInputValue);
                });
            },

            //Create the title for the search helps
            onCreateHelpTitleModels: function (oTitle) {
                var oHelpObject = {
                    title: this._geti18n(oTitle)// this.getView().getModel("i18n").getResourceBundle().getText(oTitle)
                };
                return oHelpObject;
            },

            //Function to handle new wip insertion
            onInsertWip: function (oEvent) {
                var oValue = oEvent.mParameters.newValue;
                var oItems = this.getView().getModel("items").getData();//Get the values for our table model 
                var oSelectedItem = oEvent.getSource().getBindingContext("items").getObject()
                var oCheckWip = this.checkExistingWip(oValue);

                //Add the values to the selected row
                for (var i = 0; i < oItems.length; i++) {
                    if (oSelectedItem.index == oItems[i].index) {
                        oItems[i].order = "123";
                        oItems[i].materiale = "material 1";
                        oItems[i].descrizione = "material description";
                        oItems[i].icona = "Green";
                        oItems[i].stato = "OK";
                        oItems[i].centro_di_lavoro = "Work center";
                        oItems[i].quantita = "100";
                        oItems[i].um = "PC";
                        break;
                    }
                }
                this.setModel(oItems);//Function to update the model	
            },

            //Function to add a new item 
            onAddItem: function (oEvent) {
                var oItems = this.getView().getModel("items").getData();//Get the values for our table model 
                this.Index = this.Index + 1; //We increment our index by 1 every time we add a new item

                //We add an empty row to our table model
                oItems.push({
                    'index': this.Index,
                    'wipout': '',
                    'ordine': '',
                    'materiale': '',
                    'descrizione': '',
                    'icona': '',
                    'stato': '',
                    'centro_di_lavoro': '',
                    'quantita': '',
                    'um': '',
                });
                this._setModel(oItems);//Function to update the model
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
                this._setModel(oItems);//Function to update the model	
            },

            //Function to check if the wip number already exists
            checkExistingWip: function (iValue) {
                var oItems = this.getView().getModel("items").getData();//Get the values for our model and save it in a variable
            }
//******************************************CREAZIONE NAVETTA**************************************************************************//            
        });
    });
