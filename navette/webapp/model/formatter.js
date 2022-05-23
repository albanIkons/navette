sap.ui.define([], function () {
    "use strict";
    return {
        iconaColor: function (sIcona) {
            if (sIcona == "@08@") {
                return "green";
            } else {
                return "red";
            }
        },

        icona: function (sIcona) {
            if (sIcona == "NI" ) {
                 return "";
            } else {
                return "sap-icon://status-negative"; 
            }
        },

        iconaColl: function (sIcona) {
            if (sIcona == "NI" ) {
                 return "";
            } else {
                return "sap-icon://status-negative"; 
            }
        },

    };
});