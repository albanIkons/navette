/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"npm_navette/navette/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
