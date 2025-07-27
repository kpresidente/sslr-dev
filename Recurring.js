/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
//  METHOD     : updateScheduledRecords                                                                                //
//  PARAMETERS :                                                                                                       //
//  RETURNS    :                                                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



async function createInitialBills(record) {

    const promises = [];
    const quantity = record[FLD.RecurringBills.ScheduledQuantity] - record[FLD.RecurringBills.ScheduledCount];
    const periods  = record[FLD.RecurringBills.Periods];
    const period   = record[FLD.RecurringBills.Period];
    const dueDays  = record[FLD.RecurringBills.DueDays];
    const payDays  = record[FLD.RecurringBills.PayDays];
    const autopay  = cbool(record[FLD.RecurringBills.Autopay]);

    let newRecord = {
        [FLD.RecurringBills.Account] : record[FLD.RecurringBills.Account],
        [FLD.RecurringBills.Amount]  : record[FLD.RecurringBills.Amount],
        [FLD.RecurringBills.Autopay] : record[FLD.RecurringBills.Autopay]
    }
    if (autopay) {
        newRecord[FLD.RecurringBills.AutopayReference] = record[FLD.RecurringBills.AutopayReference];
        newRecord[FLD.RecurringBills.AutopayAmount]    = record[FLD.RecurringBills.AutopayAmount];
    }
    let nextBillDate = new Date(record[FLD.RecurringBills.BillDate]);

    for (i = 1; i <= quantity; i++) {
        
        switch (period) {
            case `Daily`   : nextBillDate.setDate(nextBillDate.getDate() + periods);
            case `Weekly`  : nextBillDate.setDate(nextBillDate.getDate() + (periods * 7));
            case `Monthly` : nextBillDate.setMonth(nextBillDate.getMonth() + periods);
            case `Annually`: nextBillDate.setFullYear(nextBillDate.getFullYear() + periods);
        }
        newRecord[FLD.RecurringBills.BillDate] = nextBillDate.toString();
        newRecord[FLD.RecurringBills.DueDate]  = new Date(nextBillDate.getDate() + dueDays).toString();
        if (autopay) newRecord[FLD.RecurringBills.AutopayDate] = new Date(nextBillDate.getDate() + payDays).toString();

        promises.push(db(TBL.Bills).create(newRecord));

    }

    return await Promise.all(promises);

}



async function updateScheduledRecords(recurringBill) {

    function nextDate(dateString) {
        let date = new Date(dateString);
        const periods = recurringBill[FLD.RecurringBills.Periods];
        switch (recurringBill[FLD.RecurringBills.Period]) {
            case `Daily`   : date.setDate(date.getDate() + periods); break;
            case `Weekly`  : date.setDate(date.getDate() + (periods * 7)); break;
            case `Monthly` : date.setMonth(date.getMonth() + periods); break;
            case `Annually`: date.setFullYear(date.getFullYear() + periods); break;
        }
        return date.toString();
    }

    async function addRecord(billDate, dueDate, payDate) {

        // ADD A NEW BILL
        let billNum = await uniqueNum.getRandom(TBL.Bills);
        let newBill = await db(TBL.Bills).create({
            [FLD.Bills.Account]       : sub(recurringBill, FLD.RecurringBills.Account, `id`),
            [FLD.Bills.Amount]        : recurringBill[FLD.RecurringBills.BillAmount],
            [FLD.Bills.Autopay]       : recurringBill[FLD.RecurringBills.Autopay],
            [FLD.Bills.BillDate]      : billDate,
            [FLD.Bills.DueDate]       : dueDate,
            [FLD.Bills.Number]        : billNum,
            [FLD.Bills.RecurringBill] : recurringBill.id
        });
        let results = [newBill];

        // ADD A NEW PAYMENT
        if (recurringBill[FLD.RecurringBills.Autopay] == `Yes`) {
            let paymentNum = await uniqueNum.getRandom(TBL.Payments);
            let newPayment = await db(TBL.Payments).create({
                [FLD.Payments.Account]       : sub(recurringBill, FLD.RecurringBills.Account, `id`),
                [FLD.Payments.Amount]        : recurringBill[FLD.RecurringBills.PaymentAmount],
                [FLD.Payments.Bill]          : newBill.data[0].id,
                [FLD.Payments.Date]          : payDate,
                [FLD.Payments.Number]        : paymentNum,
                [FLD.Payments.RecurringBill] : recurringBill.id,
                [FLD.Payments.Reference]     : recurringBill[FLD.RecurringBills.PaymentReference],
                [FLD.Payments.Type]          : recurringBill[FLD.RecurringBills.PaymentType]
            });
            results.concat(newPayment);

        }

        // RETURN THE RESULTS
        return results;

    }

    try {

        //INITIALIZE
        let promises = [];

        // GET EXISTING BILLS RELATED TO THIS RECURRING BILL
        let scheduledBills = await db(TBL.Bills)
            .filter(FLD.Bills.Date, `is after today`)
            .filter(FLD.Bills.RecurringBill, `is`, recurringBill.id)
            .filter(FLD.Bills.Exists, `is`, 1)
            .sort(FLD.Bills.Date, `asc`)
            .get().data;
        let scheduledCount = recurringBills[FLD.RecurringBills.ScheduledCount] || 0;
        let scheduledQty   = recurringBills[FLD.RecurringBills.ScheduledQty] || 0;

        // TOO FEW BILLS - ADD NEW BILLS AND PAYMENTS
        if (scheduledCount < scheduledQty) {
            let billDate = recurringBill[FLD.RecurringBills.NextBillDate];
            let dueDate  = recurringBill[FLD.RecurringBills.NextDueDate];
            let payDate  = recurringBill[FLD.RecurringBills.NextPaymentDate];
            let addQty   = scheduledQty - scheduledCount;
            for (let i = 0; i < addQty; i++) {
                promises.push(addRecord(billDate, dueDate, payDate));
                billDate = nextDate(billDate);
                dueDate  = nextDate(dueDate);
                payDate  = nextDate(payDate);
            }
        }

        // TOO MANY BILLS - DELETE THE EXTRA
        else if (scheduledCount > scheduledQty) {
            scheduledBills.slice(quantity).forEach(scheduledBill => {
                promises.push(db(TBL.Bills).key(scheduledBill.id).update({[FLD.Bills.Deleted] : true}));
            });
        }

        // UPDATE THE NEXT BILL & DUE DATES
        const createDate = scheduledBills[0][FLD.Bills.Date];
        if (recurringBill[FLD.RecurringBills.Ongoing] == `Yes`) {
            promises.push(db(TBL.RecurringBills).key(recurringBill.id).update({
                [FLD.RecurringBills.NextCreateDate]  : createDate,
                [FLD.RecurringBills.NextBillDate]    : billDate,
                [FLD.RecurringBills.NextDueDate]     : dueDate, 
                [FLD.RecurringBills.NextPaymentDate] : recurringBill[FLD.RecurringBills.Autopay] == `Yes` ? payDate : ``   
            }));
        } else {
            promises.push(db(TBL.RecurringBills).key(recurringBill.id).update({
                [FLD.RecurringBills.NextCreateDate]  : ``,
                [FLD.RecurringBills.NextBillDate]    : ``,
                [FLD.RecurringBills.NextDueDate]     : ``, 
                [FLD.RecurringBills.NextPaymentDate] : ``       
            }));
        }

        // WRITE CHANGES
        let response = await Promise.all(promises);

        // CLEANUP & RETURN
        Knack.hideSpinner();
        return response;

    } catch(error) {

        // NOTIFY ERROR
        await MsgBox(`There was an error updating the scheduled Bills and/or Payments!`, error);
        return error;

    }

}


async function updateCreateDate(recurringBillKey) {

    try {

        // INITIALIZE
        Knack.showSpinner();

        // GET SCHEDULED BILLS
        let scheduledBills = await db(TBL.Bills)
            .filter([FLD.Bills.Date], `is after today`)
            .filter([FLD.Bills.Exists], `is`, 1)
            .sort(FLD.Bills.Date, `asc`)
            .get().data;

        // GET EARLIEST SCHEDULED BILL DATE
        let firstDate = scheduledBills[0][FLD.Bills.Date];

        // UPADATE THE RECURRING BILL
        let update = await db(TBL.RecurringBills)
            .key(recurringBillKey)
            .update({ [FLD.RecurringBills.NextCreateDate] : firstDate });
        
        // CLEANUP & RETURN
        Knack.hideSpinner();
        return update;

    } catch(error) {

        // NOTIFY USER
        await MsgBox(`There was an error updating the Recurring Bills next Creation Date!`, error);
        return error;

    }

}


// NOTE THIS IS ALL BEING DONE IN KNACK RECORD RULES
/*function updateScheduled(view, record) {

    if (record[FLD.Bills.RecurringBill]) {
        tableNum = view.source.object;
        let scheduledBills = await db(TBL.Bills)
            .filter([FLD.Bills.Date], `is after today`)
            .filter([FLD.Bills.Exists], `is`, 1)
            .get().data;
        let scheduledQty = scheduledBills.length
        let update = db(tableNum).key(record[FLD.Bills.RecurringBill]).update({[FLD.RecurringBills.ScheduledQuanity] : scheduledQty})
    }

    // if you manually add or delete a bill or payment, the scheduled quantity is updated on the recurring bill
    // note: also handle undeleted here
    // if scheduled quantity is 0 then ongoing is false????? how does it get back to ongoing when scheduled quantity is above 0?
    // this can all be done in knack i thingk

}*/