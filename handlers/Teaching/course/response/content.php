<?php

function Teaching_course_response_content($params)
{
	$publisherId = Q::ifset($params, 'publisherId', Streams::requestedPublisherId());
	$courseId = Q::ifset($params, 'courseId', Communities::requestedId($params, 'courseId'));
	$streamName = "Teaching/course/$courseId";
	$stream = Streams::fetchOne(null, $publisherId, $streamName);

	Q::event('Teaching/courses/response/column', $params);

	$params['stream'] = $stream;
	Q::event('Teaching/course/response/column', $params);
	return Q::view('Teaching/content/columns.php');
}