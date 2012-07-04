/**
 * @package pklib.date
 */
(function (global) {
    "use strict";
    /** @namespace */
    var pklib = global.pklib || {};

    /**
     * Utils stack to Date object
     * @namespace
     */
    pklib.date = {
        /**
         * Simple return month in string and file 0 at first place if month smaller than 10
         * @memberOf pklib.date
         * @function
         * @returns {String}
         */
        get_full_month: function () {
            var month = (parseInt(new Date().getMonth(), 10) + 1);

            if (month < 10) {
                month = "0" + month;
            }

            return String(month);
        }
    };
}(this));
