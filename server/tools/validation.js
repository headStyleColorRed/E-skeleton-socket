function validateDataFields(params, paramsToMatch, origin) {
    let i = 0;
    let receivedData = Object.keys(params);
    let missingFields = new Array();
    let error = {
        error: 0,
        isError: false,
        message: "",
        error: null,
    };

    if (receivedData.length < paramsToMatch.length) {
        paramsToMatch.forEach((param) => {
            if (!receivedData.includes(param)) {
                missingFields.push(param);
            }
        });

        // Create Error
        error.isError = true;
        error.error = "5000";
        error.message = `Fields missing: [${missingFields}]`;
        return error;
    }

    for (const _ in params) {
		const element = params[paramsToMatch[i++]];

        if ((element == null || element == undefined) && i <= paramsToMatch.length) {
            error.isError = true;
            error.error = "5001";
            error.message = `Field null or undefined: ${paramsToMatch[i - 1]} at ${origin}`;
            return error;
        }
    }
    return error;
}

module.exports = {
    validateDataFields,
};