///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                       //
//  FUNCTION   : setWitholding                                                                                           //
//  PARAMETERS : record                                                                                                  //
//  RETURNS    :                                                                                                         //
//                                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function setWitholding(record) {

    db(TBL.PayrollWeeks).key(sub(record, FLD.PayrollInstallers.PayrollWeek, `id`)).get().then(response => {

        // GET THE WITHOLDING DATA FROM TAXEE.IO
        payWeek = response.data[0];
        return new Promise((resolve, reject) => {

            // OPEN A REQUEST
            var xhr = new XMLHttpRequest();
            xhr.open("post", "https://taxee.io/api/v2/calculate/" + payWeek[FLD.PayrollWeeks.EndedYear], true);

            // SET UP THE REQUEST PROPERTIES
            xhr.setRequestHeader("Authorization", "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJBUElfS0VZX01BTkFHRVIiLCJodHRwOi8vdGF4ZWUuaW8vdXNlcl9pZCI6IjVhMjU5ZjhmOWZhMTBmMjM3OWEwOTdkNyIsImh0dHA6Ly90YXhlZS5pby9zY29wZXMiOlsiYXBpIl0sImlhdCI6MTUxMjQxNTExOX0.CqAgMo5kqTRjxN_SjB3K5iKFZ-9G8dJrsAAPuiUY3h0");
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

            // SET UP THE RESPONSE HANDLER
            xhr.onload = function () {
                var response = { status: this.status, statusText: xhr.statusText };
                if (this.status >= 200 && this.status < 300) {
                    response.data = JSON.parse(this.response);
                    resolve(response);
                } else {
                    reject(response);
                }
            };
            xhr.onerror = function () {
                reject(response);
            };

            // SEND THE REQUEST
            xhr.send(
                `state=${(record[FLD.PayrollInstallers.State] || "TN")}&` +
                `filing_status=${record[FLD.PayrollInstallers.FilingStatus].toLowerCase().replace(" ", "_")}&` +
                `pay_periods=52&` +
                `pay_rate=${record[FLD.PayrollInstallers.TotalWages + "_raw"]}&` +
                `exemptions=${record[FLD.PayrollInstallers.Exemptions]}`
            );

        });

        // UPDATE THE WITHOLDING FIELDS
    }).then(response => {
        var taxes = response.data.per_pay_period;
        var data = {
            [FLD.PayrollInstallers.FICAWitheld]: Math.round(taxes.fica.amount * 100) / 100,
            [FLD.PayrollInstallers.FederalWitheld]: Math.round(taxes.federal.amount * 100) / 100,
            [FLD.PayrollInstallers.StateWitheld]: Math.round(taxes.state.amount * 100) / 100,
        }
        return db(TBL.PayrollInstallers).key(record.id).update(data);

        // HANDLE ERRORS
    }).catch(response => {
        MsgBox(`Error calculating witholdings!  You will have to set them manually.`, `${response.statusText}, ${response.status}`);

        // CLEANUP & RETURN
    }).then(response => {
        Knack.hideSpinner()
        return response;
    });

}