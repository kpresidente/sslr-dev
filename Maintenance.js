const maintenance = {
	abbreviateAddresses,
	updateKeys,
    createAllShares,
	fixProjectFolders,
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                       //
//  FUNCTION   : abbreviateAddresses                                                                                     //
//  PARAMETERS : tables = array of table numbers to update                                                               //
//  RETURNS    : prints results to console                                                                               //
//                                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function abbreviateAddresses(tables) {
	const states = {
		Alabama: "AL",
		Alaska: "AK",
		Arizona: "AZ",
		Arkansas: "AR",
		California: "CA",
		Colorado: "CO",
		Connecticut: "CT",
		Delaware: "DE",
		District_of_Columbia: "DC",
		Florida: "FL",
		Georgia: "GA",
		Hawaii: "HI",
		Idaho: "ID",
		Illinois: "IL",
		Indiana: "IN",
		Iowa: "IA",
		Kansa: "KS",
		Kentucky: "KY",
		Lousiana: "LA",
		Maine: "ME",
		Maryland: "MD",
		Massachusetts: "MA",
		Michigan: "MI",
		Minnesota: "MN",
		Mississippi: "MS",
		Missouri: "MO",
		Montana: "MT",
		Nebraska: "NE",
		Nevada: "NV",
		New_Hampshire: "NH",
		New_Jersey: "NJ",
		New_Mexico: "NM",
		New_York: "NY",
		North_Carolina: "NC",
		North_Dakota: "ND",
		Ohio: "OH",
		Oklahoma: "OK",
		Oregon: "OR",
		Pennsylvania: "PA",
		Rhode_Island: "RI",
		South_Carolina: "SC",
		South_Dakota: "SD",
		Tennessee: "TN",
		Texas: "TX",
		Utah: "UT",
		Vermont: "VT",
		Virginia: "VA",
		Washington: "WA",
		West_Virginia: "WV",
		Wisconsin: "WI",
		Wyoming: "WY",
	}(() => {
		var promises = tables
			.map((table) => {
				var addrFlds = TBL[table].fields.models.filter(
					(field) => field.attributes.type == "address"
				);
				console.log(
					`${addrFlds.length} address fields found in ${TBL[table]}.`
				);
				if (addrFlds.length) {
					return db(table).get();
				} else {
					return false;
				}
			})
			.filter((promises) => {
				return promises != false;
			});
		return Promise.all(promises);
	})()
		.then((responses) => {
			var records = responses.map((response) => response.data);
			return []
				.concat(...records)
				.map((record) => {
					var updateFlds = Object.keys(record)
						.filter((field) => {
							try {
								return FLD[field].attributes.type == "address";
							} catch (e) {
								return false;
							}
						})
						.map((addrFld) => {
							var stateFull = (sub(record, addrFld, "state") || "")
								.trim()
								.replace(" ", "_");
							var stateAbbr = stateFull in states ? states[stateFull] : false;
							if (stateAbbr) {
								var value = {
									street: sub(record, addrFld, "street") || "",
									street2: sub(record, addrFld, "street2") || "",
									city: sub(record, addrFld, "city") || "",
									state: stateAbbr || "",
									zip: sub(record, addrFld, "zip") || "",
								};
								return { [addrFld]: value };
							} else {
								return false;
							}
						})
						.filter((fldIsUpdated) => {
							return fldIsUpdated !== false;
						});
					if (updateFlds.length) {
						var payload = {};
						updateFlds.forEach((updateFld) => {
							Object.assign(payload, updateFld);
						});
						return {
							table: FLD[Object.keys(payload)[0]].attributes.object_key,
							key: record.id,
							payload: payload,
						};
					} else {
						return false;
					}
				})
				.filter((recordIsUpdate) => {
					return recordIsUpdate != false;
				});
		})
		.then((payloads) => {
			var trials = {};
			console.log(`Total records to update = ${payloads.length}`);
			payloads.forEach((payload) => {
				updateAddress(payload.table, payload.key, payload.payload);
			});
			function updateAddress(table, key, payload) {
				db(table)
					.key(key)
					.update(payload)
					.then(() => {
						console.log(`SUCCESS!  Updated address record!`);
					})
					.catch(() => {
						console.log(`FAILURE!  Retrying to update address record...`);
						if (`${table}.${key}` in trials) {
							trials[`${table}.${key}`]++;
						} else {
							trials[`${table}.${key}`] = 1;
						}
						if (trials[`${table}.${key}`] < 10) {
							updateAddress(table, key, payload);
						} else {
							console.log(`COMPLETE FAILURE UPDATING ADDRESS RECORD!`);
						}
					});
			}
		});
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                       //
//  FUNCTION   : updateKeys                                                                                              //
//  PARAMETERS : tables = array of table numbers to update                                                               //
//  RETURNS    : prints results to console                                                                               //
//                                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function updateKeys(tables, limit) {
	var apiCalls = 1;

	// GET RECORDS FOR EACH TABLE THAT HAVE BLANK KEYS
	var tablesRecs = tables.map((table) => {
		apiCalls++;
		return db(table).filter(FLD[table].Key, `is blank`).get();
	});
	tableRecs = await Promise.all(tablesRecs);

	// CONVERT TO A LIST OF TABLE/KEYS THAT NEED TO BE UPDATED
	var updates = tablesRecs
		.map((tableRecs, i) => {
			return tableRecs.data.map((tableRec) => ({
				table: table[i],
				key: tableRec.id,
			}));
		})
		.flat();

	updates.map((update) => {
		if (apiCalls > limit) {
			throw `Script cancelled! Using too many API calls (${apiCalls} of ${limit}). Try again tomorrow.`;
		} else {
			return updateKey(table, record.id);
		}
	});

	async function updateKey(table, recordKey, trial = 1) {
		apiCalls++;
		try {
			let response = await db(table)
				.key(recordKey)
				.update({ [FLD[table].Key]: recordKey });
			console.log(
				`${apiCalls}). ${TBL[table].attributes.name
				} - ${recordKey} = SUCCESS`
			);
			return response;
		} catch (error) {
			if (trial < 10) {
				console.log(
					`${apiCalls}). ${TBL[table].attributes.name
					} - ${recordKey} = TRY AGAIN`
				);
				return updateKey(table, recordKey, trial++);
			} else {
				console.log(
					`${apiCalls}). ${TBL[table].attributes.name
					} - ${recordKey} = FAILED`
				);
			}
		}
	}
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                       //
//  FUNCTION   : fixProjectFolders                                                                                       //
//  PARAMETERS :                                                                                                         //
//  RETURNS    :                                                                                                         //
//                                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function fixProjectFolders() {
	const ACTIVE = `/projects`;
	const ARCHIVED = `/maintenance/archived`;

	// GET ALL PROJECT FOLDERS
	let folders = [ACTIVE, ARCHIVED].map((mainFolder) => pf().getFolderContents(mainFolder));
	folders = await Promise.all(folders);
	folders = folders.flat().filter(entry => entry[`.tag`] == `folder`);

	// GET ALL PROJECTS
	let projects = await db(TBL.Projects).get();
	projects = projects.data;

	// GET FOLDERS THAT ARE MISSING PROJECTS
	let updateEntries = folders.filter(folder => {
		let missingProject = projects.any(project => project[FLD.Projects.FolderPath].toLowerCase() == folder.path_lower);
		let alreadyRenamed = folder.path_lower.startsWith(`_`);
		return missingProject && !alreadyRenamed;
	}).map(folder => {
		return {
			from_path: folder.path_display,
			to_path: folder.path_display.replace(folder.name, `_${folder.name}`),
		};
	});

	// RENAME FOLDERS THAT ARE MISSING PROJECTS WITH A "_" IN FRONT
	let updates = new Promise(async (resolve) => {
		if (updateEntries.length) {
			let dbx = new Dropbox.Dropbox({
				accessToken: `bYsAjnjg6cQAAAAAAAA4iN2lniNH91qM_98WNh8_iTuT8L9gZT_u-oApgv4GlBcs`,
			});
			let response = await dbx.filesMoveBatchV2({
				entries: updateEntries,
				autorename: true,
			});
			let intervalID = setInterval(async () => {
				let response = await dbx.moveBatchCheckV2(response);
				if (`complete` in response) {
					clearInterval(intervalID);
					resolve(response);
				}
			}, 5000);
		} else {
			resolve([]);
		}
	});

	// GET PROJECTS THAT ARE MISSING FOLDERS
	let creations = [];
	let missingFolders = projects.filter((project) => {
		folderMissing = !folders.find(
			(folder) =>
				folder.path_lower == project[FLD.Projects.FolderPath].toLowerCase()
		);
		projectExists = project[FLD.Projects.Exists] == 1;
		return projectExists && folderMissing;
	});
	missingFolders.forEach((project) => {
		creations.push(pf({ source: { object: TBL.Projects } }).create(project));
	});
	missingFolders = missingFolders.map(
		(project) => project[FLD.Projects.FolderPath]
	);

	// CREATE MISSING FOLDERS
	creations = await Promise.all(creations);

	// RETURN THE RESULTS
	let results = {
		missing: {
			folders: missingFolders,
			projects: missingProjects,
		},
		fixes: {
			createdFolders: creations,
			renamedFolders: updates,
		},
	};
	console.log(results);
	return results;
}



async function createAllShares() {
    const failures = [];
    const successes = [];
    const records = await db(TBL.Projects).filter(FLD.Status, "is", "Installing").get().then(r => r.data);
    console.log("count = " + records.length);
    let i = 1;
    for (rec of records) {
        console.log(i);
        const con = window.confirm(`Create shared folder for ${rec[FLD.Projects.Name]} - ${rec[FLD.Projects.Number]}?`);
        if (con) {
            window.sleep(1000);
            await pf().createShared(record)
                .then(r => successes.push(id))
                .catch(r => failures.push(id));
            i++;
        }
    }
    console.log(`successes = `);
    console.log(successes);
    console.log(`failures = `);
    console.log(failures);
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                       //
//  FUNCTION   : duplicateNumbers                                                                                        //
//  PARAMETERS :                                                                                                         //
//  RETURNS    :                                                                                                         //
//                                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function duplicateNumbers(table) {
	table = table || Knack.objects.map((table) => table.key);
	if (!`Number` in FLD[table]) return `table has no number field!`;

	response = await db(table).get();
	duplicates = response.data.filter((record) => {
		duplicate = response.data.some(
			(record2) => record2[[FLD].Number] == record[[FLD].Number]
		);
		return duplicates.length;
	});
}

// UPLOAD ALL RECEIPTS
/*
// GET THE RECEIPTS RECORDS
function updateReceiptFiles(receiptsTable) {
	Knack.showSpinner();


	// GET CONTRACT RECORDS
	await return db(receiptsTable).get()

	// UPDATE EACH CONTRACT'S PRIOR INVOICES
	.then(response => {
		response.data.forEach(receipt => {
			var oldfile = 'C:\Users\Keith Sterling\Dropbox' + receipt[FLD.Receipts.FolderPath].replace("\","/");
			var newFile = "";


		});

	// HANDLE ERRORS
	}).catch(response => {
		console.log(response.statusText);

	// CLEANUP & RETURN
	}).then(response => {
		Knack.hideSpinner();
		return response;
	});

}
*/

/*
async function fixfolders(){
debugger;
	const folders = [
		"Architect-Engineer/BL Companies - 369438",
		"Architect-Engineer/Black & Veatch Engineers/Architects - 185965",
		"Architect-Engineer/Elevate Architecture Studio - 526723",
		"Architect-Engineer/Foil Wyatt & Jove/Daniels/Busby Architects - 554083",
		"Architect-Engineer/Ward, Scott, Vernon Architects Inc - 976454",
		"Business Service/Dropbox - 576893",
		"Business Service/Imperial PFS - 622816",
		"Electrical Contractor/A B Blake - 747293",
		"Electrical Contractor/A&J Electric, LLC - 506849",
		"Electrical Contractor/A-1 Electrical Contractors, Inc. - 501813",
		"Electrical Contractor/ABT Products and Services, Ltd. - 605188",
		"Electrical Contractor/AEC Electrical Contractors, Inc.    (N-FL) - 843206",
		"Electrical Contractor/Access Data Network Solutions, Inc. - 203362",
		"Electrical Contractor/Alabama Electric Company, Inc. - 616139",
		"Electrical Contractor/Allied Electric, Inc. - 406008",
		"Electrical Contractor/American Commercial Industrial Electrical - 895405",
		"Electrical Contractor/Andrews Electric - 807204",
		"Electrical Contractor/Audet Electric - 823266",
		"Electrical Contractor/B&B Electrical Service of Warsaw - 436831",
		"Electrical Contractor/Babcon Inc. - 993575",
		"Electrical Contractor/Big River Electric - 846876",
		"Electrical Contractor/Big State Electric - 161907",
		"Electrical Contractor/Bilbrough's Electric - 637822",
		"Electrical Contractor/Bryant-Durham Services - 559468",
		"Electrical Contractor/Buhl Electric, Inc - 520677",
		"Electrical Contractor/Chief Electric Company - 499673",
		"Electrical Contractor/Christian and Sons - 621252",
		"Electrical Contractor/Co-Ben Electric  Co - 732558",
		"Electrical Contractor/Consolidated Electric Service, L.C. - 701692",
		"Electrical Contractor/Conti Electric Florida - 103927",
		"Electrical Contractor/Cooper Electrical Construction Co.  (Raleigh) - 556242",
		"Electrical Contractor/Curtis Electric, Inc. - 722129",
		"Electrical Contractor/Dennis Electric - 174488",
		"Electrical Contractor/Dobbs & Co. Electrical Contractors - 468905",
		"Electrical Contractor/Dynalectric Florida - 732410",
		"Electrical Contractor/Ekmark Electric - 371817",
		"Electrical Contractor/Ellendale Electric - 861985",
		"Electrical Contractor/Empire Electric - 808307",
		"Electrical Contractor/First Electric, Inc. - 478751",
		"Electrical Contractor/Fountain Electric and Services - 819135",
		"Electrical Contractor/G. W. May - 500794",
		"Electrical Contractor/Garnet Electric Co., Inc. - 654545",
		"Electrical Contractor/Grigg Electrical Company - 591003",
		"Electrical Contractor/Guest Electric Company LLC - 396303",
		"Electrical Contractor/H&W Electrical - 661252",
		"Electrical Contractor/Hayes and Lunsford - 906635",
		"Electrical Contractor/Helix Electric - 601984",
		"Electrical Contractor/Hewitt Power - 711691",
		"Electrical Contractor/Hy-Power Electric and Utility Company - 977622",
		"Electrical Contractor/Inglett & Stubbs LLC - 367943",
		"Electrical Contractor/Ion Electric - 187347",
		"Electrical Contractor/J. Moore Electrical Contractors - 653941",
		"Electrical Contractor/Jesse Stutts Inc - 555088",
		"Electrical Contractor/Johnson Electric - 822242",
		"Electrical Contractor/Kelly's Electrical Servicve LLC - 495494",
		"Electrical Contractor/Kolb Electric - 164382",
		"Electrical Contractor/L. L. Vann - 393567",
		"Electrical Contractor/Lee Company - 345132",
		"Electrical Contractor/Liberty Electrical Contractors - 635244",
		"Electrical Contractor/Long-McGehee Electric Co. - 166342",
		"Electrical Contractor/Lowrie Electric - 511490",
		"Electrical Contractor/M&L Electrical, Inc. - 642289",
		"Electrical Contractor/M-W Electric - 124623",
		"Electrical Contractor/MMR Group - 831801",
		"Electrical Contractor/MNE Electric and MaineNet Enterprises, LLC - 163807",
		"Electrical Contractor/McCrory Electric Co. - 910930",
		"Electrical Contractor/McLemore Electric - 280960",
		"Electrical Contractor/Metro Electric Co., Inc. - 464681",
		"Electrical Contractor/Mid-South Electric Contractors, Inc - 934368",
		"Electrical Contractor/Mills & Farmer, Inc - 984914",
		"Electrical Contractor/Miracle Electric - 721169",
		"Electrical Contractor/Moonlite Electric & Construction - 632520",
		"Electrical Contractor/Moore's Electrical and Mechanical Construction, Inc. - 142647",
		"Electrical Contractor/Mott Electric - 365814",
		"Electrical Contractor/Moyer Electric - 400815",
		"Electrical Contractor/NECA DC - 806248",
		"Electrical Contractor/NECA National Database - 190887",
		"Electrical Contractor/Nixon Power Services Co. - 643205",
		"Electrical Contractor/Owen Electric Company - 463740",
		"Electrical Contractor/Patco Electrical Contractors - 515997",
		"Electrical Contractor/Paul Patrick Electric Inc  - 499180",
		"Electrical Contractor/Petranka Contracting, LLC - 333111",
		"Electrical Contractor/Phelps Electric - 878751",
		"Electrical Contractor/Premier Service Co - 922389",
		"Electrical Contractor/Prism Electric - 971218",
		"Electrical Contractor/Pyramid Electric, Inc. - 535635",
		"Electrical Contractor/Rains Electric Company - 792718",
		"Electrical Contractor/Ready Electric Co. Inc, - 759454",
		"Electrical Contractor/Rick's Electric Incorporated - 240035",
		"Electrical Contractor/River Town Electric LLC - 878227",
		"Electrical Contractor/Rudy L. Hawkins Electrical Contractors, Inc. - 406249",
		"Electrical Contractor/S & W Contracting - 458105",
		"Electrical Contractor/S&S Electric - 541726",
		"Electrical Contractor/Sammarco Electric Company - 475280",
		"Electrical Contractor/Schaffhouser Electric - 985133",
		"Electrical Contractor/Shaum Electric - 423153",
		"Electrical Contractor/Shelby Electric Co - 769873",
		"Electrical Contractor/Southeast Electric Inc. - 252677",
		"Electrical Contrator/Standard Electric - 762284",
		"Electrical Contractor/Stansell Electric Company, Inc. - 520419",
		"Electrical Contractor/Story Electrical Services, Inc. - 161764",
		"Electrical Contractor/Suncoast Electric and Networking, Inc. - 655285",
		"Electrical Contractor/T&H Electric - 866758",
		"Electrical Contractor/Tirone Electric - 791562",
		"Electrical Contractor/Titus Electrical - 269806",
		"Electrical Contractor/Triangle Electrical Services, Inc. - 508702",
		"Electrical Contractor/Unger Electric - 124323",
		"Electrical Contractor/W.B. Moore Company of Charlotte - 282242",
		"Electrical Contractor/Walker and Whiteside  - 912400",
		"Electrical Contractor/Warren Electric - 602221",
		"Electrical Contractor/Wells And Tate Electric Company Inc - 817704",
		"General Contractor/AMG & Associates - 763664",
		"General Contractor/American Constructors, Inc. - 928028",
		"General Contractor/B2 Constructors, LLC  - 578353",
		"General Contractor/Barlovento, LLC - 238972",
		"General Contractor/Baron Construction LLC - 547628",
		"General Contractor/Ben Cox Company, LLC - 484230",
		"General Contractor/Ben M Radcliff Contractors - 808485",
		"General Contractor/Biscan Construction - 989336",
		"General Contractor/Blue Rock Structures, Inc. - 608225",
		"General Contractor/Bohicket Construction LLC - 586659",
		"General Contractor/Bordeaux Construction Company - 745320",
		"General Contractor/Boyce Ballard Construction LLC - 910696",
		"General Contractor/Branks General Contracting - 347677",
		"General Contractor/Brantley Construction - 408890",
		"General Contractor/Brooker Construction Group - 642435",
		"General Contractor/C70 Builders, Inc - 952989",
		"General Contractor/CB Construction Services, LLC - 905623",
		"General Contractor/Calhoun Construction Services - 287117",
		"General Contractor/Cape Romain Contractors Inc - 922755",
		"General Contractor/Chris Woods Construction Company  - 462676",
		"General Contractor/Churchill McGee - 955106",
		"General Contractor/Civil Works, Contracting, LLC - 554459",
		"General Contractor/Coastal Construction Group of South Florida, Inc. - 291900",
		"General Contractor/Coburn Contractors - 856334",
		"General Contractor/Colcon Corporation - 715566",
		"General Contractor/Commonwealth Construction Co Inc - 124661",
		"General Contractor/Contego Environmental, LLC - 623007",
		"General Contractor/David Boland Inc - 599030",
		"General Contractor/Deangelis Diamond - 221957",
		"General Contractor/Design Build Corporation - 946170",
		"General Contractor/Encon Desbuild JV2 LLC - 391396",
		"General Contractor/FBi Construction - 515624",
		"General Contractor/Firewatch Contracting - 233228",
		"General Contractor/Freeman and Associates - 738808",
		"General Contractor/Frizzell Construction Co., Inc. - 923594",
		"General Contractor/Futron, Inc - 799321",
		"General Contractor/GSI Construction Corporation, Inc.   (FL) - 444329",
		"General Contractor/Garco - 856114",
		"General Contractor/Garney Construction - 131581",
		"General Contractor/George Hicks Construction, Inc. - 202959",
		"General Contractor/Gleeson Builders - 477255",
		"General Contractor/Green-Simmons Company Inc - 391619",
		"General Contractor/HG Reynolds - 843620",
		"General Contractor/Hagerman Construction Corp - 813093",
		"General Contractor/Hill Construction Services of Charleston - 334646",
		"General Contractor/Hillwood Construction Services - 907434",
		"General Contractor/Hitt Contracting, Inc. - 416697",
		"General Contractor/Holley-Henley Builders - 275909",
		"General Contractor/Hospitality Building Services - 306997",
		"General Contractor/Hudson Brothers Construction Co. - 387895",
		"General Contractor/IMEC Group, LLC - 448744",
		"General Contractor/Integrated Construction of Jacksonville LLC - 321294",
		"General Contractor/J Raymond Construction Corporation - 192837",
		"General Contractor/JM Cope - 595978",
		"General Contractor/JM Thompson - 284893",
		"General Contractor/John C Grimberg - 117242",
		"General Contractor/Joyce & Associates Construction, Inc. - 712815",
		"General Contractor/K-W Construction, Inc - 997817",
		"General Contractor/KBE Building Corp - 577014",
		"General Contractor/Kirk Airport Solutions, Inc. - 465430",
		"General Contractor/Leebcor Services - 428915",
		"General Contractor/Leitner Construction Co. - 780145",
		"General Contractor/Lord and Son - 906697",
		"General Contractor/MPS Engineering and Construction - 634147",
		"General Contractor/MW Rogers Construction Co., LLC - 669022",
		"General Contractor/Marsh Development, Inc - 847202",
		"General Contractor/Matcon Construction Services - 895600",
		"General Contractor/Metcon Construction - 606919",
		"General Contractor/Military & Federal Construction Co., Inc. - 716609",
		"General Contractor/Monolith Construction LLC - 706792",
		"General Contractor/Morette Company - 979532",
		"General Contractor/Moss - 618757",
		"General Contractor/NISOU Enterprises, Inc. - 709918",
		"General Contractor/Nachman Construction - 589793",
		"General Contractor/Olympic Enterprises, Inc. - 334400",
		"General Contractor/Owens Construction, Inc. - 936560",
		"General Contractor/Path Construction - 500146",
		"General Contractor/Patillo Construction - 776389",
		"General Contractor/Patriot Construction, LLC - 192769",
		"General Contractor/Polk and Associates - 603196",
		"General Contractor/Polydyne, Inc. - 398825",
		"General Contractor/Pyramid Contracting, LLC - 921727",
		"General Contractor/Quadrant Construction, Inc. - 204371",
		"General Contractor/R&W Construction Company, Inc. - 982055",
		"General Contractor/R.C. Construction Co., Inc.  - 794720",
		"General Contractor/R.W. Davidson Contracting LLC - 327848",
		"General Contractor/REYCO Contracting Solutions - 392038",
		"General Contractor/Rand Enterprises, Inc - 389189",
		"General Contractor/Reasor-Asturian JV, LLC - 357667",
		"General Contractor/Reed-Hayes Construction - 580230",
		"General Contractor/Ripa & Associates - 732607",
		"General Contractor/Romeo Guest - 161106",
		"General Contractor/Ross Environmental/Civil Contractor - 653927",
		"General Contractor/Roundhouse PBN - TEPA EC Joint Venture - 561575",
		"General Contractor/Roundhouse PBN, LLC. - 141022",
		"General Contractor/Roy Anderson Corporation - 135521",
		"General Contractor/Schaerer Contracting Company - 151281",
		"General Contractor/Semper Tek, Inc.  - 825070",
		"General Contractor/Shiel Sexton - 542297",
		"General Contractor/Smithson, Inc. - 724252",
		"General Contractor/SouthCon Building Group LLC - 806826",
		"General Contractor/Speegle Construction Inc - 932456",
		"General Contractor/Stallings and Son, Inc. - 257974",
		"General Contractor/Standard Builders - 476957",
		"General Contractor/Suffolk - 919701",
		"General Contractor/Summers-Taylor, Inc.  - 720442",
		"General Contractor/Sunesis Construction Co. - 649443",
		"General Contractor/Superior Construction Company - 234174",
		"General Contractor/T.E. Davis - 333783",
		"General Contractor/Tri Core Builders - 279622",
		"General Contractor/WB Brawley Company - 300182",
		"General Contractor/Waller Corporation - 888846",
		"General Contractor/Walsh Turner Joint Venture - 345657",
		"General Contractor/Wescott Construction LLC - 267071",
		"General Contractor/Wilkie Construction Company, Inc - 946827",
		"General Contractor/Willow Construction, LLC - 177509",
		"Other/AAA East Tennessee - 164898",
		"Other/ADP Fees - 616930",
		"Other/ADP Payroll Taxes - 495929",
		"Other/ADP Wages - 169990",
		"Other/Alabama - Secretary of State - 581760",
		"Other/American Self Storage - 876628",
		"Other/Anthem BCBS - Danny S - 396466",
		"Other/AutoDesk Store - 112058",
		"Other/Comcast of Tennessee - 168233",
		"Other/Dodge - 527079",
		"Other/Erie Insurance - 685133",
		"Other/Georgia - Secretary of State - 121946",
		"Other/Holy Temple of God Danville  - 923274",
		"Other/InCorp Services, Inc. - 824049",
		"Other/Kentucky - Secretary of State - 391295",
		"Other/Knoxville Fire Fighters - 405727",
		"Other/Laurel Association Insurance - 502253",
		"Other/Liberty Mutual - 456034",
		"Other/Nissan Motor Acceptance Corp - 645586",
		"Other/Office Depot - 846221",
		"Other/One Source - 238915",
		"Other/Pay Chex - 400876",
		"Other/Pay Chex - 502242",
		"Other/Progressive Insurance - 654099",
		"Other/Staples - 834155",
		"Other/T-Sheets - 522802",
		"Other/Tennessee Department of Revenue - 605516",
		"Other/Test - 287795",
		"Other/Test - 524713",
		"Other/Test - 805582",
		"Other/United Rentals - 453715",
		"Other/Verizon Wireless for Business - 372517",
		"Other/WIX - 245016",
		"Other/Wells Fargo Dealer Services - 355252",
		"Other/Y-12 Federal Credit Union - 266502",
		"Owner/Cloud Residence - 349384",
		"Owner/Cloud Residence - 608193",
		"Owner/Doran Residence - 106625",
		"Owner/Ean Brandon - 951942",
		"Owner/Justin Harvey - 762555",
		"Owner/Petree Residence - 436693",
		"Owner/Petree Residence - 956194",
		"Owner/University Of Tennessee - 295979",
		"Owner/Wallace State Community College - 102786",
		"Owner/Winfrey Residence - 787441",
		"Owner/Wing Residence - 485155",
		"Roofing Contractor/Bluebird Roofing - 841441"
	].map(fld => "/Company Files/" + fld);


	const subfolders = folders.flatMap(fld => {
		return [
			fld + "/Bills",
			fld + "/Payments",
			fld + "/Receipts"
		]
	});

	dbx = new Dropbox.Dropbox({ accessToken : `bYsAjnjg6cQAAAAAAAA4iN2lniNH91qM_98WNh8_iTuT8L9gZT_u-oApgv4GlBcs` });
	//const request = await dbx.filesCreateFolderBatch({
		//paths: folders,
		//autorename: false
	//});
	const request = dbx.filesCreateFolderBatch({
		paths: subfolders,
		autorename: false
	});
	//console.log(request);
	//const check = await dbx.filesCreateFolderBatchCheck({ async_job_id: "dbjid:AACDwNjHjVpYSmNrhIuIAJ7GqGfEmuw8xPXSYvKwYf-_7ZL2Ja3qOwY5BVxNf6vNJeAYvbDAXpzlxNbJQSy3lbvJ" });
	//console.log(check);
}

async function allExists() {
//debugger;
	let request = await db(TBL.Companies).filter(FLD.Companies.Exists,'is',1).get();
	let records = request.data;
	let allRequests = records.map(r => exists(r));
	let allResults = await Promise.allSettled(allRequests);
//debugger;
	let allRejected = allResults
			.filter(r => r.status == `rejected`)
			.map(r => r.reason)
			.map(r => `${r[FLD.Companies.Industry]}/${r[FLD.Companies.Name]} - ${r[FLD.Companies.Number]}`)
			.sort((a,b) => {
					if (a>b) return 1;
					if (b>a) return -1;
					return 0;
			});
	console.log(JSON.stringify(allRejected));


		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//                                                                                                                     //
	//  METHOD     : exists                                                                                                //
	//  PARAMETERS :                                                                                                       //
	//  RETURNS    :                                                                                                       //
	//                                                                                                                     //
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		async function exists(record) {
				try{
						//debugger;
						let dbx = new Dropbox.Dropbox(dbxOptionsProject);
						let path = await folderPath(record);
						let metadata = await dbx.filesGetMetadata({
								path: path,
								include_media_info: false,
								include_deleted: false,
								include_has_explicit_shared_members: false
						});
						return record;
						//console.log(metadata);
				} catch(err) {
						//console.log(err);
						return Promise.reject(record);
				}

		}
}*/
