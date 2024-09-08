<?php
function Teaching_course_put ($params) {
	$request = array_merge($_REQUEST, $params);

	Q_Request::requireFields(["publisherId", "streamName"], $request);
	$course = Streams::fetchOne(null, $request["publisherId"], $request["streamName"]);

	if (Q_Request::slotName("addInterests")) {
		Q_Request::requireFields(["interestsToAdd"], $request);
		if (!$course->testWriteLevel("relate")) {
			throw new Users_Exception_NotAuthorized();
		}

		foreach ($request['interestsToAdd'] as $item) {
			$interest = Streams::getInterest($item['title']);
			$course->relateFrom($interest, "interest");
		}

		Q_Response::setSlot("addInterests", true);
	}

	if (Q_Request::slotName("removeInterests")) {
		Q_Request::requireFields(["interestsToRemove"], $request);
		if (!$course->testWriteLevel("relations")) {
			throw new Users_Exception_NotAuthorized();
		}

		foreach ($request['interestsToRemove'] as $key => $item) {
			Streams::unrelate(
				null,
				$course->publisherId,
				$course->name,
				"interest",
				Users::currentCommunityId(true),
				"Streams/interest/".$key
			);
		}

		Q_Response::setSlot("removeInterests", true);
	}

}