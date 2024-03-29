<!DOCTYPE html>
<html>
	<head>
		<title>UnitRegApp</title>
		<meta name="viewport" content="width=device-width, height=device-height, initial-scale=1">
		<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js"></script>
		<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.4.5/angular.min.js"></script>
		<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js"></script>
		<script src="main.js"></script>
		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" type="text/css" />
		<link rel="stylesheet" href="main.css" type="text/css" />
	</head>
	<body ng-app="unitRegApp" ng-controller="unitRegController">

        <!-- Contents -->
		<div class="container-fluid">
            <!-- Navigation Bar -->
			<nav class="navbar">
				<ul class="nav nav-tabs nav-padding-s">
					<li class="active"><a data-toggle="tab" href="#home"><span class="bold">UnitRegApp</span></a></li>
					<li><a data-toggle="tab" href="#about">About</a></li>
					<li><a data-toggle="tab" href="#feedback">Feedbacks</a></li>
					<li><a data-toggle="tab" href="#development">Development</a></li>
				</ul>
			</nav>

            <!-- Content Panes -->
			<div class="tab-content">

                <!-- Panel: UnitRegApp -->
				<div id="home" class="tab-pane fade in active">

                    <!-- First Panel: Timetable -->
                    <div id="timetable-container" class="col-sm-12">
                        <table id="timetable" class="table table-bordered">
                            <thead>
                                <tr>
                                    <td></td>
                                    <td ng-repeat="timeGap in (timeGaps = timetable.GetArrangedTimeGaps()) track by $index"
                                        ng-if="!$last">
                                        {{ To24HourFormat(timeGap) }}<br/>{{ To24HourFormat(timeGaps[$index + 1]) }}
                                    </td>
                                </tr>
                            </thead>
                            <tbody>
                                <tr ng-repeat="timetableDay in timetable.timetableDays track by $index">
                                    <td class="text-align-right">{{ timetableDay.day }}</td>
                                    <td ng-repeat="timegap in timetableDay.GetArrangedTimeslots() track by $index"
                                        colspan="{{ timegap.colSpan }}"
                                        class="{{ timegap.timeslot? 'has-timeslot':'' }}">
                                        {{ timegap.GetDetails() }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Second Panel: Action Buttons -->
                    <div class="col-sm-12 action-panel">
                        <span class="bold">Time Gap</span>
                        <div class="btn-group" data-toggle="buttons">
                            <label ng-if="timetable.Gap()==30" class="btn btn-default active" ng-click="timetable.Gap(30)">
                                30 minutes </label>
                            <label ng-if="timetable.Gap()==30" class="btn btn-default" ng-click="timetable.Gap(60)">
                                <input type="radio" name="options"> 1 hour </label>
                            <label ng-if="timetable.Gap()==60" class="btn btn-default" ng-click="timetable.Gap(30)">
                                30 minutes </label>
                            <label ng-if="timetable.Gap()==60" class="btn btn-default active" ng-click="timetable.Gap(60)">
                                <input type="radio" name="options"> 1 hour </label>
                        </div>
                        <button class="btn btn-default"
                                ng-click="AddDummyData()">
                            <span>Add Dummy Data</span>
                        </button>
                        <button type="button" class="btn btn-default"
                                data-toggle="modal"
                                data-target="#AddSubjectModal">
                            <strong>Add Subject</strong>
                        </button>
                        <button id="zoom-in" class="btn btn-default">
                            <span> Zoom In</span>
                        </button>
                        <button id="zoom-out" class="btn btn-default">
                            <span>Zoom Out</span>
                        </button>
                        <button id="zoom-reset" class="btn btn-default">
                            <span>Reset Zoom</span>
                        </button>
                        <button id="btn-print" class="btn btn-default">
                            <span>Print</span>
                        </button>                        
                        <button id="btn-copy" class="btn btn-default" ng-click="Copy()">
                            <span>Copy all Subjects</span>
                        </button>
                        <button id="btn-import" class="btn btn-default" ng-click="ImportSubjects()">
                            <span>Import Subjects</span>
                        </button>
                    </div>

                    <!-- Third Panel: Subjects -->
                    <div class="panel-subject col-sm-12 panel padding-m">
                        <div ng-if="timetable.subjects.length == 0">
                            <h3 class="h3 text-align-center">
                                <span>No subjects found. Please add subjects</span>
                            </h3>
                        </div>
                        <div ng-if="timetable.subjects.length > 0" class="col-sm-12" ng-repeat="subject in timetable.subjects track by $index">
                            <h4 class="title">
                                <button class="btn-inline img-responsive img-rounded glyphicon glyphicon-remove-sign"
                                        ng-click="timetable.RemoveSubject(subject)">
                                </button>
                                <button class="btn-inline img-responsive img-rounded glyphicon glyphicon-arrow-up"
                                        ng-if="$index > 0"
                                        ng-click="timetable.IncreaseSubjectPriority(subject)">
                                </button>
                                <button class="btn-inline img-responsive img-rounded glyphicon glyphicon-arrow-up btn-disabled"
                                        ng-if="$index == 0" disabled>
                                </button>
                                <button class="btn-inline img-responsive img-rounded glyphicon glyphicon-arrow-down"
                                        ng-if="$index < timetable.subjects.length - 1"
                                        ng-click="timetable.DecreaseSubjectPriority(subject)">
                                </button>
                                <button class="btn-inline img-responsive img-rounded glyphicon glyphicon-arrow-down btn-disabled"
                                        ng-if="$index >= timetable.subjects.length - 1" disabled>
                                </button>
                                <span>{{ subject.subjectCode }} {{ subject.subjectName}}</span>
                            </h4>
                            <div class="col-sm-4" ng-repeat="classtype in subject.timeslots"
                                 ng-if="classtype.length > 0">
                                <h5> {{ ClassType[$index] }}</h5>
                                <div ng-repeat="timeslot in classtype track by $index">
                                    <label>
                                        <input class="timeslot" type="checkbox"
                                               ng-model="timeslot.Tick"
                                               ng-model-options="{ getterSetter: true }" />
                                        {{ ClassType[timeslot.classType].charAt(0) }}{{ timeslot.number }}
                                        ({{ DayInWeek[timeslot.day].substr(0, 3) }},
                                        {{ To24HourFormat(timeslot.startTime) }}-{{ To24HourFormat(timeslot.endTime) }})
                                    </label>
                                    <br/>
                                </div>
                            </div>
                        </div>
                    </div>

				</div>

                <!-- Panel: About -->
				<div id="about" class="tab-pane fade">

                    <!-- Panel: Objectives -->
                    <div class="panel panel-default">
                        <div class="panel-heading bold">Objectives</div>
                        <div class="panel-body">
                            <p>This web application allows students to simulate and plan their upcoming trimester's timetable</p>
                        </div>
                    </div>

                    <!-- Panel: Instruction -->
                    <div class="panel panel-default">
                        <div class="panel-heading bold">Instructions</div>
                        <div class="panel-body">
                            <ol class="li-container">
                                <li>Click
                                    <button type="button" class="btn btn-default" disabled>
                                        <span >Add Subject</span>
                                    </button>
                                     to add new subjects</li>
                                <li>Tick on
                                    <label>
                                        <input class="timeslot" type="checkbox" disabled checked> timeslot
                                    </label>
                                   to add into timetable</li>
                                <li>Preview your timetable and
                                    <button class="btn btn-default" disabled>
                                        <span>Print</span>
                                    </button></li>
                                <li><button class="btn btn-default" disabled>
                                        <span>Copy all Subjects</span>
                                    </button> and send to your friends</li>
                                <li><button class="btn btn-default" disabled>
                                        <span>Import Subjects</span>
                                    </button> and paste back the copied data to add back the timetable shared by your friend</li>
                            </ol>
                        </div>
                    </div>

                    <!-- Panel: Known Issues -->
					<div class="panel panel-default">
						<div class="panel-heading bold">Known Issues</div>
						<div class="panel-body">
							<ol>
								<li>
                                    <p>Currently unable to add two classes under one timeslot, for instance, Lecture that have two classes</p>
                                    <p>The current solution is to use Tutorial or Practical class to represent</p>
                                    <p>If the subject only have Lecture and Tutorial, use Practical represent it</p>
                                    <p>Else if it is Lecture and Practical, use Tutorial to represent it</p>
                                </li>
                                <li>
                                    <p>Odd-Even week timeslots are not supported and will be treated as normal timeslot</p>
                                    <p>There is no current solution that capable of fixing within short period</p>
                                </li>
							</ol>
						</div>
					</div>

                    <!-- Panel: About this Website -->
					<div class="panel panel-default">
						<div class="panel-heading bold">About this website</div>
						<div class="panel-body">
                            <ul class="li-container">
                                <li>Hosted directly from <a href="https://github.com/">GitHub</a></li>
                                <li>Framework used:
                                    CSS (<a href="http://getbootstrap.com/">Bootstrap</a>),
                                    JS (<a href="https://jquery.com/">jQuery</a>,
                                    <a href="https://jquery.com//">AngularJS</a>,
                                    <a href="http://getbootstrap.com/">Bootstrap JS</a>)</li>
                            </ul>
						</div>
					</div>
				</div>

                <!-- Panel: Feedback -->
				<div id="feedback" class="tab-pane fade">
					<iframe src="https://docs.google.com/forms/d/1-1NJ7P15HJjqbomkQGUOYJRnYzuEq68fquaGVeuXnYg/viewform?embedded=true"
							width="660" height="1150" frameborder="0" marginheight="0" marginwidth="0">Loading...</iframe>
                </div>

                <!-- Panel: Development -->
				<div id="development" class="tab-pane fade">

                    <!-- Pending Changes -->
                    <div class="alert alert-warning">
                        <h3 class="h3">Development temporarily stopped</h3>
                        <p>Developer is busy on his FYP...</p>
                    </div>
                    <div class="container">
                        <h3 class="h3">Pending Changes</h3>
                        <table class="table table-hover table-responsive">
                            <thead>
                                <tr class="info bold">
                                    <td>#</td>
                                    <td>Changes</td>
                                    <td>Date Added</td>
                                    <td>Status</td>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>1</td>
                                    <td>Two classes under same timeslot (E.g.: L1 has two lecture classes)</td>
                                    <td>04/12/2015</td>
                                    <td>Working on this</td>
                                </tr>
                                <tr>
                                    <td>2</td>
                                    <td>Odd-Even week classes</td>
                                    <td>04/12/2015</td>
                                    <td>Working along with #1</td>
                                </tr>
                                <tr>
                                    <td>3</td>
                                    <td>Edit added subject/timeslot</td>
                                    <td>04/12/2015</td>
                                    <td>Pending</td>
                                </tr>
                                <tr>
                                    <td>4</td>
                                    <td>12 hour format for time</td>
                                    <td>05/12/2015</td>
                                    <td>Pending</td>
                                </tr>
                                <tr>
                                    <td>5</td>
                                    <td>Add venue for classes</td>
                                    <td>05/12/2015</td>
                                    <td>Working along with #1</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Release History -->
                    <div class="container">
                        <h3 class="h3">Release History</h3>
                        <table class="table table-hover table-responsive">
                            <thead>
                                <tr class="info bold">
                                    <td>Release</td>
                                    <td>Description</td>
                                    <td>Date</td>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- v1.1.1 -->
                                <tr class="success">
                                    <td>v1.1.1</td>
                                    <td>
                                        <p>Develop from Feedback</p>
                                        <ul>
                                            <li>Added "Development" panel to list down past release and future pending changes</li>
                                        </ul>
                                    </td>
                                    <td>04/12/2015</td>
                                </tr>
                                <!-- v1.1.0 -->
                                <tr>
                                    <td>v1.1.0</td>
                                    <td>
                                        <p>Copy & Import</p>
                                        <ul>
                                            <li>Added "Copy all Subjects" and "Import Subjects" to allow transfer subject data</li>
                                            <li>Added "Known Issue" panel to list down issue and possible solutions</li>
                                        </ul>
                                    </td>
                                    <td>04/12/2015</td>
                                </tr>
                                <!-- v1.0.1 -->
                                <tr>
                                    <td>v1.0.1</td>
                                    <td>
                                        <p>UI improvement</p>
                                        <ul>
                                            <li>Restructured and redesigned UI layout</li>
                                            <li>Added "About" and "Feedback" panels</li>
                                        </ul>
                                    </td>
                                    <td>03/12/2015</td>
                                </tr>
                                <!-- v1.0.0 -->
                                <tr>
                                    <td>v1.0.0</td>
                                    <td>
                                        <p>First release with basic functionality</p>
                                        <ul>
                                            <li>Add/Remove subjects and timeslots</li>
                                            <li>Preview timetable</li>
                                            <li>Supports printing</li>
                                        </ul>
                                    </td>
                                    <td>26/11/2015</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                </div>
			</div>
		</div>

        <!-- Modals -->
        <!-- Add Subject Modal -->
        <div class="modal fade" id="AddSubjectModal" role="dialog">
            <div class="modal-dialog">
                <div class="modal-content col-sm-12">
                    <div class="modal-header col-sm-12">
                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                        <h4 class="modal-title">Add New Subject</h4>
                    </div>
                    <div class="modal-body col-sm-12">

                        <!-- Subject Code & Name -->
                        <div class="col-sm-12">
                            <label class="col-sm-3" for="subject-code">Subject Code</label>
                            <input class="col-sm-8" type="text" id="subject-code" name="subject-code" ng-model="newSubject.subjectCode"/>
                            <label class="col-sm-3" for="title">Subject Name</label>
                            <input class="col-sm-8" type="text" id="title" name="title" ng-model="newSubject.subjectName" />
                        </div>

                        <!-- Timeslots -->
                        <h4 class="title col-sm-12 margin-m">
                            <span>Timeslots</span>
                        </h4>
                        <div class="col-sm-12" ng-if="newTimeslots.length == 0">
                            <h5 class="text-align-center">Please add timeslots</h5>
                        </div>
                        <div class="col-sm-12" ng-if="newTimeslots.length > 0"
                             ng-repeat="timeslot in newTimeslots track by $index">
                            <div class="col-sm-2 timeslot-title">
                                <h3>{{ ClassType[timeslot.classType].charAt(0) }}{{ timeslot.number }}</h3>
                            </div>
                            <div class="right col-sm-9">
                                <div class="col-sm-11">
                                    <select class="col-sm-4 btn btn-default" ng-model="timeslot.day"
                                            ng-options="DayInWeek.indexOf(day) as day.substr(0, 3) for day in DayInWeek" ng-selected="0">
                                    </select>
                                    <select class="col-sm-5 btn btn-default" ng-model="timeslot.classType"
                                            ng-options="ClassType.indexOf(classType) as classType for classType in ClassType" ng-selected="0">
                                    </select>
                                    <input class="col-sm-3 input-number" type="number" ng-model="timeslot.number" min="1" max="19"/>
                                </div>
                                <div class="col-sm-11 margin-m">
                                    <input class="col-sm-5" id="start-time-{{$index}}" type="number"
                                           ng-model="timeslot.startTime" min="800" max="2400" step="100" />
                                    <label class="col-sm-2 lbl" for="end-time-{{$index}}"> till </label>
                                    <input class="col-sm-5" id="end-time-{{$index}}" type="number"
                                           ng-model="timeslot.endTime" min="800" max="2400" step="100" />
                                </div>
                            </div>
                            <button class=" btn-div img-responsive img-rounded glyphicon glyphicon-remove-sign"
                                    ng-click="RemoveNewTimeslot(timeslot)">
                            </button>
                        </div>

                        <!-- Add Timeslot Button -->
                        <div class="hr col-sm-12 margin-m">
                        </div>
                        <div class="text-center">
                            <button class="btn btn-default"
                                    ng-click="AddNewTimeslot()">
                                <span>Add Timeslot</span>
                            </button>
                        </div>
                    </div>
                    <div class="modal-footer col-sm-12">
                        <button type="button" class="btn btn-default"
                                ng-click="AddNewSubject()" >
                            <span>Add Subject</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
	</body>
</html>
