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
            if (sIcona == "NI") {
                return "";
            } else if (sIcona == "@08@") {
                return "sap-icon://busy";
            } else {
                return "sap-icon://color-fill";
            }
        },

        iconaColl: function (sIcona) {
            if (sIcona == "NI") {
                return "";
            } else if (sIcona == "@08@") {
                return "sap-icon://busy";
            } else {
                return "sap-icon://color-fill";
            }
        },

    };
});