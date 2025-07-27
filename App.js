// // SET THE SITE ICON ON APPLE DEVICES
// [`57x57`,`72x72`,`114x114`,`144x144`].forEach(size => {
//   $(`head`).append(`<link rel="apple-touch-icon-precomposed" sizes="${size}" href="pathtoicon.png"/>`);
// });


/////////////////////////////////////////////
//                                         //
//  LOAD EXTERNAL FILES                    //
//                                         //
/////////////////////////////////////////////
debugger;
const filesLoaded = (() => {
    let files = {};
    if (window.devMode) {
        files = {
            Archives:      `https://cdn.jsdelivr.net/gh/kpresidente/sslr-dev/Archives.js`,
            ClearZeros:    `https://cdn.jsdelivr.net/gh/kpresidente/sslr-dev/ClearZeros.js`,
            Collection:    `https://cdn.jsdelivr.net/gh/kpresidente/sslr-dev/Collection.js`,
            CopyRecord:    `https://cdn.jsdelivr.net/gh/kpresidente/sslr-dev/CopyRecord.js`,
            DateRange:     `https://cdn.jsdelivr.net/gh/kpresidente/sslr-dev/DateRange.js`,
            Displayed:     `https://cdn.jsdelivr.net/gh/kpresidente/sslr-dev/Displayed.js`,
            Documents:     `https://cdn.jsdelivr.net/gh/kpresidente/sslr-dev/Documents.js`,
            Dropbox:       `https://unpkg.com/dropbox/dist/Dropbox-sdk.min.js`,
            Emails:        `https://cdn.emailjs.com/dist/email.min.js`,
            Invoices:      `https://cdn.jsdelivr.net/gh/kpresidente/sslr-dev/Invoices.js`,
            Maintenance:   `https://cdn.jsdelivr.net/gh/kpresidente/sslr-dev/Maintenance.js`,
            MiniPDF:       `https://cdn.jsdelivr.net/gh/kpresidente/sslr-dev/minipdf.js`,
            PDFForm:       `https://cdn.jsdelivr.net/gh/kpresidente/sslr-dev/pdfform.js`,
            Pako:          `https://cdn.jsdelivr.net/gh/kpresidente/sslr-dev/Pako.js`,
            ProjectFolder: `https://cdn.jsdelivr.net/gh/kpresidente/sslr-dev/ProjectFolder.js`,
            Records:       `https://cdn.jsdelivr.net/gh/kpresidente/sslr-dev/Records.js`,
            Recurring:     `https://cdn.jsdelivr.net/gh/kpresidente/sslr-dev/Recurring.js`,
            UniqueNumber:  `https://cdn.jsdelivr.net/gh/kpresidente/sslr-dev/UniqueNumber.js`,
            UnitPrice:     `https://cdn.jsdelivr.net/gh/kpresidente/sslr-dev/UnitPrice.js`,
            Witholding:    `https://cdn.jsdelivr.net/gh/kpresidente/sslr-dev/Witholding.js`
        }
    } else {
        files = {
            Archives:      `https://cdn.jsdelivr.net/gh/kpresidente/sslr/Archives.min.js`,
            ClearZeros:    `https://cdn.jsdelivr.net/gh/kpresidente/sslr/ClearZeros.min.js`,
            Collection:    `https://cdn.jsdelivr.net/gh/kpresidente/sslr/Collection.min.js`,
            CopyRecord:    `https://cdn.jsdelivr.net/gh/kpresidente/sslr/CopyRecord.min.js`,
            DateRange:     `https://cdn.jsdelivr.net/gh/kpresidente/sslr/DateRange.min.js`,
            Displayed:     `https://cdn.jsdelivr.net/gh/kpresidente/sslr/Displayed.min.js`,
            Documents:     `https://cdn.jsdelivr.net/gh/kpresidente/sslr/Documents.min.js`,
            Dropbox:       `https://unpkg.com/dropbox/dist/Dropbox-sdk.min.js`,
            Emails:        `https://cdn.emailjs.com/dist/email.min.js`,
            Invoices:      `https://cdn.jsdelivr.net/gh/kpresidente/sslr/Invoices.min.js`,
            Maintenance:   `https://cdn.jsdelivr.net/gh/kpresidente/sslr/Maintenance.min.js`,
            MiniPDF:       `https://cdn.jsdelivr.net/gh/kpresidente/sslr/minipdf.min.js`,
            PDFForm:       `https://cdn.jsdelivr.net/gh/kpresidente/sslr/pdfform.min.js`,
            Pako:          `https://cdn.jsdelivr.net/gh/kpresidente/sslr/Pako.js`,
            ProjectFolder: `https://cdn.jsdelivr.net/gh/kpresidente/sslr/ProjectFolder.min.js`,
            Records:       `https://cdn.jsdelivr.net/gh/kpresidente/sslr/Records.min.js`,
            Recurring:     `https://cdn.jsdelivr.net/gh/kpresidente/sslr/Recurring.min.js`,
            UniqueNumber:  `https://cdn.jsdelivr.net/gh/kpresidente/sslr/UniqueNumber.min.js`,
            UnitPrice:     `https://cdn.jsdelivr.net/gh/kpresidente/sslr/UnitPrice.min.js`,
            Witholding:    `https://cdn.jsdelivr.net/gh/kpresidente/sslr/Witholding.js`
        }
    }
    return new Promise (r => LazyLoad.js(Object.values(files), () => r(true)));
})();



window.Knack = Knack;
window.TBL = {};
window.FLDS = {};
window.FLD = {};
window.PGS = {};
window.PG = {};
window.PGVWS = {};
window.VWS = {};
window.VWT = {};
window.VW = {};

Knack.objects.models.forEach(table => {
    const tblName = table.attributes.name.replace(/ /g, ``);
    const tblNum = table.id;
    TBL[tblName] = tblNum;
    TBL[tblNum] = table;
    FLD[tblName] = {};
    FLD[tblNum] = {};
    table.fields.models.forEach(field => {
        const fldName = field.attributes.name.replace(/ /g, ``);
        const fldNum = field.id;
        FLD[tblName][fldName] = fldNum;
        FLD[tblName][fldNum] = field;
        FLD[tblNum][fldName] = fldNum;
        FLD[tblNum][fldNum] = field;
        FLD[fldNum] = field;
        FLDS[fldName] = [ ...(FLDS?.[fldName] || []), fldName ]
    });
});

Knack.scenes.models.forEach(scene => {
    const pgName = scene.attributes.name.replace(/ /g, ``);
    const pgSlug = scene.id.replaceAll(`-`, `_`);
    const pgNum = scene.attributes.key;
    PGS[pgName] = [ ...(PGS?.[pgName] || []), pgNum ];
    PG[pgSlug] = pgNum;
    PG[pgNum] = scene;
    PGVWS[pgSlug] = {};
    PGVWS[pgNum] = {};
    scene.views.models.forEach(view => {
        const vwName = view.attributes.name.replace(/ /g, ``);
        const vwNum = view.id;
        const type = view.attributes.type;
        VWS[vwName] = [ ...(VWS?.[vwName] || []), vwNum ];
        // VWS[pgSlug][vwName] = VWS[vwName];
        PGVWS[pgSlug][vwName] = [ ...(VWS?.[pgSlug]?.[vwName] || []), vwNum ];
        // VWS[pgNum][vwName] = VWS[vwName];
        PGVWS[pgNum][vwName] = PGVWS[pgSlug][vwName];
        VW[vwNum] = view;
        VWT[type] = [ ...(VWT?.[type] || []), vwNum];
    });
});
[TBL, FLDS, FLD, PGS, PG, VWS, VW, VWT].forEach(item => Object.freeze(item));



/////////////////////////////////////////////
//                                         //
//  FUNCTION: setListener                  //
//                                         //
/////////////////////////////////////////////

const VIEW_RENDER = `knack-view-render.`;
const PAGE_RENDER = `knack-page-render.`;
const RECORD_CREATE = `knack-record-create.`;
const RECORD_UPDATE = `knack-record-update.`;
const RECORD_DELETE = `knack-record-delete`;
const RECORDS_RENDER = `knack-records-render.`;
const FORM_SUBMIT = `knack-form-submit.`;
const ANY = `any`;
window.setListener = async function (knackEvent, viewpageNums, eventFunc) {
    let func = eventFunc;
    if (eventFunc.constructor.name === "AsyncFunction") {
        func = async (ev, vwpg, data) => {
            Knack.showSpinner();
            await filesLoaded;
            Knack.hideSpinner();
            await eventFunc(ev, vwpg, data);
        }
    }
    [viewpageNums]
        .flat(2)
        .filter(vwpgNum => (vwpgNum))
        .forEach(vwpgNum => $(document).on(knackEvent + vwpgNum, func));
};




/////////////////////////////////////////////
//                                         //
//  FUNCTION: MsgBox                       //
//                                         //
/////////////////////////////////////////////

{
    var _message, _subtext;
    setListener(VIEW_RENDER, VWS.Message, (event, view, data) => {
        _message = _message ? `<h2>${(_message)}</h2>` : ``;
        _subtext = _subtext ? `<blockquote style="white-space:pre-wrap">${_subtext}</blockquote>` : ``;
        $(`#${VWS.Message}`).html(_message + _subtext);
    });
    window.MsgBox = async function (message = ``, subtext = ``) {
        _message = message;
        _subtext = subtext;
        location.href = location.href + "/message";
        Knack.hideSpinner();
        return new Promise(resolve => {
            let interval = setInterval(checkMsgBox, 500);
            function checkMsgBox() {
                if (location.href.substring(location.href.length - 8, location.href.length) !== `/message`) {
                    clearInterval(interval);
                    resolve();
                }
            }
        });
    }
}



/////////////////////////////////////////////
//                                         //
//  FUNCTION: helper functions             //
//                                         //
/////////////////////////////////////////////

window.navBack = () => Knack.Navigation.redirectToParentPage();
window.sleep = async ms => new Promise(r => setTimeout(r, ms));
window.refreshData = viewNum => {
    Knack.views[viewNum].model.fetch();
}
Object.defineProperty(Array.prototype, `dedupe`, {
    value: function() { return Array.from(new Set(this)) }
})







/////////////////////////////////////////////
//                                         //
//  UI TWEAKS                              //
//                                         //
/////////////////////////////////////////////

// GLOBAL UI TWEAKS
setListener(PAGE_RENDER, ANY, (event, page) => {

    // REMOVE KNACK LINK
    document.getElementById(`kn-powered-link`)?.parentElement?.remove();

    // REMOVE MENU CARETS
    document.getElementById(`app-menu-list`)
        .children
        .forEach(e => e.firstElementChild.lastElementChild.style.display === `none`);

});


// MOVE APP-MENU AND INFO-BAR IN THE DOM
{
    const eMenu = document.getElementById(`app-menu-container`);
    document.getElementById(`kn-app-header`).after(eMenu);
    const eInfo = document.querySelector(`.kn-info-bar`);
    document.getElementById(`knack-logo`).after(eInfo);
}


// PREVENT MODALS FROM CLOSING WHEN CLICKING OUTSIDE
new MutationObserver(mutations => {
    mutations
        ?.flatMap(mut => Array.from(mut.addedNodes ?? []))
        ?.filter(eNode => eNode?.classList.contains(`kn-modal-bg`))
        ?.forEach(eNode => $(eNode).off(`click`));
}).observe(document.getElementById(`knack-dist_1`), { 
    childList: true 
});


// AUTO SELECT TEXT IN TABLE CELL EDITOR
new MutationObserver(mutations => {
    const eAddedNodes = mutations.flatMap(mut => Array.from(mut.addedNodes ?? []));
    const eEditor = eAddedNodes.find(eNode => eNode?.classList.contains(`kn-popover`))
    eEditor?.querySelector(`input[type=text]`)?.select();
}).observe(document.getElementById(`knack-body`), { 
    childList: true 
});


// EASE PAGE TRANSITIONS BY HIDING SCENE UNTIL COMPLETELY RENDERED
{

    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {

                /**
                 * scene transitions types
                 * 
                 * page to page - old scene removed, new scene added
                 * modal form opens - old scene not removed, new scene added to modal
                 * login -  old scene removed, new scene added
                 * calendar details - old scene not removed , new scene added *** does it have kn-scene?
                 * final add form - new scene added
                 * form submitted - old scene staays, new scene removed
                 * form closed - old scene stays, new scene removed
                 * 
                 * 
                 * when the scene is added, get all the child views
                 * when all child views have rendered, show the scene
                 */

                const isScene = node.classList?.contains(`kn-scene`);
                const isModal = node.classList?.contains(`kn-modal-bg`);
                const isLogin = node.firstChild?.classList?.contains(`kn-login`);
                const isCalDetails = document.getElementById(`kn-modal-details`);
                const isAddForm = document.getElementById(`connection-form-view`);

                if ((isScene || isModal) && !(isLogin || isCalDetails || isAddForm)) hideScene(node);
            });
            mutation.removedNodes.forEach(node => {
                // console.log(`removed`)
                // console.log(node);
            })
        });
    });
    observer.observe(document.getElementById(`knack-dist_1`), { childList: true });
    observer.observe(document.querySelector(`.kn-scenes`), { childList: true });
    // setListener(FORM_SUBMIT, ANY, (ev, view) => {
    //     const isModal = view.scene.modal;
    //     const isBlank = !view.inputs.length;
    //     if (isModal && !isBlank) {
    //         const node = document.querySelector(`#knack-dist_1 > .kn-scenes .kn-scene`);
    //         if (node) hideScene(node);
    //     }
    // });

    setListener(PAGE_RENDER, ANY, () => {  
        window.hiddenNodes.forEach(node => showScene(node));
    });

    function hideScene(node) {
        window.hiddenNodes.push(node);
        node.style.visibility = `hidden`;
        Knack.showSpinner();
    }
    function showScene(node) {
        node.style.visibility = `visible`;
        Knack.hideSpinner();
        window.hiddenNodes = [];
    }
    
}


// ADD ICONS TO LINKS IN DETAILS PAGES
setListener(VIEW_RENDER, VWT.details, (event, view) => {
    document.getElementById(view.key)
        ?.lastElementChild // columns
        ?.lastElementChild // last column
        ?.getElementsByTagName(`a`)
        ?.forEach(el => {
            const linkText = el.textContent;
            if (el.className !== ``) {
                return;
            } else if (linkText.endsWith(`Folder`)) {
                var iconClass = `fa fa-folder-open-o`;
            } else if (linkText == `View PDF`) {
                var iconClass = `fa fa-file-pdf-o`;
            } else if (linkText.startsWith(`View`)) {
                var iconClass = `fa fa-link`;//`fa-search`
            } else {
                var iconClass = ``;
            }
            const html = `
                <span class="level is-compact">
                    <span class="icon is-left">
                        <i class="${iconClass}">
                        </i>
                    </span>
                    <span>
                        <span class="">
                            ${linkText}
                        </span>
                    </span>
                </span>`;
            el.textContent = ``;
            el.classList.add(`kn-link-page`);
            el.insertAdjacentHTML(`beforeend`, html);
        });      
});


// HIDE ADD NEW BUTTON FOR ONE > ONE RELATIONSHIPS
{
    const oneToOneDetails = VWT.details
        .filter(vwNum => {
            const { scene, source } = VW[vwNum].attributes;
            const { object, has, belongs_to } = FLD[source?.connection_key]?.attributes?.relationship || {};
            return (object === scene.object && has === `one` && belongs_to === `one`)
        }).map(vwNum => VW[vwNum].attributes.key);
    setListener(VIEW_RENDER, oneToOneDetails, (event, view, record) => {       
        const mainView = view.scene.views.find(vw => vw.type === `details` && vw.source.object === scene.object);
        const addText = `Add ${view.name.replace(` Details`, ``)}`;
        document
            .getElementById(mainView.key)
            .getElementByClassName(`kn-details-link`)
            .forEach(btn => {
                const btnText = btn
                    ?.querySelector(`a > span > span:last-of-type`)
                    ?.textContent;
                if (btnText === addText) btn.style.display = `none`;
            });
        
    });
}


// SET CSS CLASS FOR TABLE-HEADER-MENUS
{
    const headerMenus = VWT.menu
        .filter(vwNum => VW[vwNum].attributes.name.endsWith(`Header Menu`))
        .map(vwNum => VW[vwNum].attributes.key);
    setListener(VIEW_RENDER, headerMenus, (event, view) => {
        document.getElementById(view.key)
            ?.classList
            ?.add(`header-menu`);
    });
}


// ADD CHECKBOXES TO TABLE
setListener(VIEW_RENDER, VWS.SelectCollections, (event, view, data) => {
    const eView = document.getElementById(view.key);
    const eCheckBox = document.createElement(`input`);
    eCheckBox.setAttribute(`type`, `checkbox`);
    const eCheckHead = document.createElement(`th`);
    eCheckHead.style.width = `45px`;
    eCheckHead.appendChild(eCheckBox);
    eView.querySelector(`tr`).prepend(eCheckHead);
    eView.querySelector(`tbody`)
        .getElementsByTagName(`tr`)
        .forEach(eRow => {
            const eCheckCell = document.createElement(`td`);
            eCheckCell.appendChild(eCheckBox.cloneNode());
            eRow.prepend(eCheckCell);
        });
    eCheckBox.addEventListener(`change`, () => {
        eView.querySelectorAll(`tr input`)
            .forEach(eInput => {
                eInput.setAttribute(`checked`, eCheckBox.checked)
            });
    });
    window.getChecked = view => {
        return $(`#${view.key} tbody input[type=checkbox]:checked`)
            .map((i, checkbox) => $(checkbox)
            .closest(`tr`)
            .attr(`id`))
            .toArray();
    };
});


// SET COLUMN WIDTHS AS PERCENTAGE
setListener(VIEW_RENDER, VWT.table, (event, view) => {
    //debugger;
    const columns = view.columns.filter(col => { return !(col.grouping) });
    const columnsWidth = columns.reduce((acc, cur) => acc + Number(cur.width.amount), 0);
    const fixedColumns = columns.filter(col => !(col.header))
    const fixedColumnsWidth = fixedColumns.reduce((acc, cur) => acc + Number(cur.width.amount), 0);
    const flexWidth = columnsWidth - fixedColumnsWidth;
    const defaultColumnsExist = columns.some(col => col.width.type === `default`);
    const eTable = document.querySelector(`#${view.key} .kn-table`);
    if (eTable.parentElement.style.display === `none`) return;
    eTable.style.minWidth = `${columnsWidth}px`;
    const eHeaders = eTable.getElementsByTagName(`th`);
    Array.from(eHeaders).filter(eHead => {
        const classList = Array.from(eHead.classList);
        const isField = classList.find(cls => cls.startsWith(`field_`));
        const isLink = classList.includes(`kn-table-link`);
        const isAction = classList.includes(`kn-table-action-link`);
        return isField || isLink || isAction;
    }).forEach((eHead, i) => {
        const column = columns[i];
        const isBlank = columns[i]?.header === ``;
        const isFixed = defaultColumnsExist || isBlank;
        const canFlex = !defaultColumnsExist && !isBlank;
        if (isFixed) {
            eHead.style.width = eHead.style.minWidth;            
        } else if (canFlex) {
            eHead.style.width = `${column.width.amount / flexWidth * 100}%`;
        } else {
            eHead.style.width = `auto`;
        }
        if (column.align) eHead.style.textAlign = column.align;
    });
});


//REPLACE LINE BREAKS WITH ARROW CHARACTER
setListener(RECORDS_RENDER, VWT.table, (event, view) => {
    document
        ?.getElementById(view.key)
        ?.querySelectorAll(`td br`).forEach(br => {
            const sp = document.createElement(`span`);
            sp.textContent = `\u21A9`; //\u21B2
            sp.className = `inline-break`;
            br.insertAdjacentElement(`afterend`, sp)
        });
});


// HIDE UNNECESSARY DETAIL VIEW TABLE & NAVIGATION ELEMENTS
{
    const childTables = VWT.table
        .filter(vwNum => `relationship_type` in VW[vwNum].attributes.source)
        .map(vwNum => VW[vwNum].attributes.key);
    setListener(RECORDS_RENDER, childTables, (event, view, records) => {
        const hasRecords = records.length;
        const hasFilterMenu = view.filter_type === `menu`;
        const hasPages = view.pagination_meta.total_entries > view.pagination_meta.rows_per_page;
        const eView = document.getElementById(view.key);
        const eTable = eView?.querySelector(`.kn-table-wrapper`);
        const eSearch = eView?.querySelector(`.table-keyword-search`)?.parentElement;
        const eFilterMenu = eView?.querySelector(`.js-filter-menu`);
        const ePagination = eView?.querySelector(`.kn-pagination`)?.parentElement;
        if (!hasRecords) {
            if (eSearch) eSearch.style.display = `none`;
            if (eTable) eTable.style.display = `none`;
        }
        if (!hasRecords && !hasFilterMenu) {
            if (eFilterMenu) eFilterMenu.style.display = `none`;
        }
        if (!hasPages) {
            if (ePagination) ePagination.style.display = `none`;
            if (eSearch) eSearch.style.display = `none`;
        }
    });
}


// SIZE CALENDAR TO FIT SCREEN
{

    setListener(VIEW_RENDER, VWT.calendar, async (event, view) => {

        if (view?.events?.display_type !== `calendar`) return;

        const eView = document.getElementById(view.key);
        const eMonth = await getMonthElement(eView);
        const eWeeksContainer = eMonth.querySelector(`tbody`);
        const eWeeks = eWeeksContainer.getElementsByTagName(`tr`);
        const eEventsContainer = eMonth.lastChild;
        const eEvents = eEventsContainer.getElementsByClassName(`fc-event`);
        const vwHeaderHt = eView.offsetHeight - eWeeksContainer.offsetHeight;
        const newViewHt = getScreenFitHeight(20);
        const newWeeksHt = newViewHt - vwHeaderHt;
        resize(eWeeks, eEvents, newWeeksHt);
        const eFirstWeekSizer = eWeeks.item(0).firstChild.firstChild;
        new MutationObserver((m, observer) => {
            observer.disconnect();
            resize(eWeeks, eEvents, newWeeksHt);
            observer.observe(eFirstWeekSizer, options);
        }).observe(eFirstWeekSizer, {
            attributes: true,
            attributeOldValue: true,
            attributeFilter: [`style`]
        });

    });

    async function getMonthElement(eView) {
        return eView.querySelector(`.fc-view-month`) ?? new Promise(resolve => {
            const eCalendar = eView.querySelector(`.knack-calendar > .fc-content`);
            new MutationObserver((mutations, observer) => {
                const eMonth = mutations
                    .flatMap(mutation => Array.from(mutation.addedNodes))
                    .find(node => node.classList.contains(`fc-view-month`));
                if (eMonth) {
                    resolve(eMonth);
                    observer.disconnect();
                }
            }).observe(eCalendar, { 
                childList: true 
            });
        });
    }

    function getScreenFitHeight(marginHt = 0) {
        const winChromeHt = window.outerHeight - window.innerHeight; 
        const appHeaderHt = document.querySelector(`.kn-scenes`).offsetTop;
        return window.screen.availHeight - winChromeHt - appHeaderHt - marginHt;
    }

    function resize(eWeeks, eEvents, newWeeksHt) {

        let remWeeksHeight = (newWeeksHt);
        let avgWeekHeight = remWeeksHeight / eWeeks.length;
        const weeks = Array.from(eWeeks ?? []).map(eWeek => {
            const eWeekSizer = eWeek.firstChild.firstChild;
            const eDateNumber = eWeekSizer.firstChild;
            const eEventsSizer = eWeek.lastChild.firstChild;
            const contentHeight = (eEventsSizer.offsetHeight + eDateNumber.offsetHeight);
            const originalTop = (eWeek.offsetTop);
            const originalBottom = (eWeek.offsetTop + eWeek.offsetHeight);
            return { eWeek, eWeekSizer, contentHeight, originalTop, originalBottom }
        }).sort((prev, curr) => {
            return curr.contentHeight - prev.contentHeight;
        }).map((week, index, weeks) => {
            if (week.contentHeight > avgWeekHeight) {
                remWeeksHeight -= week.contentHeight;
                week.eWeekSizer.style.minHeight = `${week.contentHeight}px`;
            } else {
                remWeeksHeight -= avgWeekHeight;
                week.eWeekSizer.style.minHeight = `${avgWeekHeight}px`;
            }
            avgWeekHeight = Math.max(remWeeksHeight / (weeks.length - index - 1), 0) || 0;
            return week;
        });

        eEvents.forEach(eEvent => {
            const week = weeks.find(week => {
                const eventTop = eEvent.offsetTop;
                const eventBottom = eEvent.offsetTop + eEvent.offsetHeight;
                return (week.originalTop <= eventTop) && (week.originalBottom >= eventBottom)
            });
            const topShift = week.originalTop - week.eWeek.offsetTop;
            const newTop = eEvent.offsetTop - topShift;
            eEvent.style.top = `${newTop}px`;
        });

    }

}


// CALENDAR ADD EVENT
setListener(VIEW_RENDER, VWT.calendar, (event, view) => {
    
    const cal = document.querySelector(`.kn-calendar`);
    cal.querySelectorAll(`td.fc-widget-content`).forEach(dateCell => {
        dateCell.addEventListener(`click`, openNewEvent, false);
    });

    function openNewEvent(ev) {
        const knView = Knack.views[view.key];
        const dateStr = getClickedDate(knView, ev.currentTarget);
        const dateFld = knView.date_field.key;
        const prevElem = document.getElementById(view.key).previousElementSibling;
        const isHeader = prevElem.classList.contains(`header-menu`);
        if (isHeader) {
            const links = prevElem.getElementsByTagName(`a`);
            if (links.length) {
                const addLink = links.item(links.length -1);
                const addHash = addLink.hash;
                const addPage = PG[PG[addHash.split(`/`).pop().replaceAll(`-`,`_`)]];
                const addView = addPage.views.models.find(vw => vw.attributes.type == `form`);
                const addVars = encodeURIComponent(JSON.stringify({ [dateFld]: dateStr }))
                location.hash = `${addHash}?${addView?.id}_vars=${addVars}`;
            }
        }
        ev.stopPropagation();
    }

    function getClickedDate(knView, eClickedDay) {
        const eClickedWeek = eClickedDay.parentElement;
        const midMonthDate = new Date((knView.start_date.valueOf() + knView.end_date.valueOf()) / 2);
        let dayNum = Number(eClickedDay.textContent.trim());
        let monthNum = midMonthDate.getMonth() + 1;
        let yearNum = midMonthDate.getFullYear();
        if (eClickedDay.classList.contains(`fc-other-month`)) {
            if (eClickedWeek.classList.contains(`fc-first`)) {
                if (monthNum === 1) {
                    monthNum = 12;
                    yearNum--;
                } else {
                    monthNum--;
                }
            } else if (eClickedWeek.classList.contains(`fc-last`)) {
                if (monthNum === 12) {
                    monthNum = 1;
                    yearNum++;
                } else {
                    monthNum++;
                }
            }
        }
        return `${monthNum}/${dayNum}/${yearNum}`;
    }

});


// TURN OFF BROWSER AUTOCOMPLETE
setListener(VIEW_RENDER, VWT.form, (event, view) => {
    const eView = 
        document.getElementById(view.key) ??
        document.getElementById(`connection-form-view`);
    eView?.lastElementChild?.setAttribute(`autocomplete`, `off`);
});


// MULTI-CHOICE & CONNECTION CHECKBOX & RADIO CONTROLS
{
    setListener(VIEW_RENDER, VWT.form, (event, view) => {
        view.groups
            .flatMap(grp => grp?.columns ?? [])
            .flatMap(col => col?.inputs ?? [])
            .forEach(inp => {
                const eField = getToggleElement(inp);
                if (eField) {
                    setToggle(eField);
                    observer.observe(eField, { childList : true });
                }
            });
    });

    const getToggleElement = function(input) {
        let selector;
        if (input.type === `connection`) {
            if (input.format.input === `radio`) {
                selector = `#connection-picker-radio-${input.id}`;
            } else if (input.format.input === `checkbox`) {
                selector = `#connection-picker-checkbox-${input.id}`;
            }
        } else if (input.type === `multiple_choice`) {
            if (input.format.type === `radios`) {
                selector = `#kn-input-${input.id} .kn-radio`;
            } else if (input.format.type === `checkboxes`) {
                selector = `#kn-input-${input.id} .kn-checkbox`;
            }
        }
        if (selector) return document.querySelector(selector);
    }

    const observer = new MutationObserver(mutRecords => {
        const mrAdded = mutRecords.find(mr => mr.addedNodes.length);
        if (mrAdded) setToggle(mrAdded.target);
    });

    const setToggle = function(eField) {
        const eContainer = eField.parentElement.parentElement;
        const eControls = Array.from( eField.children ?? [] );
        const eInputs = eControls.flatMap(eCon => Array.from(eCon.getElementsByTagName(`input`) ?? []))

        // DISPLAY AS GRID
        let isHidden = false;
        if (eContainer.style.display === `none`) {
            isHidden = true;
            eContainer.style.display = `initial`;
        }
        const maxControlWidth = eControls
            .sort((a, b) => a.offsetWidth < b.offsetWidth)
            .at(0)
            .offsetWidth;
        if (isHidden) eContainer.style.display = `none`;
        eField.style.gridTemplateColumns = `repeat(auto-fit, minmax(${maxControlWidth}px, auto))`;
        eField.classList.add(`tick-container`);

        // SET UP TOGGLE
        eInputs.forEach(eInp => {
            if (eField.classList.contains(`kn-radio`)) eInp.addEventListener(`click`, ev => deselect(ev.target));
            eInp.addEventListener(`change`, ev => toggle(ev.target));
        });
        if (eInputs.length) toggle(eInputs.at(0));
    }

    const deselect = function(eRadio) {
        const eControl = eRadio.parentElement.parentElement;
        if (eControl.classList.contains(`checked`)) {
            eControl.classList.remove(`checked`);
            eRadio.checked = false;
        }
    }

    const toggle = function(eField) {
        eField
            ?.parentElement
            ?.parentElement
            ?.parentElement
            ?.children
            ?.forEach(eControl => {
                const eFieldInput = eControl.firstElementChild.firstElementChild;
                if (eFieldInput.checked) {
                    eControl.classList.add(`checked`)
                } else {
                    eControl.classList.remove(`checked`)
                }
            });
    }
}


// DISPLAY CHECKBOXES AS SWITCHES
setListener(VIEW_RENDER, VWT.form, () => {
    document.getElementsByClassName(`kn-input-boolean`).forEach(eBool => {
        if (!eBool.querySelector(`.switch`)) {
            const eInput = eBool.querySelector(`input`);
            const eSwitch = document.createElement(`span`);
            eSwitch.className = `switch`;
            const eSlider = document.createElement(`span`);
            eSlider.className = `slider`;
            eInput.after(eSwitch);
            eSwitch.appendChild(eSlider);
        }
    });
});


// FILE UPLOAD BUTTON
setListener(VIEW_RENDER, VWT.form, (event, view) => {
    const eView = 
        document.getElementById(view.key) ?? 
        document.getElementById(`connection-form-view`);
    eView
        ?.getElementsByClassName(`kn-input-file`)
        ?.forEach(eFile => {
            const eRemove = eFile.querySelector(`.kn-file-remove`);
            if (eRemove) {
                const eRemoveIcon = document.createElement(`i`);
                eRemoveIcon.className = "fa fa-remove";
                eRemove.textContent = ``;
                eRemove.appendChild(eRemoveIcon);
            }
            const eUpload = eFile.querySelector(`:scope .kn-file-upload`);
            if (eUpload) {
                const eUploadInput = eUpload.querySelector(`input`);
                const eUploadIcon = document.createElement(`i`);
                eUploadIcon.className =`fa fa-folder-open`;
                eUploadIcon.onclick = () => eUploadInput.click();
                eUpload.appendChild(eUploadIcon);
            }
        });
});


// ADDRESS FIELD PLACEHOLDERS
setListener(VIEW_RENDER, VWT.form, (event, view) => {
    const eView = 
        document.getElementById(view.key) ?? 
        document.getElementById(`connection-form-view`);
    eView.querySelector(`form`)
        ?.elements
        ?.forEach(input => {
            switch (input.id) {
                case `street`:
                    input.placeholder = `Street Address`;
                    break;
                case `street2`:
                    input.placeholder = `Street Address 2`;
                    break;
                case `city`:
                    input.placeholder = `City`;
                    break
                case `state`:
                    input.placeholder = `State`;
                    break;
                case `zip`:
                    input.placeholder = `Zip`;
                    break;
            }
        });
});


// MOVE TOAST MESSAGES ON TODAY SCREEN
setListener(PAGE_RENDER, PGS.Today, (event, page) => {
    if ($(`head #today-toast`).length) return;
    $(`head`).append(
        `<style id="today-toast" type="text/css">
            #toast-container { top: unset; bottom: 110px; left: 10px; right: 10px; }
            .toast { width: 100% !important; }
            .toast-message { font-size: 1.2em; }
        </style>`
    );
});


// HIDE PROJECTS IN CURRENT TRIP
setListener(VIEW_RENDER, VWS.SelectProject, (event, view, data) => {
    let items = $(`#connection-picker-radio-${FLD.Timecards.TripProject} span`).map((i, item) => item.textContent).toArray();
    $(`#connection-picker-radio-${FLD.Timecards.Project} span`).filter((i, item) => items.includes(item.textContent)).hide();
});


// UPDATE TIMER ON TODAY SCREEN
{
    function msToTime(ms) {
        const pad = (n, z = 2) => ('00' + n).slice(-z);
        return `${pad(ms / 3.6e6 | 0)}:${pad((ms % 3.6e6) / 6e4 | 0)}:${pad((ms % 6e4) / 1000 | 0)}`;
    }
    function updateTimer(dateField, startField, view, data) {
        const clockInDateISO = data[`${dateField}_raw`].iso_timestamp.split(`T`)[0];
        const clockInTimeISO = data[`${startField}_raw`].iso_timestamp.split(`T`)[1].replace(`Z`, ``);
        const clockIn = new Date(`${clockInDateISO}T${clockInTimeISO}`);
        const $timer = $(`#${view.key} .kn-special-title h3`);
        setInterval(() => {
            const ms = Math.abs(Date.now() - clockIn);
            const time = msToTime(ms).split(`.`)[0];
            $timer.text(time);
        }, 1000);
    }
    setListener(VIEW_RENDER, VWS.CurrentTimesheet, (event, view, data) => {
        if (data[FLD.Timesheets.ClockIn]) updateTimer(FLD.Timesheets.Date, FLD.Timesheets.ClockIn, view, data);
    });
    setListener(VIEW_RENDER, VWS.CurrentTimecard, (event, view, data) => {
        if (data[FLD.Timecards.ArriveTime]) updateTimer(FLD.Timecards.Date, FLD.Timecards.ArriveTime, view, data);
    });
}









/////////////////////////////////////////////
//                                         //
//  DEFAULTS                               //
//                                         //
/////////////////////////////////////////////


// UNIQUE NUMBER DEFAULTS
setListener(VIEW_RENDER, [VWS.AddProject, VWS.AddCompany, VWS.AddEstimate, VWS.AddInvoice, VWS.AddReceipt, VWS.AddDeposit, VWS.AddBill, VWS.AddPayment], async (event, view, data) => {
    await uniqueNum.setNumber(view);
});


// SCHEDULE START & END TIMES
setListener(VIEW_RENDER, [VWS.AddSchedule], (event, view, record) => {
    document.getElementById(`${view.key}-${FLD[view.source.object].DateRange}-time`).value = `7:30am`;
    document.getElementById(`${view.key}-${FLD[view.source.object].DateRange}-time-to`).value = `4:00pm`;
});




/////////////////////////////////////////////
//                                         //
//  OPERATIONS                             //
//                                         //
/////////////////////////////////////////////


// SET THE KEY FIELD FOR ALL RECORDS
// setListener(RECORD_CREATE, ANY, async (event, view, record) => {
//     updateKey(view, record);
// },[]);


// ADD COLLECTION
setListener(RECORD_UPDATE, VWS.AddCollections, async (event, view, record) => {
    insertCollections(view);
});


// CREATE PDF BUTTONS
{
    setListener(VIEW_RENDER, [VWS.DocumentDetails, VWS.DocumentItems], (event, view, record) => {
        document.getElementById(view.key).style.display = `none`;
    });

    setListener(PAGE_RENDER, [PGS.DocumentPreview], async (event, page) => {

        Knack.showSpinner();

        const view = page.views.find(vw => vw.name == "Create PDF");
        const eView = document.getElementById(view.key);
        const eContainer = document.createElement(`div`);
        const eLoading = document.createElement(`div`);
        eContainer.id = `preview-container`;
        eLoading.id = `loading-preview`;
        eLoading.textContent = `Loading PDF Preview`;
        eView.prepend(eContainer);
        eContainer.append(eLoading);

        await doc(view).preview();

        const eFrame = document.createElement(`iframe`);
        eFrame.id = `preview`;
        eFrame.src = globalThis.previewURL;
        eContainer.replaceChild(eFrame, eLoading);

        Knack.hideSpinner();

    });

    setListener(RECORD_UPDATE, VWS.CreatePDF, async (event, view, record) => {
        await doc(view).create(record);
    });
}


// COPY ESTIMATE
setListener(RECORD_UPDATE, VWS.CopyRecord, async (event, view, record) => {
    await copyRecord(view, record);
});


// EMAIL DOCUMENTS
{
    let attachView; 
    let attachRecs;
    setListener(VIEW_RENDER, VWS.Attachments, (event, view, record) => {
        attachView = view;
        attachRecs = [].concat(record).flat();
    });
    setListener(RECORD_UPDATE, VWS.SendEmail, async (event, view, record) => {
        await doc().email(view, record, attachView, attachRecs);
    });
}


// CREATE PROJECT/COMPANY FOLDER
setListener(RECORD_CREATE, VWS.AddProject, async (event, view, record) => {
    await pf(view).createFolder(record);
    //await pf(view).createShared(record);
});
setListener(RECORD_CREATE, VWS.AddCompany, async (event, view, record) => {
    await pf(view).createFolder(record);
});


// DELETE PROJECT/COMPANY FOLDER
setListener(RECORD_DELETE, [VWS.ProjectsList, VWS.ProjectsListInstallers, VWS.ProjectDetails, VWS.ProjectDetailsInstallers], async (event, view, record) => {
    await pf(view).deleteFolder(record);
});


// UPDATE PROJECT/COMPANY FOLDER
{
    let oldRecord;
    setListener(VIEW_RENDER, [VWS.EditProject, VWS.EditCompany], async (event, view, record) => {
        oldRecord = await pf(view).appendFields(record, FLD[view.source.object].FolderPath);
    });
    setListener(RECORD_UPDATE, [VWS.EditProject, VWS.EditCompany], async (event, view, record) => {
        await pf(view).updateFolder(record, oldRecord);
    });
    setListener(RECORD_UPDATE, VWS.EditProject, async (event, view, record) => {
        await pf(view).updateShared(record, oldRecord);
    });
}


/*// GET TAX WITHOLDING
setListener(RECORD_CREATE, VWS.AddPayrollInstaller, async (event, view, data) => {
    setWitholding(data);
});
setListener(RECORD_UPDATE, VWS.EditPayrollInstallerHours, async (event, view, data) => {
    setWitholding(data);
});*/


// CLEAR ZEROS FROM ESTIMATE COSTS
setListener(VIEW_RENDER, VWS.Zeros, async (event, view, records) => {
    const itemView = view;
    const itemRecords = records;
    setListener(RECORD_UPDATE, VWS.ClearZeros, async (event, view, record) => {
        await clearZeros(itemView, itemRecords);
    });
});


// SET UNIT PRICE
setListener(VIEW_RENDER, VWS.EditEstimateCost, (event, view, data) => {
    const oldRecord = data;
    setListener(RECORD_UPDATE, VWS.EditEstimateCost, async (event, view, record) => {
        setUnitPrice(record, oldRecord, view);
    });
});


// FORMAT PROJECT WEBSITE
setListener(VIEW_RENDER, [VWS.AddProject, VWS.EditProject], (event, view, record) => {
    if (!(FLD.Projects.Website in record)) return;
    record[FLD.Projects.Website] = record[FLD.Projects.Website].toLowerCase().replace(`https://`, ``).replace(`http://`, ``);
});
//*********************FIX THIS^^^^ IT MAKES NO SENSE


// CREATE MULTIPLE BILLS
setListener(RECORD_CREATE, VWS.AddRecurringBill, async (event, view, record) => {
    await insertInitial(record);
});


// PRIOR INVOICE
setListener(RECORD_CREATE, VWS.AddInvoice, async (event, view, record) => {
    await updatePriorInvoice(view, record);
});
setListener(RECORD_UPDATE, VWS.EditInvoice, async (event, view, record) => {
    await updatePriorInvoice(view, record);
});


// SET SCHEDULE/TRIP DATE RANGES
//setListener(RECORD_CREATE, [VWS.AddSchedule], async (event, view, record) => {
//    await updateScheduleRange(record);
//});
//setListener(RECORD_UPDATE, [VWS.EditSchedule, VWS.SchedulesCalendar], async (event, view, record) => {
//    await updateScheduleRange(record);
//});
//setListener(RECORD_CREATE, [VWS.AddTrip], async (event, view, record) => {
//    await updateTripRange(record);
//});
//setListener(RECORD_UPDATE, [VWS.EditTrip], async (event, view, record) => {
//    await updateTripRange(record);
//});


// ARCHIVE PROJECT
/*setListener(VIEW_RENDER, VWS.ProjectDetails, (event, view, record) => {
    $buttons = $(`#${view.key} .kn-details-link`);
    $archive = $buttons.children(`:contains('Archive Project')`);
    $restore = $buttons.children(`:contains('Restore Archive')`);
    const archived = record[`${FLD[view.source.object].Archived}_raw`];
    if (archived) {
        $archive.hide();
    } else {
        $restore.hide();
    }
    debugger;
    const arc = archiveSet().store(view);
    
});
setListener(RECORD_UPDATE, VWS.ArchiveProject, async (event, view, record) => {
    debugger;
    const archives = await archiveSet().get(view.source.object, record);
    console.log(archives);
});
setListener(RECORD_UPDATE, VWS.RestoreArchive, async (event, view, record) => {
    const archives = await archiveSet().get(view.source.object, record);
    console.log(archives);
});*/


// SET LOCATION
//setListener(PAGE_RENDER, PGS.Today, async (event, view, data) => {
//    await getLocation();
//});



// CREATE ADD BUTTONS ON TABLES AND LISTS
// {
//     async function createAddButtons(ev, page) {
//         const headerMenus = page.views.filter(vw => vw.name === `Headers Menu`);
//         headerMenus.forEach(vw => {
//             const eMenu = document.getElementById(vw.key);
//             eMenu.style.display = `none`;
//             const eBtns = eMenu.firstElementChild.children;
//             eBtns.forEach(eBtn => {
//                 const [tblName, btnText] = eBtn.textContent.trim().split(`|`);
//                 if (!tblName || !btnText) return;
//                 const vwTable = page.views.find(vw => vw.name === tblName);
//                 const eTable = document.getElementById(vwTable?.key);
//                 if (!eTable) return;
//                 const btnClone = eBtn.cloneNode(true);
//                 btnClone.classList.add(`add-link`);
//                 btnClone.firstElementChild.classList.remove(`is-small`);
//                 btnClone.lastElementChild.textContent = btnText;
//                 eTable.firstElementChild.append(btnClone);
//             });
//         });
//     }
//     const headerMenuPages = Array.from(
//         new Set(
//             VWT.menu
//                 .filter(vw => VW[vw].attributes.name === `Headers Menu`)
//                 .map(vw => VW[vw].attributes.scene.key)
//         )
//     )
//     setListener(PAGE_RENDER, headerMenuPages, createAddButtons);
// }


// DEFAULT VIEWS
// {
//     var defaults = [];
//     setListener(VIEW_RENDER, VWS.Defaults, async (event, view, record) => {
//         $(`#${view.key}`).hide();
//         var defs = Object.entries(dv(view).getLabels(true));
//         defs = defs.filter(([key, val]) => key.substr(key.length - 4) !== "_raw");
//         defs = defs.map(([key, val]) => [val, record[key + "_raw"]]);
//         defaults.push(defs);
//     });
//     setListener(PAGE_RENDER, ANY, async (event, page) => {
//         let defs = await Promise.all(defaults);
//         let forms = page.views.filter(view => view.type === `form`);
//         forms.forEach(view => {
//             defs.flat().forEach(([key, val]) => dv(view).setValue(key, val));
//         });
//         defaults = [];
//     });
// }


// RETURN TO PREVIOUS PAGE AFTER DELETE
// setListener(RECORD_UPDATE, VWS.DeleteRecord, (event, view, data) => {
//         var nav = 0;
//         nav += (Knack.hash_scenes[Knack.hash_scenes.length - 1].key == Knack.hash_scenes[Knack.hash_scenes.length - 2].key)
//     } catch (e) { }
//     setTimeout(() => { navBack(nav) }, 2000);
//     //location.reload();
// });


// SET THE BIDS FOLLOW UP DATE
//setListener(RECORD_CREATE, [VWS.AddFollowUp, VWS.EditFollowUp], async (event, view, record) => {
//    await dp.table(TBL.Bids).key(sub(record,`${FLD.FollowUps.Bid}_raw`, `id`)).update({[FLD.Bids.FollowUpDate]: record[FLD.FollowUps.NextDate]});
//});


