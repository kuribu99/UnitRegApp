var app = angular.module("unitRegApp", []);

// Constants

// DayInWeek
const DayInWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
];
const Monday = 0;
const Tuesday = 1;
const Wednesday = 2;
const Thursday = 3;
const Friday = 4;
const Saturday = 5;
const Sunday = 6;

const ClassType = [
    'Lecture', 'Tutorial', 'Practical', 'Other'
];
const Lecture = 0;
const Tutorial = 1;
const Practical = 2;
const Other = 3;

// Controller
app.controller("unitRegController", function($scope) {

    $scope.timetable = new Timetable();

    var web = new Subject(timetable, 'UECS2014', 'Web Application Development');
    web.AddTimeslot(new Timeslot(Monday, new Time(900), new Time(1100), web, Lecture, 1));
    web.AddTimeslot(new Timeslot(Monday, new Time(1200), new Time(1300), web, Practical, 1));
    web.AddTimeslot(new Timeslot(Tuesday, new Time(1200), new Time(1300), web, Practical, 2));

    $scope.timetable.AddSubject(web);

    $scope.DayInWeek = DayInWeek;

    console.log($scope.timetable);

});


// Functions
function SortTime(time, otherTime) {
    return time.Difference(otherTime) % 2;
}

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
        var mins = this.time % 100 - otherTime.time % 100;
        var hours = parseInt(this.time / 100) - parseInt(otherTime.time / 100);
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

    this.get = function() {
        return this.time >= 1000? this.time:
            this.time >= 100? new String(0).concat(new String(this.time)):
                new String(0).concat(new String(0)).concat(new String(this.time));
    };

    // Constructor
    this.time = time;
    if(deltaTime) {
        this.Add(deltaTime);
    }

}

function Timeslot(timetableDay, startTime, endTime, subject, classType, number) {

    // Constructor
    this.timetableDay = timetableDay;
    this.startTime = startTime;
    this.endTime = endTime;
    this.subject = subject;
    this.classType = classType;
    this.number = number;
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

    this.HasClash = function(timeslot) {
        for(var otherTimeslot in this.timeslots)
            if(timeslot.subjectCode != otherTimeslot.subjectCode && timeslot.ClashWith(otherTimeslot))
                    return true;
        return false;
    };

    this.Reset = function() {
        this.timeslots.clear();
    };

    this.GetTimeslotByStartTime = function(startTime) {
        for(var i = 0; i < this.timeslots.length; i++) {
            if(this.timeslots[i].startTime.Difference(startTime) == 0)
                return this.timeslots[i];
        }
        return false;
    }

}

function Timetable() {

    // Constructor
    this.timetableDays = [];
    this.timeGaps = [];

    // Add earliest and latest time
    this.timeGaps.push(new Time(800));
    this.timeGaps.push(new Time (1800));

    for(var i = 0; i < DayInWeek.length; i++) {
        this.timetableDays[i] = new TimetableDay();
    }

    this.getTimeGaps = function() {
        this.timeGaps.sort(SortTime);
        return this.timeGaps;
    };

    this.Reset = function () {
        for(var i = 0; i < this.timetableDays; i++)
            this.timetableDays[i].Reset()
    };

    this.AddSubject = function(subject) {
        for(var i = 0; i < subject.timeslots.length; i++)
            for(var j = 0; j < subject.timeslots[i].length; j++) {
                var timeslot = subject.timeslots[i][j];

                this.timetableDays[timeslot.timetableDay].timeslots.push(timeslot);

                if (this.timeGaps.indexOf(timeslot.startTime) < 0)
                    this.timeGaps.push(timeslot.startTime);
                if (this.timeGaps.indexOf(timeslot.endTime) < 0)
                    this.timeGaps.push(timeslot.endTime);

            }

        this.timeGaps.sort(SortTime);
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
        this.timeslots[i] = [];

    // Methods
    this.AddTimeslot = function (timeslot) {
        this.timeslots[timeslot.classType].push(timeslot);
    };

    this.Tick = function(timeslot) {
        // TODO: resolve logic problem here
        if(!this.timetable.HasClash(timeslot)) {
            timeslot.ticked = true;
            for(var otherTimeslot in timeslot[timeslot.classType])
                otherTimeslot.ticked = false;
        }

        return timeslot.ticked;
    };


}