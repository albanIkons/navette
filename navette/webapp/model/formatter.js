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
            } else if (sIcona == "") {
                return "";
            } else {
                return "sap-icon://busy";
            }
        },

        iconaColl: function (sIcona) {
            if (sIcona == "NI") {
                return "";
            } else if (sIcona == "") {
                return "";
            } else {
                return "sap-icon://busy";
            }
        },

    };
});