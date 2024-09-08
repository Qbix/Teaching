<?php
function Teaching_course_post ($params) {
	$request = array_merge($_REQUEST, $params);

	// create interrupted subscription for course
	if (Q_Request::slotName("subscription")) {
		Q_Request::requireFields(["publisherId", "streamName"], $request);
		$course = Streams::fetchOne(null, $request["publisherId"], $request["streamName"]);
		if (!$course->testWriteLevel(30)) {
			throw new Users_Exception_NotAuthorized();
		}

		$plan = Streams::create($request["publisherId"], $request["publisherId"], "Assets/plan", array(
			"title" => $course->title,
			"attributes" => array(
				"amount" => 0,
				"currency" => "USD",
				"period" => "monthly",
				"interrupted" => true
			)
		), array(
			"skipAccess" => true,
			'relate' => array(
				"publisherId" => Users::communityId(),
				"streamName" => "Assets/plans",
				"type" => "Assets/plan"
			)
		));
		$course->relateTo($plan, Assets_Subscription::$relationType, null, ["skipAccess" => true]);
		Q_Response::setSlot("subscription", true);
	}

	// join teacher to course
	if (Q_Request::slotName("join")) {
		Q_Request::requireFields(["publisherId", "streamName"], $request);
		$course = Streams::fetchOne(null, $request["publisherId"], $request["streamName"]);
		if (!$course->testWriteLevel('edit')) {
			throw new Users_Exception_NotAuthorized();
		}

		// joined as
		$loggedInUserId = Users::loggedInUser(true)->id;
		$authorRole = "Users/teachers";
		if ((bool)Users::roles(Users::communityId(), [$authorRole], array(), $loggedInUserId)) {
			$course->join([
				"extra" => ["role" => $authorRole]
			]);

			Q_Response::setSlot("join", true);
		} else {
			Q_Response::setSlot("join", false);
		}
	}
}