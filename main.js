// Constants
const AppName = 'unitRegApp';
const ControllerName = 'unitRegController';
const EmptyString = '';

// Day in week
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

// Class type
const ClassType = [
    'Lecture', 'Tutorial', 'Practical'
];
const Lecture = 0;
const Tutorial = 1;
const Practical = 2;

// Week type
const WeekType = [
    'Odd week only',
    'Even week only',
    'Both odd and even week'
];
const OddWeekOnly = 0;
const EvenWeekOnly = 1;
const BothWeeks = 2;

// Zoom constants
const ZoomIn = 1;
const ZoomOut = -1;
const ZoomReset = 0;
const ZoomStep = 0.1;
const ZoomMin = 0.5;
const ZoomMax = 1.5;
const ZoomDefault = 1;
const ZoomData = 'scale';

// Json related data
const TimeslotTicked = 1;
const TimeslotNotTicked = 0;

// Cookie related data
const TimeFormat12 = 0;
const TimeFormat24 = 1;

// Cookie timeout period is 1 month
const CookieTimeout = 60 * 60 * 24 * 30;

// Regex to validate text
const TextRegex = /[^A-Za-z0-9 -]/;

// Functions
/**
 * @return {string}
 */
function To24HourFormat (time) {
    if(time >= 1000)
        return time;
    else if (time >= 100)
        return '0' + time;
    else if (time >= 10)
        return '00' + time;
    else
        return '000' + time;
}

/**
 * @return {string}
 */
function To12HourFormat (time) {
    var hour = time % 100;
    var min = parseInt(time / 100);
    var type = 'AM';

    // Check for AM/PM
    if(hour >= 1200 && time < 2400) {
        hour -= 12;
        type = 'PM';
    }
    else if (time == 2400) {
        hour -= 12;
    }

    // 0 hour is shown as 12
    if(hour == 0)
        hour = 12;

    // Make leading zero
    if(hour < 10)
        hour = '0' + hour;
    if(min < 10)
        min = '0' + min;
    return hour + ':' + min + type;
}

/**
 * @return {number}
 */
function CompareTime (timeA, timeB) {
    return timeA - timeB;
}

/**
 * @return {boolean}
 */
function IsValidTime (time) {
    return time >= 0 && time <= 2400 && time % 100 < 60;
}

/**
 * @return {boolean}
 */
function ContainInvalidText (text) {
    return TextRegex.test(text);
}

/**
 * @returns {string}
 */
function RemoveEndingComma (input) {
    var result = input;
    if(input.charAt(json.length - 1) == ',')
        input = input.substr(0, json.length - 1);
    return input;
}

var scope;

// Controller
var app = angular.module(AppName, []);
app.controller(ControllerName, function($scope) {

    scope = $scope;
    // Variables
    $scope.timetable = new Timetable();
    $scope.newSubject = null;
    $scope.editSubject = null;

    // Methods
    $scope.ToTimeFormat = To24HourFormat;

    // UI Methods
    $scope.Zoom = function (zoom) {
        var timetableDiv = $('div#timetable-container');
        var currentScale = timetableDiv.data(ZoomData, ZoomDefault);

        switch (zoom) {
            case ZoomIn:
                if(currentScale < ZoomMax)
                    currentScale += ZoomStep;
                break;
            case ZoomOut:
                if(currentScale > ZoomMin)
                    currentScale -= ZoomStep;
                break;
            case ZoomReset:
                currentScale = ZoomDefault;
                break;
        }

        timetableDiv.css({
            zoom: currentScale
        });
        timetableDiv.data(ZoomData, currentScale);
    };

    $scope.Print = function () {
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
    };

    // Model Methods
    $scope.NotifyChanges = function () {
        $scope.timetable.NotifyChanges();
    };

    $scope.AddNewSubject = function () {
        var errorTrace = new ErrorTrace();
        $scope.newSubject.Validate(errorTrace);
        if(errorTrace.HasError())
            errorTrace.AlertErrors();
        else {
            $scope.timetable.AddSubject($scope.newSubject);
            $scope.newSubject = $scope.CreateNewSubject();
        }
    };

    $scope.CreateNewSubject = function () {
        var subject = new Subject($scope.timetable, EmptyString, EmptyString);
        var timeslot = subject.AddTimeslot(Lecture, 1);
        timeslot.AddClass('KB520', Monday, BothWeeks, 800, 800 + 200);
        return subject;
    };

    $scope.ParseSubject = function(data) {
        var subject = null;
        subject = new Subject($scope.timetable, data.subjectCode, data.subjectName);

        data.timeslots.forEach(function(timeslot) {
            var ticked = false;
            try {
                ticked = timeslot.ticked != null && timeslot.ticked == TimeslotTicked;
            } catch (e) {
                ticked = false;
            }
            var slot = subject.AddTimeslot(timeslot.classType, timeslot.number);
            slot.ticked = ticked;

            // Release 1.x.x timeslot type
            if(timeslot.classes == null) {
                slot.AddClass('KB520', timeslot.day, BothWeeks, timeslot.startTime, timeslot.endTime);
            }

            // Release 2.0 onwards
            else {
                timeslot.classes.forEach(function (aClass) {
                    slot.AddClass(aClass.venue, aClass.day, aClass.weekType, aClass.startTime, aClass.endTime);
                });
            }
        });
        return subject;
    };

    $scope.Copy = function() {
        var json = $scope.timetable.GetSubjectsAsJSON();
        var temp = $('<input type="text">').val(json).appendTo('body').select();
        document.execCommand('Copy');
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
    cookieData.forEach(function(cookie) {
        if(cookie && cookie.length > 0) {
            if(cookie.indexOf('SubjectData:') >= 0) {
                var subjectJson = cookie.substr(cookie.indexOf('=') + 1);

                // Verify that this cookie is subject data
                if (subjectJson && subjectJson.length > 0) {
                    try {
                        $scope.timetable.AddSubject($scope.ParseSubject(JSON.parse(subjectJson)));
                    }
                    catch(e) {}
                }
            }
            else if (cookie.indexOf('TimeGap=') >= 0) {
                var gap = cookie.substr(cookie.indexOf('=') + 1);
                $scope.timetable.Gap(parseInt(gap));
            }
            else if (json.indexOf('TimeFormat=') >= 0) {
                var timeFormat = cookie.substr(cookie.indexOf('=') + 1);
                $scope.timetable.TimeFormat(parseInt(timeFormat));
            }
        }
    });

    // Variables
    $scope.timetable = new Timetable();
    $scope.newSubject = $scope.CreateNewSubject();
    $scope.editSubject = $scope.newSubject;

    // Methods
    $scope.ToTimeFormat = To24HourFormat;

    // Update the changes
    $scope.NotifyChanges();
});

// Model Classes
function Timetable () {

    // Constructor
    this.gap = 60;
    this.timeFormat = To24HourFormat;
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

    /**
     * @return {number}
     */
    this.Gap = function (gap) {
        if(arguments.length == 0) {
            return this.gap;
        } else {
            if(this.gap != gap) {
                this.gap = gap;

                var expireDate = new Date();
                expireDate.setTime(expireDate.getTime() + CookieTimeout);

                document.cookie = 'TimeGap=' + this.gap + ';'
                    +  'expires=' + expireDate.toUTCString();

                this.NotifyChanges();
            }
        }
    };

    this.TimeFormat = function (timeFormat) {
        if(arguments.length == 0) {
            return this.timeFormat;
        } else {
            if(this.timeFormat != timeFormat) {
                this.timeFormat = timeFormat;

                var expireDate = new Date();
                expireDate.setTime(expireDate.getTime() + CookieTimeout);

                document.cookie = 'TimeFormat=' + this.TimeFormat + ';'
                    +  'expires=' + expireDate.toUTCString();

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

            var remainder;
            // Add default time gaps
            for(var i = 800; i <= 1800; i+= this.gap) {
                if(i % 100 >= 60) i += 100 - (i % 100);
                this.timeGaps.push(i);
            }

            // Add in time gaps
            this.timetableDays.forEach(function(timetableDay) {
                this.AddTimeGaps(timetableDay.GetTimeGaps());
            }, this);

            this.timeGaps.sort(CompareTime);
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
            this.timetableDays[aClass.day].classes.push(aClass);
        }, this);
    };

    this.AddSubjectToCookie = function(subject) {
        var expireDate = new Date();
        expireDate.setTime(expireDate.getTime() + CookieTimeout);

        document.cookie = 'SubjectData:' + subject.subjectCode + '=' + subject.ToJSON() + ';'
            +  'expires=' + expireDate.toUTCString();
    };

    this.RemoveSubjectFromCookie = function(subject) {
        document.cookie = 'SubjectData:' + subject.subjectCode + '=' + EmptyString + ';'
            +  'expires=' +  'Thu, 01 Jan 1970 00:00:00 UTC';
    };

    this.RemoveSubject = function(subject) {
        if(confirm('Are you sure to delete this subject?')) {
            var classes = subject.GetAllClasses();

            classes.forEach(function(aClass) {
                this.timetableDays[aClass.day].RemoveClass(aClass);
            }, this);

            var index = this.subjects.indexOf(subject);
            this.subjects.splice(index, 1);
            this.RemoveSubjectFromCookie(subject);
            this.NotifyChanges();
        }
        return this;
    };

    /**
     * @returns {boolean}
     */
    this.HasClash = function(timeslot) {
        var hasClash = false;

        timeslot.classes.forEach(function (aClass) {
            hasClash |= this.timetableDays[aClass.day].HasClash(aClass);
        }, this);

        return hasClash;
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

    /**
     * @returns {string}
     */
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

function TimetableDay (timetable, day) {

    // Constructor
    this.timetable = timetable;
    this.day = day;
    this.hasChange = false;
    this.classes = [];
    this.classSet = new ClassSet();

    // Methods
    this.NotifyChanges = function() {
        this.hasChange = true;
    };

    this.HasClash = function(aClass) {
        this.timeslots.forEach(function (otherClass) {
            var sameSubject = aClass.timeslot.subject == otherClass.timeslot.subject;
            var differentClassType = aClass.classType != otherClass.classType;
            var hasClash = aClass.ClashWith(otherClass) || otherClass.ClashWith(aClass);
            var otherIsTicked = otherClass.ticked;

            if((sameSubject? differentClassType: true) && hasClash && otherIsTicked)
                throw otherClass;
        });
    };

    this.GetTimeGaps = function() {
        var timeGaps = [];
        this.classes.forEach(function (aClass) {
            timeGaps.push(aClass.startTime);
            timeGaps.push(aClass.endTime);
        });
        return timeGaps;
    };

    this.RemoveClass = function(aClass) {
        var index = this.classes.indexOf(aClass);
        this.classes.splice(index, 1);
        return this;
    };

    this.GetTickedClassByStartTime = function(startTime) {
        var result = null;
        this.classes.forEach(function(aClass) {
            if(aClass.startTime == startTime && aClass.timeslot.ticked) {
                result = aClass;
            }
        }, this);
        return result;
    };

    /**
     * @return {boolean}
     */
    this.HasTwoWeekClasses = function () {
        var hasTwoWeekClasses = false;

        this.classes.forEach(function (aClass) {
            hasTwoWeekClasses |= !(aClass.weekType == BothWeeks);
        });

        return hasTwoWeekClasses;
    };

    this.InitializeClassSet = function() {
        var timeGaps = this.timetable.GetArrangedTimeGaps();
        var colSpan, rowSpan;
        var tickedClass;
        var i;

        // Get data for odd week or both week
        i = 0;
        while(i < timeGaps.length - 1) {
            colSpan = 1;
            rowSpan = 1;
            tickedClass = this.GetTickedClassByStartTime(timeGaps[i]);
            i++;

            if (tickedClass && tickedClass.weekType != EvenWeekOnly) {
                if (tickedClass.weekType == BothWeeks)
                    rowSpan = 2;

                while (tickedClass.endTime - timeGaps[i] > 0) {
                    colSpan++;
                    i++;
                }
            }

            this.classSet.oddWeekClasses.push(new TimeGap(tickedClass, colSpan, rowSpan));
        }

        // Get data for even week
        i = 0;
        rowSpan = 1;
        while(i < timeGaps.length - 1) {
            colSpan = 1;
            tickedClass = this.GetTickedClassByStartTime(timeGaps[i]);
            i++;

            if (tickedClass && tickedClass.weekType == EvenWeekOnly) {

                while (tickedClass.endTime - timeGaps[i] > 0) {
                    colSpan++;
                    i++;
                }

            }

            this.classSet.evenWeekClasses.push(new TimeGap(tickedClass, colSpan, rowSpan));
        }

        return this;
    };

    this.GetClassSet = function() {
        if(this.hasChange) {
            this.classSet.ClearClasses();
            this.InitializeClassSet();
            this.classSet.UpdateSpan();
            this.hasChange = false;
        }
        return this.classSet
    };
}

function Subject (timetable, subjectCode, subjectName) {

    // Constructor
    this.timetable = timetable;
    this.subjectCode = subjectCode;
    this.subjectName = subjectName;
    this.timeslots = [];

    for(var i = 0; i < ClassType.length; i++)
        this.timeslots.push([]);

    // Methods
    this.AddTimeslot = function (classType, number) {
        var timeslot = new Timeslot(this, classType, number);
        this.timeslots[classType].push(timeslot);
        return timeslot;
    };

    /**
     * @returns {Array}
     */
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

    this.Tick = function(timeslot) {
        if(!this.timetable.HasClash(timeslot)) {
            this.timeslots[timeslot.classType].forEach(function (otherTimeslot) {
                otherTimeslot.ticked = false;
            });
            timeslot.ticked = true;
            this.timetable.NotifyChanges();
        }
    };

    /**
     * @return {string}
     */
    this.GetDetails = function() {
        return this.subjectCode + ' ' + this.subjectName;
    };

    this.Reset = function() {
        this.timeslots.forEach(function(timeslotByClassType) {
            timeslotByClassType.forEach(function(timeslot) {
                timeslot.ticked = false;
            });
        });
    };

    this.Validate = function (errorTrace) {
        if(this.subjectCode.length == 0)
            errorTrace.errors.push('Subject code cannot be empty');
        else if(ContainInvalidText(this.subjectCode))
            errorTrace.errors.push('Subject code contain invalid character');

        if(this.subjectName.length == 0)
            errorTrace.errors.push('Subject name cannot be empty');
        else if(ContainInvalidText(this.subjectName))
            errorTrace.errors.push('Subject name contain invalid character');

        if(this.timeslots.length == 0)
            errorTrace.errors.push('At least one timeslot is required');
        else {
            var arr = [];
            var timeslotIndex = 1;
            this.timeslots.forEach(function (timeslot) {
                timeslot.Validate(errorTrace, timeslotIndex++);

                // Add for duplicate validation
                arr.push(timeslot.GetTimeslotDetails());
            }, this);

            var item;
            var hasDuplicate = [];
            while (arr.length > 1) {
                item = arr.pop();
                if(arr.indexOf(item) >= 0 && hasDuplicate.indexOf(item) < 0) {
                    errorTrace.push('Duplicate timeslot: ' + item);
                    hasDuplicate.push(item);
                }
            }
        }
    };

    /**
     * @return {string}
     */
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

function Timeslot (subject, classType, number) {

    // Constructor
    this.subject = subject;
    this.classType = classType;
    this.number = number;
    this.classes = [];
    this.ticked = false;

    // Methods
    this.AddClass = function (venue, day, weekType, startTime, endTime) {
        var aClass = new Class(this, venue, day, weekType, startTime, endTime);
        this.classes.push(aClass);
        return aClass;
    };

    /**
     * @return {boolean}
     */
    this.Tick = function (tick) {
        if(arguments.length == 1) {
            if(tick) {
                try {
                    this.subject.Tick(this);
                }
                catch (timeslot) {
                    alert('Unable to tick this timeslot. Clashed with:\n'
                        + timeslot.GetDetails());
                }
            }
            else {
                this.ticked = false;
                this.subject.timetable.NotifyChanges();
            }
        }
        return this.ticked;
    };

    /**
     * @return {string}
     */
    this.GetDetails = function() {
        return this.subject.GetDetails() + ' ' + this.GetTimeslotDetails();
    };

    /**
     * @return {string}
     */
    this.GetTimeslotDetails = function () {
        return ClassType[this.classType].charAt(0) + this.number;
    };

    /**
     * @returns {Array}
     */
    this.GetTimeGaps = function () {
        var timeGaps = [];
        this.classes.forEach(function (aClass) {
            timeGaps.push(aClass.startTime);
            timeGaps.push(aClass.endTime);
        });
        return timeGaps;
    };

    this.Validate = function (errorTrace, timeslotIndex) {
        try {
            this.number = parseInt(this.number);
        }
        catch (e) {
            this.number = 0;
        }
        if(this.number <= 0 || this.number > 19)
            errorTrace.errors.push('Timeslot ' + timeslotIndex + ': Invalid class number, valid range is from 1 to 19');
        if(this.classes.length == 0)
            errorTrace.errors.push('Timeslot ' + timeslotIndex + ': At least one class is required');
        else {
            var classIndex = 1;
            this.classes.forEach(function (timeslot) {
                timeslot.Validate(errorTrace, timeslotIndex, classIndex++);
            });
        }
    };

    /**
     * @return {string}
     */
    this.ToJSON = function () {
        var json = '{'
            + '"classType":' + this.classType + ','
            + '"number":' + this.number + ','
            + '"ticked":' + (this.ticked? 1: 0) + ','
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

function Class (timeslot, venue, day, weekType, startTime, endTime) {

    // Constructor
    this.timeslot = timeslot;
    this.venue = venue;
    this.day = day;
    this.weekType = weekType;
    this.startTime = startTime;
    this.endTime = endTime;

    // Methods
    this.Validate = function (errorTrace, timeslotIndex, classIndex) {
        if (this.venue.length == 0)
            errorTrace.errors.push('Timeslot ' + timeslotIndex + ' Class ' + classIndex + ': Venue cannot be empty');
        else if (ContainInvalidText(this.venue))
            errorTrace.errors.push('Timeslot ' + timeslotIndex + ' Class ' + classIndex + ': Venue contain invalid character');

        if (!IsValidTime(this.startTime))
            errorTrace.errors.push('Timeslot ' + timeslotIndex + ' Class ' + classIndex + ': Invalid class start time');
        if (!IsValidTime(this.endTime))
            errorTrace.errors.push('Timeslot ' + timeslotIndex + ' Class ' + classIndex + ': Invalid class end time');
    };

    /**
     * @return {boolean}
     */
    this.ClashWith = function (otherClass) {
        var clashTime = this.ClashTimeWith(otherClass);
        var clashClassType = false;
        if(this.weekType == BothWeeks || otherClass.weekType == BothWeeks)
            clashClassType = true;
        else
            clashClassType = (this.weekType == otherClass.weekType);

        return clashTime && clashClassType;
    };

    /**
     * @return {boolean}
     */
    this.ClashTimeWith = function (otherClass) {
        var startTimeDifference = this.startTime - otherClass.startTime;

        if(startTimeDifference == 0)
            return true;

        // This class is later than other class
        // If this class starts before other class ends, it has clashes
        else if (startTimeDifference > 0)
            return this.startTime < otherClass.endTime;

        // This class is earlier than other class
        // If other class have not end when this class starts, it has clashes
        else
            return this.endTime > otherClass.startTime;
    };

    /**
     * @return {string}
     */
    this.GetDetails = function () {
        return this.timeslot.GetDetails();
    };

    /**
     * @return {string}
     */
    this.ToJSON = function () {
        return '{'
            + '"venue":"' + this.venue + '",'
            + '"day":' + this.day + ','
            + '"weekType":' + this.weekType + ','
            + '"startTime":' + this.startTime + ','
            + '"endTime":' + this.endTime
            + '}';
    };
}

function ErrorTrace () {

    // Constructor
    this.errors = [];

    // Methods
    /**
     * @return {boolean}
     */
    this.HasError = function () {
        return this.errors.length > 0;
    };

    this.AlertErrors = function () {
        if(! this.HasError) return;

        var errorMsg = 'Please validate the following:\n';
        this.errors.forEach(function(error) {
            errorMsg += '- ' + error + '\n';
        });
        if(errorMsg.charAt(errorMsg.length - 1) == '\n')
            errorMsg.substr(0, errorMsg.length - 1);

        alert(errorMsg);
    };
}

// UI related model
function TimeGap (aClass, colSpan, rowSpan) {

    // Constructor
    this.aClass = aClass;
    this.colSpan = colSpan;
    this.rowSpan = rowSpan;

    // Methods
    /**
     * @return {string}
     */
    this.GetDetails = function () {
        if (this.aClass != null)
            return this.aClass.GetDetails();
        else
            return EmptyString;
    };
}

function ClassSet () {

    // Constructor
    this.oddWeekClasses = [];
    this.evenWeekClasses = [];

    // Methods
    this.ClearClasses = function () {
        while(this.oddWeekClasses.length > 0)
            this.oddWeekClasses.pop();
        while(this.evenWeekClasses.length > 0)
            this.evenWeekClasses.pop();
        return this;
    };

    this.UpdateSpan = function () {
        // Merge
        this.oddWeekClasses.forEach(function(oddWeekClass) {
            if(oddWeekClass.colSpan == 1) {
                var found = false;

                this.evenWeekClasses.forEach(function (evenWeekClass) {
                    if(oddWeekClass.startTime == evenWeekClass.startTime &&
                        oddWeekClass.endTime == evenWeekClass.endTime &&
                        oddWeekClass.timeslot == null || evenWeekClass.timeslot == null)
                            found = evenWeekClass;
                }, this);

                if(found) {
                    oddWeekClass.rowSpan = 2;
                    var index = this.evenWeekClasses.indexOf(found);
                    this.evenWeekClasses.splice(index, 1);
                }
            }
        }, this);
    }
}