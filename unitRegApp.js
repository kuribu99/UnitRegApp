var app = angular.module("unitRegApp", []);

const DayInWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
];

const ClassType = [
    'Lecture', 'Tutorial', 'Practical', 'Other'
];

app.controller("unitRegController", function($scope) {

    $scope.timetable = new Timetable();

    var web = new Subject(timetable, 'UECS2014', 'Web Application Development');
    web.AddTimeslot(new Timeslot(DayInWeek[0], new Time(900), new Time(1100), web, ClassType[0]));
    web.AddTimeslot(new Timeslot(DayInWeek[0], new Time(1200), new Time(1300), web, ClassType[2]));

    $scope.timetable.AddSubject(web);

});

// Model Classes
function Time(time, deltaTime) {

    // Methods
    this.Add = function(otherTime) {
        var mins = this.time % 100 + otherTime % 100;
        var additionalHours = mins % 60;
        var totalHours = parseInt(this.time / 100) + parseInt(otherTime / 100) + additionalHours;
        totalHours = totalHours % 24;

        this.time = totalHours * 100 + mins;

        return this;
    };

    this.Subtract = function(otherTime) {
        var mins = this.time % 100 - otherTime % 100;
        var hours = parseInt(this.time / 100) - parseInt(otherTime / 100);
        if(mins < 0) {
            mins += 60;
            hours--;
        }
        if(hours < 0)
            hours += 24;

        this.time = hours * 100 + mins;

        return this;
    };

    this.Difference = function(otherTime) {
        var sign = 1;
        var mins = this.time % 100 - otherTime % 100;
        var hours = parseInt(this.time / 100) - parseInt(otherTime / 100);
        if(mins < 0) {
            mins += 60;
            hours--;
        }
        if(hours < 0) {
            sign = -1;
            hours = Math.abs(hours);
        }
        return sign * (hours + mins);
    };

    // Constructor
    this.time = time;
    if(deltaTime) {
        this.Add(deltaTime);
    }

}

function Timeslot(timetableDay, startTime, endTime, subject, classType) {

    // Constructor
    this.timetableDay = timetableDay;
    this.startTime = startTime;
    this.endTime = endTime;
    this.subject = subject;
    this.classType = classType;
    this.ticked = false;

    // Methods
    this.Duration = function() {
        return this.endTime.Difference(this.startTime);
    };
    
    this.Gap = function(otherTimeslot) {
        return this.endTime.Difference(otherTimeslot.startTime);
    };

    this.ClashWith = function(otherTimeslot) {
        var startTimeDifference = this.startTime.Difference(otherTimeslot.startTime);

        if(startTimeDifference == 0)
            return true;

        // This timeslot is later than other class
        // If this timeslot starts before other timeslot ends, then it has clashes
        else if (startTimeDifference > 0)
            return this.startTime.Difference(otherTimeslot.endTime) < 0;

        // This timeslot is earlier than other timeslot
        // If this timeslot ends after other timeslot, then it has clashes
        else
            return this.endTime.Difference(otherTimeslot.startTime) > 0;
    };

    this.Tick = function() {
        this.subject.Tick(this);
    };

}

function TimetableDay() {

    // Constructor
    this.timeslots = [];

    this.GetEarliestClass = function() {
        var length = this.timeslots.length;

        if(length > 1)
            this.RearrangeTimeslots();

        return  length >= 1? this.timeslots[0]: null;
    };

    this.GetLatestClass = function() {
        var length = this.timeslots.length;

        if(length > 1)
            this.RearrangeTimeslots();

        return  length >= 1? this.timeslots[length - 1]: null;
    };

    this.RearrangeTimeslots = function() {
        if(this.timeslots.length > 1) {
            this.timeslots.sort(function(a, b) {
                return a.Difference(b) % 2;
            });
        }

        return this;
    };

    this.HasClash = function(timeslot) {
        for(var otherTimeslot in this.timeslots)
            if(timeslot.subjectCode != otherTimeslot.subjectCode && timeslot.ClashWith(otherTimeslot))
                    return true;
        return false;
    };

    this.Reset = function() {
        this.timeslots.clear();
    };

}

function Timetable() {

    // Constructor
    this.timetableDays = [];

    for(var i = 0; i < DayInWeek.length; i++) {
        this.timetableDays[DayInWeek[i]] = new TimetableDay();
    }

    this.getTimeGaps = function() {
        var timeGaps = [];

        for(var day in timetableDays)
            for(var timeslots in day) {
                if(!timeGaps.contains(timeslots.startTime))
                    timeGaps.push(timeslots.startTime);
                if(!timeGaps.contains(timeslots.endTime))
                    timeGaps.push(timeslots.endTime);
            }

        timeGaps.sort(function(a, b) {
            return a.Difference(b) % 2;
        });

        return timeGaps;
    };

    this.Reset = function () {
        for(var timetableDay in this.timetableDays)
            timetableDay.Reset()
    };

    this.AddSubject = function(subject) {
        for(var timeslotByType in subject.timeslots)
            for(var timeslot in subject.timeslots[timeslotByType])
                this.timetableDays[timeslot.timetableDay].timeslots.push(timeslot);


    };

    this.HasClash = function(timeslot) {
        this.timetableDays[timeslot.timetableDay].HasClash(timeslot);
    };

}

function Subject(timetable, subjectCode, subjectName) {

    // Constructor
    this.timetable = timetable;
    this.subjectCode = subjectCode;
    this.subjectName = subjectName;
    this.timeslots = [];

    for(var i = 0; i < ClassType.length; i++)
        this.timeslots[ClassType[i]] = [];

    // Methods
    this.AddTimeslot = function (timeslot) {
        this.timeslots[timeslot.classType].push(timeslot);
    };

    this.Tick = function(timeslot) {
        if(!this.timetable.HasClash(timeslot)) {
            timeslot.ticked = true;
            for(var otherTimeslot in timeslot[timeslot.classType])
                otherTimeslot.ticked = false;
        }

        return timeslot.ticked;
    };


}