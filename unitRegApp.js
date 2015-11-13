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
var scope;
var app = angular.module("unitRegApp", []);
app.controller("unitRegController", function($scope) {

    // Bind to external
    scope = $scope;

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
    var web = new Subject($scope.timetable, 'UECS2014', 'Web Application Development');
    web.AddTimeslot(Monday, 900, 1300, Lecture, 1)
        .AddTimeslot(Tuesday, 900, 1400, Lecture, 2)
        .AddTimeslot(Monday, 1200, 1400, Lecture, 3)
        .AddTimeslot(Wednesday, 1200, 1400, Practical, 1)
        .AddTimeslot(Thursday, 1200, 1300, Practical, 2);
    $scope.timetable.AddSubject(web);

    var fyp = new Subject($scope.timetable, 'UECS3114', 'Project I');
    fyp.AddTimeslot(Tuesday, 1200, 1400, Lecture, 1)
        .AddTimeslot(Tuesday, 1400, 1600, Lecture, 2)
        .AddTimeslot(Friday, 830, 1030, Practical, 1)
        .AddTimeslot(Friday, 1430, 1630, Practical, 2);
    $scope.timetable.AddSubject(fyp);

    var tp = new Subject($scope.timetable, 'UECS3004', 'Team Project');
    tp.AddTimeslot(Thursday, 1600, 1800, Lecture, 1)
        .AddTimeslot(Saturday, 1000, 1600, Practical, 1);
    $scope.timetable.AddSubject(tp);

    $scope.NotifyChanges();

});

$(document).ready(function() {

    // Refresh once first
    RefreshUIHeight();

    // Set height to fit screen
    $(window).resize(RefreshUIHeight);

    // Initialize datas
    $('div#timetable-container').data('scale', 1);

    // Add event listeners
    $('button#zoom-in').click(function () {
        var timetableDiv = $('div#timetable-container');
        var currentScale = timetableDiv.data('scale');

        if(currentScale < 1.5) {
            currentScale += 0.1;
        }

        timetableDiv.css({
            zoom: currentScale
        });
        timetableDiv.data('scale', currentScale);
    });

    $('button#zoom-out').click(function () {
        var timetableDiv = $('div#timetable-container');
        var currentScale = timetableDiv.data('scale');

        if(currentScale > 0.5) {
            currentScale -= 0.1;
        }

        timetableDiv.css({
            zoom: currentScale
        });
        timetableDiv.data('scale', currentScale);
    });

    $('button#zoom-reset').click(function () {
        $('div#timetable-container')
            .css({
                zoom: 1
            })
            .data('scale', 1);
    });

    $('button#btn-print').click(function () {
        var print = window.open('', 'Timetable');

        print.document.write('<html><head><title>Timetable</title>');
        print.document.write('<link rel="stylesheet" href="main.css" type="text/css" />');
        print.document.write('</head><body >');
        print.document.write($('div#timetable-container').html());
        print.document.write('</body></html>');

        print.document.close(); // necessary for IE >= 10
        print.focus(); // necessary for IE >= 10

        print.print();
        print.close();
    });

    $('input.timeslot').change(function() {
        scope.timetable.NotifyChanges();
    });

});

// UI related functions
function RefreshUIHeight() {
    $('.full-height').height(window.innerHeight * 0.9);
    $('.half-height').height(window.innerHeight * 0.45);
}

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

    for(var i in ClassType)
        this.timeslots.push([]);

    // Methods
    this.AddTimeslot = function (timetableDay, startTime, endTime, classType, number) {
        var timeslot = new Timeslot(timetableDay, startTime, endTime, this, classType, number);
        this.timeslots[classType].push(timeslot);
        return this;
    };

    this.Tick = function(timeslot) {

        try {
            if(!this.timetable.HasClash(timeslot)) {
                this.timeslots[timeslot.classType].forEach(function (otherTimeslot) {
                    otherTimeslot.ticked = false;
                });
                timeslot.ticked = true;
                this.timetable.NotifyChanges();
            }
        }
        catch (timeslot) {
            alert('Unable to tick this timeslot. Has clashes with:\n'
                + timeslot.subject.subjectCode + ' ' + timeslot.subject.subjectName + ' '
                + ClassType[timeslot.classType].charAt(0) + timeslot.number);
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
        // Add timeGap with 1 hour gap
        for(var i = 800; i <= 1600; i+= 100)
            this.timeGaps.push(i);
        return this;
    };

    this.InitializeTimeGaps = function() {

        this.timetableDays.forEach(function(timetableDay) {
            timetableDay.timeslots.forEach(function(timeslot){
                if(timeslot.ticked)
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
        // Only need to check the particular day
        return this.timetableDays[timeslot.timetableDay].HasClash(timeslot);
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
        this.timeslots.forEach(function (otherTimeslot) {

            // Same subject but is not same type of class considers clashes
            if(timeslot.subjectCode == otherTimeslot.subjectCode)
                if(timeslot.classType != otherTimeslot.classType)
                    if (otherTimeslot.ticked && timeslot.ClashWith(otherTimeslot))
                        throw otherTimeslot;

            else if(otherTimeslot.ticked && timeslot.ClashWith(otherTimeslot))
                throw otherTimeslot;

        }, this);

        return false;
    };

    this.AddTimeslot = function(timeslot) {
        this.timeslots.push(timeslot);
        return this;
    };

    this.GetTickedTimeslotByStartTime = function(startTime) {
        var result = false;
        this.timeslots.forEach(function(timeslot) {
            if(timeslot.startTime == startTime && timeslot.ticked) {
                console.log(timeslot);
                result = timeslot;
            }
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
            timeslot = this.GetTickedTimeslotByStartTime(timeGaps[i]);
            i++;

            if(timeslot) {
                while (timeslot.endTime - timeGaps[i] > 0) {
                    colspan++;
                    i++;
                }
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

    this.Tick = function(tick) {
        if(arguments.length == 0) {
            return this.ticked;
        } else {
            if(tick)
                this.subject.Tick(this);
            else {
                this.ticked = false;
                this.subject.timetable.NotifyChanges();
            }
        }
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
