<?php
/**
 * @module Teaching
 */
/**
 *
 * @class Teaching_Course
 */
class Teaching_Course {
	/**
	 * Get or create new Teaching/course empty stream for composer
	 * @method getComposerStream
	 * @param {string} [$publisherId=null] - If null loggedin user id used
	 * @param {array} [$category=null] - array("publisherId" => ..., "streamName" => ...), if defined, use this stream as category for course composer
	 * @return {Streams_Stream}
	 */
	static function getComposerStream ($publisherId = null, $category = null) {
		$loggedInUserId = Users::loggedInUser(true)->id;
		$publisherId = $publisherId ?: $loggedInUserId;
		if (!($category instanceof Streams_Stream)) {
			$category = Streams_Stream::fetch(null, $category["publisherId"], $category["streamName"], true);
		}

		$streams = Streams::related(null, $category->publisherId, $category->name, true, array(
			"type" => "new",
			"streamsOnly" => true,
			"ignoreCache" => true
		));

		foreach ($streams as $stream) {
			$stream->calculateAccess($loggedInUserId);
			if ($stream->testWriteLevel(40)) {
				return $stream;
			}
		}

		$stream = Streams::create(null, $publisherId, "Teaching/course", array(), 
		array(
			'relate' => array(
				"publisherId" => $category->publisherId,
				"streamName" => $category->name,
				"type" => "new",
				"inheritAccess" => false
			)
		));
		if ($publisherId != $loggedInUserId) {
			Streams_Access::insert(array(
				"publisherId" => $publisherId,
				"streamName" => $stream->name,
				"ofUserId" => $loggedInUserId,
				"readLevel" => 40,
				"writeLevel" => 40,
				"adminLevel" => 40
			))->execute();
		}

		return $stream;
	}
};