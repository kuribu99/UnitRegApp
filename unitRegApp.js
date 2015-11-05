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
var app = angular.module("unitRegApp", []);
app.controller("unitRegController", function($scope) {

    // Methods
    $scope.To24HourFormat = To24HourFormat;

    $scope.timetable = new Timetable();

    var web = new Subject(timetable, 'UECS2014', 'Web Application Development');
    web.AddTimeslot(new Timeslot(Monday, 900, 1300, web, Lecture, 1))
        .AddTimeslot(new Timeslot(Tuesday, 900, 1400, web, Lecture, 2))
        .AddTimeslot(new Timeslot(Tuesday, 1200, 1300, web, Practical, 1))
        .AddTimeslot(new Timeslot(Wednesday, 1200, 1300, web, Practical, 2));

    $scope.timetable.AddSubject(web);

    $scope.DayInWeek = DayInWeek;

    console.log($scope.timetable.GetArrangedTimeGaps());

});


// Functions
function To24HourFormat(time) {
    return time >= 1000? time:
        time >= 100? new String(0).concat(time):
            new String(0).concat(new String(0)).concat(time);
}

// Model Classes
function Subject(timetable, subjectCode, subjectName) {

    // Constructor
    this.timetable = timetable;
    this.subjectCode = subjectCode;
    this.subjectName = subjectName;
    this.timeslots = [];

    ClassType.forEach(function(classType) {
        this.timeslots.push([]);
    }, this);

    // Methods
    this.AddTimeslot = function (timeslot) {
        this.timeslots[timeslot.classType].push(timeslot);
        return this;
    };

    this.Tick = function(timeslot) {
        // TODO: resolve logic problem here
        if(!this.timetable.HasClash(timeslot)) {
            timeslot.ticked = true;
            for(var otherTimeslot in timeslot[timeslot.classType])
                otherTimeslot.ticked = false;
        }

        return this;
    };

}

function Timetable() {

    // Constructor
    this.timetableDays = [];
    this.timeGaps = [];

    // Create all days of in the week
    DayInWeek.forEach(function(day) {
        this.timetableDays.push(new TimetableDay(this, day));
    }, this);

    // Methods
    this.GetArrangedTimeGaps = function() {
        return this.ClearTimeGaps()
            .AddDefaultTimeGaps()
            .InitializeTimeGaps()
            .SortTimeGaps()
            .timeGaps;
    };

    this.ClearTimeGaps = function() {
        while(this.timeGaps.length > 0)
            this.timeGaps.pop();
        return this;
    };

    this.AddDefaultTimeGaps = function() {
        // Add earliest and latest time
        this.timeGaps.push(800);
        this.timeGaps.push(1800);

        return this;
    };

    this.InitializeTimeGaps = function() {

        this.timetableDays.forEach(function(timetableDay) {
            timetableDay.timeslots.forEach(function(timeslot){
                this.AddTimeslot(timeslot);
            }, this);
        }, this);

        return this;
    };

    this.AddTimeGap = function(time){
        if(this.timeGaps.indexOf(time) < 0)
            this.timeGaps.push(time);
        return this;
    }

    this.SortTimeGaps = function() {
        this.timeGaps.sort();
        return this;
    };

    this.AddSubject = function(subject) {
        var timeslotByClassTypes = 1;
        var timeslot;

        subject.timeslots.forEach(function(timeslotByClassTypes) {
            timeslotByClassTypes.forEach(function(timeslot) {
                this.timetableDays[timeslot.timetableDay].AddTimeslot(timeslot);
            }, this);
        }, this);

        this.timeGaps.sort();

        return this;
    };

    this.AddTimeslot = function(timeslot) {
        return this
            .AddTimeGap(timeslot.startTime)
            .AddTimeGap(timeslot.endTime);
    };

    this.HasClash = function(timeslot) {
        this.timetableDays[timeslot.timetableDay].HasClash(timeslot);
    };

}

function TimetableDay(timetable, day) {

    // Constructor
    this.timetable = timetable;
    this.day = day;
    this.timeslots = [];
    this.arrangedTimeslots = [];

    this.HasClash = function(timeslot) {
        // TODO: complete logic
        for(var otherTimeslot in this.timeslots)
            if(timeslot.subjectCode != otherTimeslot.subjectCode && timeslot.ClashWith(otherTimeslot))
                    return true;
        return false;
    };

    this.AddTimeslot = function(timeslot) {
        this.timeslots.push(timeslot);
        return this;
    };

    this.GetTimeslotByStartTime = function(startTime) {
        for(var timeslot in this.timeslots) {
            if(timeslot.startTime == startTime)
                return timeslot;
        }
        return false;
    };

    this.ClearArrangedTimeslots = function() {
        while(this.arrangedTimeslots.length > 0)
            this.arrangedTimeslots.pop();

        return this;
    };

    this.InitializeArrangedTimeslots = function() {
        var timeGaps = this.timetable.GetArrangedTimeGaps();
        var counter;
        var timeslot;

        var i = 0;
        while(i < timeGaps.length - 1) {
            counter = 1;
            timeslot = this.GetTimeslotByStartTime(timeGaps[i++]);

            if(timeslot)
                while(timeslot.endTime - timeGaps[i++] > 0)
                    counter++;

            this.arrangedTimeslots.push(counter);
        }
        return this;
    };

    this.GetArrangedTimeslots = function() {
        return this.ClearArrangedTimeslots()
            .InitializeArrangedTimeslots()
            .arrangedTimeslots;
    };

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
    this.ClashWith = function(otherTimeslot) {

        // TODO: verify
        var startTimeDifference = this.startTime - otherTimeslot.startTime;

        if(startTimeDifference == 0)
            return true;

        // This timeslot is later than other class
        // If this timeslot starts before other timeslot ends, then it has clashes
        else if (startTimeDifference > 0)
            return this.startTime - otherTimeslot.endTime < 0;

        // This timeslot is earlier than other timeslot
        // If this timeslot ends after other timeslot, then it has clashes
        else
            return this.endTime - otherTimeslot.startTime > 0;
    };

    this.Tick = function() {
        this.subject.Tick(this);
    };

}

function TimeGap(span, timeslot) {

    // Constructor
    this.span = span;
    if(timeslot)
        this.timeslot = timeslot;

    // Methods
    this.GetDetails = function() {
        if(!timeslot) return "";
        else return timeslot.subjectCode
            .concat(" ")
            .concat(timeslot.subjectName)
            .concat("-")
            .concat(timeslot.number);
    };
}
