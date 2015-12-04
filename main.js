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

const WeekType = [
    'Odd week only',
    'Even week only',
    'Normal'
];
const OddWeekOnly = 0;
const EvenWeekOnly = 1;
const Normal = 2;

const ClassNumber = [
    'One only',
    'Two classes'
];
const OneClass = 0;
const TwoClsss = 1;

// Cookie timeout period is 1 month
const CookieTimeout = 60 * 60 * 24 * 30;

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
                this.newSubject.AddTimeslot(timeslot.day, timeslot.startTime, timeslot.endTime, timeslot.classType, timeslot.number, false);
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

    $scope.ParseSubject = function(data) {
        var subject = null;
        subject = new Subject($scope.timetable, data.subjectCode, data.subjectName);

        data.timeslots.forEach(function(timeslot) {
            var ticked = false;
            try {
                ticked = timeslot.ticked != null && timeslot.ticked == 1;
            } catch (e) {}
            subject.AddTimeslot(timeslot.day,
                timeslot.startTime,
                timeslot.endTime,
                timeslot.classType,
                timeslot.number,
                ticked);
        });
        return subject;
    };

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

    $scope.Copy = function() {
        json = $scope.timetable.GetSubjectsAsJSON();
        var temp = $('<input type="text">').val(json).appendTo('body').select();
        document.execCommand("Copy");
        temp.remove();
        alert('Subject data copied to clipboard. Use "Import Subject" to add them back');
    };

    $scope.ImportSubjects = function() {
        var json = prompt('Please paste subject data here');
        if(json != null && json.length > 0) {
            try {
                var subjects = JSON.parse(json);
                subjects.Subjects.forEach(function(subject) {
                    $scope.timetable.AddSubject($scope.ParseSubject(subject));
                }, this);
            }
            catch(e) {
                alert('Invalid data');
            }
        }
    };

    // Read from cookie
    var cookieData = document.cookie.split(';');
    cookieData.forEach(function(json) {
        if(json && json.length > 0) {
            if(json.indexOf('SubjectData:') >= 0) {
                var subjectJson = json.substr(json.indexOf('=') + 1);

                // Verify that this cookie is subject data
                if (subjectJson && subjectJson.length > 0) {
                    try {
                        $scope.timetable.AddSubject($scope.ParseSubject(JSON.parse(subjectJson)));
                    }
                    catch(e) {}
                }
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
        // Only update if changes found
        if(this.hasChange) {

            // Clear timeGaps
            while(this.timeGaps.length > 0)
                this.timeGaps.pop();

            // Add default time gaps
            for(var i = 800; i <= 1600; i+= this.gap) {
                if(i % 100 == 60)
                    i+= 40;
                this.timeGaps.push(i);
            }

            // Add in time gaps
            this.timetableDays.forEach(function(timetableDay) {
                this.AddTimeGaps(timetableDay.GetTimeGaps());
            }, this);

            this.timeGaps.sort(SortTime);
            this.hasChange = false;
        }
        return this.timeGaps;
    };

    this.AddTimeGaps = function(timeGaps){
        timeGaps.forEach(function(timeGap) {
            if (this.timeGaps.indexOf(timeGap) < 0)
                this.timeGaps.push(timeGap);
        }, this);
    };

    this.AddSubject = function(subject) {
        this.subjects.push(subject);
        this.AddClassesToTimetableDay(subject.GetAllClasses());
        this.AddSubjectToCookie(subject);
        this.NotifyChanges();
        return this;
    };

    this.AddClassesToTimetableDay = function(classes) {
        classes.forEach(function (aClass) {
            this.timetableDays[aClass.day].push(aClass);
        }, this);
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
    };

    this.GetSubjectsAsJSON = function() {
        var json =  '{'
            + '"Subjects":[';
        this.subjects.forEach(function (subject) {
            json += subject.ToJSON() + ',';
        });
        if(json.charAt(json.length - 1) == ',')
            json = json.substr(0, json.length - 1);
        json += ']';
        json += '}';
        return json;
    }
}

function TimetableDay(timetable, day) {

    // Constructor
    this.timetable = timetable;
    this.day = day;
    this.hasChange = false;
    this.classes = [];
    this.arrangedTimeslots = [];

    // Methods
    this.NotifyChanges = function() {
        this.hasChange = true;
    };

    this.HasClash = function(aClass) {
        this.timeslots.forEach(function (otherClass) {
            var sameSubject = aClass.subject == otherClass.subject;
            var differentClassType = aClass.classType != otherClass.classType;
            var hasClash = aClass.ClashWith(otherClass) || otherClass.ClashWith(aClass);
            var otherIsTicked = otherClass.ticked;

            if((sameSubject? differentClassType: true) && hasClash && otherIsTicked)
                throw otherClass;
        });
        return false;
    };

    this.AddTimeslot = function(timeslot) {
        this.timeslots.push(timeslot);
        return this;
    };

    this.GetTimeGaps = function() {

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

function Subject(timetable, subjectCode, subjectName) {

    // Constructor
    this.timetable = timetable;
    this.subjectCode = subjectCode;
    this.subjectName = subjectName;
    this.timeslots = [];

    for(var i = 0; i< ClassType.length; i++)
        this.timeslots.push([]);

    // Methods
    this.GetAllClasses = function () {
        var classes = [];
        this.timeslots.forEach(function (timeslotsByClassType) {
            timeslotsByClassType.forEach(function (timeslot) {
                timeslot.classes.forEach(function (aClass) {
                    classes.push(aClass);
                });
            });
        });
        return classes;
    };

    this.AddTimeslot = function (day, startTime, endTime, classType, number, ticked) {
        var timeslot = new Timeslot(day, startTime, endTime, this, classType, number);
        timeslot.ticked = ticked;
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


function Timeslot(subject, classType, number) {

    // Constructor
    this.subject = subject;
    this.classType = classType;
    this.classNumber = classNumber;
    this.number = number;
    this.classes = [];
    this.ticked = false;

    // Methods
    this.Tick = function (tick) {
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

    this.GetFullDetails = function() {
        return this.subject.GetDetails() + this.GetClassNumber();
    };

    this.GetClassNumber = function () {
        return ClassType[this.classType].charAt(0) + this.number;
    };

    this.GetTimeGaps = function () {
        var timeGaps = [];
        this.classes.forEach(function (aClass) {
            timeGaps.push(aClass.startTime);
            timeGaps.push(aClass.endTime);
        });
        return timeGaps;
    };

    this.ToJSON = function () {
        var json = '{'
            + '"classType":' + this.classType + ','
            + '"number":' + this.number
            + '"ticked":' + (this.ticked? 1: 0)
            + '"classes":[';
        this.classes.forEach(function (eachClass) {
            json += eachClass.ToJSON() + ',';
        });
        if(json.charAt(json.length - 1) == ',')
            json = json.substr(0, json.length - 1);
        json += ']';
        json += '}';
        return json;
    };
}

function Class (day, weekType, startTime, endTime) {

    // Constructor
    this.day = day;
    this.weekType = weekType;
    this.startTime = startTime;
    this.endTime = endTime;

    // Methods
    this.ClashWith = function (otherClass) {
        return this.ClashTimeWith(otherClass)
            && this.weekType == otherClass.weekType;
    };

    this.ClashTimeWith = function (otherClass) {
        var startTimeDifference = this.startTime - otherClass.startTime;

        if(startTimeDifference == 0)
            return true;

        // This class is later than other class
        // If this class starts before other class ends, it has clashes
        else if (startTimeDifference > 0)
            return this.startTime < otherClass.endTime

        // This class is earlier than other class
        // If other class have not end when this class starts, it has clashes
        else
            return this.endTime > otherClass.startTime;
    };

    this.ToJSON = function () {
        return '{'
            + '"day":' + this.day + ','
            + '"weekType":' + this.weekType + ','
            + '"classNumber":' + this.classNumber + ','
            + '"startTime":' + this.startTime + ','
            + '"endTime":' + this.endTime
            + '}';
    };
}

// UI related model
function TimeGap (colSpan, timeslot) {

    // Constructor
    this.colSpan = colSpan;
    this.timeslot = timeslot;

    // Methods
    this.GetFullDetails = function() {
        if(!this.timeslot) return "";
        else return this.timeslot.GetFullDetails();
    };
}
