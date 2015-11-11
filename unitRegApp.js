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
    'Lecture', 'Tutorial', 'Practical'
];
const Lecture = 0;
const Tutorial = 1;
const Practical = 2;

// Controller
var app = angular.module("unitRegApp", []);
app.controller("unitRegController", function($scope) {

    // Variables
    $scope.DayInWeek = DayInWeek;
    $scope.ClassType = ClassType;
    $scope.timetable = new Timetable();

    // Methods
    $scope.To24HourFormat = To24HourFormat;
    $scope.NotifyChanges = function() {
        $scope.timetable.NotifyChanges();
    };

    // Add dummy data
    var web = new Subject(timetable, 'UECS2014', 'Web Application Development');
    web.AddTimeslot(Monday, 900, 1300, Lecture, 1)
        .AddTimeslot(Tuesday, 900, 1400, Lecture, 2)
        .AddTimeslot(Tuesday, 1200, 1300, Practical, 1)
        .AddTimeslot(Wednesday, 1200, 1300, Practical, 2);
    $scope.timetable.AddSubject(web);

    var fyp = new Subject(timetable, 'UECS3114', 'Project I');
    fyp.AddTimeslot(Tuesday, 1200, 1400, Lecture, 1)
        .AddTimeslot(Tuesday, 1400, 1600, Lecture, 2)
        .AddTimeslot(Friday, 830, 1030, Practical, 1)
        .AddTimeslot(Friday, 1430, 1630, Practical, 2);
    $scope.timetable.AddSubject(fyp);

    var tp = new Subject(timetable, 'UECS3004', 'Team Project');
    tp.AddTimeslot(Thursday, 1600, 1800, Lecture, 1)
        .AddTimeslot(Saturday, 1000, 1600, Practical, 1);
    $scope.timetable.AddSubject(tp);

    $scope.NotifyChanges();

});

$(document).ready(function() {
    $('.full-height').height($(window).height());
    $('.half-height').height($(window).height() / 2);
});
// Functions
function To24HourFormat(time) {
    return time >= 1000? time:
        time >= 100? new String(0).concat(time):
            new String(0).concat(new String(0)).concat(time);
}

function SortTime(timeA, timeB) {
    return timeA - timeB;
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
    this.AddTimeslot = function (timetableDay, startTime, endTime, classType, number) {
        var timeslot = new Timeslot(timetableDay, startTime, endTime, this, classType, number);
        this.timeslots[classType].push(timeslot);
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

    this.GetDetails = function() {
        return this.subjectCode.concat(' ').concat(this.subjectName);
    };
}

function Timetable() {

    // Constructor
    this.subjects = [];
    this.timetableDays = [];
    this.timeGaps = [];
    this.hasChange = false;

    // Create all days of in the week
    DayInWeek.forEach(function(day) {
        this.timetableDays.push(new TimetableDay(this, day));
    }, this);

    // Methods
    this.NotifyChanges = function() {
        this.hasChange = true;
        this.timetableDays.forEach(function(timetableDay) {
            timetableDay.NotifyChanges();
        });
    };

    this.GetArrangedTimeGaps = function() {
        if(this.hasChange) {
            this.ClearTimeGaps()
                .AddDefaultTimeGaps()
                .InitializeTimeGaps()
                .SortTimeGaps()
                .hasChange = false;
        }
        return this.timeGaps;
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
    };

    this.SortTimeGaps = function() {
        this.timeGaps.sort(SortTime);
        return this;
    };

    this.AddSubject = function(subject) {
        this.subjects.push(subject);
        subject.timeslots.forEach(function(timeslotByClassTypes) {
            timeslotByClassTypes.forEach(function(timeslot) {
                this.timetableDays[timeslot.timetableDay].AddTimeslot(timeslot);
            }, this);
        }, this);

        this.timeGaps.sort(SortTime);

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
    this.hasChange = false;
    this.timeslots = [];
    this.arrangedTimeslots = [];

    // Methods
    this.NotifyChanges = function() {
        this.hasChange = true;
    };

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
        var result = false;
        this.timeslots.forEach(function(timeslot) {
            if(timeslot.startTime == startTime)
                result = timeslot;
        }, this);
        return result;
    };

    this.ClearArrangedTimeslots = function() {
        while(this.arrangedTimeslots.length > 0)
            this.arrangedTimeslots.pop();

        return this;
    };

    this.InitializeArrangedTimeslots = function() {
        var timeGaps = this.timetable.GetArrangedTimeGaps();
        var colspan;
        var timeslot;

        var i = 0;
        while(i < timeGaps.length - 1) {
            colspan = 1;
            timeslot = this.GetTimeslotByStartTime(timeGaps[i++]);

            if(timeslot)
                while(timeslot.endTime - timeGaps[i] > 0) {
                    colspan++;
                    i++;
                }

            this.arrangedTimeslots.push(new TimeGap(colspan, timeslot));
        }
        return this;
    };

    this.GetArrangedTimeslots = function() {
        if(this.hasChange) {
            this.ClearArrangedTimeslots()
                .InitializeArrangedTimeslots()
                .hasChange = false;
        }
        console.log(this.arrangedTimeslots);
        return this.arrangedTimeslots
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

    this.GetDetails = function() {
        return this.subject.GetDetails()
            .concat(' ')
            .concat(ClassType[classType].charAt(0)).concat(number);
    };
}

function TimeGap(colSpan, timeslot) {

    // Constructor
    this.colSpan = colSpan;
    this.timeslot = timeslot;

    // Methods
    this.GetDetails = function() {
        if(!this.timeslot) return "";
        else return this.timeslot.GetDetails();
    };
}
