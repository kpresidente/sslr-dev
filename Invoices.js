
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                       //
//  FUNCTION   :                                                                                                         //
//  PARAMETERS :                                                                                                         //
//  RETURNS    :                                                                                                         //
//                                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const updatePriorInvoice = async (view, record) => {

	const fldTotPct = `${FLD.Invoices.TotalPercent}_raw`;
	const priorInvoicesRequest = await db(TBL.Invoices)
		.filter(FLD.Invoices.Contract, `is`, sub(record, FLD.Invoices.Contract, `id`))
		.filter(FLD.Invoices.TotalPercent, `lower than`, record[fldTotPct])
		.filter(FLD.Invoices.Exists, `is`, 1)
		.get();
	//const priorInvoices = invoicesRequest.data.filter(invoice => invoice[fldTotPct] < record[fldTotPct]);
	const priorInvoices = priorInvoicesRequest.data;

	if (priorInvoices.length === 0) return;

	const priorInvoice = priorInvoices.reduce((prevInvoice, currInvoice) => {
		return (prevInvoice[fldTotPct] > currInvoice[fldTotPct]) ? prevInvoice : currInvoice;
	});

	const updateData = { [FLD.Invoices.PriorInvoice] : priorInvoice.id }
	const updateRequest = await db(TBL.Invoices).key(record.id).update(updateData);
	return updateRequest;

}


/*
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                       //
//  FUNCTION   :                                                                                                         //
//  PARAMETERS :                                                                                                         //
//  RETURNS    :                                                                                                         //
//                                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var updatePercents = function(changeOrder) {
	Knack.showSpinner();
	let contractID = changeOrder[FLD.ChangeOrders.Contract];
	let contract = db(TBL.Contracts).key(contractID).get();
	let invoices = db(TBL.Invoices).filter(FLD.Invoices.Contract, "is", contractID).get();
	return Promise.all([contract, invoices]).then(([contract, invoices]) => {
		let contract = contract.data;
		let invoices = invoices.data;
		let updates = invoices.map(invoice => {
			return {
				invoiceID : invoice.id,
				[FLD.Invoices.ContractAmount] : contract[FLD.Contracts.CurrentAmount],
				[FLD.Invoices.TotalPercent] : invoice[FLD.Invoices.Amount] / contract[FLD.Contracts.CurrentAmount]
			}
		}).map(update => {
			let invoiceID = update.invoiceID;
			delete update.invoiceID;
			return db(TBL.Invoices).key(invoiceID).update(update);
		});
		return Promise.all(updates);
	}).catch(error => {
		MsgBox(error);
	}).then(() => {
		Knack.hideSpinner();
	});
}
*/
