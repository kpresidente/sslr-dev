async function setDateRange(table, record) {
    
    try {

        let dateRange = FLD[table].DateRange;
        let startDate = FLD[table].StartDate;
        let startTime = `StartTime` in FLD[table] ? FLD[table].StartTime : FLD[table].StartDate;
        let endDate   = FLD[table].EndDate;
        let endTime   = `EndTime` in FLD[table] ? FLD[table].EndTime : FLD[table].EndDate;

        updateData = {
            [dateRange] : {
                date    : record[`${startDate}_raw`].date,
                hours   : record[`${startDate}_raw`].hours,
                minutes : record[`${startTime}_raw`].minutes,
                am_pm   : record[`${startTime}_raw`].am_pm,
                to      : {
                    date    : record[`${endDate}_raw`].date,
                    hours   : record[`${endDate}_raw`].hours,
                    minutes : record[`${endTime}_raw`].minutes,
                    am_pm   : record[`${endTime}_raw`].am_pm,
                }
            }
        }

        let response = await db(table).key(record.id).update(updateData);
        
        return response;

    } catch(error) { return Promise.reject(error); }

}


async function updateTripRange(record) {

    let response = setDateRange(TBL.Trips, record);
    return response;
}

async function updateScheduleRange(record) {

    let updateSchedule = setDateRange(TBL.Schedules, record);

    let trip = await db(TBL.Trips).key(sub(record, FLD.Schedules.Trip, `id`)).get();
    let updateTrip = updateTripRange(trip.data[0]);

    let response = await Promise.all([updateSchedule, updateTrip]);
    return response;

}