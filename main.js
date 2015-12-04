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

// Cookie timeout period is 1 month
const CookieTimeout = 60 * 60 * 24 * 30 * 1000;

// Controller
var app = angular.module("unitRegApp", []);
app.controller("unitRegController", function($scope) {
    // Variables
    $scope.DayInWeek = DayInWeek;
    $scope.ClassType = ClassType;
    $scope.timetable = new Timetable();
    $scope.newSubject = new Subject($scope.timetable, '', '');
    $scope.newTimeslots = [];

    // Methods
    $scope.To24HourFormat = To24HourFormat;

    $scope.NotifyChanges = function () {
        $scope.timetable.NotifyChanges();
    };

    $scope.AddNewSubject = function () {
        var hasError = false;
        var errorMsg = 'Please validate the following:\n';

        // Validation
        if($scope.newSubject.subjectCode.length == 0) {
            errorMsg += 'Subject code cannot be empty\n';
            hasError = true;
        }
        if($scope.newSubject.subjectName.length == 0) {
            errorMsg += 'Subject name cannot be empty\n';
            hasError = true;
        }
        if($scope.newTimeslots.length == 0) {
            errorMsg += 'At least one timeslot is required\n';
            hasError = true;
        }
        else {
            var arr = [];
            $scope.newTimeslots.forEach(function (timeslot) {
                var number;
                try {
                    if(timeslot.number.length == 0)
                        throw false;
                    number = parseInt(timeslot.number);
                }
                catch(e) {
                    number = -1;
                }

                if (number <= 0 || number > 19) {
                    errorMsg += 'Timeslot ' + ($scope.newTimeslots.indexOf(timeslot) + 1) + ': Invalid timeslot number. Acceptable range is 1 to 9\n';
                    hasError = true;
                }

                if(!ValidTime(timeslot.startTime)) {
                    errorMsg += 'Timeslot ' + ($scope.newTimeslots.indexOf(timeslot) + 1) + ': Invalid timeslot start time. Acceptable range is 1 to 9\n';
                    hasError = true;
                }
                if(!ValidTime(timeslot.endTime)) {
                    errorMsg += 'Timeslot ' + ($scope.newTimeslots.indexOf(timeslot) + 1) + ': Invalid timeslot end time\n';
                    hasError = true;
                }
                if(timeslot.startTime > timeslot.endTime) {
                    errorMsg += 'Timeslot ' + ($scope.newTimeslots.indexOf(timeslot) + 1) + ': Start time cannot be later than end time\n';
                    hasError = true;
                }

                // Add timeslot number for next validation
                if(number > 0)
                    arr.push(ClassType[timeslot.classType].charAt(0) + number);
            }, $scope);

            var item;
            var hasDuplicate = [];  // To prevent repeating validation
            while (arr.length > 1) {
                item = arr.pop();
                if(arr.indexOf(item) >= 0 && hasDuplicate.indexOf(item) < 0) {
                    errorMsg += 'Duplicate timeslot: ' + item + '\n';
                    hasError = true;
                    hasDuplicate.push(item);
                }
            }
        }

        if(hasError) {
            alert(errorMsg);
        }
        else {
            $scope.newTimeslots.forEach(function (timeslot) {
                this.newSubject.AddTimeslot(timeslot.day, timeslot.startTime, timeslot.endTime, timeslot.classType, timeslot.number);
            }, $scope);

            $scope.timetable.AddSubject($scope.newSubject);

            $scope.newSubject = new Subject($scope.timetable, '', '');
            while ($scope.newTimeslots.length > 0)
                $scope.newTimeslots.pop();

            // Add at least one timeslot for the new subject
            $scope.AddNewTimeslot();
        }
    };

    $scope.AddNewTimeslot = function () {
        $scope.newTimeslots.push(new Timeslot(Monday, 800, 1000, $scope.newSubject, Lecture, 1));
    };

    $scope.RemoveNewTimeslot = function (timeslot) {
        var index = this.newTimeslots.indexOf(timeslot);
        this.newTimeslots.splice(index, 1);
    };

    $scope.ParseSubject = function(json) {
        var subject = null;
        try {
            var data = JSON.parse(json);
            subject = new Subject($scope.timetable, data.subjectCode, data.subjectName);

            data.timeslots.forEach(function(timeslot) {
                subject.AddTimeslot(timeslot.day,
                    timeslot.startTime,
                    timeslot.endTime,
                    timeslot.classType,
                    timeslot.number);
            });
        } catch(e) {}
        return subject;
    };

    // Add dummy data function
    $scope.AddDummyData = function() {
        if(confirm('This will add 3 dummy subjects, proceed?')) {
            var web = new Subject($scope.timetable, 'UECS2014', 'Web Application Development (Dummy Data)');
            web.AddTimeslot(Monday, 900, 1300, Lecture, 1)
                .AddTimeslot(Tuesday, 900, 1400, Lecture, 2)
                .AddTimeslot(Monday, 1200, 1400, Tutorial, 1)
                .AddTimeslot(Wednesday, 1200, 1400, Practical, 1)
                .AddTimeslot(Thursday, 1200, 1300, Practical, 2);
            $scope.timetable.AddSubject(web);

            var fyp = new Subject($scope.timetable, 'UECS3114', 'Project I (Dummy Data)');
            fyp.AddTimeslot(Tuesday, 1200, 1400, Lecture, 1)
                .AddTimeslot(Tuesday, 1400, 1600, Lecture, 2)
                .AddTimeslot(Friday, 830, 1030, Practical, 1)
                .AddTimeslot(Friday, 1430, 1630, Practical, 2);
            $scope.timetable.AddSubject(fyp);

            var tp = new Subject($scope.timetable, 'UECS3004', 'Team Project (Dummy Data)');
            tp.AddTimeslot(Thursday, 1600, 1800, Lecture, 1)
                .AddTimeslot(Saturday, 1000, 1600, Practical, 1);
            $scope.timetable.AddSubject(tp);
        }
    };

    // Read from cookie
    var cookieData = document.cookie.split(';');
    cookieData.forEach(function(json) {
        if(json && json.length > 0) {
            if(json.indexOf('SubjectData:') >= 0) {
                var subjectJson = json.substr(json.indexOf('=') + 1);

                // Verify that this cookie is subject data
                if (subjectJson && subjectJson.length > 0)
                    $scope.timetable.AddSubject($scope.ParseSubject(subjectJson));
            }
            else if (json.indexOf('TimeGap') >= 0) {
                var gap = json.substr(json.indexOf('=') + 1);
                $scope.timetable.Gap(parseInt(gap));
            }
        }
    });

    // Add at least one timeslot for the new subject
    $scope.AddNewTimeslot();

    // Update the changes
    $scope.NotifyChanges();
});

$(document).ready(function() {

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
        var print = window.open();

        print.document.write('<html><head><title>Timetable</title>');
        print.document.write('<link rel="stylesheet" href="main.css" type="text/css" />');
        print.document.write('</head><body >');
        print.document.write($('div#timetable-container').html());
        print.document.write('</body></html>');

        print.document.close(); // necessary for IE >= 10
        print.focus(); // necessary for IE >= 10

        // Wait a while for document.write to complete
        setTimeout(function() {
            print.print();
            print.close();
        }, 100);
    });

});

// Functions
function To24HourFormat(time) {
    return time >= 1000? time:
        time >= 100? '0'.concat(time):
            '00'.concat(time);
}

function SortTime(timeA, timeB) {
    return timeA - timeB;
}

function ValidTime(time) {
    return time >= 0 && time <= 2400 && time % 100 < 60;
}

// Model Classes
function Subject(timetable, subjectCode, subjectName) {

    // Constructor
    this.timetable = timetable;
    this.subjectCode = subjectCode;
    this.subjectName = subjectName;
    this.timeslots = [];

    for(var i = 0; i< ClassType.length; i++)
        this.timeslots.push([]);

    // Methods
    this.AddTimeslot = function (day, startTime, endTime, classType, number) {
        var timeslot = new Timeslot(day, startTime, endTime, this, classType, number);
        this.timeslots[classType].push(timeslot);
        return this;
    };

    this.Tick = function(timeslot) {
        if(!this.timetable.HasClash(timeslot)) {
            this.timeslots[timeslot.classType].forEach(function (otherTimeslot) {
                otherTimeslot.ticked = false;
            });
            timeslot.ticked = true;
            this.timetable.NotifyChanges();
        }
        return this;
    };

    this.GetDetails = function() {
        return this.subjectCode.concat(' ').concat(this.subjectName);
    };

    this.Reset = function() {
        this.timeslots.forEach(function(timeslotByClassType) {
            timeslotByClassType.forEach(function(timeslot) {
                timeslot.ticked = false;
            });
        });
    };

    this.ToJSON = function() {
        var json =  '{'
            + '"subjectCode":"' + this.subjectCode + '",'
            + '"subjectName":"' + this.subjectName + '",'
            + '"timeslots":[';
        this.timeslots.forEach(function (timeslotByClassType) {
            timeslotByClassType.forEach(function(timeslot) {
                json += timeslot.ToJSON() + ',';
            });
        });
        if(json.charAt(json.length - 1) == ',')
            json = json.substr(0, json.length - 1);
        json += ']';
        json += '}';
        return json;
    };
}

function Timetable() {

    // Constructor
    this.gap = 30;
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

    this.Gap = function (gap) {
        if(arguments.length == 0) {
            return this.gap;
        } else {
            if(this.gap != gap) {
                this.gap = gap;

                var expireDate = new Date();
                expireDate.setTime(expireDate.getTime() + CookieTimeout);

                document.cookie = 'TimeGap='
                    + this.gap + ';'
                    + 'expires=' + expireDate.toUTCString();

                this.NotifyChanges();
            }
        }
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
        for(var i = 800; i <= 1600; i+= this.gap) {
            if(i % 100 == 60)
                i+= 40;
            this.timeGaps.push(i);
        }
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
                this.timetableDays[timeslot.day].AddTimeslot(timeslot);
            }, this);
        }, this);

        this.AddSubjectToCookie(subject);

        this.NotifyChanges();
        return this;
    };

    this.AddSubjectToCookie = function(subject) {
        var expireDate = new Date();
        expireDate.setTime(expireDate.getTime() + CookieTimeout);

        document.cookie = 'SubjectData:' + subject.subjectCode + '='
            + subject.ToJSON() + ';'
            + 'expires=' + expireDate.toUTCString();
    };

    this.RemoveSubjectFromCookie = function(subject) {
        document.cookie = 'SubjectData:' + subject.subjectCode + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC';
    };

    this.RemoveSubject = function(subject) {
        if(confirm('Are you sure to delete this subject?')) {
            subject.timeslots.forEach(function(timeslotByClassTypes) {
                timeslotByClassTypes.forEach(function(timeslot) {
                    this.timetableDays[timeslot.day].RemoveTimeslot(timeslot);
                }, this);
            }, this);

            var index = this.subjects.indexOf(subject);
            this.subjects.splice(index, 1);
            this.RemoveSubjectFromCookie(subject);
            this.NotifyChanges();
        }
        return this;
    };

    this.AddTimeslot = function(timeslot) {
        return this
            .AddTimeGap(timeslot.startTime)
            .AddTimeGap(timeslot.endTime);
    };

    this.HasClash = function(timeslot) {
        // Only need to check the particular day
        return this.timetableDays[timeslot.day].HasClash(timeslot);
    };

    this.IncreaseSubjectPriority = function (subject) {
        var index = this.subjects.indexOf(subject);
        if(index > 0 && this.subjects.length > 1 && index < this.subjects.length) {
            var temp = this.subjects[index - 1];
            this.subjects[index - 1] = subject;
            this.subjects[index] = temp;
        }
    };

    this.DecreaseSubjectPriority = function (subject) {
        var index = this.subjects.indexOf(subject);
        if(index < this.subjects.length - 1 && this.subjects.length > 1) {
            var temp = this.subjects[index + 1];
            this.subjects[index + 1] = subject;
            this.subjects[index] = temp;
        }
    };

    this.Reset = function() {
        this.subjects.forEach(function(subject) {
            subject.Reset();
        });
        this.NotifyChanges();
    }
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
            var sameSubject = timeslot.subject == otherTimeslot.subject;
            var differentClassType = timeslot.classType != otherTimeslot.classType;
            var hasClash = timeslot.ClashWith(otherTimeslot) || otherTimeslot.ClashWith(timeslot);
            var otherIsTicked = otherTimeslot.ticked;

            if((sameSubject? differentClassType: true) && hasClash && otherIsTicked)
                throw otherTimeslot;
        });

        return false;
    };

    this.AddTimeslot = function(timeslot) {
        this.timeslots.push(timeslot);
        return this;
    };

    this.RemoveTimeslot = function(timeslot) {
        var index = this.timeslots.indexOf(timeslot);
        this.timeslots.splice(index, 1);
        return this;
    };

    this.GetTickedTimeslotByStartTime = function(startTime) {
        var result = false;
        this.timeslots.forEach(function(timeslot) {
            if(timeslot.startTime == startTime && timeslot.ticked) {
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

function Timeslot(day, startTime, endTime, subject, classType, number) {

    // Constructor
    this.day = day;
    this.startTime = startTime;
    this.endTime = endTime;
    this.subject = subject;
    this.classType = classType;
    this.number = number;
    this.ticked = false;

    // Methods
    this.ClashWith = function(otherTimeslot) {
        var startTimeDifference = this.startTime - otherTimeslot.startTime;

        if(startTimeDifference == 0)
            return true;

        // This timeslot is later than other class
        // If this timeslot starts before other timeslot ends, it has clashes
        else if (startTimeDifference > 0)
            return this.startTime < otherTimeslot.endTime

        // This timeslot is earlier than other timeslot
        // If other timeslot have not end when this timeslot starts, it has clashes
        else
            return this.endTime > otherTimeslot.startTime;
    };

    this.Tick = function(tick) {
        if(arguments.length == 0) {
            return this.ticked;
        } else {
            if(tick) {
                try {
                    this.subject.Tick(this);
                }
                catch (timeslot) {
                    alert('Unable to tick this timeslot. Has clashes with:\n'
                        + timeslot.subject.subjectCode + ' ' + timeslot.subject.subjectName + ' '
                        + ClassType[timeslot.classType].charAt(0) + timeslot.number);
                }
            }
            else {
                this.ticked = false;
                this.subject.timetable.NotifyChanges();
            }
        }
    };

    this.TryTick = function(tick) {
        if(tick) {
            this.subject.Tick(this);
        } else {
            this.ticked = false;
        }
    };

    this.GetDetails = function() {
        return this.subject.GetDetails()
            .concat(' ')
            .concat(ClassType[classType].charAt(0)).concat(number);
    };

    this.ToJSON = function() {
        return '{'
            + '"day":' + this.day + ','
            + '"startTime":' + this.startTime + ','
            + '"endTime":' + this.endTime + ','
            + '"classType":' + this.classType + ','
            + '"number":' + this.number
            + '}';
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
